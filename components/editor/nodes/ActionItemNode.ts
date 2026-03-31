import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ActionItemView } from "./ActionItemView";

export const ActionItemNode = Node.create({
  name: "actionItem",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      text: { default: null },
      owner: { default: null },
      due: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-action-item]" }];
  },

  renderHTML() {
    return ["div", { "data-action-item": "true" }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ActionItemView);
  },
});
