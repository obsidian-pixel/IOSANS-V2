/**
 * Node Executors Registry
 * Skeleton for node type execution handlers.
 * Part of IOSANS Sovereign Architecture.
 */

/**
 * @typedef {Object} ExecutionContext
 * @property {Object} inputs - Input data from upstream nodes
 * @property {Object} nodeData - Node configuration data
 * @property {Function} setProgress - Progress callback
 * @property {Object} services - Available services (webLLM, embedding, etc.)
 * @property {AbortSignal} signal - Abort signal for cancellation
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {*} output - Node output data
 * @property {Object} metadata - Execution metadata
 */

/**
 * Base executor class
 */
class BaseNodeExecutor {
  constructor(type) {
    this.type = type;
  }

  /**
   * Validates node inputs before execution
   * @param {ExecutionContext} context
   * @returns {{valid: boolean, error?: string}}
   */
  // eslint-disable-next-line no-unused-vars
  validate(_context) {
    return { valid: true };
  }

  /**
   * Executes the node
   * @param {ExecutionContext} context
   * @returns {Promise<ExecutionResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async execute(_context) {
    throw new Error(`Execute not implemented for ${this.type}`);
  }
}

/**
 * Start Node - Entry point, no inputs required
 */
class StartNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("start");
  }

  // eslint-disable-next-line no-unused-vars
  async execute(context) {
    return {
      output: { triggered: true, timestamp: Date.now() },
      metadata: { type: "start" },
    };
  }
}

/**
 * End Node - Terminal node, collects final results
 */
class EndNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("end");
  }

  async execute(context) {
    return {
      output: context.inputs,
      metadata: { type: "end", completed: true },
    };
  }
}

/**
 * Merge Node - Waits for all branches then combines
 */
class MergeNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("merge");
  }

  async execute(context) {
    const { inputs, nodeData } = context;
    const mergeStrategy = nodeData.mergeStrategy || "object";

    let merged;
    switch (mergeStrategy) {
      case "array":
        merged = Object.values(inputs);
        break;
      case "concat":
        merged = Object.values(inputs).flat();
        break;
      case "first":
        merged = Object.values(inputs)[0];
        break;
      case "object":
      default:
        merged = { ...inputs };
    }

    return {
      output: merged,
      metadata: {
        type: "merge",
        strategy: mergeStrategy,
        branchCount: Object.keys(inputs).length,
      },
    };
  }
}

/**
 * Branch Node - Splits execution into parallel paths
 */
class BranchNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("branch");
  }

  async execute(context) {
    const { inputs } = context;
    // Pass through input to all downstream branches
    return {
      output: inputs,
      metadata: { type: "branch" },
    };
  }
}

/**
 * Delay Node - Pauses execution
 */
class DelayNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("delay");
  }

  async execute(context) {
    const { inputs, nodeData, signal } = context;
    const delay = nodeData.delay || 1000;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, delay);
      if (signal) {
        signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new Error("Execution aborted"));
        });
      }
    });

    return {
      output: inputs,
      metadata: { type: "delay", delayMs: delay },
    };
  }
}

/**
 * Condition Node - Conditional branching
 */
class ConditionNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("condition");
  }

  async execute(context) {
    const { inputs, nodeData } = context;
    const { condition } = nodeData;

    let result = false;
    try {
      // Safe evaluation of simple conditions
      const value = inputs.value ?? inputs;
      if (typeof condition === "function") {
        result = condition(value);
      } else if (typeof condition === "string") {
        // Simple comparisons only
        result = Boolean(value);
      }
    } catch (error) {
      console.warn("[ConditionNode] Evaluation error:", error);
    }

    return {
      output: inputs,
      metadata: {
        type: "condition",
        result,
        branch: result ? "true" : "false",
      },
    };
  }
}

/**
 * LLM Node - Placeholder for LLM execution
 */
class LLMNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("llm");
  }

  validate(context) {
    if (!context.services?.webLLM) {
      return { valid: false, error: "WebLLM service not available" };
    }
    return { valid: true };
  }

  async execute(context) {
    const { nodeData, setProgress } = context;

    // This will be implemented with actual WebLLM integration
    setProgress?.("Generating response...", 50);

    return {
      output: {
        response: "[LLM response placeholder]",
        model: nodeData.modelId,
      },
      metadata: { type: "llm", modelId: nodeData.modelId },
    };
  }
}

/**
 * Transform Node - Data transformation
 */
class TransformNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("transform");
  }

  async execute(context) {
    const { inputs, nodeData } = context;
    const { transformType } = nodeData;

    let output = inputs;

    switch (transformType) {
      case "json-parse":
        output = typeof inputs === "string" ? JSON.parse(inputs) : inputs;
        break;
      case "json-stringify":
        output = JSON.stringify(inputs, null, 2);
        break;
      case "extract":
        output = inputs[nodeData.key];
        break;
      case "template":
        // Simple template substitution
        output = nodeData.template?.replace(
          /\{\{(\w+)\}\}/g,
          (_, key) => inputs[key] ?? ""
        );
        break;
      default:
        output = inputs;
    }

    return {
      output,
      metadata: { type: "transform", transformType },
    };
  }
}

/**
 * Python Executor - Runs Python code via Pyodide
 * Returns artifacts for complex outputs
 */
class PythonNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("python");
    this.pyodide = null;
  }

  async _loadPyodide() {
    if (this.pyodide) return this.pyodide;

    // Dynamically load Pyodide
    if (typeof loadPyodide === "undefined") {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
      document.head.appendChild(script);
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    // eslint-disable-next-line no-undef
    this.pyodide = await loadPyodide();
    return this.pyodide;
  }

  async execute(context) {
    const { inputs, nodeData, services } = context;
    const { code } = nodeData;

    if (!code) {
      throw new Error("No Python code provided");
    }

    const pyodide = await this._loadPyodide();

    // Inject inputs as Python globals
    pyodide.globals.set("inputs", pyodide.toPy(inputs));

    // Execute code
    let result;
    try {
      result = await pyodide.runPythonAsync(code);
      result = result?.toJs ? result.toJs() : result;
    } catch (error) {
      throw new Error(`Python execution error: ${error.message}`);
    }

    // Check if result is complex (object/array)
    const isComplex =
      result !== null &&
      typeof result === "object" &&
      (Array.isArray(result) || Object.keys(result).length > 0);

    if (isComplex && services?.artifactStorage) {
      // Save as artifact
      const blob = new Blob([JSON.stringify(result, null, 2)], {
        type: "application/json",
      });
      const artifact = await services.artifactStorage.saveArtifact(
        blob,
        "python-output"
      );

      return {
        output: { artifactId: artifact.id, type: "json" },
        metadata: { type: "python", hasArtifact: true },
      };
    }

    return {
      output: result,
      metadata: { type: "python", hasArtifact: false },
    };
  }
}

/**
 * Text-to-Speech Executor
 * Generates audio Blob and saves to IDB
 */
class TextToSpeechNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("textToSpeech");
  }

  async execute(context) {
    const { inputs, nodeData, services } = context;
    const text =
      typeof inputs === "string" ? inputs : inputs.text || nodeData.text;
    const { voice, rate, pitch } = nodeData;

    if (!text) {
      throw new Error("No text provided for speech synthesis");
    }

    // Use Web Speech API to generate audio
    const audioBlob = await this._synthesizeSpeech(text, {
      voice,
      rate,
      pitch,
    });

    // Save artifact
    if (!services?.artifactStorage) {
      throw new Error("Artifact storage service not available");
    }

    const artifact = await services.artifactStorage.saveArtifact(
      audioBlob,
      "tts-audio"
    );

    // MANDATE: Return artifact reference, never text description
    return {
      output: { artifactId: artifact.id, type: "audio/wav" },
      metadata: { type: "textToSpeech", textLength: text.length },
    };
  }

  async _synthesizeSpeech(text, options = {}) {
    return new Promise((resolve, reject) => {
      const synth = window.speechSynthesis;

      if (!synth) {
        reject(new Error("Speech synthesis not supported"));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;

      // Select voice if specified
      if (options.voice) {
        const voices = synth.getVoices();
        const selectedVoice = voices.find((v) => v.name === options.voice);
        if (selectedVoice) utterance.voice = selectedVoice;
      }

      // Create audio context for recording
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const dest = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(dest.stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        resolve(blob);
      };

      mediaRecorder.start();
      synth.speak(utterance);

      utterance.onend = () => {
        mediaRecorder.stop();
        audioContext.close();
      };

      utterance.onerror = (e) => reject(new Error(`TTS error: ${e.error}`));
    });
  }
}

