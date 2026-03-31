import { ReactNodeViewRenderer } from "@tiptap/react";
import { SemanticBlockView } from "./SemanticBlockView";
import { Node as TiptapNode } from "@tiptap/core";
export const SemanticBlock = (name: string) =>
  TiptapNode.create({
    name,
    group: "block",
    content: "block*",

    addAttributes() {
      return {
        id: { default: null },
        label: { default: null },
        helper: { default: null },
      };
    },

    parseHTML() {
      return [{ tag: `div[data-${name}]` }];
    },

    renderHTML() {
      return ["div", { [`data-${name}`]: "true" }, 0];
    },

    addNodeView() {
      return ReactNodeViewRenderer(SemanticBlockView);
    },
  });
