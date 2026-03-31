import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { DataBlockView } from "./DataBlockView";

export const DataBlock = (name: string) =>
  Node.create({
    name,
    group: "block",
    content: "block*",

    addAttributes() {
      return {
        id: { default: null },
        helper: { default: null },
      };
    },

    parseHTML() {
      return [{ tag: `div[data-${name}]` }];
    },

    renderHTML({ node }) {
      return [
        "div",
        {
          [`data-${name}`]: "true",
        },
        0,
      ];
    },

    addNodeView() {
      return ReactNodeViewRenderer(DataBlockView);
    },
  });
