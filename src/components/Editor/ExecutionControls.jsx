/**
 * Execution Controls Component
 * Play/Stop controls for workflow execution.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import PropTypes from "prop-types";
import useExecutionStore from "../../store/executionStore.js";
import { executionEngine } from "../../engine/ExecutionEngine.js";
import "./ExecutionControls.css";

function ExecutionControls({ onStart, onStop, services = {} }) {
  const isRunning = useExecutionStore((state) => state.isRunning);
  const isPaused = useExecutionStore((state) => state.isPaused);
  const hasErrors = useExecutionStore((state) => state.hasErrors());
  const duration = useExecutionStore((state) => state.getExecutionDuration());

  const handlePlay = async () => {
    if (isRunning) return;

    try {
      onStart?.();
      await executionEngine.executeGraph(null, { services });
    } catch (error) {
      console.error("[ExecutionControls] Execution failed:", error);
    }
  };

  const handleStop = () => {
    executionEngine.abort();
    onStop?.();
  };

  const handlePause = () => {
    const store = useExecutionStore.getState();
    if (isPaused) {
      store.resumeExecution();
    } else {
      store.pauseExecution();
    }
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="execution-controls">
      <div className="execution-controls__buttons">
        {!isRunning ? (
          <button
            className="execution-controls__btn execution-controls__btn--play"
            onClick={handlePlay}
            title="Run Workflow"
          >
            ▶ Run
          </button>
        ) : (
          <>
            <button
              className="execution-controls__btn execution-controls__btn--pause"
              onClick={handlePause}
              title={isPaused ? "Resume" : "Pause"}
            >
              {isPaused ? "▶" : "⏸"}
            </button>
            <button
              className="execution-controls__btn execution-controls__btn--stop"
              onClick={handleStop}
              title="Stop"
            >
              ⏹ Stop
            </button>
          </>
        )}
      </div>

      <div className="execution-controls__status">
        {isRunning && (
          <span className="execution-controls__running">
            {isPaused ? "⏸ Paused" : "⚡ Running"} ({formatDuration(duration)})
          </span>
        )}
        {!isRunning && hasErrors && (
          <span className="execution-controls__error">❌ Errors</span>
        )}
        {!isRunning && !hasErrors && duration > 0 && (
          <span className="execution-controls__complete">
            ✅ Complete ({formatDuration(duration)})
          </span>
        )}
      </div>
    </div>
  );
}

ExecutionControls.propTypes = {
  onStart: PropTypes.func,
  onStop: PropTypes.func,
  services: PropTypes.object,
};

export default ExecutionControls;
