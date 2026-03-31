"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";

export function SemanticBlockView({ node, editor, getPos }: any) {
  const { label } = node.attrs;

  const handleFocus = () => {
    const firstChild = node.content?.firstChild;

    if (
      firstChild?.type?.name === "paragraph" &&
      firstChild?.attrs?.placeholder === true
    ) {
      const pos = getPos();

      editor
        .chain()
        .focus()
        .deleteRange({
          from: pos + 1,
          to: pos + node.nodeSize - 1,
        })
        .run();
    }
  };

  return (
    <NodeViewWrapper data-section>
      {label && <div className="semantic-block-title">{label}</div>}

      <div className="semantic-block-content" onFocus={handleFocus}>
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
}
