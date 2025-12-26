/**
 * Model Store
 * Tracks AI model loading state and capabilities.
 * Part of IOSANS Sovereign Architecture.
 */

import { create } from "zustand";
import { getModelById, MODEL_REGISTRY } from "../engine/modelRegistry.js";
import { detectHardware } from "../utils/hardwareDetection.js";

const useModelStore = create((set, get) => ({
  // State
  currentModelId: null,
  downloadProgress: 0,
  downloadStatus: null, // null | 'downloading' | 'ready' | 'error'
  downloadError: null,
  hardwareInfo: null,
  isInitialized: false,

  // Actions
  initializeHardware: async () => {
    try {
      const hardware = await detectHardware();
      set({
        hardwareInfo: hardware,
        isInitialized: true,
      });
      return hardware;
    } catch (error) {
      console.error("[ModelStore] Hardware detection failed:", error);
      set({
        hardwareInfo: { vram: 0, hasWebGPU: false, tier: "low" },
        isInitialized: true,
      });
      return null;
    }
  },

  setCurrentModel: (modelId) =>
    set({
      currentModelId: modelId,
      downloadProgress: 100,
      downloadStatus: "ready",
      downloadError: null,
    }),

  setDownloadProgress: (progress, status = "downloading") =>
    set({
      downloadProgress: progress,
      downloadStatus: status,
    }),

  setDownloadError: (error) =>
    set({
      downloadProgress: 0,
      downloadStatus: "error",
      downloadError:
        typeof error === "string" ? error : error?.message || String(error),
    }),

  clearModel: () =>
    set({
      currentModelId: null,
      downloadProgress: 0,
      downloadStatus: null,
      downloadError: null,
    }),

  // Selectors

  /**
   * Checks if a model can be loaded based on VRAM requirements.
   * @param {string} modelId - Model ID from registry
   * @returns {boolean}
   */
  canLoadModel: (modelId) => {
    const state = get();
    const model = getModelById(modelId);

    if (!model) {
      console.warn(`[ModelStore] Model not found: ${modelId}`);
      return false;
    }

    if (!state.hardwareInfo) {
      console.warn("[ModelStore] Hardware info not initialized");
      return false;
    }

    if (!state.hardwareInfo.hasWebGPU) {
      console.warn("[ModelStore] WebGPU not available");
      return false;
    }

    // Compare VRAM requirement vs available
    const canLoad = model.vram_required <= state.hardwareInfo.vram;

    if (!canLoad) {
      console.log(
        `[ModelStore] Insufficient VRAM for ${modelId}: ` +
          `requires ${model.vram_required}GB, available ${state.hardwareInfo.vram}GB`
      );
    }

    return canLoad;
  },

  /**
   * Gets all models that can run on current hardware.
   * @returns {Array}
   */
  getLoadableModels: () => {
    const state = get();

    if (!state.hardwareInfo || !state.hardwareInfo.hasWebGPU) {
      return [];
    }

    return MODEL_REGISTRY.filter(
      (model) => model.vram_required <= state.hardwareInfo.vram
    );
  },

  /**
   * Gets the recommended model for current hardware.
   * @param {'text'|'vision'|'code'|'embedding'} type
   * @returns {Object|null}
   */
  getRecommendedModel: (type = "text") => {
    const state = get();

    if (!state.hardwareInfo || !state.hardwareInfo.hasWebGPU) {
      return null;
    }

    const loadable = MODEL_REGISTRY.filter(
      (model) =>
        model.type === type && model.vram_required <= state.hardwareInfo.vram
    ).sort((a, b) => b.vram_required - a.vram_required);

    return loadable[0] || null;
  },

  /**
   * Gets the current model config.
   * @returns {Object|null}
   */
  getCurrentModelConfig: () => {
    const state = get();
    if (!state.currentModelId) return null;
    return getModelById(state.currentModelId);
  },

  /**
   * Checks if system is ready for AI operations.
   * @returns {boolean}
   */
  isSystemReady: () => {
    const state = get();
    return (
      state.isInitialized &&
      state.hardwareInfo?.hasWebGPU &&
      state.currentModelId !== null &&
      state.downloadStatus === "ready"
    );
  },
}));

export default useModelStore;
