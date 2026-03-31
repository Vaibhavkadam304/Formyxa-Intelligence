"use client";

import { NodeViewWrapper } from "@tiptap/react";

export function ActionItemView({ node, updateAttributes }: any) {
  return (
    <NodeViewWrapper as="div" className="space-y-1 text-sm">
      {/* DESCRIPTION */}
      <div
        contentEditable
        suppressContentEditableWarning
        className="outline-none"
        onBlur={(e) =>
          updateAttributes({
            text: e.currentTarget.innerText.trim() || null,
          })
        }
      >
        {node.attrs.text || "Describe the action to take…"}
      </div>

      {/* META (inline, subtle) */}
      <div className="flex gap-4 text-xs text-slate-500">
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) =>
            updateAttributes({ owner: e.currentTarget.innerText.trim() || null })
          }
        >
          {node.attrs.owner || "Owner"}
        </span>

        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) =>
            updateAttributes({ due: e.currentTarget.innerText.trim() || null })
          }
        >
          {node.attrs.due || "Due date"}
        </span>
      </div>
    </NodeViewWrapper>
  );
}
