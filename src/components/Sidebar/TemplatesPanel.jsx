import React from "react";
import "./NodeSidebar.css";
import { TEMPLATES } from "../../data/flowTemplates.js";
import useWorkflowStore from "../../store/workflowStore.js";
import { useReactFlow } from "reactflow";

export function TemplatesPanel() {
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const setEdges = useWorkflowStore((state) => state.setEdges);
  const { fitView } = useReactFlow();

  const handleLoad = (template) => {
    // Confirm? No, just load for speed.
    setNodes(template.nodes);
    setEdges(template.edges);

    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 50);
  };

  return (
    <div className="node-sidebar__categories">
      <div className="node-sidebar__category">
        <div
          className="node-sidebar__category-header"
          style={{ cursor: "default" }}
        >
          <span className="category-icon">📂</span>
          <span className="category-label">My Templates</span>
        </div>
        <div className="node-sidebar__nodes">
          {TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="node-sidebar__node"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/reactflow-template", t.id);
                e.dataTransfer.effectAllowed = "copy";
              }}
              style={{ cursor: "grab" }}
              onClick={() => handleLoad(t)}
              title={t.description}
            >
              <span className="node-icon">{t.icon}</span>
              <span className="node-label">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
