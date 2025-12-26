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
  setTools(tools) {
    this.tools = tools;
  }

  /**
   * Sets service dependencies
   * @param {Object} services - artifactStorage, etc.
   */
  setServices(services) {
    this.services = services;
  }

  /**
   * Runs the ReAct loop
   * @param {string} userMessage - Initial user message
   * @param {ReActConfig} config
   * @returns {Promise<{answer: string, steps: ReActStep[]}>}
   */
  async runReActLoop(userMessage, config = {}) {
    const opts = { ...DEFAULT_CONFIG, ...config };
    const steps = [];

    // Generate system prompt with tools
    const systemPrompt = generateToolSystemPrompt(this.tools);

    // Build conversation history
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    for (let i = 0; i < opts.maxIterations; i++) {
      // Generate LLM response
      const response = await this.webLLM.generate(messages, {
        temperature: 0.7,
        max_tokens: 1024,
      });

      const assistantMessage = response.content || response;
      messages.push({ role: "assistant", content: assistantMessage });

      if (opts.verbose) {
        console.log(`[ReAct] Iteration ${i + 1}:`, assistantMessage);
      }

      // Parse response
      const parsed = this._parseResponse(assistantMessage);

      // Record thought
      if (parsed.thought) {
        const thoughtStep = { type: "thought", content: parsed.thought };
        steps.push(thoughtStep);
        opts.onStep?.(thoughtStep);
      }

      // Check for final answer
      if (parsed.finalAnswer) {
        const answerStep = { type: "answer", content: parsed.finalAnswer };
        steps.push(answerStep);
        opts.onStep?.(answerStep);
        return { answer: parsed.finalAnswer, steps };
      }

      // Execute tool if action requested
      if (parsed.action) {
        const actionStep = {
          type: "action",
          content: `${parsed.action}: ${JSON.stringify(parsed.actionInput)}`,
          toolCall: {
            name: parsed.action,
            arguments: parsed.actionInput,
          },
        };
        steps.push(actionStep);
        opts.onStep?.(actionStep);

        // Execute the tool
        const observation = await this._executeTool(
          parsed.action,
          parsed.actionInput
        );

        const observationStep = {
          type: "observation",
          content: this._formatObservation(observation),
          result: observation,
        };
        steps.push(observationStep);
        opts.onStep?.(observationStep);

        // Add observation to conversation
        messages.push({
          role: "user",
          content: `Observation: ${observationStep.content}`,
        });
      } else if (!parsed.finalAnswer && !parsed.action) {
        // No action or answer - prompt for completion
        messages.push({
          role: "user",
          content: "Please provide either an Action or Final Answer.",
        });
      }
    }

    // Max iterations reached
    return {
      answer: "Maximum iterations reached without final answer.",
      steps,
    };
  }

  /**
   * Parses LLM response for ReAct components
   * @private
   */
  _parseResponse(response) {
    const result = {
      thought: null,
      action: null,
      actionInput: null,
      finalAnswer: null,
    };

    // Extract thought
    const thoughtMatch = response.match(PATTERNS.THOUGHT);
    if (thoughtMatch) {
      result.thought = thoughtMatch[1].trim();
    }

    // Check for final answer
    const finalMatch = response.match(PATTERNS.FINAL_ANSWER);
    if (finalMatch) {
      result.finalAnswer = finalMatch[1].trim();
      return result;
    }

    // Check for action
    const actionMatch = response.match(PATTERNS.ACTION);
    if (actionMatch) {
      result.action = actionMatch[1].trim();

      // Parse action input
      const inputMatch = response.match(PATTERNS.ACTION_INPUT);
      if (inputMatch) {
        try {
          result.actionInput = JSON.parse(inputMatch[1].trim());
        } catch {
          // Try to parse as simple string
          result.actionInput = { input: inputMatch[1].trim() };
        }
      }
    }

    return result;
  }

  /**
   * Executes a tool and returns the result
   * @private
   */
  async _executeTool(toolName, toolInput) {
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

  /**
   * Formats observation for LLM consumption
   * Injects artifactId for binary outputs
   * @private
   */
  _formatObservation(result) {
    if (result.error) {
      return `Error: ${result.error}`;
    }

    const output = result.output;

    // Check for artifact reference
    if (output && output.artifactId) {
      return `Success. Artifact created: ${output.artifactId} (type: ${output.type})`;
    }

    // Format complex objects
    if (typeof output === "object") {
      return JSON.stringify(output, null, 2);
    }

    return String(output);
  }

  /**
   * Runs a single tool directly (for ExecutionEngine integration)
   * @param {string} toolName
   * @param {Object} toolInput
   * @returns {Promise<Object>}
   */
  async runTool(toolName, toolInput) {
    return this._executeTool(toolName, toolInput);
  }
}

export default ToolCallingService;
