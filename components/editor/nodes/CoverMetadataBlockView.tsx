/**
 * CoverMetadataBlock — Tiptap Node
 *
 * Renders the "Prepared By / Prepared For / Project Name / Effective Date"
 * summary block that sits right below the document title on the cover page.
 *
 * Attrs are synced bidirectionally with FormyxaSidebar via useCoverMetaSync.
 *
 * JSON shape in contentJsonTemplate:
 * {
 *   "type": "coverMetadata",
 *   "attrs": {
 *     "provider_company": "",
 *     "client_company": "",
 *     "project_name": "",
 *     "date": ""
 *   }
 * }
 */

import { Node, mergeAttributes } from "@tiptap/core";

export const CoverMetadataBlock = Node.create({
  name: "coverMetadata",

  // Block-level, non-editable atom — the sidebar drives all changes
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      provider_company: { default: "" },
      client_company:   { default: "" },
      project_name:     { default: "" },
      date:             { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='cover-metadata']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "cover-metadata" }),
    ];
  },

  addNodeView() {
    return ({ node, updateAttributes }) => {
      // ── Outer wrapper ───────────────────────────────────────────────
      const dom = document.createElement("div");
      dom.setAttribute("data-type", "cover-metadata");
      dom.style.cssText = `
        margin: 24px 0 32px;
        padding: 20px 24px;
        border: 1px solid rgba(99,102,241,0.18);
        border-radius: 10px;
        background: rgba(99,102,241,0.04);
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 32px;
        font-family: inherit;
      `;

      /** Helper: create one labelled row */
      function makeRow(label: string, value: string, attrKey: string) {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;flex-direction:column;gap:2px;";

        const lbl = document.createElement("span");
        lbl.style.cssText =
          "font-size:10px;font-weight:700;text-transform:uppercase;" +
          "letter-spacing:.08em;color:#94a3b8;";
        lbl.textContent = label;

        const val = document.createElement("span");
        val.setAttribute("data-attr", attrKey);
        val.style.cssText =
          "font-size:13px;color:" +
          (value ? "#1e293b" : "#cbd5e1") +
          ";font-style:" + (value ? "normal" : "italic") + ";";
        val.textContent = value || getPlaceholder(attrKey);

        wrap.appendChild(lbl);
        wrap.appendChild(val);
        return wrap;
      }

      function getPlaceholder(key: string) {
        const map: Record<string, string> = {
          provider_company: "Your company…",
          client_company:   "Client company…",
          project_name:     "Project name…",
          date:             "Effective date…",
        };
        return map[key] ?? "—";
      }

      function render() {
        dom.innerHTML = "";
        const { provider_company, client_company, project_name, date } =
          node.attrs;
        dom.appendChild(makeRow("Prepared By",  provider_company, "provider_company"));
        dom.appendChild(makeRow("Prepared For", client_company,   "client_company"));
        dom.appendChild(makeRow("Project Name", project_name,     "project_name"));
        dom.appendChild(makeRow("Effective Date", date,           "date"));
      }

      render();

      return {
        dom,
        update(updatedNode: any) {
          if (updatedNode.type.name !== "coverMetadata") return false;
          // Re-render when attrs change (sidebar → editor)
          (node as any) = updatedNode;
          render();
          return true;
        },
      };
    };
  },
});