/**
 * Trigger Nodes
 * ManualTrigger and ScheduleTrigger nodes.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import PropTypes from "prop-types";
import BaseNode from "../base/BaseNode.jsx";
import "./TriggerNodes.css";

/**
 * ManualTriggerNode - Entry point triggered by user action
 */
export function ManualTriggerNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  return (
    <BaseNode
      id={id}
      title={data.label || "Manual Trigger"}
      type="trigger"
      icon="▶️"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={false}
      hasWorkflowOutput={true}
    >
      <div className="trigger-node">
        <span className="trigger-node__hint">Click to trigger</span>
      </div>
    </BaseNode>
  );
}

ManualTriggerNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * ScheduleTriggerNode - Cron-based trigger
 */
export function ScheduleTriggerNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { cronExpression = "* * * * *", enabled = true } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "Schedule"}
      type="trigger"
      icon="⏰"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={false}
      hasWorkflowOutput={true}
    >
      <div className="trigger-node">
        <div className="trigger-node__cron">
          <code>{cronExpression}</code>
        </div>
        <span
          className={`trigger-node__status ${enabled ? "active" : "inactive"}`}
        >
          {enabled ? "● Active" : "○ Paused"}
        </span>
      </div>
    </BaseNode>
  );
}

ScheduleTriggerNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};
