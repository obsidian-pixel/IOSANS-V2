/**
 * CustomEdge Component
 * React Flow compatible edge using smooth step routing and CSS animation.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
import { getSmoothStepPath } from "reactflow";
import "./AnimatedEdge.css";

/**
 * CustomEdge - React Flow edge with status-based styling
 */
function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {},
  selected,
  style = {},
}) {
  const status = data?.status || "idle";

  // Get smooth step path for clean orthogonal routing
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  // Build class names based on status
  const pathClasses = [
    "custom-edge__path",
    selected && "custom-edge__path--selected",
    status !== "idle" && `custom-edge__path--${status}`,
    (status === "running" || status === "idle") &&
      "custom-edge__path--animated",
  ]
    .filter(Boolean)
    .join(" ");

  const glowClasses = [
    "custom-edge__glow",
    status !== "idle" && `custom-edge__glow--${status}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <g className="custom-edge">
      {/* Glow effect */}
      <path className={glowClasses} d={edgePath} fill="none" />

      {/* Hit area for selection */}
      <path d={edgePath} fill="none" strokeWidth={20} stroke="transparent" />

      {/* Main path */}
      <path
        id={id}
        className={pathClasses}
        d={edgePath}
        fill="none"
        style={style}
        markerEnd="url(#custom-edge-arrow)"
      />
    </g>
  );
}

/**
 * Edge marker definitions - include this once in your canvas
 */
export function EdgeMarkerDefs() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        <marker
          id="custom-edge-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 10 5 L 0 10 z"
            fill="currentColor"
            className="custom-edge__marker"
          />
        </marker>
      </defs>
    </svg>
  );
}

export default CustomEdge;
