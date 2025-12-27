/**
 * AnimatedEdge Component
 * Smooth animated edge using smart routing and CSS stroke animation.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useMemo, useState, useCallback } from "react";
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useStore,
  useReactFlow,
} from "reactflow";
import useExecutionStore from "../../store/executionStore.js";
import PropTypes from "prop-types";
import { HANDLE_TYPES } from "../../utils/handleTypes.js";
import "./AnimatedEdge.css";

/**
 * AnimatedEdge - Smart routed edge with flow animation
 */
function AnimatedEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  handleType = HANDLE_TYPES.WORKFLOW,
  selected = false,
  animated = true,
  status = "idle",
}) {
  // Move hooks to top level
  const { deleteElements, addNodes, addEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = React.useRef(null);
  const edgeSnapshots = useExecutionStore((state) => state.edgeSnapshots);
  const snapshot = edgeSnapshots.get(id);

  // Fetch nodes to determine colors (Simplified to match Handle Taxonomy)
  // Source (Output Handle) = Primary (Purple)
  // Target (Input Handle) = Secondary (Cyan)

  const sourceColor = "#6366f1"; // var(--color-primary)
  const targetColor = "#14b8a6"; // var(--color-secondary)
  const gradientId = `edge-gradient-${id}`;

  // Generate perfect smooth step path with label coordinates
  const [pathD, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
    offset: 20,
  });

  // Use calculated label coordinates for perfect centering
  const controlX = labelX;
  const controlY = labelY;

  // Build class names
  const pathClasses = [
    "animated-edge__path",
    animated && "animated-edge__path--animated",
    selected && "animated-edge__path--selected",
    status !== "idle" && `animated-edge__path--${status}`,
    handleType === HANDLE_TYPES.RESOURCE && "animated-edge__path--resource",
  ]
    .filter(Boolean)
    .join(" ");

  const containerClasses = [
    "animated-edge",
    (animated || status === "running") && "animated-edge--active",
  ]
    .filter(Boolean)
    .join(" ");

  // Calculate stroke-dasharray based on animation state
  const dashArray = useMemo(() => {
    if (handleType === HANDLE_TYPES.RESOURCE) {
      return "4 4";
    }
    if (animated || status === "running") {
      return "8 16";
    }
    return "none";
  }, [handleType, animated, status]);

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Resource edge override (no gradient, solid color)
  const isResource = handleType === HANDLE_TYPES.RESOURCE;
  const strokeColor = isResource
    ? "var(--color-accent)"
    : `url(#${gradientId})`;

  // Arrow marker ID
  const markerEndId = status === "idle" ? "arrow-cyan" : `arrow-${status}`;

  // Edge Control Logic
  const handleEdgeDelete = (e) => {
    e.stopPropagation(); // Prevent edge selection
    deleteElements({ edges: [{ id }] });
  };

  const handleAddNode = (e) => {
    e.stopPropagation();

    // Create a new AIAgent Node at the midpoint
    const newNodeId = `agent-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: "aiAgent", // Default to Agent
      position: { x: controlX - 100, y: controlY - 50 }, // Center node
      data: { label: "New Agent" },
    };

    // Create new edges
    const edgeSourceToNew = {
      id: `e-${source}-${newNodeId}`,
      source: source,
      target: newNodeId,
      sourceHandle: null, // Use default or specific handle logic if needed
      targetHandle: null,
      type: "animated",
    };

    const edgeNewToTarget = {
      id: `e-${newNodeId}-${target}`,
      source: newNodeId,
      target: target,
      sourceHandle: null,
      targetHandle: null,
      type: "animated",
    };

    // Execute split: Add Node, Add Edges, Delete Original Edge
    deleteElements({ edges: [{ id }] });
    addNodes(newNode);
    addEdges([edgeSourceToNew, edgeNewToTarget]);
  };

  // Hover Debounce Logic
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200); // 200ms grace period
  };

  if (!pathD) return null;

  return (
    <>
      {/* Define Gradient */}
      {!isResource && (
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={sourceX}
              y1={sourceY}
              x2={targetX}
              y2={targetY}
            >
              <stop offset="0%" stopColor={sourceColor} />
              <stop offset="100%" stopColor={targetColor} />
            </linearGradient>
          </defs>
        </svg>
      )}

      <g
        className={containerClasses}
        data-edgeid={id}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Glow effect layer */}
        <path
          className="animated-edge__glow"
          d={pathD}
          stroke={isResource ? "var(--color-accent)" : `url(#${gradientId})`}
        />

        {/* Hit zone */}
        <path className="animated-edge__hitzone" d={pathD} />

        {/* Main path */}
        <path
          className={pathClasses}
          d={pathD}
          strokeDasharray={dashArray}
          stroke={strokeColor} // Apply gradient
          markerEnd={`url(#${markerEndId})`}
          style={!isResource ? { stroke: `url(#${gradientId})` } : {}}
        />
      </g>

      <EdgeLabelRenderer>
        {isHovered && (
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${controlX}px,${controlY}px)`,
              zIndex: 1000,
              pointerEvents: "all",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Control Menu */}
            <div className="edge-controls-menu">
              <button
                className="edge-control-btn edge-control-btn--add"
                onClick={handleAddNode}
                title="Add Node"
              >
                +
              </button>
              <button
                className="edge-control-btn edge-control-btn--delete"
                onClick={handleEdgeDelete}
                title="Delete Connection"
              >
                ×
              </button>
            </div>

            {/* Debug Snapshot (Optional - kept small/hidden if needed, or removed) */}
            {snapshot && (
              <div
                style={{
                  fontSize: 8,
                  color: "#666",
                  marginTop: 4,
                  display: "none",
                }}
              >
                {snapshot.data?.status}
              </div>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

AnimatedEdge.propTypes = {
  id: PropTypes.string.isRequired,
  sourcePosition: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  targetPosition: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }),
  handleType: PropTypes.oneOf(Object.values(HANDLE_TYPES)),
  selected: PropTypes.bool,
  animated: PropTypes.bool,
  status: PropTypes.oneOf(["idle", "running", "success", "error"]),
};

/**
 * SVG Defs for arrow markers
 */
export function EdgeMarkerDefs() {
  return (
    <svg
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        pointerEvents: "none",
      }}
    >
      <defs>
        {/* Default Purple Arrow (Backwards compatibility) */}
        <marker
          id="arrow-idle"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="animated-edge__marker" />
        </marker>

        {/* Cyan Arrow (Matches Input Handle) */}
        <marker
          id="arrow-cyan"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#14b8a6" />
        </marker>

        <marker
          id="arrow-running"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            className="animated-edge__marker animated-edge__marker--running"
          />
        </marker>

        <marker
          id="arrow-success"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            className="animated-edge__marker animated-edge__marker--success"
          />
        </marker>

        <marker
          id="arrow-error"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            className="animated-edge__marker animated-edge__marker--error"
          />
        </marker>
      </defs>
    </svg>
  );
}

export default AnimatedEdge;
