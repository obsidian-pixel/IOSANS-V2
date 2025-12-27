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
    const { inputs, nodeData, nodeId } = context;
    const { switchKey = "type", cases = [] } = nodeData;

    // Resolve value to switch on
    let switchValue = inputs;
    if (typeof inputs === "object" && inputs !== null && switchKey) {
      switchValue = inputs[switchKey];
    }

    // Find matching case
    // switchValue might be string or number, cases are usually strings
    let activeCase = null;
    if (cases.includes(String(switchValue))) {
      activeCase = String(switchValue);
    } else if (cases.includes("default")) {
      activeCase = "default";
    }

    const activeHandles = activeCase ? [`${nodeId}-case-${activeCase}`] : [];

    return {
      output: inputs,
      metadata: { type: "branch", activeCase, activeHandles },
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
    const { field, operator, value } = nodeData;

    let result = false;
    let actualValue = inputs;

    try {
      // 1. Resolve Value
      if (field && typeof inputs === "object") {
        // Simple dot notation support could be added here if needed
        actualValue = inputs[field];
      } else if (inputs && inputs.value !== undefined) {
        actualValue = inputs.value;
      }

      // 2. Evaluate Condition
      if (!operator) {
        // Fallback to truthiness
        result = Boolean(actualValue);
      } else {
        switch (operator) {
          case "equals":
          case "==":
            result = actualValue == value;
            break;
          case "notEquals":
          case "!=":
            result = actualValue != value;
            break;
          case "contains":
            result = String(actualValue).includes(value);
            break;
          case "greaterThan":
          case ">":
            result = Number(actualValue) > Number(value);
            break;
          case "lessThan":
          case "<":
            result = Number(actualValue) < Number(value);
            break;
          case "regex":
            result = new RegExp(value).test(String(actualValue));
            break;
          default:
            result = false;
        }
      }
    } catch (error) {
      console.warn("[ConditionNode] Evaluation error:", error);
      result = false;
    }

    const activeBranch = result ? "true" : "false";
    const activeHandles = [`${context.nodeId}-${activeBranch}`];

    return {
      output: inputs,
      metadata: {
        type: "condition",
        result,
        branch: activeBranch,
        activeHandles,
      },
    };
  }
}

// Add scanConnectedTools import
import { scanConnectedTools } from "../utils/toolSchemaGenerator.js";

/**
 * Code Executor - Javascript Sandbox (Lite)
 */
class CodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("codeExecutor");
  }

  validate(context) {
    if (!context.nodeData.code) {
      return {
        valid: false,
        error: "Code is required. Open Inspector to add JavaScript.",
      };
    }
    return { valid: true };
  }

  async execute(context) {
    const { inputs, nodeData } = context;
    const { code } = nodeData;

    try {
      // Create a function with 'inputs' available
      const func = new Function(
        "inputs",
        `
        try {
          ${code}
          // If code doesn't return, we try to grab 'output' var if defined, or just return inputs
          if (typeof output !== 'undefined') return output;
          return inputs;
        } catch(e) { throw e; }
      `
      );

      const result = func(inputs);
      return {
        output: result,
        metadata: { type: "codeExecutor", length: code?.length || 0 },
      };
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }
}

/**
 * HTTP Request Executor
 */
class HTTPRequestNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("httpRequest");
  }

  validate(context) {
    if (!context.nodeData.url) {
      return {
        valid: false,
        error: "URL is required. Open Inspector to configure.",
      };
    }
    return { valid: true };
  }

  async execute(context) {
    const { inputs, nodeData } = context;
    let { url, method = "GET", headers = {}, body } = nodeData;

    if (!url) throw new Error("No URL provided");

    // Template url support
    if (url.includes("{{")) {
      url = url.replace(/\{\{(\w+)\}\}/g, (_, k) => inputs[k] || "");
    }

    const options = {
      method,
      headers: { ...headers, "Content-Type": "application/json" },
    };

    if (method !== "GET" && method !== "HEAD") {
      if (body) {
        options.body = typeof body === "string" ? body : JSON.stringify(body);
      } else {
        options.body = JSON.stringify(inputs);
      }
    }

    try {
      const response = await fetch(url, options);
      const data = await response
        .json()
        .catch(() => ({ status: response.status }));

      if (!response.ok)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      return {
        output: data,
        metadata: { type: "httpRequest", status: response.status, url },
      };
    } catch (error) {
      throw new Error(`HTTP Request failed: ${error.message}`);
    }
  }
}

