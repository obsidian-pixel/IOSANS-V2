/**
 * Execution Store
 * Tracks runtime execution state - NOT persisted.
 * Part of IOSANS Sovereign Architecture.
 */

import { create } from "zustand";

/**
 * @typedef {Object} NodeResult
 * @property {string} nodeId
 * @property {'pending'|'running'|'success'|'error'} status
 * @property {*} output - Node output data
 * @property {string} error - Error message if failed
 * @property {number} startTime
 * @property {number} endTime
 */

const useExecutionStore = create((set, get) => ({
  // State
  isRunning: false,
  isPaused: false,
  currentNodeId: null,
  nodeResults: new Map(),
  edgeSnapshots: new Map(),
  executionOrder: [],
  executionStartTime: null,
  executionEndTime: null,

  // Execution Control
  startExecution: (nodeOrder = []) =>
    set({
      isRunning: true,
      isPaused: false,
      currentNodeId: null,
      nodeResults: new Map(),
      edgeSnapshots: new Map(),
      executionOrder: nodeOrder,
      executionStartTime: Date.now(),
      executionEndTime: null,
    }),

  stopExecution: () =>
    set({
      isRunning: false,
      isPaused: false,
      currentNodeId: null,
      executionEndTime: Date.now(),
    }),

  pauseExecution: () => set({ isPaused: true }),

  resumeExecution: () => set({ isPaused: false }),

  // Node Result Actions
  setNodePending: (nodeId) =>
    set((state) => {
      const results = new Map(state.nodeResults);
      results.set(nodeId, {
        nodeId,
        status: "pending",
        output: null,
        error: null,
        startTime: null,
        endTime: null,
      });
      return { nodeResults: results };
    }),

  setNodeRunning: (nodeId) =>
    set((state) => {
      const results = new Map(state.nodeResults);
      const existing = results.get(nodeId) || {};
      results.set(nodeId, {
        ...existing,
        nodeId,
        status: "running",
        startTime: Date.now(),
      });
      return { nodeResults: results, currentNodeId: nodeId };
    }),

  setNodeSuccess: (nodeId, output) =>
    set((state) => {
      const results = new Map(state.nodeResults);
      const existing = results.get(nodeId) || {};
      results.set(nodeId, {
        ...existing,
        nodeId,
        status: "success",
        output,
        error: null,
        endTime: Date.now(),
      });
      return { nodeResults: results };
    }),

  setNodeError: (nodeId, error) =>
    set((state) => {
      const results = new Map(state.nodeResults);
      const existing = results.get(nodeId) || {};
      results.set(nodeId, {
        ...existing,
        nodeId,
        status: "error",
        output: null,
        error:
          typeof error === "string" ? error : error?.message || String(error),
        endTime: Date.now(),
      });
      return { nodeResults: results };
    }),

  getNodeResult: (nodeId) => get().nodeResults.get(nodeId),

  // Edge Snapshot Actions
  setEdgeSnapshot: (edgeId, data) =>
    set((state) => {
      const snapshots = new Map(state.edgeSnapshots);
      snapshots.set(edgeId, {
        data,
        timestamp: Date.now(),
      });
      return { edgeSnapshots: snapshots };
    }),

  getEdgeSnapshot: (edgeId) => get().edgeSnapshots.get(edgeId),

  clearEdgeSnapshot: (edgeId) =>
    set((state) => {
      const snapshots = new Map(state.edgeSnapshots);
      snapshots.delete(edgeId);
      return { edgeSnapshots: snapshots };
    }),

  // Bulk Actions
  clearResults: () =>
    set({
      nodeResults: new Map(),
      edgeSnapshots: new Map(),
      currentNodeId: null,
    }),

  resetExecution: () =>
    set({
      isRunning: false,
      isPaused: false,
      currentNodeId: null,
      nodeResults: new Map(),
      edgeSnapshots: new Map(),
      executionOrder: [],
      executionStartTime: null,
      executionEndTime: null,
    }),

  // Selectors
  getExecutionDuration: () => {
    const state = get();
    if (!state.executionStartTime) return 0;
    const endTime = state.executionEndTime || Date.now();
    return endTime - state.executionStartTime;
  },

  getCompletedNodes: () => {
    const state = get();
    const completed = [];
    state.nodeResults.forEach((result, nodeId) => {
      if (result.status === "success" || result.status === "error") {
        completed.push(nodeId);
      }
    });
    return completed;
  },

  getPendingNodes: () => {
    const state = get();
    const pending = [];
    state.nodeResults.forEach((result, nodeId) => {
      if (result.status === "pending") {
        pending.push(nodeId);
      }
    });
    return pending;
  },

  hasErrors: () => {
    const state = get();
    for (const result of state.nodeResults.values()) {
      if (result.status === "error") return true;
    }
    return false;
  },
}));

export default useExecutionStore;
