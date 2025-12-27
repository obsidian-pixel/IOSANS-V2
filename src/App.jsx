/**
 * IOSANS V2 - Main Dashboard
 * 3-Pane Operational Interface with n8n-tier workflow automation.
 * Part of IOSANS Sovereign Architecture.
 */

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import ReactFlow, {
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  useViewport,
} from "reactflow";
import dagre from "@dagrejs/dagre";
import "reactflow/dist/style.css";

// Stores
import useWorkflowStore from "./store/workflowStore.js";
import useExecutionStore from "./store/executionStore.js";
import { executionEngine } from "./engine/ExecutionEngine.js";
import { webLLMService } from "./engine/WebLLMService.js";
import * as artifactStorage from "./utils/artifactStorage.js";
import ToolCallingService from "./engine/ToolCallingService.js";
import { schedulerService } from "./engine/SchedulerService.js";

// Components
import ConfirmationModal from "./components/UI/ConfirmationModal.jsx";

// Initialize services
const toolCallingService = new ToolCallingService(webLLMService);
toolCallingService.setServices({ artifactStorage });

// Components
import NodeSidebar from "./components/Sidebar/NodeSidebar.jsx";
import ExecutionPanel from "./components/Panels/ExecutionPanel.jsx";
import ArtifactPanel from "./components/Panels/ArtifactPanel.jsx";
import NodeConfigPanel from "./components/Panels/NodeConfigPanel.jsx";

// Nodes
import BaseNode from "./nodes/base/BaseNode.jsx";
import AIAgentNode from "./nodes/agent/AIAgentNode.jsx";
import {
  ManualTriggerNode,
  ScheduleTriggerNode,
} from "./nodes/triggers/TriggerNodes.jsx";
import {
  IfElseNode,
  SwitchNode,
  MergeNode as MergeNodeComponent,
  DelayNode,
} from "./nodes/logic/LogicNodes.jsx";
import {
  CodeExecutorNode,
  HTTPRequestNode,
  TransformNode,
} from "./nodes/actions/ActionNodes.jsx";
import {
  LLMNode,
  TextToSpeechNode,
  ImageGenerationNode,
  PythonNode,
} from "./nodes/actions/AIActionNodes.jsx";
import OutputNode from "./nodes/output/OutputNode.jsx";
// ... imports
import AnimatedEdge, {
  EdgeMarkerDefs,
} from "./components/Editor/AnimatedEdge.jsx";

import "./App.css";

// Node types registry (defined outside component to prevent re-creation)
const nodeTypes = {
  base: BaseNode,
  aiAgent: AIAgentNode,
  manualTrigger: ManualTriggerNode,
  scheduleTrigger: ScheduleTriggerNode,
  ifElse: IfElseNode,
  switch: SwitchNode,
  merge: MergeNodeComponent,
  codeExecutor: CodeExecutorNode,
  httpRequest: HTTPRequestNode,
  output: OutputNode,
  // AI Action types
  llm: LLMNode,
  python: PythonNode,
  textToSpeech: TextToSpeechNode,
  imageGeneration: ImageGenerationNode,
  // Placeholder types
  // llm: BaseNode, // Now registered
  delay: DelayNode,
  transform: TransformNode,
};

// Edge types (defined outside component)
const edgeTypes = {
  default: AnimatedEdge,
  custom: AnimatedEdge,
  animated: AnimatedEdge,
};

// Dagre layout config
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

function getLayoutedElements(nodes, edges, direction = "LR") {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 110,
        y: nodeWithPosition.y - 50,
      },
    };
  });
}

