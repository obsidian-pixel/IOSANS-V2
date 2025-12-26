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
  const nodeResults = useExecutionStore((state) => state.nodeResults);
  const duration = useExecutionStore((state) => state.getExecutionDuration());

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [nodeResults]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "running":
        return "⏳";
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "pending":
        return "⏸️";
      default:
        return "○";
    }
  };

  const logs = Array.from(nodeResults.entries()).map(([nodeId, result]) => ({
    nodeId,
    ...result,
  }));

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
          logs.map((log, index) => (
            <div
              key={`${log.nodeId}-${index}`}
              className={`execution-panel__entry execution-panel__entry--${log.status}`}
            >
              <span className="entry-icon">{getStatusIcon(log.status)}</span>
              <span className="entry-node">{log.nodeId.slice(0, 8)}</span>
              <span className="entry-status">{log.status}</span>
              {log.timestamp && (
                <span className="entry-time">{formatTime(log.timestamp)}</span>
              )}
              {log.error && (
                <div className="entry-error">
                  {log.error.message || log.error}
                </div>
              )}
              {log.output && log.status === "success" && (
                <div className="entry-output">
                  {typeof log.output === "object" && log.output.artifactId ? (
                    <span className="artifact-ref">
                      📎 {log.output.artifactId.slice(0, 8)}...
                    </span>
                  ) : (
                    <code>{JSON.stringify(log.output).slice(0, 100)}</code>
                  )}
                </div>
              )}
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
