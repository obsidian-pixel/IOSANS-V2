/**
 * Logic Nodes
 * IfElse, Switch, and Merge nodes.
 * Part of IOSANS Sovereign Architecture.
 */

import { Handle, Position } from "reactflow"; // useReactFlow removed as it's no longer needed in these simplified nodes
import PropTypes from "prop-types";
import BaseNode from "../base/BaseNode.jsx";
import "./LogicNodes.css";

/**
 * IfElseNode - Conditional branching
 */
export function IfElseNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { lastResult = null } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "If/Else"}
      type="logic"
      icon="🔀"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={false}
    >
      <div className="logic-node">
        {/* Inputs removed, now managed externally */}
        <div className="logic-node__branches">
          <div
            className={`logic-node__branch logic-node__branch--true ${
              lastResult === true ? "active" : ""
            }`}
            style={{ position: "relative" }}
          >
            ✓ True
            <Handle
              type="source"
              position={Position.Right}
              id={`${id}-true`}
              style={{ top: "50%", right: -8 }}
            />
          </div>
          <div
            className={`logic-node__branch logic-node__branch--false ${
              lastResult === false ? "active" : ""
            }`}
            style={{ position: "relative" }}
          >
            ✗ False
            <Handle
              type="source"
              position={Position.Right}
              id={`${id}-false`}
              style={{ top: "50%", right: -8 }}
            />
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

IfElseNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * SwitchNode - Multi-way branching with dynamic handles
 */
export function SwitchNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { switchKey = "type", cases = ["case1", "case2", "default"] } = data;

  // Note: Case management (Add/Remove) now handled in Inspector via 'cases' list.

  return (
    <BaseNode
      id={id}
      title={data.label || "Switch"}
      type="logic"
      icon="🔃"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={false} // We manage our own outputs
    >
      <div className="logic-node">
        <div className="logic-node__key">
          <span style={{ opacity: 0.7 }}>Key:</span> <code>{switchKey}</code>
        </div>
        <div className="logic-node__cases">
          {cases.map(
            (
              c // Removed index 'i' as key is now 'c'
            ) => (
              <div
                key={c} // Use case string as key, assuming unique
                className="logic-node__case-wrapper"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  height: 24, // Added height for consistent spacing
                }}
              >
                <span className="logic-node__case-label">{c}</span>
                {/* Remove button removed */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`${id}-case-${c}`}
                  style={{ top: "50%", right: -24 }}
                />
              </div>
            )
          )}
        </div>
      </div>
    </BaseNode>
  );
}

SwitchNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * MergeNode - Waits for all branches and combines
 */
export function MergeNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { mergeStrategy = "object", expectedBranches = 2 } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "Merge"}
      type="logic"
      icon="🔗"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="logic-node">
        <div className="logic-node__info">
          Strategy: <code>{mergeStrategy}</code>
        </div>
        <div className="logic-node__branches-count">
          Expecting {expectedBranches} branches
        </div>
      </div>
    </BaseNode>
  );
}

MergeNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};

/**
 * Delay Node - Pauses execution
 */
export function DelayNode({
  id,
  data = {},
  selected = false,
  status = "idle",
}) {
  const { delay = 1000 } = data;

  return (
    <BaseNode
      id={id}
      title={data.label || "Delay"}
      type="logic"
      icon="⏳"
      slots={[]}
      selected={selected}
      status={status}
      hasWorkflowInput={true}
      hasWorkflowOutput={true}
    >
      <div className="logic-node">
        <div style={{ fontSize: 11, textAlign: "center" }}>{delay}ms</div>
      </div>
    </BaseNode>
  );
}

DelayNode.propTypes = {
  id: PropTypes.string.isRequired,
  data: PropTypes.object,
  selected: PropTypes.bool,
  status: PropTypes.string,
};
