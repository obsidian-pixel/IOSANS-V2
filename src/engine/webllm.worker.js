/**
 * WebLLM Worker
 * Isolated Web Worker for running LLM inference without blocking UI.
 * Part of IOSANS Sovereign Architecture.
 */

import * as webllm from "@mlc-ai/web-llm";

let engine = null;
let currentModelId = null;

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
 * Initializes or switches the LLM engine to the specified model.
 * @param {string} modelId - Model ID from the registry
 */
async function initializeEngine(modelId) {
  if (engine && currentModelId === modelId) {
    return; // Already loaded
  }

  postProgress("Initializing WebLLM engine...", 0);

  try {
    // Create progress callback
    const progressCallback = (report) => {
      const progress = Math.round(report.progress * 100);
      postProgress(report.text || "Loading model...", progress);
    };

    // Create new engine with the specified model
    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: progressCallback,
      logLevel: "SILENT",
    });

    currentModelId = modelId;
    postProgress("Model loaded successfully", 100);

    self.postMessage({
      type: "MODEL_LOADED",
      payload: { modelId },
    });
  } catch (error) {
    postError("Failed to initialize model", error);
    throw error;
  }
}

/**
 * Generates a response from the LLM.
 * @param {Object} request - Generation request
 * @param {string} request.modelId - Model ID to use
 * @param {Array} request.messages - Chat messages
 * @param {Object} request.options - Generation options
 */
async function handleGenerate(request) {
  const { modelId, messages, options = {} } = request;

  try {
    // Ensure engine is initialized with correct model
    await initializeEngine(modelId);

    postProgress("Generating response...", 0);

    // Process messages for vision models (handle image_url content)
    const processedMessages = messages.map((msg) => {
      if (Array.isArray(msg.content)) {
        // Handle multimodal content (text + images)
        return {
          ...msg,
          content: msg.content.map((item) => {
            if (item.type === "image_url") {
              return {
                type: "image_url",
                image_url: {
                  url: item.image_url?.url || item.url,
                },
              };
            }
            return item;
          }),
        };
      }
      return msg;
    });

    // Generation options
    const genOptions = {
      temperature: options.temperature ?? 0.7,
      top_p: options.top_p ?? 0.9,
      max_tokens: options.max_tokens ?? 1024,
      stream: options.stream ?? false,
      ...options,
    };

    let response;

    if (genOptions.stream) {
      // Streaming generation
      let fullContent = "";
      const chunks = await engine.chat.completions.create({
        messages: processedMessages,
        ...genOptions,
        stream: true,
      });

      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || "";
        fullContent += delta;

        self.postMessage({
          type: "STREAM_CHUNK",
          payload: {
            content: delta,
            fullContent,
          },
        });
      }

      response = {
        content: fullContent,
        finishReason: "stop",
      };
    } else {
      // Non-streaming generation
      const result = await engine.chat.completions.create({
        messages: processedMessages,
        ...genOptions,
      });

      response = {
        content: result.choices[0]?.message?.content || "",
        finishReason: result.choices[0]?.finish_reason || "stop",
        usage: result.usage,
      };
    }

    self.postMessage({
      type: "GENERATE_COMPLETE",
      payload: response,
    });
  } catch (error) {
    postError("Generation failed", error);
  }
}

/**
 * Unloads the current model to free memory.
 */
async function handleUnload() {
  if (engine) {
    try {
      await engine.unload();
      engine = null;
      currentModelId = null;

      self.postMessage({
        type: "MODEL_UNLOADED",
        payload: {},
      });
    } catch (error) {
      postError("Failed to unload model", error);
    }
  }
}

/**
 * Gets the current engine status.
 */
function handleStatus() {
  self.postMessage({
    type: "STATUS",
    payload: {
      loaded: engine !== null,
      modelId: currentModelId,
    },
  });
}

// Message handler
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case "GENERATE":
        await handleGenerate(payload);
        break;

      case "LOAD_MODEL":
        await initializeEngine(payload.modelId);
        break;

      case "UNLOAD":
        await handleUnload();
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
