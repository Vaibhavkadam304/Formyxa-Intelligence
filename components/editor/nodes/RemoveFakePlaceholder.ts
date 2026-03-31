import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";

export const RemoveFakePlaceholder = Extension.create({
  name: "removeFakePlaceholder",

  addProseMirrorPlugins() {
    console.log("[RemoveFakePlaceholder] plugin registered");

    return [
      new Plugin({
        props: {
          handleTextInput(view, from, to, text) {
            const { state } = view;
            const { $from } = state.selection;
            const parent = $from.parent;

            console.log("[RemoveFakePlaceholder] handleTextInput fired", {
              text,
              parentType: parent.type.name,
              parentAttrs: parent.attrs,
              parentText: parent.textContent,
            });

            if (
              parent.type.name === "paragraph" &&
              parent.attrs?.placeholder === true
            ) {
              console.log("[RemoveFakePlaceholder] REMOVING PLACEHOLDER");

              const tr = state.tr.delete(
                $from.before(),
                $from.after()
              );
              view.dispatch(tr);
            }

            return false;
          },
        },
      }),
    ];
  },
});
