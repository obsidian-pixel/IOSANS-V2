/**
 * Logic Nodes
 * IfElse, Switch, and Merge nodes.
 * Part of IOSANS Sovereign Architecture.
 */

import React from "react";
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
  const { condition = "value === true", lastResult = null } = data;

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
      hasWorkflowOutput={true}
    >
      <div className="logic-node">
        <div className="logic-node__condition">
          <code>{condition}</code>
        </div>
        <div className="logic-node__branches">
          <span className="logic-node__branch logic-node__branch--true">
            ✓ True
          </span>
          <span className="logic-node__branch logic-node__branch--false">
            ✗ False
          </span>
        </div>
        {lastResult !== null && (
          <div className="logic-node__result">
            Last: {lastResult ? "True" : "False"}
          </div>
        )}
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
      hasWorkflowOutput={true}
    >
      <div className="logic-node">
        <div className="logic-node__key">
          Key: <code>{switchKey}</code>
        </div>
        <div className="logic-node__cases">
          {cases.map((c, i) => (
            <span key={i} className="logic-node__case">
              {c}
            </span>
          ))}
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
