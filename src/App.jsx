import "./App.css";
import BaseNode from "./nodes/base/BaseNode.jsx";
import AnimatedEdge, {
  EdgeMarkerDefs,
} from "./components/Editor/AnimatedEdge.jsx";
import { RESOURCE_SLOTS } from "./utils/handleTypes.js";

function App() {
  // Demo nodes for routing
  const demoNodes = [
    { id: "node1", position: { x: 100, y: 150 }, width: 200, height: 80 },
    { id: "node2", position: { x: 450, y: 150 }, width: 200, height: 80 },
    { id: "obstacle", position: { x: 275, y: 100 }, width: 100, height: 100 },
  ];

  return (
    <div className="app-container">
      <h1>IOSANS V2 - Phase 5 Validation</h1>
      <p className="subtitle">
        Advanced Routing: A* Pathfinding + Animated Edges
      </p>

      {/* Edge Animation Demo */}
      <div className="edge-showcase">
        <h2>Smart Routing Demo</h2>
        <svg width="700" height="350" className="edge-canvas">
          <EdgeMarkerDefs />

          {/* Grid background */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Obstacle visualization */}
          <rect
            x={275}
            y={100}
            width={100}
            height={100}
            fill="rgba(255,100,100,0.2)"
            stroke="rgba(255,100,100,0.5)"
            strokeDasharray="4 4"
            rx="8"
          />
          <text
            x={325}
            y={155}
            fill="rgba(255,100,100,0.7)"
            textAnchor="middle"
            fontSize="12"
          >
            Obstacle
          </text>

          {/* Animated Edge - routes around obstacle */}
          <AnimatedEdge
            id="edge-1"
            sourcePosition={{ x: 300, y: 190 }}
            targetPosition={{ x: 450, y: 190 }}
            nodes={demoNodes}
            animated={true}
            status="idle"
          />

          {/* Running Edge */}
          <AnimatedEdge
            id="edge-2"
            sourcePosition={{ x: 100, y: 280 }}
            targetPosition={{ x: 600, y: 280 }}
            nodes={[]}
            animated={true}
            status="running"
          />

          {/* Success Edge */}
          <AnimatedEdge
            id="edge-3"
            sourcePosition={{ x: 100, y: 320 }}
            targetPosition={{ x: 600, y: 320 }}
            nodes={[]}
            animated={false}
            status="success"
          />

          {/* Node placeholders */}
          <rect
            x={95}
            y={145}
            width={210}
            height={90}
            rx="12"
            fill="rgba(99,102,241,0.1)"
            stroke="rgba(99,102,241,0.3)"
          />
          <text
            x={200}
            y={195}
            fill="var(--color-text-secondary)"
            textAnchor="middle"
            fontSize="14"
          >
            Source Node
          </text>

          <rect
            x={445}
            y={145}
            width={210}
            height={90}
            rx="12"
            fill="rgba(99,102,241,0.1)"
            stroke="rgba(99,102,241,0.3)"
          />
          <text
            x={550}
            y={195}
            fill="var(--color-text-secondary)"
            textAnchor="middle"
            fontSize="14"
          >
            Target Node
          </text>
        </svg>

        <div className="edge-legend">
          <span>
            <span className="legend-dot legend-dot--animated"></span> Animated
            Flow
          </span>
          <span>
            <span className="legend-dot legend-dot--running"></span> Running
          </span>
          <span>
            <span className="legend-dot legend-dot--success"></span> Success
          </span>
        </div>
      </div>

      {/* BaseNode States */}
      <div className="node-showcase">
        <div className="node-demo">
          <h3>Multi-Slot</h3>
          <BaseNode
            id="multi-1"
            title="Agent Node"
            type="agent"
            icon="🤖"
            slots={[RESOURCE_SLOTS.TOOL, RESOURCE_SLOTS.MODEL]}
          >
            <p>Tool + Model slots</p>
          </BaseNode>
        </div>

        <div className="node-demo">
          <h3>Running</h3>
          <BaseNode
            id="running-1"
            title="Processing..."
            type="exec"
            icon="⚡"
            status="running"
          >
            <p>Animated glow</p>
          </BaseNode>
        </div>
      </div>
    </div>
  );
}

export default App;
