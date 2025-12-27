/**
 * Execution Engine
 * Graph traversal with parallel execution and merge node synchronization.
 * Part of IOSANS Sovereign Architecture.
 */

import { getExecutor } from "./NodeExecutors.js";
import useExecutionStore from "../store/executionStore.js";
import useWorkflowStore from "../store/workflowStore.js";
import useUIStore from "../store/uiStore.js";

/**
 * @typedef {Object} ExecutionOptions
 * @property {Object} services - Available services (webLLM, embedding, etc.)
 * @property {AbortSignal} signal - Abort signal for cancellation
 * @property {Function} onNodeStart - Callback when node starts
 * @property {Function} onNodeComplete - Callback when node completes
 * @property {Function} onNodeError - Callback when node errors
 */

class ExecutionEngine {
  constructor() {
    this.abortController = null;
    this.pendingMerges = new Map(); // Track merge node inputs
  }

  /**
   * Executes the entire workflow graph
   * @param {Object} workflow - {nodes, edges} from workflowStore
   * @param {ExecutionOptions} options
   * @returns {Promise<Object>} Final execution results
   */
  async executeGraph(workflow = null, options = {}) {
    const { services = {}, onNodeStart, onNodeComplete, onNodeError } = options;

    // Get workflow from store if not provided
    const { nodes, edges } = workflow || useWorkflowStore.getState();
    const executionStore = useExecutionStore.getState();

    // Create abort controller
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Build execution graph
    const graph = this._buildExecutionGraph(nodes, edges);

    // Find start nodes (nodes with no incoming edges)
    const startNodes = this._findStartNodes(graph);

    if (startNodes.length === 0) {
      throw new Error("No start nodes found in graph");
    }

    // Initialize execution
    executionStore.startExecution(nodes.map((n) => n.id));
    this.pendingMerges.clear();

    try {
      // Execute from start nodes
      const results = await this._executeLevel(startNodes, graph, {
        workflow: { nodes, edges }, // Pass raw workflow for tools
        services,
        signal,
        onNodeStart,
        onNodeComplete,
        onNodeError,
      });

      executionStore.stopExecution();
      return results;
    } catch (error) {
      executionStore.stopExecution();
      throw error;
    }
  }

  /**
   * Aborts current execution
   */
  abort() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Executes a single node imperatively (for Tool Calling)
   * @param {string} nodeId
   * @param {Object} inputs
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async executeNode(nodeId, inputs, options = {}) {
    // We need to fetch the node definition.
    // We assume the store has the latest state.
    const { nodes } = useWorkflowStore.getState();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);

    const executor = getExecutor(node.type);
    if (!executor) throw new Error(`Executor for ${node.type} not found`);

    const context = {
      inputs,
      nodeData: node.data || {},
      nodeId,
      services: options.services || {},
      signal: this.abortController?.signal,
      // We might not have a graph here if running isolated,
      // but tools usually don't need full graph unless recursive.
    };

    // Validate
    const validation = executor.validate(context);
    if (!validation.valid) throw new Error(validation.error);

