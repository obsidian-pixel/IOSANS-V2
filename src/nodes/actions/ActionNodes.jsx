/**
 * Action Nodes
 * CodeExecutor and HTTPRequest nodes.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import PropTypes from "prop-types";
import BaseNode from "../base/BaseNode.jsx";
import "./ActionNodes.css";

/**
 * CodeExecutorNode - Sandboxed JavaScript execution
 */
export function CodeExecutorNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { code = "", language = "javascript" } = data;

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
        <div className="action-node__lang">{language}</div>
        <div className="action-node__preview">
          <code>
            {code.slice(0, 60) || "// No code"}
            {code.length > 60 ? "..." : ""}
          </code>
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
 * HTTPRequestNode - Makes HTTP requests
 */
export function HTTPRequestNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { method = "GET", url = "", headers = {} } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "HTTP"}
      type="action"
      icon="🌐"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="action-node">
        <div className="action-node__method">{method}</div>
        <div className="action-node__url">
          {url.slice(0, 40) || "No URL"}
          {url.length > 40 ? "..." : ""}
        </div>
        <div className="action-node__headers">
          {Object.keys(headers).length} headers
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
