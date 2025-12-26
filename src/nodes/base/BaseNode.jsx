/**
 * BaseNode Component
 * Unified node wrapper with 4-Axis UI topology.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import PropTypes from "prop-types";
import {
  HANDLE_TYPES,
  RESOURCE_SLOTS,
  SLOT_CONFIG,
  getHandleClass,
} from "../../utils/handleTypes.js";
import "./BaseNode.css";

/**
 * BaseNode - Universal node wrapper for all node types
 *
 * @param {Object} props
 * @param {string} props.id - Node ID
 * @param {string} props.title - Node title
 * @param {string} props.type - Node type label
 * @param {string} props.icon - Node icon emoji
 * @param {Array} props.slots - Resource slots ['tool', 'model', etc.]
 * @param {boolean} props.selected - Whether node is selected
 * @param {string} props.status - Execution status ('idle'|'running'|'success'|'error')
 * @param {React.ReactNode} props.children - Node content
 * @param {boolean} props.hasWorkflowInput - Show left workflow handle
 * @param {boolean} props.hasWorkflowOutput - Show right workflow handle
 */
function BaseNode({
  id,
  title = "Node",
  type = "",
  icon = "📦",
  slots = [],
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

  // Render workflow handles (circles on left/right)
  const renderWorkflowHandles = () => (
    <>
      {hasWorkflowInput && (
        <div
          className={getHandleClass(HANDLE_TYPES.WORKFLOW, "input")}
          data-handletype={HANDLE_TYPES.WORKFLOW}
          data-handleid={`${id}-workflow-in`}
        >
          <span className="handle__label">Input</span>
        </div>
      )}
      {hasWorkflowOutput && (
        <div
          className={getHandleClass(HANDLE_TYPES.WORKFLOW, "output")}
          data-handletype={HANDLE_TYPES.WORKFLOW}
          data-handleid={`${id}-workflow-out`}
        >
          <span className="handle__label">Output</span>
        </div>
      )}
    </>
  );

  // Render resource handles (diamonds on top/bottom)
  const renderResourceHandles = () => {
    if (slots.length === 0) return null;

    const getSlotPosition = (index, total) => {
      if (total === 1) return 50;
      if (total === 2) return index === 0 ? 35 : 65;
      if (total === 3) return [25, 50, 75][index];
      return 25 + index * (50 / (total - 1));
    };

    return slots.map((slot, index) => {
      const slotConfig = SLOT_CONFIG[slot] || SLOT_CONFIG[RESOURCE_SLOTS.TOOL];
      const leftPos = getSlotPosition(index, slots.length);

      return (
        <div
          key={`${id}-resource-${slot}-${index}`}
          className={`${getHandleClass(
            HANDLE_TYPES.RESOURCE,
            "input"
          )} handle--slot-${slot}`}
          style={{ left: `${leftPos}%`, marginLeft: "-6px" }}
          data-handletype={HANDLE_TYPES.RESOURCE}
          data-handleslot={slot}
          data-handleid={`${id}-resource-${slot}`}
        >
          <span className="handle__label">
            {slotConfig.icon} {slotConfig.label}
          </span>
        </div>
      );
    });
  };

  return (
    <div className={nodeClasses} data-nodeid={id}>
      {/* Workflow Handles (Left/Right) */}
      {renderWorkflowHandles()}

      {/* Resource Handles (Top) */}
      {renderResourceHandles()}

      {/* Node Header */}
      <div className="base-node__header">
        <span className="base-node__icon">{icon}</span>
        <span className="base-node__title">{title}</span>
        {type && <span className="base-node__type">{type}</span>}
      </div>

      {/* Node Content */}
      {children && <div className="base-node__content">{children}</div>}
    </div>
  );
}

BaseNode.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string,
  type: PropTypes.string,
  icon: PropTypes.string,
  slots: PropTypes.arrayOf(PropTypes.oneOf(Object.values(RESOURCE_SLOTS))),
  selected: PropTypes.bool,
  status: PropTypes.oneOf(["idle", "running", "success", "error"]),
  children: PropTypes.node,
  hasWorkflowInput: PropTypes.bool,
  hasWorkflowOutput: PropTypes.bool,
};

export default BaseNode;
