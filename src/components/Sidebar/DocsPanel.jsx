import React from "react";
import useUIStore from "../../store/uiStore.js";

export function DocsPanel() {
  const openDocs = useUIStore((state) => state.openDocs);

  const linkStyle = {
    color: "var(--color-secondary)",
    textDecoration: "none",
    cursor: "pointer",
    background: "none",
    border: "none",
    padding: 0,
    fontSize: "14px",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <div style={{ padding: 16 }}>
      <h4
        style={{
          marginTop: 0,
          color: "var(--color-text-primary)",
          marginBottom: 8,
        }}
      >
        Documentation
      </h4>
      <p
        style={{
          fontSize: 12,
          marginBottom: 16,
          color: "var(--color-text-secondary)",
          lineHeight: 1.5,
        }}
      >
        Learn how to use IOSANS V2 nodes and workflows.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          style={linkStyle}
          onClick={() => openDocs("gettingStarted")}
          className="docs-link"
        >
          ▶ Getting Started
        </button>
        <button
          style={linkStyle}
          onClick={() => openDocs("triggersGuide")}
          className="docs-link"
        >
          ⚡ Triggers & Events
        </button>
        <button
          style={linkStyle}
          onClick={() => openDocs("aiAgentsGuide")}
          className="docs-link"
        >
          🤖 AI Agents
        </button>
        <button
          style={linkStyle}
          onClick={() => openDocs("pythonGuide")}
          className="docs-link"
        >
          🐍 Python Scripting
        </button>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: 12,
          background: "var(--color-background-secondary)",
          border: "1px solid var(--color-surface-border)",
          borderRadius: 8,
        }}
      >
        <strong
          style={{
            fontSize: 11,
            display: "block",
            color: "var(--color-warning)",
            marginBottom: 4,
          }}
        >
          💡 Quick Tip:
        </strong>
        <p
          style={{
            fontSize: 11,
            margin: 0,
            color: "var(--color-text-secondary)",
          }}
        >
          Select a node and use the right panel to configure properties.
        </p>
      </div>
    </div>
  );
}
