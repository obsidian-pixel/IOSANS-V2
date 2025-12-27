/**
 * ExecutionPanel Component
 * Live execution logs with real-time updates.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useEffect, useRef } from "react";
import useExecutionStore from "../../store/executionStore.js";
import "./ExecutionPanel.css";

function ExecutionPanel() {
  const logRef = useRef(null);

  const isRunning = useExecutionStore((state) => state.isRunning);
  const logs = useExecutionStore((state) => state.logs);
  const duration = useExecutionStore((state) => state.getExecutionDuration());

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case "running":
      case "info":
        return "ℹ️";
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "action":
        return "🛠️";
      case "pending":
        return "⏳";
      default:
        return "○";
    }
  };

  return (
    <div className="execution-panel">
      <div className="execution-panel__header">
        <h4>Execution Log</h4>
        {isRunning && (
          <span className="execution-panel__status">
            ⚡ Running ({(duration / 1000).toFixed(1)}s)
          </span>
        )}
      </div>

      <div className="execution-panel__logs" ref={logRef}>
        {logs.length === 0 ? (
          <div className="execution-panel__empty">
            No execution logs yet.
            <br />
            Click <strong>Run</strong> to execute the workflow.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className={`execution-panel__entry execution-panel__entry--${log.type}`}
            >
              <span className="entry-icon">{getStatusIcon(log.type)}</span>
              <span className="entry-time">{formatTime(log.timestamp)}</span>
              {log.nodeId && (
                <span className="entry-node">[{log.nodeId.slice(0, 8)}]</span>
              )}
              <div className="entry-content-wrapper">
                <div className="entry-message">{log.content}</div>
                {log.data && (
                  <div className="entry-data">
                    {typeof log.data === "object" && log.data.artifactId ? (
                      <span className="artifact-ref">
                        📎 Artifact: {log.data.artifactId.slice(0, 8)}...
                      </span>
                    ) : (
                      <code>
                        {typeof log.data === "object"
                          ? JSON.stringify(log.data).slice(0, 200) +
                            (JSON.stringify(log.data).length > 200 ? "..." : "")
                          : String(log.data).slice(0, 200)}
                      </code>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="execution-panel__footer">
        <span>{logs.length} events</span>
        <button
          className="execution-panel__clear"
          onClick={() => useExecutionStore.getState().clearResults()}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default ExecutionPanel;
