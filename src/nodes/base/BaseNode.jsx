/**
 * BaseNode Component
 * Unified node wrapper with React Flow handles for proper connections.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import "./BaseNode.css";

/**
 * BaseNode - Universal node wrapper for all node types
 */
function BaseNode({
  id,
  title = "Node",
  type = "",
  icon = "📦",
  selected = false,
  status = "idle",
  children,
  hasWorkflowInput = true,
  hasWorkflowOutput = true,
}) {
  // Build class names based on state
  const nodeClasses = [
    "base-node",
    selected && "base-node--selected",
    status !== "idle" && `base-node--${status}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={nodeClasses} data-nodeid={id}>
      {/* Input Handle (Left) */}
      {hasWorkflowInput && (
        <Handle
          type="target"
          position={Position.Left}
          id={`${id}-input`}
          className="base-node__handle base-node__handle--input"
        />
      )}

      {/* Node Header */}
      <div className="base-node__header">
        <span className="base-node__icon">{icon}</span>
        <span className="base-node__title">{title}</span>
        {type && <span className="base-node__type">{type}</span>}
      </div>

      {/* Node Content */}
      {children && <div className="base-node__content">{children}</div>}

      {/* Output Handle (Right) */}
      {hasWorkflowOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id={`${id}-output`}
          className="base-node__handle base-node__handle--output"
        />
      )}
    </div>
  );
}

BaseNode.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
  icon: PropTypes.string,
  selected: PropTypes.bool,
  status: PropTypes.oneOf(["idle", "running", "success", "error"]),
  children: PropTypes.node,
  hasWorkflowInput: PropTypes.bool,
  hasWorkflowOutput: PropTypes.bool,
};

export default BaseNode;
