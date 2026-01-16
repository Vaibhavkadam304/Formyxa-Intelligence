import { Extension } from "@tiptap/core";

export const BlockMover = Extension.create({
  name: "blockMover",

  addCommands() {
    return {
      moveBlockUp:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;
          const depth = $from.depth;
          const node = $from.node(depth);
          const pos = $from.before(depth);
          const parent = $from.node(depth - 1);
          const index = $from.index(depth - 1);

          if (!parent || index === 0) return false;

          const prevSibling = parent.child(index - 1);
          const prevPos = pos - prevSibling.nodeSize;

          const tr = state.tr;
          tr.delete(pos, pos + node.nodeSize);
          tr.insert(prevPos, node);

          if (dispatch) dispatch(tr.scrollIntoView());
          return true;
        },

      moveBlockDown:
        () =>
        ({ state, dispatch }) => {
          const { selection } = state;
          const { $from } = selection;
          const depth = $from.depth;
          const node = $from.node(depth);
          const pos = $from.before(depth);
          const parent = $from.node(depth - 1);
          const index = $from.index(depth - 1);

          if (!parent || index >= parent.childCount - 1) return false;

          const nextSibling = parent.child(index + 1);
          const afterNextPos = pos + node.nodeSize + nextSibling.nodeSize;

          const tr = state.tr;
          tr.delete(pos, pos + node.nodeSize);
          tr.insert(afterNextPos - node.nodeSize, node);

          if (dispatch) dispatch(tr.scrollIntoView());
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-ArrowUp": () => this.editor.commands.moveBlockUp(),
      "Mod-Shift-ArrowDown": () => this.editor.commands.moveBlockDown(),
    };
  },
});
