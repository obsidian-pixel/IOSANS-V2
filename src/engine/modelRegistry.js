/**
 * Model Registry
 * Defines available AI models with their specifications.
 * Part of IOSANS Sovereign Architecture.
 */

/**
 * @typedef {Object} ModelConfig
 * @property {string} id - Unique model identifier
 * @property {string} name - Human-readable model name
 * @property {'text'|'vision'|'code'|'embedding'} type - Model capability type
 * @property {number} vram_required - Minimum VRAM required in GB
 * @property {string} description - Brief model description
 */

/**
 * Central registry of available models.
 * Models are categorized by type and include VRAM requirements.
 * @type {ModelConfig[]}
 */
export const MODEL_REGISTRY = [
  // Text Generation Models
  {
    id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
    name: "Llama 3.2 1B Instruct",
    type: "text",
    vram_required: 1,
    description: "Lightweight text generation model for basic tasks",
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
    name: "Llama 3.2 3B Instruct",
    type: "text",
    vram_required: 2,
    description: "Balanced text generation model",
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f32_1-MLC",
    name: "Llama 3.1 8B Instruct",
    type: "text",
    vram_required: 6,
    description: "High-quality text generation model",
  },
  {
    id: "Qwen2.5-7B-Instruct-q4f32_1-MLC",
    name: "Qwen 2.5 7B Instruct",
    type: "text",
    vram_required: 5,
    description: "Multilingual text generation model",
  },
  {
    id: "Mistral-7B-Instruct-v0.3-q4f32_1-MLC",
    name: "Mistral 7B Instruct",
    type: "text",
    vram_required: 5,
    description: "Efficient instruction-following model",
  },

  // Vision Models
  {
    id: "Llama-3.2-11B-Vision-Instruct-q4f32_1-MLC",
    name: "Llama 3.2 11B Vision",
    type: "vision",
    vram_required: 8,
    description: "Multimodal vision-language model",
  },

  // Code Models
  {
    id: "Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC",
    name: "Qwen 2.5 Coder 7B",
    type: "code",
    vram_required: 5,
    description: "Code-specialized generation model",
  },
  {
    id: "DeepSeek-Coder-V2-Lite-Instruct-q4f32_1-MLC",
    name: "DeepSeek Coder V2 Lite",
    type: "code",
    vram_required: 4,
    description: "Lightweight code generation model",
  },

  // Embedding Models (for @xenova/transformers)
  {
    id: "Xenova/all-MiniLM-L6-v2",
    name: "MiniLM L6 v2",
    type: "embedding",
    vram_required: 0.5,
    description: "Sentence embedding model for semantic search",
  },
];

/**
 * Gets models that can run on the given VRAM budget.
 * @param {number} availableVram - Available VRAM in GB
 * @returns {ModelConfig[]}
 */
export function getCompatibleModels(availableVram) {
  return MODEL_REGISTRY.filter((model) => model.vram_required <= availableVram);
}

/**
 * Gets models by type.
 * @param {'text'|'vision'|'code'|'embedding'} type
 * @returns {ModelConfig[]}
 */
export function getModelsByType(type) {
  return MODEL_REGISTRY.filter((model) => model.type === type);
}

/**
 * Gets a specific model by ID.
 * @param {string} id
 * @returns {ModelConfig|undefined}
 */
export function getModelById(id) {
  return MODEL_REGISTRY.find((model) => model.id === id);
}

/**
 * Gets the recommended model based on available VRAM and type.
 * @param {number} availableVram
 * @param {'text'|'vision'|'code'|'embedding'} type
 * @returns {ModelConfig|undefined}
 */
export function getRecommendedModel(availableVram, type = "text") {
  const compatible = getCompatibleModels(availableVram)
    .filter((model) => model.type === type)
    .sort((a, b) => b.vram_required - a.vram_required);

  return compatible[0];
}
