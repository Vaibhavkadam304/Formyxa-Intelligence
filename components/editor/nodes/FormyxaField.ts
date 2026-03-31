import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { FormyxaFieldView } from "./FormyxaFieldView";

export const FormyxaField = Node.create({
  name: "formyxaField",

  inline: true,
  group: "inline",
  atom: true,        // value lives in attrs — no child text content
  selectable: false,

  addAttributes() {
    return {
      key:      { default: null },
      label:    { default: "" },
      value:    { default: null },
      required: { default: false },
      format:   { default: "text" },
      bold:     { default: false },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-formyxa-field]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-formyxa-field": "true",
        style: "background:#f1f5ff;padding:2px 6px;border-radius:4px;",
      }),
    ];
  },

  // ← THIS WAS MISSING — without it, FormyxaFieldView is never used
  addNodeView() {
    return ReactNodeViewRenderer(FormyxaFieldView);
  },
});