    // Execute
    // We do NOT update the main execution store here to avoid state collisions
    // with the main graph flow, unless we want to visualize it?
    // For now, let's just return the result.
    const result = await executor.execute(context);
    return result.output;
  }

  /**
   * Builds execution graph from nodes and edges
   * @private
   */
  _buildExecutionGraph(nodes, edges) {
    const graph = new Map();

    // Initialize node entries
    nodes.forEach((node) => {
      graph.set(node.id, {
        node,
        incoming: new Set(),
        outgoing: new Set(),
        incomingEdges: [],
      });
    });

    // Build connections
    edges.forEach((edge) => {
      const source = graph.get(edge.source);
      const target = graph.get(edge.target);

      if (source && target) {
        source.outgoing.add(edge.target);
        target.incoming.add(edge.source);
        target.incomingEdges.push(edge);
      }
    });

    return graph;
  }

  /**
   * Finds nodes with no incoming edges
   * @private
   */
  _findStartNodes(graph) {
    const startNodes = [];
    graph.forEach((entry, nodeId) => {
      if (entry.incoming.size === 0) {
        startNodes.push(nodeId);
      }
    });
    return startNodes;
  }

  /**
   * Executes a level of sibling nodes in parallel
   * @private
   */
  async _executeLevel(nodeIds, graph, context) {
    const { signal, onNodeStart, onNodeComplete, onNodeError } = context;
    const executionStore = useExecutionStore.getState();

    // Check abort
    if (signal?.aborted) {
      throw new Error("Execution aborted");
    }

    // Check Pause
    while (useExecutionStore.getState().isPaused) {
      if (signal?.aborted) throw new Error("Execution aborted");
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Group nodes by their dependencies for parallel execution
    const results = new Map();

    // Execute all nodes at this level in parallel
    const executions = nodeIds.map(async (nodeId) => {
      const entry = graph.get(nodeId);
      if (!entry) return null;

      const { node } = entry;
      const nodeType = node.type || "unknown";

      // Check if this is a merge node that needs to wait
      if (nodeType === "merge") {
        const mergeResult = await this._handleMergeNode(nodeId, graph, context);
        if (!mergeResult.ready) {
          return null; // Not ready yet, will be triggered by another branch
        }
      }

      // Get executor
      const executor = getExecutor(nodeType);
      if (!executor) {
        console.warn(`[ExecutionEngine] No executor for type: ${nodeType}`);
        return null;
      }

      // Gather inputs from upstream nodes
      const inputs = this._gatherInputs(nodeId, graph, executionStore);

      // Execute node
      try {
        onNodeStart?.(nodeId);
        executionStore.setNodeRunning(nodeId);
        executionStore.addLog({
          nodeId,
          type: "info",
          content: "Started execution",
        });

        const executionContext = {
          inputs,
          nodeData: node.data || {},
          nodeId, // Pass ID for tool scanning
          services: {
            ...context.services,
            executionEngine: this, // Pass engine for callbacks
          },
          graph: {
            // Pass graph structure for traversal tools
            nodes: Array.from(graph.values()).map((e) => e.node),
            edges: Array.from(graph.values()).flatMap((e) => e.incomingEdges), // Approximation or pass raw edges?
            // Better: pass the raw 'nodes' and 'edges' arrays from 'processGraph' context?
            // Since we didn't store them in 'context' passed to _executeLevel, we can't easily.
            // Let's add 'workflow' to 'context' in executeGraph.
          },
          workflow: context.workflow, // { nodes, edges }
          signal,
          log: (content, type = "info") =>
            executionStore.addLog({ nodeId, type, content }),
          setContent: (content) => {
            // Optional: Update node data/display live?
          },
          // eslint-disable-next-line no-unused-vars
          setProgress: (status, progress) => {
            // Update progress through log for now
            executionStore.addLog({ nodeId, type: "info", content: status });
          },
        };

        // Validate
        const validation = executor.validate(executionContext);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        // Execute
        const result = await executor.execute(executionContext);

        // Store result
        executionStore.setNodeSuccess(nodeId, result.output);
        executionStore.addLog({
          nodeId,
          type: "success",
          content: "Completed successfully",
          data: result.output,
        });

        results.set(nodeId, result.output);

        // Store edge snapshots for downstream edges
        entry.outgoing.forEach((targetId) => {
          const edge = graph.get(nodeId)?.node
            ? entry.incomingEdges.find((e) => e.target === targetId)
            : null;
          if (edge) {
            executionStore.setEdgeSnapshot(edge.id, result.output);
          }
        });

        onNodeComplete?.(nodeId, result);

        // Execute downstream nodes
        let downstreamIds = Array.from(entry.outgoing);

        // Filter for Conditional Logic (Switch / IfElse)
        if (downstreamIds.length > 0) {
          const { metadata } = result;

          // logic for filtering based on active handles
          if (
            metadata?.activeHandles &&
            Array.isArray(metadata.activeHandles)
          ) {
            // Filter edges that match the active handles
            downstreamIds = downstreamIds.filter((targetId) => {
              // We need access to OUTGOING edges. entry.outgoing is just a Set of IDs.
              // The graph structure in _buildExecutionGraph puts incomingEdges on target.
              // So to find the edge connecting Current -> Target:
              const targetEntry = graph.get(targetId);
              const connectingEdge = targetEntry?.incomingEdges.find(
                (e) => e.source === nodeId
              );

              if (connectingEdge) {
                return metadata.activeHandles.includes(
                  connectingEdge.sourceHandle
                );
              }
              return false;
            });
          }
        }

        if (downstreamIds.length > 0) {
          await this._executeLevel(downstreamIds, graph, context);
        }

        return result;
      } catch (error) {
        executionStore.setNodeError(nodeId, error);

        // Toast for Runtime Error
        useUIStore.getState().addToast({
          message: `[${nodeType}] Failed: ${error.message}`,
          type: "error",
        });

        // Log for Runtime Error
        executionStore.addLog({
          nodeId,
          type: "error",
          content: error.message,
        });

        onNodeError?.(nodeId, error);
        throw error;
      }
    });

    // Wait for all parallel executions
    await Promise.all(executions);

    return results;
  }

  /**
   * Handles merge node synchronization
   * @private
   */
  // eslint-disable-next-line no-unused-vars
  async _handleMergeNode(nodeId, graph, _context) {
    const entry = graph.get(nodeId);
    const incomingCount = entry.incoming.size;
    const executionStore = useExecutionStore.getState();

    // Initialize pending merge tracking
    if (!this.pendingMerges.has(nodeId)) {
      this.pendingMerges.set(nodeId, new Set());
    }

    // Check which upstream nodes have completed
    let completedCount = 0;
    entry.incoming.forEach((sourceId) => {
      const result = executionStore.getNodeResult(sourceId);
      if (result?.status === "success") {
        completedCount++;
        this.pendingMerges.get(nodeId).add(sourceId);
      }
    });

    // Strategy Check
    const strategy = entry.node.data.mergeStrategy || "object"; // Default to wait-all

    // If strategy is 'first' (race), we are ready if ANY input is here.
    // Note: This might cause multiple executions if multiple inputs arrive at different times.
    // For proper 'Race' (run once), we'd need state to know we already ran.
    // But ExecutionEngine restarts check every level.

    let ready = completedCount === incomingCount; // Default Wait All

    if (strategy === "first" || strategy === "race") {
      ready = completedCount > 0;
    }

    return { ready, completedCount, totalRequired: incomingCount };
  }

  /**
   * Gathers inputs from upstream nodes
   * @private
   */
  _gatherInputs(nodeId, graph, executionStore) {
    const entry = graph.get(nodeId);
    const inputs = {};

    entry.incoming.forEach((sourceId) => {
      const result = executionStore.getNodeResult(sourceId);
      if (result?.status === "success") {
        inputs[sourceId] = result.output;
      }
    });

    // If single input, unwrap
    const inputKeys = Object.keys(inputs);
    if (inputKeys.length === 1) {
      return inputs[inputKeys[0]];
    }

    return inputs;
  }

  /**
   * Gets topologically sorted execution order
   * @param {Map} graph
   * @returns {string[]}
   */
  getExecutionOrder(graph) {
    const visited = new Set();
    const order = [];

    const visit = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const entry = graph.get(nodeId);
      if (entry) {
        entry.outgoing.forEach((downstream) => visit(downstream));
        order.unshift(nodeId);
      }
    };

    // Start from nodes with no incoming edges
    graph.forEach((entry, nodeId) => {
      if (entry.incoming.size === 0) {
        visit(nodeId);
      }
    });

    return order;
  }
}

// Export singleton
export const executionEngine = new ExecutionEngine();

// Also export class for testing
export { ExecutionEngine };
