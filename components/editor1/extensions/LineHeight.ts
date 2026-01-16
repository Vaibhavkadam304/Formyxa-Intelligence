import { Extension } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (value: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

export const LineHeight = Extension.create({
  name: "lineHeight",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => (element as HTMLElement).style.lineHeight || null,
            renderHTML: (attrs) =>
              attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight};` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
        setLineHeight:
        (value: string) =>
        ({ tr, state, dispatch }) => {
            const { from, to } = state.selection;

            state.doc.nodesBetween(from, to, (node, pos) => {
            if (!this.options.types.includes(node.type.name)) return;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineHeight: value });
            });

            if (dispatch) dispatch(tr);
            return true;
        },

        unsetLineHeight:
        () =>
        ({ tr, state, dispatch }) => {
            const { from, to } = state.selection;

            state.doc.nodesBetween(from, to, (node, pos) => {
            if (!this.options.types.includes(node.type.name)) return;
            const nextAttrs = { ...node.attrs };
            delete nextAttrs.lineHeight;
            tr.setNodeMarkup(pos, undefined, nextAttrs);
            });

            if (dispatch) dispatch(tr);
            return true;
        },
    };
    }
,
});
