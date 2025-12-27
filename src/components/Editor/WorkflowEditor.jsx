/**
 * WorkflowEditor Component
 * React Flow canvas for building workflows.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import useWorkflowStore from "../../store/workflowStore.js";
import AnimatedEdge, { EdgeMarkerDefs } from "./AnimatedEdge.jsx";

// Node type imports
import BaseNode from "../../nodes/base/BaseNode.jsx";
import AIAgentNode from "../../nodes/agent/AIAgentNode.jsx";
import {
  ManualTriggerNode,
  ScheduleTriggerNode,
} from "../../nodes/triggers/TriggerNodes.jsx";
import {
  IfElseNode,
  SwitchNode,
  MergeNode,
} from "../../nodes/logic/LogicNodes.jsx";
import {
  CodeExecutorNode,
  HTTPRequestNode,
} from "../../nodes/actions/ActionNodes.jsx";
import OutputNode from "../../nodes/output/OutputNode.jsx";

import "./WorkflowEditor.css";

// Register custom node types
const nodeTypes = {
  base: BaseNode,
  aiAgent: AIAgentNode,
  manualTrigger: ManualTriggerNode,
  scheduleTrigger: ScheduleTriggerNode,
  ifElse: IfElseNode,
  switch: SwitchNode,
  merge: MergeNode,
  codeExecutor: CodeExecutorNode,
  httpRequest: HTTPRequestNode,
  output: OutputNode,
};

// Register custom edge types
const edgeTypes = {
  animated: AnimatedEdge,
};

function WorkflowEditor({ services = {} }) {
  // Connect to store
  const storeNodes = useWorkflowStore((state) => state.nodes);
  const storeEdges = useWorkflowStore((state) => state.edges);
  const addNode = useWorkflowStore((state) => state.addNode);

  // React Flow state
  const [nodes, , onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);
  const [isDebug, setIsDebug] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Handlers
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, type: "animated" }, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = {
        x: event.clientX - 100,
        y: event.clientY - 50,
      };

      addNode({
        type,
        position,
        data: { label: `New ${type}` },
      });
    },
    [addNode]
  );

  const handleRun = () => {
    console.log("Executing workflow...");
    // Trigger execution logic here
    if (services.executor) {
      services.executor.execute(nodes, edges);
    }
  };

  const handleLayout = () => {
    console.log("Auto-layout triggered");
    // Layout logic would go here (e.g., dagre)
  };

  const handleDebug = () => {
    setIsDebug(!isDebug);
    console.log("Debug mode:", !isDebug);
  };

  const toggleMiniMap = () => {
    setShowMiniMap((prev) => !prev);
  };

  // Default edge options
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "animated",
      animated: true,
    }),
    []
  );

  return (
    <div className={`workflow-editor ${isDebug ? "debug-mode" : ""}`}>
      <div className="workflow-editor__canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          snapToGrid
          snapGrid={[10, 10]}
        >
          <Background
            variant="dots"
            gap={20}
            size={1}
            color="rgba(255,255,255,0.1)"
          />

          {/* Custom Controls replacing standard Controls */}
          <Controls>
            <ControlButton
              onClick={handleRun}
              title="Run"
              style={{ color: "var(--color-success)" }}
            >
              ▶
            </ControlButton>
            <ControlButton onClick={handleLayout} title="Layout">
              ⬡
            </ControlButton>
            <ControlButton
              onClick={handleDebug}
              title="Debug Mode"
              style={{ color: isDebug ? "var(--color-warning)" : "inherit" }}
            >
              🐛
            </ControlButton>
          </Controls>

          <div className="minimap-controls">
            {showMiniMap && (
              <MiniMap
                nodeColor={(node) => {
                  switch (node.type) {
                    case "aiAgent":
                      return "#6366f1";
                    case "manualTrigger":
                    case "scheduleTrigger":
                      return "#22c55e";
                    case "ifElse":
                    case "switch":
                    case "merge":
                      return "#f59e0b";
                    case "output":
                      return "#14b8a6";
                    default:
                      return "#64748b";
                  }
                }}
                maskColor="rgba(0, 0, 0, 0.75)"
                style={{
                  height: 150,
                  width: 200,
                  backgroundColor: "rgba(15, 15, 20, 0.8)",
                }}
                className="glass-minimap"
              />
            )}
            <button
              className={`minimap-toggle ${showMiniMap ? "active" : ""}`}
              onClick={toggleMiniMap}
              title="Toggle MiniMap"
            >
              🗺️
            </button>
          </div>

          {/* SVG Definitions for Markers */}
          <EdgeMarkerDefs />
        </ReactFlow>
      </div>
    </div>
  );
}

export default WorkflowEditor;
