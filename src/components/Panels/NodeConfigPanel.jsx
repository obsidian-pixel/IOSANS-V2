/**
 * NodeConfigPanel Component
 * Dynamic configuration form for selected nodes.
 * Part of IOSANS Sovereign Architecture.
 */

import { SchedulerConfig } from "./SchedulerConfig.jsx";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import useWorkflowStore from "../../store/workflowStore.js";
import useUIStore from "../../store/uiStore.js";
import "./NodeConfigPanel.css";

// ... (keeping imports)

// Node configuration schemas (Dynamic)
const NODE_SCHEMAS = {
  aiAgent: {
    title: "AI Agent",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "systemPrompt", type: "textarea", label: "System Prompt" },
      {
        key: "modelId",
        type: "select",
        label: "Model",
        options: ["llama-3-8b", "mistral-7b", "gemma-2b"],
      },
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
      { key: "headers", type: "textarea", label: "Headers (JSON)" },
      { key: "body", type: "textarea", label: "Body (JSON)" },
    ],
  },
  ifElse: {
    title: "If/Else",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "field", type: "text", label: "FieldToCheck" },
      {
        key: "operator",
        type: "select",
        label: "Operator",
        options: ["equals", "notEquals", "greaterThan", "lessThan", "contains"],
      },
      { key: "value", type: "text", label: "Value" },
    ],
  },
  switch: {
    title: "Switch",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "switchKey", type: "text", label: "Switch Key (e.g. type)" },
      { key: "cases", type: "list", label: "Cases" }, // Custom List Type
    ],
  },
  merge: {
    title: "Merge",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "expectedBranches", type: "number", label: "Expected Branches" },
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
      { key: "config", type: "scheduler", label: "Configuration" },
    ],
  },
  textToSpeech: {
    title: "Text to Speech",
    fields: [
      { key: "label", type: "text", label: "Name" },
      { key: "text", type: "textarea", label: "Text" },
      {
        key: "voice",
        type: "select",
        label: "Voice",
        options: ["en-US-Neural2-F", "en-US-Neural2-D", "en-GB-Neural2-A"],
      },
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
  transform: (data) => ({
    title: "Transform",
    fields: [
      { key: "label", type: "text", label: "Name" },
      {
        key: "transformType",
        type: "select",
        label: "Type",
        options: ["json-parse", "json-stringify", "extract", "template"],
      },
      ...(data.transformType === "extract"
        ? [{ key: "key", type: "text", label: "Property Key" }]
        : []),
      ...(data.transformType === "template"
        ? [{ key: "template", type: "textarea", label: "Template" }]
        : []),
    ],
  }),
};

function NodeConfigPanel({ selectedNodeId }) {
  const node = useWorkflowStore((state) =>
    state.nodes.find((n) => n.id === selectedNodeId)
  );
  const updateNode = useWorkflowStore((state) => state.updateNode);

  const openDocs = useUIStore((state) => state.openDocs);

  const [localData, setLocalData] = useState({});

  // Sync when selected node changes
  // Sync when selected node changes
  useEffect(() => {
    if (node) {
      setLocalData(JSON.parse(JSON.stringify(node.data))); // Deep copy to avoid ref issues
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  if (!selectedNodeId || !node) {
    return (
      <div className="config-panel">
        <div className="config-panel__empty">Select a node to configure</div>
      </div>
    );
  }

  // Resolve Schema (handle function vs object)
  const schemaDef = NODE_SCHEMAS[node.type] || {
    title: node.type,
    fields: [{ key: "label", type: "text", label: "Name" }],
  };
  const schema =
    typeof schemaDef === "function" ? schemaDef(localData) : schemaDef;

  const handleChange = (key, value) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);

    // Debounce updates to global store could be better, but direct update is fine for now
    updateNode(node.id, { data: newData });
  };

  // Helper for List inputs (e.g. Switch Cases)
  const handleListChange = (key, newList) => {
    handleChange(key, newList);
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
            rows={field.type === "code" ? 12 : 3}
            className={field.type === "code" ? "code-input" : ""}
            spellCheck={false}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleChange(field.key, e.target.value)}
          >
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleChange(field.key, e.target.checked)}
            />
          </div>
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

      case "scheduler":
        return <SchedulerConfig data={localData} onChange={handleChange} />;

      case "list": {
        // Simple string list manager
        const list = Array.isArray(value) ? value : [];
        return (
          <div className="list-input">
            {list.map((item, i) => (
              <div key={i} className="list-item">
                <input
                  value={item}
                  onChange={(e) => {
                    const newList = [...list];
                    newList[i] = e.target.value;
                    handleListChange(field.key, newList);
                  }}
                />
                <button
                  onClick={() => {
                    const newList = list.filter((_, idx) => idx !== i);
                    handleListChange(field.key, newList);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              className="list-add-btn"
              onClick={() =>
                handleListChange(field.key, [...list, `case${list.length + 1}`])
              }
            >
              + Add Item
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="config-panel">
      <div className="config-panel__header">
        <div className="config-header-left">
          <h4>{schema.title}</h4>
          <span className="config-panel__id">{node.id.slice(0, 8)}</span>
        </div>
        <button
          className="config-panel__docs-btn"
          onClick={() => openDocs(node.type)}
          title="Open Documentation"
        >
          ?
        </button>
      </div>

      <div className="config-panel__form">
        {schema.fields.map((field) => (
          <div key={field.key} className="config-field">
            {field.label !== "Configuration" && <label>{field.label}</label>}
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
