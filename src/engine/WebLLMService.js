/**
 * WebLLM Service
 * Service layer bridging UI and Web Workers for AI operations.
 * Part of IOSANS Sovereign Architecture.
 */

import { getModelById, MODEL_REGISTRY } from "./modelRegistry.js";

/**
 * @typedef {Object} GenerateOptions
 * @property {number} temperature - Sampling temperature (0-2)
 * @property {number} top_p - Nucleus sampling parameter
 * @property {number} max_tokens - Maximum tokens to generate
 * @property {boolean} stream - Enable streaming responses
 */

/**
 * @typedef {Object} Message
 * @property {'system'|'user'|'assistant'} role
 * @property {string|Array} content - Text or multimodal content
 */

class WebLLMService {
  constructor() {
    this.llmWorker = null;
    this.embeddingWorker = null;
    this.llmReady = false;
    this.embeddingReady = false;
    this.currentModelId = null;
    this.listeners = new Map();
    this.messageQueue = [];
  }

  /**
   * Initializes the LLM worker.
   * @returns {Promise<void>}
   */
  async initLLMWorker() {
    if (this.llmWorker) return;

    return new Promise((resolve, reject) => {
      try {
        this.llmWorker = new Worker(
          new URL("./webllm.worker.js", import.meta.url),
          { type: "module" }
        );

        this.llmWorker.onmessage = (event) => {
          this._handleLLMMessage(event.data);
        };

        this.llmWorker.onerror = (error) => {
          console.error("[WebLLMService] LLM Worker error:", error);
          this._emit("error", { source: "llm", error });
          reject(error);
        };

        // Wait for ready signal
        const readyHandler = (data) => {
          if (data.type === "READY") {
            this.llmReady = true;
            resolve();
          }
        };
        this._once("llm-ready", readyHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initializes the embedding worker.
   * @returns {Promise<void>}
   */
  async initEmbeddingWorker() {
    if (this.embeddingWorker) return;

    return new Promise((resolve, reject) => {
      try {
        this.embeddingWorker = new Worker(
          new URL("./embedding.worker.js", import.meta.url),
          { type: "module" }
        );

        this.embeddingWorker.onmessage = (event) => {
          this._handleEmbeddingMessage(event.data);
        };

        this.embeddingWorker.onerror = (error) => {
          console.error("[WebLLMService] Embedding Worker error:", error);
          this._emit("error", { source: "embedding", error });
          reject(error);
        };

        // Wait for ready signal
        const readyHandler = (data) => {
          if (data.type === "READY") {
            this.embeddingReady = true;
            resolve();
          }
        };
        this._once("embedding-ready", readyHandler);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initializes both workers.
   * @returns {Promise<void>}
   */
  async initialize() {
    await Promise.all([this.initLLMWorker(), this.initEmbeddingWorker()]);
    console.log("[WebLLMService] All workers initialized");
  }

  /**
   * Loads a specific model.
   * @param {string} modelId - Model ID from registry
   * @param {function} onProgress - Progress callback
   * @returns {Promise<void>}
   */
  async loadModel(modelId, onProgress = null) {
    if (!this.llmWorker) {
      await this.initLLMWorker();
    }

    const model = getModelById(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    return new Promise((resolve, reject) => {
      const progressHandler = (data) => {
        if (onProgress && data.payload) {
          onProgress(data.payload);
        }
      };

      const loadedHandler = (data) => {
        if (data.type === "MODEL_LOADED") {
          this.currentModelId = modelId;
          this._off("progress", progressHandler);
          resolve();
        }
      };

      const errorHandler = (data) => {
        if (data.type === "ERROR") {
          this._off("progress", progressHandler);
          reject(new Error(data.payload.message));
        }
      };

      this._on("progress", progressHandler);
      this._once("model-loaded", loadedHandler);
      this._once("error", errorHandler);

      this.llmWorker.postMessage({
        type: "LOAD_MODEL",
        payload: { modelId },
      });
    });
  }

  /**
   * Generates a response using the LLM.
   * @param {Message[]} messages - Conversation messages
   * @param {GenerateOptions} options - Generation options
   * @param {function} onStream - Streaming callback
   * @returns {Promise<{content: string, usage?: Object}>}
   */
  async generate(messages, options = {}, onStream = null) {
    if (!this.llmWorker) {
      throw new Error("LLM Worker not initialized");
    }

    const modelId = options.modelId || this.currentModelId;
    if (!modelId) {
      throw new Error("No model loaded");
    }

    return new Promise((resolve, reject) => {
      const streamHandler = (data) => {
        if (data.type === "STREAM_CHUNK" && onStream) {
          onStream(data.payload);
        }
      };

      const completeHandler = (data) => {
        if (data.type === "GENERATE_COMPLETE") {
          this._off("stream", streamHandler);
          resolve(data.payload);
        }
      };

      const errorHandler = (data) => {
        if (data.type === "ERROR") {
          this._off("stream", streamHandler);
          reject(new Error(data.payload.message));
        }
      };

      if (options.stream) {
        this._on("stream", streamHandler);
      }
      this._once("generate-complete", completeHandler);
      this._once("error", errorHandler);

      this.llmWorker.postMessage({
        type: "GENERATE",
        payload: {
          modelId,
          messages,
          options,
        },
      });
    });
  }

  /**
   * Generates embeddings for text.
   * @param {string|string[]} text - Text(s) to embed
   * @param {function} onProgress - Progress callback
   * @returns {Promise<{embeddings: Float32Array|Float32Array[], dimensions: number}>}
   */
  async embed(text, onProgress = null) {
    if (!this.embeddingWorker) {
      await this.initEmbeddingWorker();
    }

    return new Promise((resolve, reject) => {
      const progressHandler = (data) => {
        if (onProgress && data.payload) {
          onProgress(data.payload);
        }
      };

      const completeHandler = (data) => {
        if (data.type === "EMBED_COMPLETE") {
          this._off("progress", progressHandler);
          resolve(data.payload);
        }
      };

      const errorHandler = (data) => {
        if (data.type === "ERROR") {
          this._off("progress", progressHandler);
          reject(new Error(data.payload.message));
        }
      };

      this._on("progress", progressHandler);
      this._once("embed-complete", completeHandler);
      this._once("error", errorHandler);

      this.embeddingWorker.postMessage({
        type: "EMBED",
        payload: { text },
      });
    });
  }

  /**
   * Computes similarity between two texts.
   * @param {string} text1
   * @param {string} text2
   * @returns {Promise<number>} Cosine similarity
   */
  async computeSimilarity(text1, text2) {
    const { embeddings } = await this.embed([text1, text2]);

    return new Promise((resolve, reject) => {
      const completeHandler = (data) => {
        if (data.type === "SIMILARITY_COMPLETE") {
          resolve(data.payload.similarity);
        }
      };

      const errorHandler = (data) => {
        if (data.type === "ERROR") {
          reject(new Error(data.payload.message));
        }
      };

      this._once("similarity-complete", completeHandler);
      this._once("error", errorHandler);

      this.embeddingWorker.postMessage({
        type: "SIMILARITY",
        payload: {
          embedding1: Array.from(embeddings[0]),
          embedding2: Array.from(embeddings[1]),
        },
      });
    });
  }

  /**
   * Unloads the current model.
   * @returns {Promise<void>}
   */
  async unloadModel() {
    if (!this.llmWorker) return;

    return new Promise((resolve) => {
      const unloadHandler = () => {
        this.currentModelId = null;
        resolve();
      };

      this._once("model-unloaded", unloadHandler);

      this.llmWorker.postMessage({ type: "UNLOAD" });
    });
  }

  /**
   * Gets the current status.
   * @returns {Object}
   */
  getStatus() {
    return {
      llmReady: this.llmReady,
      embeddingReady: this.embeddingReady,
      currentModelId: this.currentModelId,
      availableModels: MODEL_REGISTRY,
    };
  }

  /**
   * Terminates all workers.
   */
  terminate() {
    if (this.llmWorker) {
      this.llmWorker.terminate();
      this.llmWorker = null;
    }
    if (this.embeddingWorker) {
      this.embeddingWorker.terminate();
      this.embeddingWorker = null;
    }
    this.llmReady = false;
    this.embeddingReady = false;
    this.currentModelId = null;
    console.log("[WebLLMService] All workers terminated");
  }

  // Internal event handling
  _handleLLMMessage(data) {
    switch (data.type) {
      case "READY":
        this._emit("llm-ready", data);
        break;
      case "PROGRESS":
        this._emit("progress", data);
        break;
      case "MODEL_LOADED":
        this._emit("model-loaded", data);
        break;
      case "MODEL_UNLOADED":
        this._emit("model-unloaded", data);
        break;
      case "STREAM_CHUNK":
        this._emit("stream", data);
        break;
      case "GENERATE_COMPLETE":
        this._emit("generate-complete", data);
        break;
      case "ERROR":
        this._emit("error", data);
        break;
    }
  }

  _handleEmbeddingMessage(data) {
    switch (data.type) {
      case "READY":
        this._emit("embedding-ready", data);
        break;
      case "PROGRESS":
        this._emit("progress", data);
        break;
      case "MODEL_LOADED":
        this._emit("embedding-model-loaded", data);
        break;
      case "EMBED_COMPLETE":
        this._emit("embed-complete", data);
        break;
      case "SIMILARITY_COMPLETE":
        this._emit("similarity-complete", data);
        break;
      case "ERROR":
        this._emit("error", data);
        break;
    }
  }

  _on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);
  }

  _off(event, handler) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(handler);
    }
  }

  _once(event, handler) {
    const wrapper = (data) => {
      this._off(event, wrapper);
      handler(data);
    };
    this._on(event, wrapper);
  }

  _emit(event, data) {
    if (this.listeners.has(event)) {
      for (const handler of this.listeners.get(event)) {
        handler(data);
      }
    }
  }
}

// Export singleton instance
export const webLLMService = new WebLLMService();

// Also export class for testing
export { WebLLMService };
