/**
 * AnimatedEdge Component
 * Smooth animated edge using smart routing and CSS stroke animation.
 * Part of IOSANS Sovereign Architecture.
 */

import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { getSmartPath } from "../../utils/smartRouting.js";
import { HANDLE_TYPES } from "../../utils/handleTypes.js";
import "./AnimatedEdge.css";

/**
 * AnimatedEdge - Smart routed edge with flow animation
 *
 * @param {Object} props
 * @param {string} props.id - Edge ID
 * @param {Object} props.sourcePosition - {x, y} of source handle
 * @param {Object} props.targetPosition - {x, y} of target handle
 * @param {Array} props.nodes - Array of nodes for obstacle avoidance
 * @param {string} props.handleType - 'workflow' or 'resource'
 * @param {boolean} props.selected - Whether edge is selected
 * @param {boolean} props.animated - Enable flow animation
 * @param {string} props.status - Execution status
 */
function AnimatedEdge({
  id,
  sourcePosition,
  targetPosition,
  nodes = [],
  handleType = HANDLE_TYPES.WORKFLOW,
  selected = false,
  animated = true,
  status = "idle",
}) {
  // Generate smart routed path
  const pathD = useMemo(() => {
    if (!sourcePosition || !targetPosition) return "";

    return getSmartPath(sourcePosition, targetPosition, nodes, {
      gridSize: 10,
      turnPenalty: 15,
      bufferZoneCost: 50,
      bufferZoneSize: 3,
      cornerRadius: 15,
    });
  }, [sourcePosition, targetPosition, nodes]);

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

  if (!pathD) return null;

  return (
    <g className={containerClasses} data-edgeid={id}>
      {/* Glow effect layer */}
      <path className="animated-edge__glow" d={pathD} />

      {/* Hit zone for interaction */}
      <path className="animated-edge__hitzone" d={pathD} />

      {/* Main path */}
      <path
        className={pathClasses}
        d={pathD}
        strokeDasharray={dashArray}
        markerEnd={`url(#arrow-${status})`}
      />
    </g>
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
  nodes: PropTypes.array,
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
    <defs>
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
  );
}

export default AnimatedEdge;
