import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CoverMetadataBlockView } from "./CoverMetadataBlockView";

export const CoverMetadataBlock = Node.create({
  name: "coverMetadata",
  group: "block",
  atom: true,       // all data lives in attrs — no inner content
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      provider_company: { default: null },
      client_company:   { default: null },
      project_name:     { default: null },
      date:             { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-cover-metadata]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-cover-metadata": "true" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CoverMetadataBlockView);
  },
});