// ... (StartNodeExecutor, EndNodeExecutor, etc remain the same) ...

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
 * AI Agent Node - ReAct Agent with Tool Calling
 */
class AIAgentNodeExecutor extends BaseNodeExecutor {
  constructor() {
    super("aiAgent");
  }

  validate(context) {
    if (!context.services?.webLLM) {
      return { valid: false, error: "WebLLM service not available" };
    }
    if (!context.services?.toolCalling) {
      return { valid: false, error: "ToolCallingService not available" };
    }
    return { valid: true };
  }

  async execute(context) {
    const { inputs, services, setProgress, workflow, nodeId } = context;

    // 1. Prepare Inputs
    // Combine standard inputs into a user prompt/message
    let userMessage = "";
    if (typeof inputs === "string") {
      userMessage = inputs;
    } else if (inputs.prompt) {
      userMessage = inputs.prompt;
    } else {
      userMessage = JSON.stringify(inputs);
    }

    if (!userMessage) userMessage = "Process this request.";

    setProgress?.("Initializing Agent...", 10);

    // 2. Discover Tools
    let tools = [];
    let toolNodeMap = new Map();

    if (workflow && workflow.nodes && workflow.edges) {
      // Find the node instance to pass to scanner
      const nodeInstance = workflow.nodes.find((n) => n.id === nodeId);
      if (nodeInstance) {
        tools = scanConnectedTools(
          nodeInstance,
          workflow.edges,
          workflow.nodes
        );

        // Map generated tool names to Node IDs for execution
        // scanConnectedTools returns schemas. We need to find which node produced which schema.
        // Actually, scanConnectedTools is a bit opaque. Let's make it easier:
        // We can iterate the connected nodes manually or trust the naming convention.
        // The generator names them `${type}_${id}`.

        // Let's refine the map building.
        // We can re-scan or rely on the name.
        tools.forEach((tool) => {
          // Name format: type_uuid_parts
          // This is fragile if ID contains underscores. UUIDs use hyphens.
          // Better: Modify scanConnectedTools to return metadata or handle map building there.
          // For now, let's look for the node that has a matching ID in the name?
          // Or just Iterate edges again here to be safe.

          workflow.edges
            .filter(
              (e) => e.target === nodeId && e.targetHandle?.includes("resource")
            )
            .forEach((edge) => {
              const source = workflow.nodes.find((n) => n.id === edge.source);
              if (source && tool.name.includes(source.id.replace(/-/g, "_"))) {
                toolNodeMap.set(tool.name, source.id);
              }
            });
        });
      }
    }

    // 3. Configure Tool Service
    services.toolCalling.setTools(
      tools,
      toolNodeMap,
      // Execute Node Callback
      async (targetNodeId, toolInput) => {
        // We use the Engine's imperative executeNode
        // We must pass the 'services' to the tool node as well
        return await services.executionEngine.executeNode(
          targetNodeId,
          toolInput,
          { services }
        );
      }
    );

    // 4. Run ReAct Loop
    setProgress?.("Agent Thinking...", 30);

    const result = await services.toolCalling.runReActLoop(userMessage, {
      onStep: (step) => {
        // Log full detail to execution logs
        if (context.log) {
          if (step.type === "thought") {
            context.log(step.content, "info"); // Log full thought
          } else if (step.type === "action") {
            context.log(
              `Action: ${step.toolCall.name}(${JSON.stringify(
                step.toolCall.input
              )})`,
              "action"
            );
          }
        }

        // Update UI progress status (brief)
        if (step.type === "thought") {
          setProgress?.(`Thinking...`, 50);
        } else if (step.type === "action") {
          setProgress?.(`Calling tool: ${step.toolCall.name}...`, 70);
        }
      },
    });

    return {
      output: {
        response: result.answer,
        trace: result.steps,
      },
      metadata: {
        type: "aiAgent",
        toolCount: tools.length,
        steps: result.steps.length,
      },
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

  validate(context) {
    if (!context.nodeData.code) {
      return {
        valid: false,
        error: "Python code is required. Open Inspector to add script.",
      };
    }
    return { valid: true };
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

  validate(context) {
    const { inputs, nodeData } = context;
    const text =
      typeof inputs === "string" ? inputs : inputs?.text || nodeData.text;
    if (!text) {
      return {
        valid: false,
        error: "Missing text: Connect a text input or set 'Text' in Inspector.",
      };
    }
    return { valid: true };
  }

  async execute(context) {
    const { inputs, nodeData, services } = context;
    const text =
      typeof inputs === "string" ? inputs : inputs.text || nodeData.text;
    const { voice, rate, pitch } = nodeData;

    if (!text) {
      throw new Error(
        "Missing text: Configure 'Text' in the Inspector or connect a text output."
      );
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
    // Use Web Audio API to generate actual audio from text
    const sampleRate = 44100;
    const duration = Math.max(2, text.length * 0.08); // ~80ms per character
    const audioContext = new (window.AudioContext || window.webkitAudioContext)(
      { sampleRate }
    );

    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      1,
      sampleRate * duration,
      sampleRate
    );

    // Generate speech-like audio using formant synthesis
    const rate = options.rate || 1;
    const pitch = options.pitch || 1;
    const basePitch = 150 * pitch;

    // Create carrier oscillator
    const carrier = offlineContext.createOscillator();
    carrier.type = "sawtooth";
    carrier.frequency.setValueAtTime(basePitch, 0);

    // Create formant filters (vowel-like sounds)
    const formant1 = offlineContext.createBiquadFilter();
    formant1.type = "bandpass";
    formant1.frequency.setValueAtTime(500, 0);
    formant1.Q.setValueAtTime(10, 0);

    const formant2 = offlineContext.createBiquadFilter();
    formant2.type = "bandpass";
    formant2.frequency.setValueAtTime(1500, 0);
    formant2.Q.setValueAtTime(10, 0);

    // Create amplitude envelope based on text rhythm
    const gainNode = offlineContext.createGain();
    gainNode.gain.setValueAtTime(0, 0);

    // Simulate speech rhythm - syllables
    const syllableDuration = 0.15 / rate;
    let currentTime = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i].toLowerCase();

      // Pause on spaces/punctuation
      if (char === " " || char === "." || char === ",") {
        gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.05);
        currentTime += syllableDuration * (char === " " ? 0.5 : 1.5);
        continue;
      }

      // Vary pitch based on character for more natural sound
      const pitchVar = basePitch + (char.charCodeAt(0) % 50);
      carrier.frequency.linearRampToValueAtTime(pitchVar, currentTime);

      // Vowels are louder and longer
      const isVowel = "aeiou".includes(char);
      const targetGain = isVowel ? 0.4 : 0.2;
      const charDuration = isVowel
        ? syllableDuration * 1.2
        : syllableDuration * 0.8;

      gainNode.gain.linearRampToValueAtTime(targetGain, currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(
        targetGain * 0.8,
        currentTime + charDuration
      );

      currentTime += charDuration;
    }

    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, duration);

    // Connect the audio graph
    carrier.connect(formant1);
    formant1.connect(formant2);
    formant2.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    carrier.start(0);
    carrier.stop(duration);

    // Render audio
    const audioBuffer = await offlineContext.startRendering();

    // Convert AudioBuffer to WAV blob
    const wavBlob = this._audioBufferToWav(audioBuffer);

    audioContext.close();

    return wavBlob;
  }

