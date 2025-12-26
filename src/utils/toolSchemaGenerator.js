/**
 * Tool Schema Generator
 * Scans connected Diamond handles and generates JSON tool definitions.
 * Part of IOSANS Sovereign Architecture.
 */

import { HANDLE_TYPES, RESOURCE_SLOTS } from "./handleTypes.js";

/**
 * Tool parameter types
 */
export const PARAM_TYPES = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  OBJECT: "object",
  ARRAY: "array",
};

/**
 * Built-in tool definitions
 */
export const BUILT_IN_TOOLS = {
  python: {
    name: "python",
    description:
      "Execute Python code using Pyodide. Returns execution result or artifact reference.",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description:
            "Python code to execute. Use `inputs` variable to access input data.",
        },
      },
      required: ["code"],
    },
  },
  textToSpeech: {
    name: "textToSpeech",
    description:
      "Convert text to speech audio. Returns artifact reference to audio/wav file.",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text to convert to speech",
        },
        voice: {
          type: "string",
          description: "Voice name (optional)",
        },
        rate: {
          type: "number",
          description: "Speech rate (0.1 to 10, default 1)",
        },
      },
      required: ["text"],
    },
  },
  imageGeneration: {
    name: "imageGeneration",
    description:
      "Generate an image from a text prompt. Returns artifact reference to image/png file.",
    parameters: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Text description of image to generate",
        },
        width: {
          type: "number",
          description: "Image width in pixels (default 512)",
        },
        height: {
          type: "number",
          description: "Image height in pixels (default 512)",
        },
      },
      required: ["prompt"],
    },
  },
};

/**
 * Scans a node's connected diamond handles and returns tool schemas
 * @param {Object} node - The agent node
 * @param {Array} edges - All edges in the workflow
 * @param {Array} nodes - All nodes in the workflow
 * @returns {Array} Tool schemas for connected tools
 */
export function scanConnectedTools(node, edges, nodes) {
  const connectedTools = [];

  // Find edges where this node is the target and handle type is resource
  const incomingResourceEdges = edges.filter(
    (edge) => edge.target === node.id && edge.targetHandle?.includes("resource")
  );

  incomingResourceEdges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (sourceNode && sourceNode.type) {
      const schema = getToolSchema(sourceNode.type, sourceNode.data);
      if (schema) {
        connectedTools.push(schema);
      }
    }
  });

  return connectedTools;
}

/**
 * Gets the schema for a tool type
 * @param {string} toolType - Node type
 * @param {Object} nodeData - Node configuration
 * @returns {Object} Tool schema
 */
export function getToolSchema(toolType, nodeData = {}) {
  // Check built-in tools
  if (BUILT_IN_TOOLS[toolType]) {
    return { ...BUILT_IN_TOOLS[toolType] };
  }

  // Custom tool from node data
  if (nodeData.toolSchema) {
    return nodeData.toolSchema;
  }

  // Generate basic schema from node type
  return {
    name: toolType,
    description: nodeData.description || `Execute ${toolType} tool`,
    parameters: nodeData.parameters || {
      type: "object",
      properties: {},
      required: [],
    },
  };
}

/**
 * Generates a system prompt with available tools
 * @param {Array} tools - Tool schemas
 * @returns {string} System prompt
 */
export function generateToolSystemPrompt(tools) {
  if (!tools || tools.length === 0) {
    return "You are a helpful AI assistant.";
  }

  const toolDescriptions = tools
    .map((tool) => {
      const params = Object.entries(tool.parameters?.properties || {})
        .map(([name, def]) => `  - ${name}: ${def.description || def.type}`)
        .join("\n");

      return `### ${tool.name}\n${tool.description}\nParameters:\n${
        params || "  (none)"
      }`;
    })
    .join("\n\n");

  return `You are a helpful AI assistant with access to the following tools:

${toolDescriptions}

When you need to use a tool, respond with:
Action: [tool_name]
Action Input: {"param": "value"}

After a tool executes, you will receive an Observation with the result.
When you have the final answer, respond with:
Final Answer: [your response]

Think step by step and use tools when needed.`;
}

/**
 * Formats tools for OpenAI-style function calling
 * @param {Array} tools - Tool schemas
 * @returns {Array} OpenAI function definitions
 */
export function formatToolsForLLM(tools) {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}
