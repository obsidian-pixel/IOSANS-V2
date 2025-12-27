/**
 * Action Nodes
 * Code Execution, HTTP Requests, etc.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import PropTypes from "prop-types";
import BaseNode from "../base/BaseNode.jsx";
import "./ActionNodes.css";

/**
 * CodeExecutorNode - JavaScript Sandbox
 */
export function CodeExecutorNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { language = "javascript" } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "Code"}
      type="action"
      icon="💻"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="action-node">
        <div className="action-node__info">
          <span className="action-node__lang">{language}</span>
        </div>
      </div>
    </BaseNode>
  );
}

CodeExecutorNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * HTTPRequestNode - External API Calls
 */
export function HTTPRequestNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { method = "GET", url = "" } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "HTTP Request"}
      type="action"
      icon="🌐"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="action-node">
        <div className="action-node__info">
          <span className={`action-node__method ${method?.toLowerCase()}`}>
            {method}
          </span>
          <span className="action-node__url" title={url}>
            {url || "https://..."}
          </span>
        </div>
      </div>
    </BaseNode>
  );
}

HTTPRequestNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * TransformNode - Data Transformation
 */
export function TransformNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { transformType = "json-parse" } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "Transform"}
      type="action"
      icon="🔄"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="action-node">
        <div className="action-node__info">
          <span style={{ opacity: 0.7 }}>Op:</span> {transformType}
        </div>
      </div>
    </BaseNode>
  );
}

TransformNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};
