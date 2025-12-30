/**
 * NodeSidebar Component
 * Categorized draggable nodes for workflow building.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useState } from "react";
import PropTypes from "prop-types";
import "./NodeSidebar.css";
import { TemplatesPanel } from "./TemplatesPanel.jsx";
import { DocsPanel } from "./DocsPanel.jsx";

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
  const [activeTab, setActiveTab] = useState("nodes"); // nodes | templates | docs

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

  return (
    <div
      className={`node-sidebar ${collapsed ? "node-sidebar--collapsed" : ""}`}
    >
      <button
        className="sidebar-collapse-btn"
        onClick={onToggle}
        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {collapsed ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M3 12h18M3 6h18M3 18h18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M18 6L6 18M6 6l12 12"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="node-sidebar__header">
        <div className="sidebar-tabs">
          <button
            className={`tab-btn ${activeTab === "nodes" ? "active" : ""}`}
            onClick={() => setActiveTab("nodes")}
            title="Nodes"
          >
            🧩
          </button>
          <button
            className={`tab-btn ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveTab("templates")}
            title="Templates"
          >
            📑
          </button>
          <button
            className={`tab-btn ${activeTab === "docs" ? "active" : ""}`}
            onClick={() => setActiveTab("docs")}
            title="Documentation"
          >
            📚
          </button>
        </div>
      </div>

      <div className="node-sidebar__content">
        {activeTab === "nodes" && (
          <>
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
                    className={`node-sidebar__category-header category--${key}`}
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
                          className={`node-sidebar__node node-type--${key}`}
                          draggable
                          onDragStart={(e) =>
                            onDragStart(e, node.type, node.label)
                          }
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
          </>
        )}

        {activeTab === "templates" && <TemplatesPanel />}
        {activeTab === "docs" && <DocsPanel />}
      </div>
    </div>
  );
}

NodeSidebar.propTypes = {
  collapsed: PropTypes.bool,
  onToggle: PropTypes.func,
};

export default NodeSidebar;
