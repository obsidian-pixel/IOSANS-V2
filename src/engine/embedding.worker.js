/**
 * Embedding Worker
 * Isolated Web Worker for generating text embeddings.
 * Uses @xenova/transformers with all-MiniLM-L6-v2 model.
 * Part of IOSANS Sovereign Architecture.
 */

import { pipeline, env } from "@xenova/transformers";

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

let embedder = null;
let isInitializing = false;

/**
 * Posts a progress event to the main thread.
 * @param {string} status - Progress status message
 * @param {number} progress - Progress percentage (0-100)
 */
function postProgress(status, progress = 0) {
  self.postMessage({
    type: "PROGRESS",
    payload: { status, progress },
  });
}

/**
 * Posts an error event to the main thread.
 * @param {string} message - Error message
 * @param {Error} error - Original error object
 */
function postError(message, error) {
  self.postMessage({
    type: "ERROR",
    payload: {
      message,
      error: error?.message || String(error),
    },
  });
}

/**
 * Initializes the embedding pipeline.
 */
async function initializeEmbedder() {
  if (embedder) return;
  if (isInitializing) {
    // Wait for initialization to complete
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return;
  }

  isInitializing = true;
  postProgress("Loading embedding model...", 0);

  try {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      progress_callback: (data) => {
        if (data.status === "progress") {
          const progress = Math.round((data.loaded / data.total) * 100);
          postProgress(`Loading: ${data.file}`, progress);
        }
      },
    });

    postProgress("Embedding model ready", 100);

    self.postMessage({
      type: "MODEL_LOADED",
      payload: { modelId: "Xenova/all-MiniLM-L6-v2" },
    });
  } catch (error) {
    postError("Failed to load embedding model", error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Generates embeddings for the given text(s).
 * @param {Object} request - Embed request
 * @param {string|string[]} request.text - Text or array of texts to embed
 * @param {boolean} request.normalize - Whether to normalize embeddings (default: true)
 * @param {boolean} request.pooling - Pooling strategy: 'mean' | 'cls' (default: 'mean')
 */
async function handleEmbed(request) {
  const { text, normalize = true, pooling = "mean" } = request;

  try {
    await initializeEmbedder();

    const texts = Array.isArray(text) ? text : [text];

    postProgress(`Generating embeddings for ${texts.length} text(s)...`, 0);

    const embeddings = [];

    for (let i = 0; i < texts.length; i++) {
      const output = await embedder(texts[i], {
        pooling,
        normalize,
      });

      // Convert to Float32Array
      const embedding = new Float32Array(output.data);
      embeddings.push(embedding);

      const progress = Math.round(((i + 1) / texts.length) * 100);
      postProgress(`Processed ${i + 1}/${texts.length}`, progress);
    }

    // Return single embedding or array based on input
    const result = Array.isArray(text) ? embeddings : embeddings[0];

    self.postMessage({
      type: "EMBED_COMPLETE",
      payload: {
        embeddings: result,
        dimensions: embeddings[0]?.length || 384,
        count: embeddings.length,
      },
    });
  } catch (error) {
    postError("Embedding generation failed", error);
  }
}

/**
 * Computes cosine similarity between two embeddings.
 * @param {Float32Array} a - First embedding
 * @param {Float32Array} b - Second embedding
 * @returns {number} Cosine similarity (-1 to 1)
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error("Embeddings must have same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Handles similarity computation request.
 * @param {Object} request
 * @param {Float32Array} request.embedding1
 * @param {Float32Array} request.embedding2
 */
function handleSimilarity(request) {
  const { embedding1, embedding2 } = request;

  try {
    const similarity = cosineSimilarity(
      new Float32Array(embedding1),
      new Float32Array(embedding2)
    );

    self.postMessage({
      type: "SIMILARITY_COMPLETE",
      payload: { similarity },
    });
  } catch (error) {
    postError("Similarity computation failed", error);
  }
}

/**
 * Gets the current status.
 */
function handleStatus() {
  self.postMessage({
    type: "STATUS",
    payload: {
      loaded: embedder !== null,
      modelId: "Xenova/all-MiniLM-L6-v2",
      dimensions: 384,
    },
  });
}

// Message handler
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case "EMBED":
        await handleEmbed(payload);
        break;

      case "SIMILARITY":
        handleSimilarity(payload);
        break;

      case "INIT":
        await initializeEmbedder();
        break;

      case "STATUS":
        handleStatus();
        break;

      default:
        postError(`Unknown message type: ${type}`, null);
    }
  } catch (error) {
    postError(`Worker error handling ${type}`, error);
  }
};

// Signal ready
self.postMessage({ type: "READY" });
