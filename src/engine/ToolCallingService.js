/**
 * Tool Calling Service
 * ReAct loop implementation connecting LLM to tools.
 * Part of IOSANS Sovereign Architecture.
 */

import { getExecutor } from "./NodeExecutors.js";
import { generateToolSystemPrompt } from "../utils/toolSchemaGenerator.js";

/**
 * ReAct parsing patterns
 */
const PATTERNS = {
  ACTION: /^Action:\s*(.+)$/m,
  ACTION_INPUT: /^Action Input:\s*(.+)$/m,
  FINAL_ANSWER: /^Final Answer:\s*([\s\S]+)$/m,
  THOUGHT: /^Thought:\s*([\s\S]+?)(?=\n(?:Action|Final Answer)|$)/m,
};

/**
 * @typedef {Object} ReActStep
 * @property {'thought'|'action'|'observation'|'answer'} type
 * @property {string} content
 * @property {Object} [toolCall] - For action steps
 * @property {Object} [result] - For observation steps
 */

/**
 * @typedef {Object} ReActConfig
 * @property {number} maxIterations - Maximum ReAct loop iterations
 * @property {boolean} verbose - Log steps to console
 * @property {Function} onStep - Callback for each step
 */

const DEFAULT_CONFIG = {
  maxIterations: 10,
  verbose: false,
  onStep: null,
};

class ToolCallingService {
  constructor(webLLMService) {
    this.webLLM = webLLMService;
    this.tools = [];
    this.services = {};
  }

  /**
   * Sets available tools
   * @param {Array} tools - Tool schemas
   */
  /**
   * Sets available tools and their node mappings
   * @param {Array} tools - Tool schemas
   * @param {Map<string, string>} toolNodeMap - Map of tool name to node ID
   * @param {Function} executeNodeCallback - Callback to execute a node by ID
   */
  setTools(tools, toolNodeMap, executeNodeCallback) {
    this.tools = tools;
    this.toolNodeMap = toolNodeMap || new Map();
    this.executeNodeCallback = executeNodeCallback;
  }

  /**
   * Sets service dependencies
   * @param {Object} services - artifactStorage, etc.
   */
  setServices(services) {
    this.services = services;
  }

  // ...

  /**
   * Executes a tool and returns the result
   * @private
   */
  async _executeTool(toolName, toolInput) {
    // 1. Check if it's a connected Tool Node
    if (this.toolNodeMap && this.toolNodeMap.has(toolName)) {
      const nodeId = this.toolNodeMap.get(toolName);
      if (this.executeNodeCallback) {
        try {
          console.log(
            `[ToolCalling] Executing node tool: ${toolName} (${nodeId})`
          );
          // Execute the node. We assume executeNodeCallback handles result extraction.
          // We pass 'toolInput' as if it came from the workflow or merged with config.
          const result = await this.executeNodeCallback(nodeId, toolInput);
          return result;
        } catch (err) {
          return { error: `Tool execution failed: ${err.message}` };
        }
      }
    }

    // 2. Check for built-in/registered executors (legacy/direct)
    const executor = getExecutor(toolName);

    if (!executor) {
      return { error: `Tool "${toolName}" not found` };
    }

    try {
      const context = {
        inputs: toolInput,
        nodeData: toolInput,
        services: this.services,
        signal: null,
        setProgress: () => {},
      };

      const result = await executor.execute(context);
      return result;
    } catch (error) {
      return { error: error.message };
    }
  }

  // ...

  /**
   * Runs a single tool directly (for ExecutionEngine integration)
   * @param {string} toolName
   * @param {Object} toolInput
   * @returns {Promise<Object>}
   */
  async runTool(toolName, toolInput) {
    return this._executeTool(toolName, toolInput);
  }

  /**
   * Main ReAct Loop
   * @param {string} userPrompt
   * @param {ReActConfig} config
   */
  async runReActLoop(userPrompt, config = {}) {
    const { maxIterations = DEFAULT_CONFIG.maxIterations, onStep } = config;

    // Initialize prompt with system instruction
    const systemPrompt = generateToolSystemPrompt(this.tools);
    let currentScratchpad = `Question: ${userPrompt}\nThought: `;

    const steps = [];

    for (let i = 0; i < maxIterations; i++) {
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: currentScratchpad },
      ];

      // Assuming webLLM.chat(messages) returns just the string content
      let response = "";
      try {
        if (this.webLLM.chat) {
          response = await this.webLLM.chat(messages);
        } else if (this.webLLM.generate) {
          // Fallback if chat not available
          response = await this.webLLM.generate(
            systemPrompt + "\n\n" + currentScratchpad
          );
        } else {
          throw new Error("WebLLM service has no chat or generate method");
        }

        if (typeof response !== "string") {
          // If response object, try to extract content
          response =
            response.content || response.message || JSON.stringify(response);
        }
      } catch (e) {
        console.error("LLM Error:", e);
        throw new Error(`LLM Generation failed: ${e.message}`);
      }

      // Cleanup response (trim)
      response = response.trim();
      currentScratchpad += response + "\n";

      // Parse
      const step = this._parseReActResponse(response);
      steps.push(step);
      onStep?.(step);

      if (step.type === "answer") {
        return { answer: step.content, steps };
      }

      if (step.type === "action") {
        const { name, input } = step.toolCall;

        // Execute Tool
        let observation;
        try {
          const result = await this._executeTool(name, input);
          observation =
            typeof result === "string" ? result : JSON.stringify(result);
        } catch (err) {
          observation = `Error: ${err.message}`;
        }

        const obsText = `Observation: ${observation}`;
        currentScratchpad += obsText + "\nThought:"; // Next iteration expects prompt ending in Thought:

        // Push observation step
        const obsStep = {
          type: "observation",
          content: obsText,
          result: observation,
        };
        steps.push(obsStep);
        onStep?.(obsStep);
      } else {
        // Just thought, continue
        currentScratchpad += "Thought:";
      }
    }

    return { answer: "Max iterations reached.", steps };
  }

  /**
   * Parses LLM output for ReAct patterns
   * @param {string} text
   * @returns {ReActStep}
   */
  _parseReActResponse(text) {
    // 1. Check Final Answer
    const finalMatch = text.match(PATTERNS.FINAL_ANSWER);
    if (finalMatch) {
      return { type: "answer", content: finalMatch[1].trim() };
    }

    // 2. Check Action
    const actionMatch = text.match(PATTERNS.ACTION);
    if (actionMatch) {
      const toolName = actionMatch[1].trim();
      const inputMatch = text.match(PATTERNS.ACTION_INPUT);
      let toolInput = {};

      if (inputMatch) {
        try {
          // Try JSON parse first
          toolInput = JSON.parse(inputMatch[1].trim());
        } catch {
          // Fallback to string if strictly text input
          toolInput = inputMatch[1].trim();
        }
      }

      return {
        type: "action",
        content: text,
        toolCall: { name: toolName, input: toolInput },
      };
    }

    // 3. Default to Thought
    // If we have Thought: prefix, strip it for cleaner content
    const thoughtMatch = text.match(PATTERNS.THOUGHT);
    const content = thoughtMatch ? thoughtMatch[1].trim() : text;

    return { type: "thought", content };
  }
}

export default ToolCallingService;
