/**
 * ArtifactPanel Component
 * Media gallery for generated artifacts.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useState, useEffect } from "react";
import {
  listArtifacts,
  getArtifact,
  deleteArtifact,
} from "../../utils/artifactStorage.js";
import "./ArtifactPanel.css";

function ArtifactPanel() {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [blobUrls, setBlobUrls] = useState({});

  // Poll for artifacts
  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        const list = await listArtifacts();
        setArtifacts(list);
      } catch (error) {
        console.error("[ArtifactPanel] Load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadArtifacts();
    const interval = setInterval(loadArtifacts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Create blob URLs for previews
  useEffect(() => {
    const createUrls = async () => {
      const urls = {};
      for (const artifact of artifacts) {
        if (!blobUrls[artifact.id]) {
          try {
            const full = await getArtifact(artifact.id);
            if (full?.blob) {
              urls[artifact.id] = URL.createObjectURL(full.blob);
            }
          } catch (error) {
            console.error("[ArtifactPanel] URL error:", error);
          }
        }
      }
      if (Object.keys(urls).length > 0) {
        setBlobUrls((prev) => ({ ...prev, ...urls }));
      }
    };

    createUrls();

    // Cleanup blob URLs
    return () => {
      Object.values(blobUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [artifacts]);

  const handleDelete = async (id) => {
    if (confirm("Delete this artifact?")) {
      await deleteArtifact(id);
      setArtifacts((prev) => prev.filter((a) => a.id !== id));
      if (blobUrls[id]) {
        URL.revokeObjectURL(blobUrls[id]);
        setBlobUrls((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
    }
  };

  const renderPreview = (artifact) => {
    const url = blobUrls[artifact.id];
    const type = artifact.mimeType || "";

    if (!url) {
      return (
        <div className="artifact-preview artifact-preview--loading">
          Loading...
        </div>
      );
    }

    if (type.startsWith("image")) {
      return <img className="artifact-preview" src={url} alt={artifact.name} />;
    }

    if (type.startsWith("audio")) {
      return (
        <div className="artifact-preview artifact-preview--audio">
          <span className="audio-icon">🔊</span>
          <audio controls src={url} />
        </div>
      );
    }

    if (type.includes("json") || type.includes("text")) {
      return (
        <div className="artifact-preview artifact-preview--code">
          <code>JSON/Text</code>
        </div>
      );
    }

    return (
      <div className="artifact-preview artifact-preview--file">
        📄 {type || "Unknown"}
      </div>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="artifact-panel">
      <div className="artifact-panel__header">
        <h4>Artifacts</h4>
        <span className="artifact-panel__count">{artifacts.length}</span>
      </div>

      <div className="artifact-panel__grid">
        {loading ? (
          <div className="artifact-panel__loading">Loading artifacts...</div>
        ) : artifacts.length === 0 ? (
          <div className="artifact-panel__empty">
            No artifacts yet.
            <br />
            Generated files will appear here.
          </div>
        ) : (
          artifacts.map((artifact) => (
            <div
              key={artifact.id}
              className={`artifact-card ${
                selectedArtifact === artifact.id ? "selected" : ""
              }`}
              onClick={() => setSelectedArtifact(artifact.id)}
            >
              {renderPreview(artifact)}
              <div className="artifact-card__info">
                <span className="artifact-name">
                  {artifact.name || artifact.id.slice(0, 8)}
                </span>
                <span className="artifact-meta">
                  {formatDate(artifact.createdAt)} · {formatSize(artifact.size)}
                </span>
              </div>
              <button
                className="artifact-card__delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(artifact.id);
                }}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ArtifactPanel;