function Dashboard() {
  const { fitView, zoomIn, zoomOut, zoomTo, screenToFlowPosition } =
    useReactFlow();
  const { zoom } = useViewport();

  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("config");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [modelManagerOpen, setModelManagerOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // ... store hooks (unchanged)
  const storeNodes = useWorkflowStore((state) => state.nodes);
  const storeEdges = useWorkflowStore((state) => state.edges);
  const addNode = useWorkflowStore((state) => state.addNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const setStoreNodes = useWorkflowStore((state) => state.setNodes);
  const setStoreEdges = useWorkflowStore((state) => state.setEdges);
  const clearStoreWorkflow = useWorkflowStore((state) => state.clearWorkflow);

  const isRunning = useExecutionStore((state) => state.isRunning);
  const isPaused = useExecutionStore((state) => state.isPaused);
  const nodeResults = useExecutionStore((state) => state.nodeResults);
  const resetExecution = useExecutionStore((state) => state.resetExecution);
  const pauseExecution = useExecutionStore((state) => state.pauseExecution);
  const resumeExecution = useExecutionStore((state) => state.resumeExecution);

  // ... (store hooks)

  // ... (Export/Import)

  // ... (Clear Canvas)

  // ... (Canvas Controls - inside return)

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Memoize types to prevent re-creation warnings
  const memoNodeTypes = useMemo(() => nodeTypes, []);
  const memoEdgeTypes = useMemo(() => edgeTypes, []);

  // ... effects (unchanged)
  // Sync with execution status (Optimized)
  useEffect(() => {
    // We only trigger a status update if the logical status has actually changed.
    setNodes((currentNodes) => {
      let hasChanges = false;
      const newNodes = currentNodes.map((node) => {
        const result = nodeResults.get(node.id);
        const newStatus = result?.status || "idle";

        // Only create new object if status changed
        if (node.data.status !== newStatus) {
          hasChanges = true;
          return {
            ...node,
            data: {
              ...node.data,
              status: newStatus,
            },
          };
        }
        return node;
      });

      // Return identical reference if no changes to prevent re-render
      return hasChanges ? newNodes : currentNodes;
    });
  }, [nodeResults, setNodes]);

  // Sync to store
  useEffect(() => {
    const timer = setTimeout(() => {
      setStoreNodes(nodes);
      setStoreEdges(edges);
    }, 300);
    return () => clearTimeout(timer);
  }, [nodes, edges, setStoreNodes, setStoreEdges]);

  // Connection handler
  const onConnect = useCallback(
    (params) => {
      // Force 'animated' edge type for new connections
      setEdges((eds) =>
        addEdge({ ...params, type: "animated", animated: true }, eds)
      );
    },
    [setEdges]
  );

  // ... drag handlers (unchanged)
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      const label = event.dataTransfer.getData("application/nodeLabel") || type;

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label },
      };

      setNodes((nds) => [...nds, newNode]);
      addNode(newNode);
    },
    [addNode, setNodes, screenToFlowPosition]
  );

  // ... context menu handlers (unchanged)
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    setRightPanelTab("config");
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleDuplicate = useCallback(() => {
    const node = nodes.find((n) => n.id === contextMenu?.nodeId);
    if (node) {
      const newNode = {
        id: `${node.type}-${Date.now()}`,
        type: node.type,
        position: { x: node.position.x + 50, y: node.position.y + 50 },
        data: { ...node.data },
      };
      setNodes((nds) => [...nds, newNode]);
      addNode(newNode);
    }
    closeContextMenu();
  }, [contextMenu, nodes, addNode, setNodes, closeContextMenu]);

  const handleDelete = useCallback(() => {
    if (contextMenu?.nodeId) {
      setNodes((nds) => nds.filter((n) => n.id !== contextMenu.nodeId));
      setEdges((eds) =>
        eds.filter(
          (e) =>
            e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId
        )
      );
      removeNode(contextMenu.nodeId);
    }
    closeContextMenu();
  }, [contextMenu, setNodes, setEdges, removeNode, closeContextMenu]);

  // Auto-layout
  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [nodes, edges, setNodes, fitView]);

  // Run/Stop handlers
  const handleRun = useCallback(async () => {
    if (isRunning) return;
    try {
      const services = {
        webLLM: webLLMService,
        artifactStorage,
        toolCalling: toolCallingService,
      };
      await executionEngine.executeGraph({ nodes, edges }, { services });
    } catch (error) {
      console.error("[Dashboard] Execution error:", error);
    }
  }, [isRunning, nodes, edges]);

  const handleStop = useCallback(() => {
    executionEngine.abort();
  }, []);

  const handlePause = useCallback(() => {
    pauseExecution();
  }, [pauseExecution]);

  const handleResume = useCallback(() => {
    resumeExecution();
  }, [resumeExecution]);

  // Scheduler Loop (Moved here to access handleRun)
  const lastRunRef = useRef(0);
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      // Calculate current absolute minute (unixtime / 60000)
      const currentMinute = Math.floor(now.getTime() / 60000);

      if (currentMinute > lastRunRef.current) {
        // Only verify nodes if we haven't processed this minute yet
        let triggered = false;
        nodes.forEach((node) => {
          if (node.type === "scheduleTrigger" && !triggered) {
            // Check if this specific node matches the current time
            if (schedulerService.shouldTrigger(node, now)) {
              console.log(
                `[Scheduler] Triggering workflow for node ${node.id}`
              );
              triggered = true;
              handleRun();
            }
          }
        });

        // Update last run time regardless of trigger to avoid re-checking this minute
        lastRunRef.current = currentMinute;
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [nodes, handleRun]);

  // Export/Import
  const handleExport = useCallback(() => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow.json";
    a.click();
  }, [nodes, edges]);

  // Clear Canvas Request (Opens Modal)
  const handleClearCanvas = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsClearModalOpen(true);
  }, []);

  // Execute Clear Canvas (Called by Modal)
  const confirmClearCanvas = useCallback(() => {
    console.log("[Dashboard] Clear Confirmed - Executing Ultimate Clear...");

    // 1. Clear Memory State
    clearStoreWorkflow();
    resetExecution();

    // 2. Clear Disk State (LocalStorage)
    try {
      localStorage.removeItem("iosans-workflow");
    } catch (err) {
      console.error("Failed to clear local storage:", err);
    }

    // 3. Clear Local View State
    setNodes([]);
    setEdges([]);

    // 4. Force Component Destruction & Recreation after delay
    setTimeout(() => {
      setResetKey((prev) => prev + 1);
      console.log("[Dashboard] Canvas Reset Complete");
    }, 50);

    setIsClearModalOpen(false);
  }, [clearStoreWorkflow, resetExecution, setNodes, setEdges]);

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        const data = JSON.parse(text);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
      }
    };
    input.click();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" && selectedNodeId) {
        setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
        setEdges((eds) =>
          eds.filter(
            (e) => e.source !== selectedNodeId && e.target !== selectedNodeId
          )
        );
        setSelectedNodeId(null);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleExport();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, setNodes, setEdges, handleExport]);

  return (
    <div className="dashboard" onClick={closeContextMenu}>
      {/* Top Bar */}
      <header className="dashboard__topbar">
        <div className="topbar__left">
          <h1>IOSANS</h1>
          <span className="topbar__tag">Sovereign AI</span>
        </div>
        <div className="topbar__center">{/* Actions moved to canvas */}</div>
        <div className="topbar__right">
          <button className="topbar__btn" onClick={handleExport}>
            Export
          </button>
          <button className="topbar__btn" onClick={handleImport}>
            Import
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard__content">
        {/* Left Sidebar */}
        <NodeSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Center Canvas */}
        <div className="dashboard__canvas">
          <EdgeMarkerDefs />
          <ReactFlow
            key={resetKey}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={memoNodeTypes}
            edgeTypes={memoEdgeTypes}
            fitView
            fitViewOptions={{ padding: 0.5, maxZoom: 0.65 }}
            minZoom={0.2}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.65 }}
            snapToGrid
            snapGrid={[10, 10]}
            nodesDraggable={!isLocked}
            nodesConnectable={!isLocked}
            elementsSelectable={!isLocked}
            panOnDrag={!isLocked}
            zoomOnScroll={!isLocked}
          >
            <Background
              variant="dots"
              gap={20}
              size={1}
              color="rgba(255,255,255,0.08)"
            />

            <div
              className={`minimap-controls ${showMiniMap ? "open" : "closed"}`}
            >
              <MiniMap
                className="sovereign-minimap"
                nodeColor={(node) => {
                  const result = nodeResults.get(node.id);
                  if (result?.status === "running") return "#14b8a6";
                  if (result?.status === "success") return "#22c55e";
                  if (result?.status === "error") return "#ef4444";
                  return "#64748b";
                }}
                maskColor="rgba(0, 0, 0, 0.75)"
                style={{
                  backgroundColor: "rgba(15, 15, 20, 0.85)",
                }}
              />
              <button
                className={`minimap-toggle ${showMiniMap ? "active" : ""}`}
                onClick={() => setShowMiniMap(!showMiniMap)}
                title="Toggle MiniMap"
              >
                🗺️
              </button>
            </div>

            {/* Custom Canvas Controls & Actions */}
            <Panel position="bottom-left" className="canvas-panel-container">
              <div className="canvas-actions">
                <button
                  className={`canvas-btn canvas-btn--run ${
                    isRunning && !isPaused ? "disabled" : ""
                  }`}
                  onClick={isPaused ? handleResume : handleRun}
                  disabled={isRunning && !isPaused}
                  style={{ color: isPaused ? "#22c55e" : "" }}
                  data-tooltip={isPaused ? "Resume Workflow" : "Run Workflow"}
                >
                  ▶
                </button>
                <button
                  className={`canvas-btn ${isPaused ? "active" : ""}`}
                  onClick={handlePause}
                  disabled={!isRunning || isPaused}
                  data-tooltip="Pause Execution"
                >
                  ⏸
                </button>
                <button
                  className={`canvas-btn ${isRunning ? "active" : ""}`}
                  onClick={handleStop}
                  disabled={!isRunning}
                  style={{ color: isRunning ? "#ef4444" : "" }}
                  data-tooltip="Stop Execution"
                >
                  ⏹
                </button>
                <button
                  className="canvas-btn"
                  onClick={handleAutoLayout}
                  data-tooltip="Auto Layout"
                >
                  ⬡
                </button>
                <button
                  className={`canvas-btn ${modelManagerOpen ? "active" : ""}`}
                  onClick={() => setModelManagerOpen(!modelManagerOpen)}
                  data-tooltip="Model Manager"
                >
                  🧠
                </button>
                <button
                  className="canvas-btn"
                  onClick={handleClearCanvas}
                  data-tooltip="Clear Canvas"
                >
                  🗑️
                </button>
              </div>

              <div className="canvas-controls">
                <button
                  className="canvas-btn"
                  onClick={() => fitView({ padding: 0.2 })}
                  data-tooltip="Fit View"
                >
                  ⛶
                </button>
                <button
                  className="canvas-btn"
                  onClick={() => zoomIn({ duration: 300 })}
                  data-tooltip="Zoom In"
                >
                  +
                </button>
                <button
                  className="canvas-btn canvas-btn--zoom-display"
                  onClick={() => zoomTo(1, { duration: 300 })}
                  data-tooltip="Reset Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  className="canvas-btn"
                  onClick={() => zoomOut({ duration: 300 })}
                  data-tooltip="Zoom Out"
                >
                  −
                </button>
                <button
                  className={`canvas-btn ${isLocked ? "active" : ""}`}
                  onClick={() => setIsLocked(!isLocked)}
                  data-tooltip={isLocked ? "Unlock Canvas" : "Lock Canvas"}
                >
                  {isLocked ? "🔒" : "🔓"}
                </button>
              </div>
            </Panel>
          </ReactFlow>

          {/* Context Menu */}
          {contextMenu && (
            <div
              className="context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button onClick={handleDuplicate}>Duplicate</button>
              <button onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div
          className={`dashboard__panel ${
            isRightPanelCollapsed ? "collapsed" : ""
          }`}
        >
          <button
            className="panel-collapse-btn"
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            title={isRightPanelCollapsed ? "Expand Panel" : "Close Panel"}
          >
            {isRightPanelCollapsed ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M3 12h18M3 6h18M3 18h18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <div className="panel__tabs">
            <button
              className={rightPanelTab === "config" ? "active" : ""}
              onClick={() => setRightPanelTab("config")}
            >
              Config
            </button>
            <button
              className={rightPanelTab === "logs" ? "active" : ""}
              onClick={() => setRightPanelTab("logs")}
            >
              Logs
            </button>
            <button
              className={rightPanelTab === "artifacts" ? "active" : ""}
              onClick={() => setRightPanelTab("artifacts")}
            >
              Artifacts
            </button>
          </div>
          <div className="panel__content">
            {rightPanelTab === "config" && (
              <NodeConfigPanel selectedNodeId={selectedNodeId} />
            )}
            {rightPanelTab === "logs" && <ExecutionPanel />}
            {rightPanelTab === "artifacts" && <ArtifactPanel />}
          </div>
        </div>
      </div>

      {/* Privacy Monitor */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Clear Canvas"
        message="Are you sure you want to clear the entire canvas? This action cannot be undone."
        onConfirm={confirmClearCanvas}
        onCancel={() => setIsClearModalOpen(false)}
        confirmText="Clear Canvas"
        isDestructive={true}
      />
    </div>
  );
}

import { ToastContainer } from "./components/UI/ToastContainer.jsx";
import DocsModal from "./components/UI/DocsModal.jsx";

function App() {
  return (
    <ReactFlowProvider>
      <Dashboard />
      <ToastContainer />
      <DocsModal />
    </ReactFlowProvider>
  );
}

export default App;