  _audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const samples = audioBuffer.getChannelData(0);
    const dataLength = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // PCM format chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, dataLength, true);

    // Write audio samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: "audio/wav" });
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
    // Real procedural image generation based on prompt keywords
    const { width, height } = options;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Generate seeded random based on prompt
    const seed = this._hashString(prompt);
    const random = this._seededRandom(seed);

    // Analyze prompt for color/style hints
    const colors = this._extractColors(prompt, random);
    const style = this._detectStyle(prompt);

    // Create background
    const gradient = ctx.createLinearGradient(
      0,
      0,
      width * (0.5 + random() * 0.5),
      height * (0.5 + random() * 0.5)
    );
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(0.5, colors.secondary);
    gradient.addColorStop(1, colors.accent);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add procedural elements based on style
    if (style === "abstract" || style === "default") {
      this._drawAbstractShapes(ctx, width, height, random, colors);
    } else if (style === "geometric") {
      this._drawGeometricPattern(ctx, width, height, random, colors);
    } else if (style === "nature") {
      this._drawNatureElements(ctx, width, height, random, colors);
    }

    // Add texture overlay
    this._addNoiseTexture(ctx, width, height, random);

    // Convert to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  _seededRandom(seed) {
    let s = seed;
    return function () {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  _extractColors(prompt, random) {
    const lowercasePrompt = prompt.toLowerCase();
    const colorMap = {
      red: ["#ff4444", "#cc2222", "#ff6666"],
      blue: ["#4444ff", "#2266cc", "#6688ff"],
      green: ["#44ff44", "#22cc44", "#66ff88"],
      purple: ["#8844ff", "#6622cc", "#aa66ff"],
      orange: ["#ff8844", "#cc6622", "#ffaa66"],
      yellow: ["#ffff44", "#cccc22", "#ffff88"],
      pink: ["#ff44aa", "#cc2288", "#ff66cc"],
      dark: ["#1a1a2e", "#16213e", "#0f3460"],
      light: ["#f8f9fa", "#e9ecef", "#dee2e6"],
    };

    for (const [keyword, palette] of Object.entries(colorMap)) {
      if (lowercasePrompt.includes(keyword)) {
        return {
          primary: palette[0],
          secondary: palette[1],
          accent: palette[2],
        };
      }
    }

    // Default random palette
    const hue = random() * 360;
    return {
      primary: `hsl(${hue}, 70%, 50%)`,
      secondary: `hsl(${(hue + 30) % 360}, 60%, 40%)`,
      accent: `hsl(${(hue + 60) % 360}, 80%, 60%)`,
    };
  }

  _detectStyle(prompt) {
    const lowercasePrompt = prompt.toLowerCase();
    if (
      lowercasePrompt.includes("geometric") ||
      lowercasePrompt.includes("pattern")
    )
      return "geometric";
    if (
      lowercasePrompt.includes("nature") ||
      lowercasePrompt.includes("landscape")
    )
      return "nature";
    if (lowercasePrompt.includes("abstract")) return "abstract";
    return "default";
  }

  _drawAbstractShapes(ctx, width, height, random, colors) {
    const numShapes = 5 + Math.floor(random() * 10);

    for (let i = 0; i < numShapes; i++) {
      const x = random() * width;
      const y = random() * height;
      const size = 20 + random() * 150;

      ctx.beginPath();
      ctx.globalAlpha = 0.3 + random() * 0.5;

      const shapeType = Math.floor(random() * 3);
      if (shapeType === 0) {
        ctx.arc(x, y, size, 0, Math.PI * 2);
      } else if (shapeType === 1) {
        ctx.rect(x - size / 2, y - size / 2, size, size);
      } else {
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x - size, y + size);
        ctx.closePath();
      }

      ctx.fillStyle = i % 2 === 0 ? colors.accent : colors.secondary;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawGeometricPattern(ctx, width, height, random, colors) {
    const cellSize = 40 + Math.floor(random() * 40);
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (random() > 0.3) {
          ctx.fillStyle = random() > 0.5 ? colors.accent : colors.secondary;
          ctx.globalAlpha = 0.2 + random() * 0.4;
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  _drawNatureElements(ctx, width, height, random, colors) {
    // Draw circles like trees/plants
    const numElements = 8 + Math.floor(random() * 12);

    for (let i = 0; i < numElements; i++) {
      const x = random() * width;
      const y = height * 0.4 + random() * (height * 0.6);
      const size = 30 + random() * 80;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.globalAlpha = 0.4 + random() * 0.4;
      ctx.fillStyle = colors.accent;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _addNoiseTexture(ctx, width, height, random) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (random() - 0.5) * 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);
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

// Register UI node type aliases (Dashboard nodes)
registerExecutor("manualTrigger", new StartNodeExecutor()); // Manual trigger = start node
registerExecutor("scheduleTrigger", new StartNodeExecutor()); // Schedule trigger = start node
registerExecutor("aiAgent", new AIAgentNodeExecutor()); // AI Agent uses Agent executor
registerExecutor("ifElse", new ConditionNodeExecutor()); // IfElse = condition
registerExecutor("switch", new BranchNodeExecutor()); // Switch = branch
registerExecutor("codeExecutor", new CodeExecutor()); // JS Code Executor
registerExecutor("httpRequest", new HTTPRequestNodeExecutor()); // HTTP Request Executor
registerExecutor("output", new EndNodeExecutor()); // Output = end node
registerExecutor("base", new TransformNodeExecutor()); // Base node passthrough

export { BaseNodeExecutor };
