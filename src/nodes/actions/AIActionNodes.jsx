/**
 * AI Action Nodes
 * Specialized nodes for AI operations.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import PropTypes from "prop-types";
import BaseNode from "../base/BaseNode.jsx";
import { useReactFlow } from "reactflow";
import "./ActionNodes.css";

// Helper hook to update node data (kept for future or status updates if needed)
const useNodeData = (id) => {
  const { setNodes } = useReactFlow();

  const updateData = (key, value) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, [key]: value },
          };
        }
        return node;
      })
    );
  };

  return updateData;
};

/**
 * AIAgentNode - Complex AI Agent with tools
 */
export function AIAgentNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { modelId = "llama-3-8b" } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "AI Agent"}
      type="agent"
      icon="🤖"
      slots={["model", "tool", "memory"]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="action-node">
        <div className="action-node__info">
          <span style={{ opacity: 0.7 }}>Model:</span> {modelId}
        </div>
      </div>
    </BaseNode>
  );
}

AIAgentNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * LLMNode - Simple text generation
 */
export function LLMNode({ id, data = {}, selected = false, status = "idle" }) {
  const { modelId = "llama-3.2-1b" } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "LLM"}
      type="ai"
      icon="💬"
      slots={["model"]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="action-node">
        <div className="action-node__info">
          <span style={{ opacity: 0.7 }}>Model:</span> {modelId}
        </div>
      </div>
    </BaseNode>
  );
}

LLMNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * TextToSpeechNode - AI Voice Generation
 */
export function TextToSpeechNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { voice = "en-US-Neural2-F" } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "Text to Speech"}
      type="tool"
      icon="🔊"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="action-node">
        <div className="action-node__info">
          <span style={{ opacity: 0.7 }}>Voice:</span> {voice}
        </div>
      </div>
    </BaseNode>
  );
}

TextToSpeechNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * ImageGenerationNode - AI Image Generation
 */
export function ImageGenerationNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { width = 1024, height = 1024 } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "Image Gen"}
      type="tool"
      icon="🎨"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="action-node">
        <div className="action-node__info">
          {width} x {height}
        </div>
      </div>
    </BaseNode>
  );
}

ImageGenerationNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * PythonNode - Python script execution
 */
export function PythonNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  return (
    <BaseNode
      id={id}
      title={data.label || "Python"}
      type="tool"
      icon="🐍"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="action-node">
        <div
          className="action-node__info"
          style={{ fontFamily: "monospace", opacity: 0.5 }}
        >
          script.py
        </div>
      </div>
    </BaseNode>
  );
}

PythonNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};
