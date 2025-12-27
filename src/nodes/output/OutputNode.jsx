/**
 * OutputNode Component
 * Auto-detects type and renders artifacts (audio/image).
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import BaseNode from "../base/BaseNode.jsx";
import {
  getArtifactUrl,
  revokeArtifactUrl,
} from "../../utils/artifactStorage.js";
import "./OutputNode.css";

/**
 * Auto-detect content type
 */
function autoDetectType(value) {
  if (!value) return "empty";
  if (value.artifactId) return value.type || "artifact";
  if (typeof value === "string") return "text";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "unknown";
}

/**
 * OutputNode - Renders workflow output with artifact display
 */
function OutputNode({ id, data = {}, selected = false, status = "idle" }) {
  const { value = null, label = "Output" } = data;
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const detectedType = autoDetectType(value);
  const isArtifact = value?.artifactId;

  // Fetch and create blob URL for artifacts
  useEffect(() => {
    if (isArtifact) {
      setLoading(true);
      getArtifactUrl(value.artifactId)
        .then((url) => {
          setBlobUrl(url);
        })
        .catch(console.error)
        .finally(() => setLoading(false));

      return () => {
        if (blobUrl) revokeArtifactUrl(blobUrl);
      };
    }
  }, [value?.artifactId]);

  const renderContent = () => {
    if (loading) {
      return <div className="output-node__loading">Loading...</div>;
    }

    if (isArtifact && blobUrl) {
      const type = value.type || "";

      if (type.startsWith("audio")) {
        return (
          <div className="output-node__media-wrapper">
            <audio controls className="output-node__audio" src={blobUrl}>
              Audio not supported
            </audio>
            <div className="output-node__meta">Audio: {type}</div>
          </div>
        );
      }

      if (type.startsWith("image")) {
        return (
          <div className="output-node__media-wrapper">
            <a href={blobUrl} target="_blank" rel="noopener noreferrer">
              <img
                className="output-node__image"
                src={blobUrl}
                alt="Generated Artifact"
              />
            </a>
            <div className="output-node__meta">Image: {type}</div>
          </div>
        );
      }

      return (
        <div className="output-node__artifact">
          <span className="output-node__icon">📎</span>
          <div className="output-node__details">
            <div className="output-node__filename">
              Artifact: {value.artifactId.slice(0, 8)}...
            </div>
            <div className="output-node__filetype">{type}</div>
            <a
              href={blobUrl}
              download={`artifact-${value.artifactId}.${
                type.split("/")[1] || "bin"
              }`}
              className="output-node__download"
            >
              Download
            </a>
          </div>
        </div>
      );
    }

    switch (detectedType) {
      case "text":
        return (
          <div className="output-node__text">{String(value).slice(0, 500)}</div>
        );
      case "number":
        return <div className="output-node__number">{value}</div>;
      case "boolean":
        return (
          <div className="output-node__boolean">
            {value ? "✓ True" : "✗ False"}
          </div>
        );
      case "array":
        return (
          <div className="output-node__json">
            <pre>{JSON.stringify(value, null, 2).slice(0, 200)}</pre>
            {value.length > 0 && (
              <div className="output-node__meta">{value.length} items</div>
            )}
          </div>
        );
      case "object":
        return (
          <div className="output-node__json">
            <pre>{JSON.stringify(value, null, 2).slice(0, 300)}</pre>
          </div>
        );
      case "empty":
        return <div className="output-node__empty">No output</div>;
      default:
        return <div className="output-node__unknown">{String(value)}</div>;
    }
  };

  return (
    <BaseNode
      id={id}
      title={label}
      type="output"
      icon="📤"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={false}
    >
      <div className="output-node">
        <div className="output-node__header">
          <span className="output-node__badge">{detectedType}</span>
        </div>
        <div className="output-node__content">{renderContent()}</div>
      </div>
    </BaseNode>
  );
}

OutputNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

export default OutputNode;
