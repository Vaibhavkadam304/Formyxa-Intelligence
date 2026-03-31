"use client";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";

export function DataBlockView({ node }: any) {
  const isEmpty =
    node.content.size === 0 || node.textContent.trim().length === 0;

  return (
    <NodeViewWrapper className="data-block">
      {isEmpty && node.attrs.helper && (
        <div className="data-block-helper" contentEditable={false}>
          {node.attrs.helper}
        </div>
      )}

      <NodeViewContent className="data-block-content" />
    </NodeViewWrapper>
  );
}
