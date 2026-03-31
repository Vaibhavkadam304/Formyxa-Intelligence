"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { useRef } from "react";

export function TimelineRowView({ node, updateAttributes }: any) {
  const timeRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  return (
    <NodeViewWrapper
        as="div"
        className="flex gap-3 items-start text-sm ml-4 leading-snug"
        >
      {/* TIME */}
      <span
        ref={timeRef}
        contentEditable
        suppressContentEditableWarning
        className="text-slate-500 min-w-[52px] outline-none"
        onBlur={(e) =>
          updateAttributes({
            time: e.currentTarget.innerText.trim() || null,
          })
        }
      >
        {node.attrs.time || "HH:MM"}
      </span>

      {/* TEXT */}
      <span
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        className="flex-1 outline-none text-slate-900"
        onBlur={(e) =>
          updateAttributes({
            text: e.currentTarget.innerText.trim() || null,
          })
        }
      >
        {node.attrs.text || "Describe what happened…"}
      </span>
    </NodeViewWrapper>
  );
}
