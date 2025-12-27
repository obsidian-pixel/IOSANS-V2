/**
 * BaseNode Component
 * Unified node wrapper with React Flow handles for proper connections.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import PropTypes from "prop-types";
import { Handle, Position } from "reactflow";
import { HANDLE_TYPES, RESOURCE_SLOTS } from "../../utils/handleTypes.js"; // Import handle constants
import "./BaseNode.css";
import "./NodeInputs.css";

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
  slots = [], // Array of slot types (e.g. ['model', 'tool'])
}) {
  // Build class names based on state
  const nodeClasses = [
    "base-node",
    selected && "base-node--selected",
    status !== "idle" && `base-node--${status}`,
  ]
    .filter(Boolean)
    .join(" ");

  // Helper to render resource handles
  const renderResourceHandle = (slotType, index) => {
    // Logic for slot placement based on type
    // Model -> Top (Input)
    // Tool -> Bottom (Input/Output? User said "slots on bottom")
    // We'll assume Tools are injected, so 'target' type, but positioned at Bottom for this specific requirement.
    // Or strictly follow Master Plan.

    let position = Position.Top;
    let type = "target";
    let handleId = `${slotType}-${index}`;

    if (slotType === RESOURCE_SLOTS.MODEL) {
      position = Position.Top;
      type = "target";
      handleId = "model-input";
    } else if (slotType === RESOURCE_SLOTS.TOOL) {
      position = Position.Bottom;
      type = "target"; // Tools are inputs to the agent
      // Offset tools if there are multiple?
      // For now just one handle per slot entry.
      // If we need 3 tools, we expect 3 entries in 'slots' or a count.
      // AIAgentNode passes [MODEL, TOOL]. Only 1 tool slot?
      // User said "3 Tool slots". Code says `slots={[...MODEL, ...TOOL]}`.
      // I'll assume `slots` supports multiple tools if passed multiple times, or single handle accepts multiple connections.
      // React Flow handles accept multiple connections by default unless restricted.
      handleId = "tool-input";
    }

    return (
      <Handle
        key={`${id}-${handleId}`}
        type={type}
        position={position}
        id={handleId}
        className={`base-node__handle base-node__handle--resource base-node__handle--${slotType}`}
        isConnectable={true}
      />
    );
  };

  return (
    <div className={nodeClasses} data-nodeid={id}>
      {/* Resource Handles (Top/Bottom) */}
      {slots.map((slot, i) => renderResourceHandle(slot, i))}

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
