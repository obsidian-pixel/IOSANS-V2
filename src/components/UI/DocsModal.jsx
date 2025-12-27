/**
 * DocsModal Component
 * Displays comprehensive documentation with sidebar navigation.
 */

import React, { useMemo } from "react";
import useUIStore from "../../store/uiStore.js";
import { nodeDocumentation } from "../../data/nodeDocumentation.js";
import "./DocsModal.css";

/* Inline CSS injection for new components (Quick Fix) */
/* Ideally this goes into DocsModal.css, but we'll inject via style tag or just ensure main.css covers it. */
/* Let's assume DocsModal.css handles basic markdown. We'll add classes to the Component for clarity. */

// Helper for inline styles
const parseInline = (text) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

// Robust Markdown Renderer
const MarkdownContent = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let currentListType = null;
  let currentListItems = [];

  const flushList = (keySuffix) => {
    if (!currentListType) return;
    const ListTag = currentListType;
    elements.push(
      <ListTag key={`list-${keySuffix}`} className="docs-list">
        {currentListItems}
      </ListTag>
    );
    currentListType = null;
    currentListItems = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Empty line? Flush list if any
    if (!trimmed) {
      flushList(i);
      return;
    }

    // Header 3
    if (trimmed.startsWith("### ")) {
      flushList(i);
      elements.push(<h3 key={i}>{trimmed.replace("### ", "")}</h3>);
      return;
    }

    // Header 4
    if (trimmed.startsWith("#### ")) {
      flushList(i);
      elements.push(<h4 key={i}>{trimmed.replace("#### ", "")}</h4>);
      return;
    }

    // Code Block Start/End (Toggle) - simplified
    if (trimmed.startsWith("```")) {
      flushList(i);
      return;
    }

    // Unordered List
    if (trimmed.startsWith("- ")) {
      if (currentListType && currentListType !== "ul") flushList(i);
      currentListType = "ul";
      currentListItems.push(<li key={i}>{parseInline(trimmed.slice(2))}</li>);
      return;
    }

    // Ordered List
    const orderedMatch = trimmed.match(/^(\d+)\.\s/);
    if (orderedMatch) {
      if (currentListType && currentListType !== "ol") flushList(i);
      currentListType = "ol";
      currentListItems.push(
        <li key={i}>{parseInline(trimmed.replace(orderedMatch[0], ""))}</li>
      );
      return;
    }

    // Regular Paragraph
    // If we are currently in a list, and this line is NOT a list item, flush the list.
    flushList(i);
    elements.push(<p key={i}>{parseInline(trimmed)}</p>);
  });

  flushList("end");

  return <div className="docs-markdown">{elements}</div>;
};

const DocsModal = () => {
  const isDocsOpen = useUIStore((state) => state.isDocsOpen);
  const activeDocsNodeType = useUIStore((state) => state.activeDocsNodeType);
  const openDocs = useUIStore((state) => state.openDocs);
  const closeDocs = useUIStore((state) => state.closeDocs);

  // Group documentation by category
  const categories = useMemo(() => {
    const groups = {};
    Object.entries(nodeDocumentation).forEach(([key, doc]) => {
      const cat = doc.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ key, ...doc });
    });

    // Sort categories: Guide first, then others
    const orderedKeys = [
      "Guide",
      ...Object.keys(groups).filter((k) => k !== "Guide"),
    ];
    return orderedKeys.map((cat) => ({
      name: cat,
      items: groups[cat] || [],
    }));
  }, []);

  if (!isDocsOpen) return null;

  // Resolve current doc or default to Getting Started
  const currentKey = activeDocsNodeType || "gettingStarted";
  const doc =
    nodeDocumentation[currentKey] || nodeDocumentation["gettingStarted"];

  return (
    <div className="docs-modal-overlay" onClick={closeDocs}>
      <div className="docs-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="docs-modal-header">
          <div className="docs-title-group">
            <h2>Documentation</h2>
          </div>
          <button className="docs-close-btn" onClick={closeDocs}>
            ✕
          </button>
        </div>

        {/* Body (Sidebar + Content) */}
        <div className="docs-modal-body">
          {/* Sidebar */}
          <div className="docs-sidebar">
            {categories.map((cat) => (
              <div key={cat.name}>
                <div className="docs-category-header">{cat.name}</div>
                {cat.items.map((item) => (
                  <div
                    key={item.key}
                    className={`docs-sidebar-item ${
                      currentKey === item.key ? "active" : ""
                    }`}
                    onClick={() => openDocs(item.key)}
                  >
                    {item.title}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="docs-content-area">
            <span className="docs-badge">{doc.category}</span>
            <h1 style={{ margin: "0 0 16px", fontSize: "2rem" }}>
              {doc.title}
            </h1>

            {doc.image && (
              <div className="docs-image-container">
                <img
                  src={doc.image}
                  alt={doc.title}
                  className="docs-node-image"
                />
              </div>
            )}

            {doc.isGuide ? (
              <MarkdownContent content={doc.content} />
            ) : (
              <>
                {/* Node Specific Layout */}
                <p className="docs-lead">{doc.description}</p>

                {doc.howItWorks && (
                  <section className="docs-section">
                    <h3>How it Works</h3>
                    <p>{doc.howItWorks}</p>
                  </section>
                )}

                {doc.howToUse && (
                  <section className="docs-section">
                    <h3>How to Use</h3>
                    <ol>
                      {Array.isArray(doc.howToUse) ? (
                        doc.howToUse.map((step, i) => <li key={i}>{step}</li>)
                      ) : (
                        <li>{doc.howToUse}</li>
                      )}
                    </ol>
                  </section>
                )}

                {doc.configuration && (
                  <section className="docs-section">
                    <h3>Configuration Parameters</h3>
                    <div className="docs-params-list">
                      {doc.configuration.map((param, i) => (
                        <div key={i} className="docs-param-item">
                          <code className="docs-param-name">{param.name}</code>
                          <span className="docs-param-desc">
                            {param.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="docs-layout-split">
                  {doc.inputs && doc.inputs.length > 0 && (
                    <section className="docs-section half">
                      <h3>Inputs</h3>
                      <div className="docs-io-list">
                        {doc.inputs.map((io) => (
                          <div key={io.id} className="docs-io-item">
                            <span className="docs-io-name">{io.label}</span>
                            <span className="docs-io-desc">
                              {io.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {doc.outputs && doc.outputs.length > 0 && (
                    <section className="docs-section half">
                      <h3>Outputs</h3>
                      <div className="docs-io-list">
                        {doc.outputs.map((io) => (
                          <div key={io.id} className="docs-io-item">
                            <span className="docs-io-name">{io.label}</span>
                            <span className="docs-io-desc">
                              {io.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {doc.examples && (
                  <section className="docs-section">
                    <h3>Real-World Examples</h3>
                    {doc.examples.map((ex, i) => (
                      <div key={i} className="docs-example-box">
                        <strong className="docs-example-title">
                          {ex.title}
                        </strong>
                        <p>{ex.description}</p>
                        {ex.code && (
                          <pre className="docs-code-block">{ex.code}</pre>
                        )}
                      </div>
                    ))}
                  </section>
                )}

                {doc.tips && (
                  <section className="docs-section tip-box">
                    <h3>💡 Pro Tip</h3>
                    <p>{doc.tips}</p>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsModal;
