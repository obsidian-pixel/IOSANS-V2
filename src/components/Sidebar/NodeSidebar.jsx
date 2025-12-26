/**
 * NodeSidebar Component
 * Categorized draggable nodes for workflow building.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useState } from "react";
import PropTypes from "prop-types";
import "./NodeSidebar.css";

// Node categories with their types
const NODE_CATEGORIES = {
  triggers: {
    label: "Triggers",
    icon: "⚡",
    nodes: [
      { type: "manualTrigger", label: "Manual", icon: "▶️" },
      { type: "scheduleTrigger", label: "Schedule", icon: "⏰" },
    ],
  },
  ai: {
    label: "AI",
    icon: "🧠",
    nodes: [
      { type: "aiAgent", label: "AI Agent", icon: "🤖" },
      { type: "llm", label: "LLM", icon: "💬" },
    ],
  },
  logic: {
    label: "Logic",
    icon: "🔀",
    nodes: [
      { type: "ifElse", label: "If/Else", icon: "🔀" },
      { type: "switch", label: "Switch", icon: "🔃" },
      { type: "merge", label: "Merge", icon: "🔗" },
      { type: "delay", label: "Delay", icon: "⏳" },
    ],
  },
  actions: {
    label: "Actions",
    icon: "⚙️",
    nodes: [
      { type: "codeExecutor", label: "Code", icon: "💻" },
      { type: "httpRequest", label: "HTTP", icon: "🌐" },
      { type: "transform", label: "Transform", icon: "🔄" },
    ],
  },
  tools: {
    label: "Tools",
    icon: "🔧",
    nodes: [
      { type: "python", label: "Python", icon: "🐍" },
      { type: "textToSpeech", label: "TTS", icon: "🔊" },
      { type: "imageGeneration", label: "Image Gen", icon: "🎨" },
    ],
  },
  io: {
    label: "I/O",
    icon: "📥",
    nodes: [{ type: "output", label: "Output", icon: "📤" }],
  },
};

function NodeSidebar({ collapsed = false, onToggle }) {
  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(NODE_CATEGORIES)
  );
  const [searchTerm, setSearchTerm] = useState("");

  const toggleCategory = (category) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const onDragStart = (event, nodeType, nodeLabel) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/nodeLabel", nodeLabel);
    event.dataTransfer.effectAllowed = "move";
  };

  // Filter nodes based on search
  const getFilteredCategories = () => {
    if (!searchTerm) return NODE_CATEGORIES;

    const filtered = {};
    Object.entries(NODE_CATEGORIES).forEach(([key, category]) => {
      const matchingNodes = category.nodes.filter(
        (node) =>
          node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingNodes.length > 0) {
        filtered[key] = { ...category, nodes: matchingNodes };
      }
    });
    return filtered;
  };

  const filteredCategories = getFilteredCategories();

  if (collapsed) {
    return (
      <div className="node-sidebar node-sidebar--collapsed">
        <button className="node-sidebar__toggle" onClick={onToggle}>
          ☰
        </button>
      </div>
    );
  }

  return (
    <div className="node-sidebar">
      <div className="node-sidebar__header">
        <h3>Nodes</h3>
        <button className="node-sidebar__toggle" onClick={onToggle}>
          ✕
        </button>
      </div>

      <div className="node-sidebar__search">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="node-sidebar__categories">
        {Object.entries(filteredCategories).map(([key, category]) => (
          <div key={key} className="node-sidebar__category">
            <div
              className="node-sidebar__category-header"
              onClick={() => toggleCategory(key)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
              <span className="category-chevron">
                {expandedCategories.includes(key) ? "▼" : "▶"}
              </span>
            </div>

            {expandedCategories.includes(key) && (
              <div className="node-sidebar__nodes">
                {category.nodes.map((node) => (
                  <div
                    key={node.type}
                    className="node-sidebar__node"
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type, node.label)}
                  >
                    <span className="node-icon">{node.icon}</span>
                    <span className="node-label">{node.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

NodeSidebar.propTypes = {
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
};

export default NodeSidebar;
