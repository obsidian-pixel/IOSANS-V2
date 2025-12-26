/**
 * Workflow Store
 * Central state for nodes and edges with localStorage persistence.
 * Part of IOSANS Sovereign Architecture.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

/**
 * @typedef {Object} Node
 * @property {string} id - Unique node ID
 * @property {string} type - Node type
 * @property {Object} position - {x, y} coordinates
 * @property {Object} data - Node-specific data
 */

/**
 * @typedef {Object} Edge
 * @property {string} id - Unique edge ID
 * @property {string} source - Source node ID
 * @property {string} sourceHandle - Source handle ID
 * @property {string} target - Target node ID
 * @property {string} targetHandle - Target handle ID
 */

const useWorkflowStore = create(
  persist(
    (set, get) => ({
      // State
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],

      // Node Actions
      addNode: (node) =>
        set((state) => ({
          nodes: [
            ...state.nodes,
            {
              id: node.id || uuidv4(),
              type: node.type,
              position: node.position || { x: 0, y: 0 },
              data: node.data || {},
              ...node,
            },
          ],
        })),

      updateNode: (nodeId, updates) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          ),
        })),

      updateNodeData: (nodeId, dataUpdates) =>
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...dataUpdates } }
              : node
          ),
        })),

      removeNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
        })),

      removeNodes: (nodeIds) =>
        set((state) => ({
          nodes: state.nodes.filter((node) => !nodeIds.includes(node.id)),
          edges: state.edges.filter(
            (edge) =>
              !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
          ),
        })),

      setNodes: (nodes) => set({ nodes }),

      // Edge Actions
      addEdge: (edge) =>
        set((state) => {
          // Prevent duplicate edges
          const exists = state.edges.some(
            (e) =>
              e.source === edge.source &&
              e.sourceHandle === edge.sourceHandle &&
              e.target === edge.target &&
              e.targetHandle === edge.targetHandle
          );
          if (exists) return state;

          return {
            edges: [
              ...state.edges,
              {
                id: edge.id || uuidv4(),
                ...edge,
              },
            ],
          };
        }),

      updateEdge: (edgeId, updates) =>
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === edgeId ? { ...edge, ...updates } : edge
          ),
        })),

      removeEdge: (edgeId) =>
        set((state) => ({
          edges: state.edges.filter((edge) => edge.id !== edgeId),
        })),

      removeEdges: (edgeIds) =>
        set((state) => ({
          edges: state.edges.filter((edge) => !edgeIds.includes(edge.id)),
        })),

      setEdges: (edges) => set({ edges }),

      // Selection Actions
      setSelectedNodes: (nodeIds) => set({ selectedNodeIds: nodeIds }),

      setSelectedEdges: (edgeIds) => set({ selectedEdgeIds: edgeIds }),

      clearSelection: () => set({ selectedNodeIds: [], selectedEdgeIds: [] }),

      // Bulk Actions
      clearWorkflow: () =>
        set({
          nodes: [],
          edges: [],
          selectedNodeIds: [],
          selectedEdgeIds: [],
        }),

      loadWorkflow: (workflow) =>
        set({
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
          selectedNodeIds: [],
          selectedEdgeIds: [],
        }),

      // Selectors (accessed via get())
      getNode: (nodeId) => get().nodes.find((node) => node.id === nodeId),

      getEdge: (edgeId) => get().edges.find((edge) => edge.id === edgeId),

      getConnectedEdges: (nodeId) =>
        get().edges.filter(
          (edge) => edge.source === nodeId || edge.target === nodeId
        ),

      getIncomingEdges: (nodeId) =>
        get().edges.filter((edge) => edge.target === nodeId),

      getOutgoingEdges: (nodeId) =>
        get().edges.filter((edge) => edge.source === nodeId),

      getUpstreamNodes: (nodeId) => {
        const state = get();
        const incomingEdges = state.edges.filter(
          (edge) => edge.target === nodeId
        );
        return incomingEdges
          .map((edge) => state.nodes.find((node) => node.id === edge.source))
          .filter(Boolean);
      },

      getDownstreamNodes: (nodeId) => {
        const state = get();
        const outgoingEdges = state.edges.filter(
          (edge) => edge.source === nodeId
        );
        return outgoingEdges
          .map((edge) => state.nodes.find((node) => node.id === edge.target))
          .filter(Boolean);
      },
    }),
    {
      name: "iosans-workflow",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);

export default useWorkflowStore;
