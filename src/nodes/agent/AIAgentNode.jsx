/**
 * AIAgentNode Component
 * AI Agent with Model and Tools input handles.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import PropTypes from "prop-types";
import BaseNode from "../base/BaseNode.jsx";
import { RESOURCE_SLOTS } from "../../utils/handleTypes.js";
import "./AIAgentNode.css";

/**
 * AIAgentNode - LLM-powered agent with tool access
 */
function AIAgentNode({ id, data = {}, selected = false, status = "idle" }) {
  const {
    systemPrompt = "",
    temperature = 0.7,
    maxTokens = 1024,
    modelId = null,
    connectedTools = [],
  } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "AI Agent"}
      type="agent"
      icon="🤖"
      slots={[RESOURCE_SLOTS.MODEL, RESOURCE_SLOTS.TOOL]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="ai-agent-node">
        {/* Model Indicator */}
        <div className="ai-agent-node__info">
          <span className="ai-agent-node__label">Model:</span>
          <span className="ai-agent-node__value">
            {modelId || "Not connected"}
          </span>
        </div>

        {/* Tools Count */}
        <div className="ai-agent-node__info">
          <span className="ai-agent-node__label">Tools:</span>
          <span className="ai-agent-node__value">
            {connectedTools.length || 0} connected
          </span>
        </div>

        {/* System Prompt Preview */}
        {systemPrompt && (
          <div className="ai-agent-node__prompt">
            {systemPrompt.slice(0, 50)}...
          </div>
        )}

        {/* Config Preview */}
        <div className="ai-agent-node__config">
          <span>T: {temperature}</span>
          <span>Max: {maxTokens}</span>
        </div>
      </div>
    </BaseNode>
  );
}

AIAgentNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.shape({
    label: PropTypes.string,
    systemPrompt: PropTypes.string,
    temperature: PropTypes.number,
    maxTokens: PropTypes.number,
    modelId: PropTypes.string,
    connectedTools: PropTypes.array,
  }),
  selected: PropTypes.bool,
  status: PropTypes.oneOf(["idle", "running", "success", "error"]),
};

export default AIAgentNode;
