/**
 * WorkflowEditor Component
 * React Flow canvas for building workflows.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import useWorkflowStore from "../../store/workflowStore.js";
import ExecutionControls from "./ExecutionControls.jsx";
import AnimatedEdge from "./AnimatedEdge.jsx";

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
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const setEdges = useWorkflowStore((state) => state.setEdges);
  const addNode = useWorkflowStore((state) => state.addNode);

  // React Flow state
  const [nodes, setLocalNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setLocalEdges, onEdgesChange] = useEdgesState(storeEdges);

  // Sync to store
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      // Debounced store update would go here
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const onConnect = useCallback(
    (params) => {
      setLocalEdges((eds) => addEdge({ ...params, type: "animated" }, eds));
    },
    [setLocalEdges]
  );

  // Drag and drop handler
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

  // Default edge options
  const defaultEdgeOptions = useMemo(
    () => ({
      type: "animated",
      animated: true,
    }),
    []
  );

  return (
    <div className="workflow-editor">
      <div className="workflow-editor__toolbar">
        <ExecutionControls services={services} />
      </div>

      <div className="workflow-editor__canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
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
          <Controls />
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
            style={{ background: "rgba(0,0,0,0.5)" }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default WorkflowEditor;
