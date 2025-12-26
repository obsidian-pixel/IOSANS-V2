/**
 * IOSANS V2 - Main Dashboard
 * 3-Pane Operational Interface with n8n-tier workflow automation.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import dagre from "@dagrejs/dagre";
import "reactflow/dist/style.css";

// Stores
import useWorkflowStore from "./store/workflowStore.js";
import useExecutionStore from "./store/executionStore.js";
import { executionEngine } from "./engine/ExecutionEngine.js";

// Components
import NodeSidebar from "./components/Sidebar/NodeSidebar.jsx";
import ExecutionPanel from "./components/Panels/ExecutionPanel.jsx";
import ArtifactPanel from "./components/Panels/ArtifactPanel.jsx";
import NodeConfigPanel from "./components/Panels/NodeConfigPanel.jsx";
import PrivacyMonitor from "./components/Privacy/PrivacyMonitor.jsx";

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
} from "./nodes/logic/LogicNodes.jsx";
import {
  CodeExecutorNode,
  HTTPRequestNode,
} from "./nodes/actions/ActionNodes.jsx";
import OutputNode from "./nodes/output/OutputNode.jsx";

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
  // Placeholder types
  llm: BaseNode,
  delay: BaseNode,
  transform: BaseNode,
  python: BaseNode,
  textToSpeech: BaseNode,
  imageGeneration: BaseNode,
};

// Edge types (defined outside component)
const edgeTypes = {};

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
  const { fitView } = useReactFlow();

  // State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState("config");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Store connections
  const storeNodes = useWorkflowStore((state) => state.nodes);
  const storeEdges = useWorkflowStore((state) => state.edges);
  const addNode = useWorkflowStore((state) => state.addNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const setStoreNodes = useWorkflowStore((state) => state.setNodes);
  const setStoreEdges = useWorkflowStore((state) => state.setEdges);

  const isRunning = useExecutionStore((state) => state.isRunning);
  const nodeResults = useExecutionStore((state) => state.nodeResults);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync nodes with execution status (triggered only by nodeResults changes)
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const result = nodeResults.get(node.id);
        return {
          ...node,
          data: {
            ...node.data,
            status: result?.status || "idle",
          },
        };
      })
    );
  }, [nodeResults, setNodes]);

  // Sync to store (debounced)
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
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  // Drag handlers
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

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 50,
      };

      // Create node with proper structure for React Flow
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label },
      };

      setNodes((nds) => [...nds, newNode]);
      addNode(newNode); // Also persist to store
    },
    [addNode, setNodes]
  );

  // Selection handler
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    setRightPanelTab("config");
  }, []);

  // Context menu
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

  // Context menu actions
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

  // Run workflow
  const handleRun = async () => {
    if (isRunning) return;
    try {
      await executionEngine.executeGraph({ nodes, edges });
    } catch (error) {
      console.error("[Dashboard] Execution error:", error);
    }
  };

  // Stop workflow
  const handleStop = () => {
    executionEngine.abort();
  };

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
        <div className="topbar__center">
          <button
            className={`topbar__btn topbar__btn--run ${
              isRunning ? "running" : ""
            }`}
            onClick={isRunning ? handleStop : handleRun}
          >
            {isRunning ? "⏹ Stop" : "▶ Run"}
          </button>
          <button className="topbar__btn" onClick={handleAutoLayout}>
            ⬡ Layout
          </button>
        </div>
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
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            snapToGrid
            snapGrid={[10, 10]}
          >
            <Background
              variant="dots"
              gap={20}
              size={1}
              color="rgba(255,255,255,0.08)"
            />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const result = nodeResults.get(node.id);
                if (result?.status === "running") return "#14b8a6";
                if (result?.status === "success") return "#22c55e";
                if (result?.status === "error") return "#ef4444";
                return "#64748b";
              }}
              style={{ background: "rgba(0,0,0,0.5)" }}
            />
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
        <div className="dashboard__panel">
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
      <PrivacyMonitor />
    </div>
  );
}

function App() {
  return (
    <ReactFlowProvider>
      <Dashboard />
    </ReactFlowProvider>
  );
}

export default App;
