/**
 * Smart Routing - Weighted A* Pathfinding
 * Anti-Jank routing engine with turn penalties and buffer zones.
 * Part of IOSANS Sovereign Architecture.
 */

/**
 * @typedef {Object} Point
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} RoutingOptions
 * @property {number} gridSize - Grid cell size (default: 10)
 * @property {number} turnPenalty - Cost for direction changes (default: 15)
 * @property {number} bufferZoneCost - Cost for cells near nodes (default: 50)
 * @property {number} bufferZoneSize - Buffer zone radius in cells (default: 3)
 * @property {number} cornerRadius - Quadratic curve radius (default: 15)
 */

const DEFAULT_OPTIONS = {
  gridSize: 10,
  turnPenalty: 15,
  bufferZoneCost: 50,
  bufferZoneSize: 3,
  cornerRadius: 15,
};

// Direction vectors: right, down, left, up
const DIRECTIONS = [
  { dx: 1, dy: 0 }, // right
  { dx: 0, dy: 1 }, // down
  { dx: -1, dy: 0 }, // left
  { dx: 0, dy: -1 }, // up
];

/**
 * Priority Queue implementation for A*
 */
class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item, priority) {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.items.shift()?.item;
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

/**
 * Creates an obstacle grid from node positions
 * @param {Array} nodes - Array of node objects with position and dimensions
 * @param {Object} bounds - Canvas bounds {width, height}
 * @param {RoutingOptions} options
 * @returns {Map} Grid cost map
 */
function createObstacleGrid(nodes, bounds, options) {
  const { gridSize, bufferZoneCost, bufferZoneSize } = options;
  const costMap = new Map();

  // Mark node cells and buffer zones
  nodes.forEach((node) => {
    const nodeLeft = Math.floor((node.position?.x || 0) / gridSize);
    const nodeTop = Math.floor((node.position?.y || 0) / gridSize);
    const nodeRight = Math.ceil(
      ((node.position?.x || 0) + (node.width || 200)) / gridSize
    );
    const nodeBottom = Math.ceil(
      ((node.position?.y || 0) + (node.height || 80)) / gridSize
    );

    // Mark buffer zone around node
    for (
      let x = nodeLeft - bufferZoneSize;
      x <= nodeRight + bufferZoneSize;
      x++
    ) {
      for (
        let y = nodeTop - bufferZoneSize;
        y <= nodeBottom + bufferZoneSize;
        y++
      ) {
        const key = `${x},${y}`;

        // Inside node = blocked (Infinity)
        if (
          x >= nodeLeft &&
          x <= nodeRight &&
          y >= nodeTop &&
          y <= nodeBottom
        ) {
          costMap.set(key, Infinity);
        }
        // Buffer zone = high cost
        else if (!costMap.has(key) || costMap.get(key) < bufferZoneCost) {
          costMap.set(key, bufferZoneCost);
        }
      }
    }
  });

  return costMap;
}

/**
 * Manhattan distance heuristic
 */
function heuristic(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * A* pathfinding with turn penalties
 * @param {Point} start - Start point
 * @param {Point} end - End point
 * @param {Array} nodes - Obstacle nodes
 * @param {Object} bounds - Canvas bounds
 * @param {RoutingOptions} options
 * @returns {Point[]} Path points
 */
export function findPath(
  start,
  end,
  nodes = [],
  bounds = { width: 2000, height: 2000 },
  options = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { gridSize, turnPenalty } = opts;

  // Convert to grid coordinates
  const startX = Math.round(start.x / gridSize);
  const startY = Math.round(start.y / gridSize);
  const endX = Math.round(end.x / gridSize);
  const endY = Math.round(end.y / gridSize);

  // Create obstacle grid
  const costMap = createObstacleGrid(nodes, bounds, opts);

  // A* data structures
  const openSet = new PriorityQueue();
  const cameFrom = new Map();
  const gScore = new Map();
  const directionFrom = new Map();

  const startKey = `${startX},${startY}`;
  gScore.set(startKey, 0);
  openSet.enqueue(
    { x: startX, y: startY },
    heuristic(startX, startY, endX, endY)
  );

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue();
    const currentKey = `${current.x},${current.y}`;

    // Reached goal
    if (current.x === endX && current.y === endY) {
      return reconstructPath(cameFrom, current, gridSize);
    }

    // Explore neighbors
    for (let i = 0; i < DIRECTIONS.length; i++) {
      const dir = DIRECTIONS[i];
      const neighborX = current.x + dir.dx;
      const neighborY = current.y + dir.dy;
      const neighborKey = `${neighborX},${neighborY}`;

      // Skip blocked cells
      const cellCost = costMap.get(neighborKey) || 0;
      if (cellCost === Infinity) continue;

      // Calculate turn penalty
      let turnCost = 0;
      const prevDir = directionFrom.get(currentKey);
      if (prevDir !== undefined && prevDir !== i) {
        turnCost = turnPenalty;
      }

      // Calculate total cost
      const tentativeG =
        (gScore.get(currentKey) || 0) + 1 + cellCost + turnCost;

      if (!gScore.has(neighborKey) || tentativeG < gScore.get(neighborKey)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        directionFrom.set(neighborKey, i);

        const fScore = tentativeG + heuristic(neighborX, neighborY, endX, endY);
        openSet.enqueue({ x: neighborX, y: neighborY }, fScore);
      }
    }
  }

  // No path found - return direct line
  return [start, end];
}

/**
 * Reconstructs path from A* result
 */
function reconstructPath(cameFrom, end, gridSize) {
  const path = [];
  let current = end;

  while (current) {
    path.unshift({
      x: current.x * gridSize,
      y: current.y * gridSize,
    });
    current = cameFrom.get(`${current.x},${current.y}`);
  }

  return path;
}

/**
 * Simplifies path by removing collinear points
 * @param {Point[]} path
 * @returns {Point[]}
 */
function simplifyPath(path) {
  if (path.length <= 2) return path;

  const simplified = [path[0]];

  for (let i = 1; i < path.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = path[i];
    const next = path[i + 1];

    // Check if direction changes
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;

    if (dx1 !== dx2 || dy1 !== dy2) {
      simplified.push(curr);
    }
  }

  simplified.push(path[path.length - 1]);
  return simplified;
}

/**
 * Generates SVG path with quadratic curves for smooth corners
 * @param {Point[]} points - Path points
 * @param {number} radius - Corner radius (default: 15)
 * @returns {string} SVG path d attribute
 */
export function generateQuadraticPath(points, radius = 15) {
  if (points.length < 2) return "";

  const simplified = simplifyPath(points);

  if (simplified.length === 2) {
    // Direct line
    return `M ${simplified[0].x} ${simplified[0].y} L ${simplified[1].x} ${simplified[1].y}`;
  }

  let path = `M ${simplified[0].x} ${simplified[0].y}`;

  for (let i = 1; i < simplified.length - 1; i++) {
    const prev = simplified[i - 1];
    const curr = simplified[i];
    const next = simplified[i + 1];

    // Calculate vectors
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    // Normalize and calculate control point distances
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    const d1 = Math.min(radius, len1 / 2);
    const d2 = Math.min(radius, len2 / 2);

    // Start of curve (coming from previous segment)
    const p1 = {
      x: curr.x - (v1.x / len1) * d1,
      y: curr.y - (v1.y / len1) * d1,
    };

    // End of curve (going to next segment)
    const p2 = {
      x: curr.x + (v2.x / len2) * d2,
      y: curr.y + (v2.y / len2) * d2,
    };

    // Line to curve start, then quadratic curve
    path += ` L ${p1.x} ${p1.y}`;
    path += ` Q ${curr.x} ${curr.y} ${p2.x} ${p2.y}`;
  }

  // Final line to end point
  path += ` L ${simplified[simplified.length - 1].x} ${
    simplified[simplified.length - 1].y
  }`;

  return path;
}

/**
 * Generates a smart routed path between two points
 * @param {Point} start
 * @param {Point} end
 * @param {Array} nodes
 * @param {RoutingOptions} options
 * @returns {string} SVG path d attribute
 */
export function getSmartPath(start, end, nodes = [], options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pathPoints = findPath(start, end, nodes, undefined, opts);
  return generateQuadraticPath(pathPoints, opts.cornerRadius);
}

/**
 * Calculates path length for animation
 * @param {string} pathD - SVG path d attribute
 * @returns {number} Approximate path length
 */
export function getPathLength(pathD) {
  if (typeof document === "undefined") return 100;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  svg.appendChild(path);
  document.body.appendChild(svg);
  const length = path.getTotalLength();
  document.body.removeChild(svg);
  return length;
}
