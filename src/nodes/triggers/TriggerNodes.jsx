/**
 * Trigger Nodes
 * ManualTrigger and ScheduleTrigger nodes.
 * Part of IOSANS Sovereign Architecture.
 */

import { useReactFlow } from "reactflow";
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
 * ScheduleTriggerNode - Cron-based trigger with UI builder
 */
export function ScheduleTriggerNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { setNodes } = useReactFlow();
  const {
    cronExpression = "* * * * *",
    enabled = true,
    mode = "simple", // simple | advanced
    frequency = "minute", // minute | hourly | daily | weekly
    hour = 12,
    minute = 0,
    intervalValue = 15, // for "every X minutes"
    dayOfWeek = 1,
  } = data;

  const updateData = (updates) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      })
    );
  };

  // Helper to generate cron based on simple settings
  const generateCron = (freq, h, m, intVal, dow) => {
    switch (freq) {
      case "minute":
        return "* * * * *";
      case "interval-minutes":
        return `*/${intVal} * * * *`;
      case "hourly":
        return `${m} * * * *`;
      case "daily":
        return `${m} ${h} * * *`;
      case "weekly":
        return `${m} ${h} * * ${dow}`;
      default:
        return "* * * * *";
    }
  };

  // Handle Simple Change
  const handleSimpleChange = (key, val) => {
    const newData = {
      frequency: key === "frequency" ? val : frequency,
      hour: key === "hour" ? val : hour,
      minute: key === "minute" ? val : minute,
      intervalValue: key === "intervalValue" ? val : intervalValue,
      dayOfWeek: key === "dayOfWeek" ? val : dayOfWeek,
    };

    // Update the specific key
    newData[key] = val;

    // Regenerate cron
    newData.cronExpression = generateCron(
      newData.frequency,
      newData.hour,
      newData.minute,
      newData.intervalValue,
      newData.dayOfWeek
    );

    updateData(newData);
  };

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
        {/* Mode Toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            className={`nodrag node-btn-small ${
              mode === "simple" ? "active" : ""
            }`}
            onClick={() => updateData({ mode: "simple" })}
            style={{
              flex: 1,
              background:
                mode === "simple"
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.05)",
            }}
          >
            Simple
          </button>
          <button
            className={`nodrag node-btn-small ${
              mode === "advanced" ? "active" : ""
            }`}
            onClick={() => updateData({ mode: "advanced" })}
            style={{
              flex: 1,
              background:
                mode === "advanced"
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.05)",
            }}
          >
            Advanced
          </button>
        </div>

        {mode === "simple" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="node-input-group">
              <label className="node-input-label">Frequency</label>
              <select
                className="nodrag node-select"
                value={frequency}
                onChange={(e) =>
                  handleSimpleChange("frequency", e.target.value)
                }
              >
                <option value="minute">Every Minute</option>
                <option value="interval-minutes">Every X Minutes</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {frequency === "interval-minutes" && (
              <div className="node-input-group">
                <label className="node-input-label">Minutes</label>
                <input
                  className="nodrag node-input"
                  type="number"
                  min="1"
                  max="59"
                  value={intervalValue}
                  onChange={(e) =>
                    handleSimpleChange(
                      "intervalValue",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
            )}

            {(frequency === "daily" || frequency === "weekly") && (
              <div style={{ display: "flex", gap: 4 }}>
                <div className="node-input-group" style={{ flex: 1 }}>
                  <label className="node-input-label">Hour</label>
                  <input
                    className="nodrag node-input"
                    type="number"
                    min="0"
                    max="23"
                    value={hour}
                    onChange={(e) =>
                      handleSimpleChange("hour", parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="node-input-group" style={{ flex: 1 }}>
                  <label className="node-input-label">Minute</label>
                  <input
                    className="nodrag node-input"
                    type="number"
                    min="0"
                    max="59"
                    value={minute}
                    onChange={(e) =>
                      handleSimpleChange("minute", parseInt(e.target.value))
                    }
                  />
                </div>
              </div>
            )}

            {frequency === "weekly" && (
              <div className="node-input-group">
                <label className="node-input-label">Day</label>
                <select
                  className="nodrag node-select"
                  value={dayOfWeek}
                  onChange={(e) =>
                    handleSimpleChange("dayOfWeek", parseInt(e.target.value))
                  }
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="node-input-group">
            <label className="node-input-label">Cron Expression</label>
            <input
              className="nodrag node-input"
              value={cronExpression}
              onChange={(e) => updateData({ cronExpression: e.target.value })}
              placeholder="* * * * *"
            />
          </div>
        )}

        {/* Status Hint */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <code style={{ fontSize: 9, opacity: 0.5 }}>{cronExpression}</code>
          <button
            className="nodrag"
            onClick={() => updateData({ enabled: !enabled })}
            style={{
              background: "none",
              border: "none",
              fontSize: 10,
              cursor: "pointer",
              color: enabled ? "#4ade80" : "#94a3b8",
            }}
          >
            {enabled ? "● Active" : "○ Paused"}
          </button>
        </div>
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
