/**
 * Execution Engine
 * Graph traversal with parallel execution and merge node synchronization.
 * Part of IOSANS Sovereign Architecture.
 */

import { getExecutor } from "./NodeExecutors.js";
import useExecutionStore from "../store/executionStore.js";
import useWorkflowStore from "../store/workflowStore.js";

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

        const executionContext = {
          inputs,
          nodeData: node.data || {},
          services: context.services,
          signal,
          // eslint-disable-next-line no-unused-vars
          setProgress: (_status, _progress) => {
            // TODO: Update progress through store
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
        const downstreamIds = Array.from(entry.outgoing);
        if (downstreamIds.length > 0) {
          await this._executeLevel(downstreamIds, graph, context);
        }

        return result;
      } catch (error) {
        executionStore.setNodeError(nodeId, error);
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

    // Merge node fires only when ALL upstream branches complete
    const ready = completedCount === incomingCount;

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
