import { Extension } from "@tiptap/core";

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addKeyboardShortcuts() {
    return {
      "/": ({ editor }) => {
        setTimeout(() => {
          const word = editor.state.doc.textBetween(
            editor.state.selection.from - 20,
            editor.state.selection.from,
            " "
          );

          if (word.endsWith("/section")) {
            editor.commands.deleteRange({
              from: editor.state.selection.from - 8,
              to: editor.state.selection.from,
            });
            editor.commands.insertContent({ type: "section" });
          }

          if (word.endsWith("/timeline")) {
            editor.commands.deleteRange({
              from: editor.state.selection.from - 9,
              to: editor.state.selection.from,
            });
            editor.commands.insertContent({ type: "timelineRow" });
          }

          if (word.endsWith("/action")) {
            editor.commands.deleteRange({
              from: editor.state.selection.from - 7,
              to: editor.state.selection.from,
            });
            editor.commands.insertContent({ type: "actionItem" });
          }

          if (word.endsWith("/cover")) {
            editor.commands.deleteRange({
              from: editor.state.selection.from - 6,
              to: editor.state.selection.from,
            });
            editor.commands.insertContent({
              type: "coverMetadata",
              attrs: {
                provider_company: null,
                client_company: null,
                project_name: null,
                date: null,
              },
            });
          }
        }, 0);

        return false;
      },
    };
  },
});
