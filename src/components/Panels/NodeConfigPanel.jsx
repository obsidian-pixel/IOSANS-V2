/**
 * NodeConfigPanel Component
 * Dynamic configuration form for selected nodes.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import useWorkflowStore from "../../store/workflowStore.js";
import "./NodeConfigPanel.css";

// Node configuration schemas
const NODE_SCHEMAS = {
  aiAgent: {
    title: "AI Agent",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "systemPrompt", type: "textarea", label: "System Prompt" },
      {
        key: "temperature",
        type: "range",
        label: "Temperature",
        min: 0,
        max: 2,
        step: 0.1,
      },
      { key: "maxTokens", type: "number", label: "Max Tokens" },
    ],
  },
  llm: {
    title: "LLM",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "prompt", type: "textarea", label: "Prompt" },
      {
        key: "modelId",
        type: "select",
        label: "Model",
        options: ["llama-3.2-1b", "phi-3.5", "gemma-2-2b"],
      },
    ],
  },
  codeExecutor: {
    title: "Code",
    fields: [
      { key: "label", type: "text", label: "Name" },
      {
        key: "language",
        type: "select",
        label: "Language",
        options: ["javascript", "python"],
      },
      { key: "code", type: "code", label: "Code" },
    ],
  },
  httpRequest: {
    title: "HTTP Request",
    fields: [
      { key: "label", type: "text", label: "Name" },
      {
        key: "method",
        type: "select",
        label: "Method",
        options: ["GET", "POST", "PUT", "DELETE"],
      },
      { key: "url", type: "url", label: "URL" },
    ],
  },
  ifElse: {
    title: "If/Else",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "condition", type: "text", label: "Condition" },
    ],
  },
  switch: {
    title: "Switch",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "switchKey", type: "text", label: "Switch Key" },
    ],
  },
  delay: {
    title: "Delay",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "delay", type: "number", label: "Delay (ms)" },
    ],
  },
  scheduleTrigger: {
    title: "Schedule",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "cronExpression", type: "text", label: "Cron Expression" },
      { key: "enabled", type: "checkbox", label: "Enabled" },
    ],
  },
  textToSpeech: {
    title: "Text to Speech",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "text", type: "textarea", label: "Text" },
      {
        key: "rate",
        type: "range",
        label: "Rate",
        min: 0.5,
        max: 2,
        step: 0.1,
      },
    ],
  },
  imageGeneration: {
    title: "Image Generation",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "prompt", type: "textarea", label: "Prompt" },
      { key: "width", type: "number", label: "Width" },
      { key: "height", type: "number", label: "Height" },
    ],
  },
  python: {
    title: "Python",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "code", type: "code", label: "Python Code" },
    ],
  },
};

function NodeConfigPanel({ selectedNodeId }) {
  const node = useWorkflowStore((state) =>
    state.nodes.find((n) => n.id === selectedNodeId)
  );
  const updateNode = useWorkflowStore((state) => state.updateNode);

  const [localData, setLocalData] = useState({});

  useEffect(() => {
    if (node?.data) {
      setLocalData(node.data);
    }
  }, [node?.id, node?.data]);

  if (!selectedNodeId || !node) {
    return (
      <div className="config-panel">
        <div className="config-panel__empty">Select a node to configure</div>
      </div>
    );
  }

  const schema = NODE_SCHEMAS[node.type] || {
    title: node.type,
    fields: [{ key: "label", type: "text", label: "Name" }],
  };

  const handleChange = (key, value) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    updateNode(node.id, { data: newData });
  };

  const renderField = (field) => {
    const value = localData[field.key] ?? "";

    switch (field.type) {
      case "text":
      case "url":
      case "number":
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) =>
              handleChange(
                field.key,
                field.type === "number"
                  ? Number(e.target.value)
                  : e.target.value
              )
            }
          />
        );

      case "textarea":
      case "code":
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
            rows={field.type === "code" ? 8 : 3}
            className={field.type === "code" ? "code-input" : ""}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleChange(field.key, e.target.checked)}
          />
        );

      case "range":
        return (
          <div className="range-field">
            <input
              type="range"
              value={value || field.min || 0}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              onChange={(e) => handleChange(field.key, Number(e.target.value))}
            />
            <span className="range-value">{value || field.min || 0}</span>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="config-panel">
      <div className="config-panel__header">
        <h4>{schema.title}</h4>
        <span className="config-panel__id">{node.id.slice(0, 8)}</span>
      </div>

      <div className="config-panel__form">
        {schema.fields.map((field) => (
          <div key={field.key} className="config-field">
            <label>{field.label}</label>
            {renderField(field)}
          </div>
        ))}
      </div>
    </div>
  );
}

NodeConfigPanel.propTypes = {
  selectedNodeId: PropTypes.string,
};

export default NodeConfigPanel;
