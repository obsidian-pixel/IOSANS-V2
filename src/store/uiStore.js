import { create } from "zustand";

/**
 * UI Store
 * Manages global UI state like Toasts, Modals, etc.
 */
const useUIStore = create((set) => ({
  toasts: [],

  /**
   * Add a new toast notification
   * @param {Object} toast - { message, type: 'error'|'success'|'warning'|'info', duration }
   */
  addToast: (toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
  },

  /**
   * Remove a toast by ID
   * @param {string} id
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  /**
   * Clear all toasts
   */
  clearToasts: () => {
    set({ toasts: [] });
  },
  // Docs Modal State
  isDocsOpen: false,
  activeDocsNodeType: null,

  openDocs: (nodeType = null) =>
    set({ isDocsOpen: true, activeDocsNodeType: nodeType }),
  closeDocs: () => set({ isDocsOpen: false, activeDocsNodeType: null }),
}));

export default useUIStore;
