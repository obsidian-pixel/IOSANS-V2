import React from "react";
import PropTypes from "prop-types";

/**
 * SchedulerConfig
 * Advanced time/calendar picker for the Schedule Trigger Node.
 */
export function SchedulerConfig({ data, onChange }) {
  const {
    frequency = "weekly",
    hour = 12,
    minute = 0,
    intervalValue = 15,
    selectedDays = [1, 3, 5], // 0=Sun, 6=Sat
    cronExpression = "* * * * *",
  } = data;

  // Helper to generate cron based on settings
  const updateCron = (newFreq, h, m, intVal, days) => {
    let cron = "* * * * *";

    switch (newFreq) {
      case "minute":
        cron = "* * * * *";
        break;
      case "interval-minutes":
        cron = `*/${intVal} * * * *`;
        break;
      case "hourly":
        cron = `${m} * * * *`;
        break;
      case "daily":
        cron = `${m} ${h} * * *`;
        break;
      case "weekly":
        const dayStr = days.length > 0 ? days.join(",") : "*";
        cron = `${m} ${h} * * ${dayStr}`;
        break;
      default:
        cron = "* * * * *";
    }

    onChange("cronExpression", cron);
  };

  const handleFreqChange = (val) => {
    onChange("frequency", val);
    updateCron(val, hour, minute, intervalValue, selectedDays);
  };

  const handleTimeChange = (key, val) => {
    const newH = key === "hour" ? val : hour;
    const newM = key === "minute" ? val : minute;
    onChange(key, val);
    updateCron(frequency, newH, newM, intervalValue, selectedDays);
  };

  const handleIntervalChange = (val) => {
    onChange("intervalValue", val);
    updateCron(frequency, hour, minute, val, selectedDays);
  };

  const toggleDay = (dayIndex) => {
    let newDays = [...selectedDays];
    if (newDays.includes(dayIndex)) {
      newDays = newDays.filter((d) => d !== dayIndex);
    } else {
      newDays.push(dayIndex);
    }
    newDays.sort();

    onChange("selectedDays", newDays);
    updateCron(frequency, hour, minute, intervalValue, newDays);
  };

  const days = [
    { label: "S", value: 0 },
    { label: "M", value: 1 },
    { label: "T", value: 2 },
    { label: "W", value: 3 },
    { label: "T", value: 4 },
    { label: "F", value: 5 },
    { label: "S", value: 6 },
  ];

  return (
    <div className="scheduler-config">
      {/* Frequency */}
      <div className="config-field">
        <label>Frequency</label>
        <select
          value={frequency}
          onChange={(e) => handleFreqChange(e.target.value)}
        >
          <option value="minute">Every Minute</option>
          <option value="interval-minutes">Interval (Minutes)</option>
          <option value="hourly">Hourly</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>

      {/* Interval Input */}
      {frequency === "interval-minutes" && (
        <div className="config-field">
          <label>Every X Minutes</label>
          <input
            type="number"
            min="1"
            max="59"
            value={intervalValue}
            onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
          />
        </div>
      )}

      {/* Time Picker */}
      {(frequency === "daily" || frequency === "weekly") && (
        <div className="config-field">
          <label>Time</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              min="0"
              max="23"
              value={hour}
              onChange={(e) =>
                handleTimeChange("hour", parseInt(e.target.value))
              }
              style={{ width: 60 }}
            />
            <span>:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={minute}
              onChange={(e) =>
                handleTimeChange("minute", parseInt(e.target.value))
              }
              style={{ width: 60 }}
            />
          </div>
        </div>
      )}

      {/* Calendar Day Picker */}
      {frequency === "weekly" && (
        <div className="config-field">
          <label>Days</label>
          <div
            style={{ display: "flex", gap: 4, justifyContent: "space-between" }}
          >
            {days.map((d) => (
              <button
                key={d.value}
                onClick={() => toggleDay(d.value)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: selectedDays.includes(d.value)
                    ? "var(--color-primary)"
                    : "transparent",
                  color: "white",
                  fontSize: 10,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Toggle */}
      <div
        className="config-field"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 12,
        }}
      >
        <input
          type="checkbox"
          checked={data.enabled ?? true}
          onChange={(e) => onChange("enabled", e.target.checked)}
        />
        <label style={{ margin: 0 }}>Enabled</label>
      </div>

      {/* Preview */}
      <div
        style={{
          marginTop: 12,
          padding: 8,
          background: "rgba(0,0,0,0.2)",
          borderRadius: 4,
        }}
      >
        <label style={{ fontSize: 9, opacity: 0.7 }}>Generated Cron</label>
        <div style={{ fontFamily: "monospace", fontSize: 11 }}>
          {cronExpression}
        </div>
      </div>
    </div>
  );
}

SchedulerConfig.propTypes = {
  data: PropTypes.object,
  onChange: PropTypes.func,
};
