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
 * Generates a tool schema from a node instance
 * @param {Object} node - The node to convert to a tool
 * @returns {Object} JSON Schema for the tool
 */
export function generateToolSchema(node) {
  const { type, data, id } = node;
  const config = data.config || {};

  // Base schema structure
  const schema = {
    name: `${type}_${id.replace(/-/g, "_")}`, // Unique name: imageGeneration_123
    description: data.label || `Execute ${type}`,
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  };

  // Customize based on node type
  switch (type) {
    case "imageGeneration":
      schema.description = "Generate an image based on a prompt.";
      schema.parameters.properties = {
        prompt: {
          type: "string",
          description: "Visual description of the image",
        },
        style: {
          type: "string",
          description:
            "Style of the image (cinematic, anime, photographic, etc.)",
        },
      };
      schema.parameters.required = ["prompt"];
      break;

    case "textToSpeech":
      schema.description = "Convert text to spoken audio.";
      schema.parameters.properties = {
        text: {
          type: "string",
          description: "The text to speak",
        },
        voice: {
          type: "string",
          description: "Voice ID (default, male, female)",
        },
      };
      schema.parameters.required = ["text"];
      break;

    case "python":
      schema.description =
        "Execute Python code for calculations or data processing.";
      schema.parameters.properties = {
        inputs: {
          type: "object",
          description: "Variables to pass to the python script",
        },
      };
      // Python node usually has code in config, but agent might want to PASS data to it.
      // If the agent WRITES the code, that's a different node type (Code Interpreter).
      // Here we assume the node HAS code, and we pass variable inputs.
      break;

    case "httpRequest":
      schema.description = "Make an HTTP request.";
      schema.parameters.properties = {
        body: {
          type: "object",
          description: "JSON body for the request",
        },
        queryParams: {
          type: "object",
          description: "Query parameters",
        },
      };
      break;

    default:
      // Fallback for unknown tools
      schema.parameters.properties = {
        input: { type: "string", description: "Input for the tool" },
      };
      break;
  }

  return schema;
}

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
  // AND the source handle is a "tool" slot (usually bottom handle of source, connecting to top of agent?
  // Wait, Agent (Resource In) <--- Tool (Resource Out).
  // Standard: Tool Node (Diamond Top/Bottom) -> Agent (Diamond Bottom/Top).
  // Let's assume any resource connection to the Agent is a potential tool.

  const incomingResourceEdges = edges.filter(
    (edge) => edge.target === node.id && edge.targetHandle?.includes("resource")
  );

  incomingResourceEdges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (sourceNode) {
      // Ignore Models, only look for Action/Tool nodes
      if (["llm", "embedding"].includes(sourceNode.type)) return;

      const schema = generateToolSchema(sourceNode);
      if (schema) {
        connectedTools.push(schema);
      }
    }
  });

  return connectedTools;
}

// Deprecated: getToolSchema (replaced by generateToolSchema)
export function getToolSchema(toolType, nodeData = {}) {
  return generateToolSchema({ type: toolType, data: nodeData, id: "mnock" });
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
