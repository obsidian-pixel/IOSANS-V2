/**
 * Handle Types Definition
 * Defines the 4-Axis UI topology for node connections.
 * Part of IOSANS Sovereign Architecture.
 */

/**
 * Handle Types - Visual differentiation between connection types
 */
export const HANDLE_TYPES = {
  WORKFLOW: "workflow",
  RESOURCE: "resource",
};

/**
 * Handle Shapes - Visual indicators
 * workflow: Circle (data flow between nodes)
 * resource: Diamond (tool/model connections)
 */
export const HANDLE_SHAPES = {
  [HANDLE_TYPES.WORKFLOW]: "circle",
  [HANDLE_TYPES.RESOURCE]: "diamond",
};

/**
 * Handle Positions by Type
 * workflow: Left (input) / Right (output) - horizontal flow
 * resource: Top (input) / Bottom (output) - vertical resource binding
 */
export const HANDLE_POSITIONS = {
  [HANDLE_TYPES.WORKFLOW]: {
    input: "left",
    output: "right",
  },
  [HANDLE_TYPES.RESOURCE]: {
    input: "top",
    output: "bottom",
  },
};

/**
 * Resource Slot Types
 */
export const RESOURCE_SLOTS = {
  TOOL: "tool",
  MODEL: "model",
  MEMORY: "memory",
  ARTIFACT: "artifact",
};

/**
 * Slot configuration for resource handles
 */
export const SLOT_CONFIG = {
  [RESOURCE_SLOTS.TOOL]: {
    color: "var(--color-accent)",
    label: "Tool",
    icon: "🔧",
  },
  [RESOURCE_SLOTS.MODEL]: {
    color: "var(--color-primary)",
    label: "Model",
    icon: "🧠",
  },
  [RESOURCE_SLOTS.MEMORY]: {
    color: "var(--color-secondary)",
    label: "Memory",
    icon: "💾",
  },
  [RESOURCE_SLOTS.ARTIFACT]: {
    color: "var(--color-warning)",
    label: "Artifact",
    icon: "📦",
  },
};

/**
 * Gets the CSS class for a handle based on type and shape
 * @param {string} type - HANDLE_TYPES value
 * @param {string} direction - 'input' or 'output'
 * @returns {string}
 */
export function getHandleClass(type, direction) {
  const shape = HANDLE_SHAPES[type];
  const position = HANDLE_POSITIONS[type][direction];
  return `handle handle--${shape} handle--${position}`;
}

/**
 * Gets the handle position for React Flow
 * @param {string} type - HANDLE_TYPES value
 * @param {string} direction - 'input' or 'output'
 * @returns {string} - 'left' | 'right' | 'top' | 'bottom'
 */
export function getHandlePosition(type, direction) {
  return HANDLE_POSITIONS[type][direction];
}

/**
 * Validates if two handles can connect
 * @param {Object} source - Source handle info
 * @param {Object} target - Target handle info
 * @returns {boolean}
 */
export function canConnect(source, target) {
  // Only same types can connect
  if (source.type !== target.type) {
    return false;
  }

  // Resource slots must match
  if (source.type === HANDLE_TYPES.RESOURCE) {
    if (source.slot !== target.slot) {
      return false;
    }
  }

  return true;
}