/**
 * Image Generation Executor
 * Generates image Blob and saves to IDB
 */
class ImageGenerationNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("imageGeneration");
  }

  validate(context) {
    if (!context.services?.webLLM) {
      return {
        valid: false,
        error: "WebLLM service required for image generation",
      };
    }
    return { valid: true };
  }

  async execute(context) {
    const { inputs, nodeData, services, setProgress } = context;
    const prompt =
      typeof inputs === "string" ? inputs : inputs.prompt || nodeData.prompt;
    const { width, height, style } = nodeData;

    if (!prompt) {
      throw new Error("No prompt provided for image generation");
    }

    setProgress?.("Generating image...", 10);

    // Use placeholder generation for now (actual integration with image model later)
    const imageBlob = await this._generateImage(prompt, {
      width: width || 512,
      height: height || 512,
      style: style || "default",
    });

    setProgress?.("Saving artifact...", 90);

    // Save artifact
    if (!services?.artifactStorage) {
      throw new Error("Artifact storage service not available");
    }

    const artifact = await services.artifactStorage.saveArtifact(
      imageBlob,
      "generated-image"
    );

    // MANDATE: Return artifact reference, never text description
    return {
      output: { artifactId: artifact.id, type: "image/png" },
      metadata: {
        type: "imageGeneration",
        prompt,
        dimensions: { width: width || 512, height: height || 512 },
      },
    };
  }

  async _generateImage(prompt, options) {
    // Placeholder: Generate a canvas with the prompt text
    // In production, this would call an actual image generation model
    const { width, height } = options;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(1, "#16213e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add prompt text
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `[Generated: ${prompt.slice(0, 50)}...]`,
      width / 2,
      height / 2
    );

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }
}

// Registry of all executors
const executorRegistry = new Map();

/**
 * Registers a node executor
 * @param {string} type - Node type
 * @param {BaseNodeExecutor} executor - Executor instance
 */
export function registerExecutor(type, executor) {
  executorRegistry.set(type, executor);
}

/**
 * Gets an executor for a node type
 * @param {string} type
 * @returns {BaseNodeExecutor}
 */
export function getExecutor(type) {
  return executorRegistry.get(type);
}

/**
 * Checks if an executor exists for a type
 * @param {string} type
 * @returns {boolean}
 */
export function hasExecutor(type) {
  return executorRegistry.has(type);
}

// Register default executors
registerExecutor("start", new StartNodeExecutor());
registerExecutor("end", new EndNodeExecutor());
registerExecutor("merge", new MergeNodeExecutor());
registerExecutor("branch", new BranchNodeExecutor());
registerExecutor("delay", new DelayNodeExecutor());
registerExecutor("condition", new ConditionNodeExecutor());
registerExecutor("llm", new LLMNodeExecutor());
registerExecutor("transform", new TransformNodeExecutor());

// Register Phase 7 tool executors
registerExecutor("python", new PythonNodeExecutor());
registerExecutor("textToSpeech", new TextToSpeechNodeExecutor());
registerExecutor("imageGeneration", new ImageGenerationNodeExecutor());

export { BaseNodeExecutor };
