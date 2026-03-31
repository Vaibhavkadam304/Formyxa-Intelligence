import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TimelineRowView } from "./TimelineRowView";

export const TimelineRowNode = Node.create({
  name: "timelineRow",
  group: "block",
  content: "inline*",
  selectable: true,


  addAttributes() {
    return {
      time: { default: null },
      text: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-timeline-row]" }];
  },

  renderHTML() {
    return ["div", { "data-timeline-row": "true" }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimelineRowView);
  },
});
