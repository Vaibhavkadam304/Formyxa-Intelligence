"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Node, Mark, Extension } from "@tiptap/core";
import FontFamily from "@tiptap/extension-font-family";
import Bold from "@tiptap/extension-bold";
import { FormyxaField } from "./nodes/FormyxaField";

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { ResizableImage } from "./ResizableImage";

import type { BrandProfile, SignatoryProfile } from "@/components/editor/types/doc-layout";
import { getLayoutForTemplateSlug } from "@/lib/docLayout";
import { DocumentPageShell } from "./DocumentPageShell";
import { LineHeight } from "@/components/editor/extensions/LineHeight";

import Paragraph from "@tiptap/extension-paragraph";
import { Plugin, PluginKey } from "prosemirror-state";


type EditorViewMode = "document" | "blog";

type JsonEditorProps = {
  initialDoc: any;
  fileName: string;
  onFileNameChange: (name: string) => void;
  onDocChange: (doc: any) => void;
  onExport: (doc: any, fileName: string) => Promise<void>;
  onSave?: (doc: any, fileName: string) => Promise<void>;
  initialMode?: EditorViewMode;

  templateSlug?: string;
  designKey?: string;
  brand?: BrandProfile;
  signatory?: SignatoryProfile;

  chrome?: "full" | "canvas";
  zoom?: number;
  onZoomChange?: (z: number) => void;
  onEditorReady?: (editor: any) => void;
  onEditHeader?: () => void;
  variables?: Record<string, any>;
  placeholderSchema?: Record<string, { label: string }>;
};

// ---------------------------------------------------------------------
const DEFAULT_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

function stripEmptyTextNodes(node: any): any {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map(stripEmptyTextNodes).filter((child) => child != null);
  }

  const clone: any = { ...node };

  if (clone.type === "text") {
    if (!clone.text || clone.text.length === 0) return null;
    return clone;
  }

  if (Array.isArray(clone.content)) {
    clone.content = clone.content
      .map(stripEmptyTextNodes)
      .filter((child: any) => child != null);
  }

  return clone;
}

function normalizeDoc(doc: any): any {
  if (!doc) return DEFAULT_DOC;

  if (typeof doc === "string") {
    try {
      doc = JSON.parse(doc);
    } catch {
      return DEFAULT_DOC;
    }
  }

  if (typeof doc !== "object") return DEFAULT_DOC;

  if ((doc as any).type !== "doc") {
    doc = { type: "doc", content: Array.isArray((doc as any).content) ? (doc as any).content : [] };
  }

  if (!Array.isArray((doc as any).content)) (doc as any).content = [];

  const cleaned = stripEmptyTextNodes(doc);
  if (!cleaned || typeof cleaned !== "object") return DEFAULT_DOC;
  if (!Array.isArray((cleaned as any).content)) (cleaned as any).content = [];
  return cleaned;
}

// ---------------------------------------------------------------------
// Page Break node
// ---------------------------------------------------------------------
const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: "hr[data-page-break]" }];
  },

  renderHTML() {
    return ["hr", { "data-page-break": "true", class: "border-t border-dashed my-6" }];
  },
});

// ---------------------------------------------------------------------
// Font Size mark
// ---------------------------------------------------------------------
const FontSizeMark = Mark.create({
  name: "fontSize",

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
        renderHTML: (attrs: { size?: string | null }) =>
          attrs.size ? { style: `font-size: ${attrs.size}` } : {},
      },
    };
  },

  parseHTML() {
    return [{ style: "font-size" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});

// ---------------------------------------------------------------------
// Underline mark
// ---------------------------------------------------------------------
const UnderlineMark = Mark.create({
  name: "underline",

  parseHTML() {
    return [{ tag: "u" }, { style: "text-decoration" }];
  },

  renderHTML({ HTMLAttributes }) {
    const style = (HTMLAttributes as any)?.style || "";
    const nextStyle = style.includes("text-decoration")
      ? style
      : [style, "text-decoration: underline;"].filter(Boolean).join(" ");
    return ["span", { ...HTMLAttributes, style: nextStyle }, 0];
  },

  addCommands() {
    return {
      toggleUnderline:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    } as any;
  },
});

// ---------------------------------------------------------------------
// Better list behavior
// ---------------------------------------------------------------------
const BetterListEnter = Extension.create({
  name: "betterListEnter",

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;
        const parent = $from.parent;

        const inList = editor.isActive("bulletList") || editor.isActive("orderedList");
        const isEmptyParagraph =
          parent.type.name === "paragraph" && parent.textContent.trim().length === 0;

        if (inList && isEmptyParagraph) return editor.commands.liftListItem("listItem");
        return false;
      },
    };
  },
});

const ConfluenceClickBehavior = Extension.create({
  name: "confluenceClickBehavior",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClick(view, pos, event) {
            const { state } = view;
            const $pos = state.doc.resolve(pos);
            const node = $pos.parent;

            if (node.type.name === "paragraph" && node.attrs?.instructional) {
              const start = $pos.start();
              const tr = state.tr.setSelection(
                state.selection.constructor.near(state.doc.resolve(start))
              );
              view.dispatch(tr);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

// ---------------------------------------------------------------------
// Signature Block
// ---------------------------------------------------------------------
// --- Signatures Block React NodeView ---

function SignaturesBlockView({ node, deleteNode, updateAttributes }: {
  node: any;
  deleteNode: () => void;
  updateAttributes: (attrs: Record<string, any>) => void;
}) {
  const a = node.attrs;

  return (
    <NodeViewWrapper
      data-signatures-block="true"
      className="signatures-block not-prose my-8 relative group/sigblock"
      contentEditable={false}
    >
      {/* Floating delete button */}
      <button
        onMouseDown={(e) => { e.preventDefault(); deleteNode(); }}
        className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full text-[11px] font-bold flex items-center justify-center shadow-md opacity-0 group-hover/sigblock:opacity-100 transition-opacity"
        title="Remove acceptance block"
      >
        &times;
      </button>

      <div className="grid grid-cols-2 gap-8">

        {/* CLIENT (fully editable inline) */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {a.leftTitle ?? "CLIENT"}
          </p>

          {/* Client signature */}
          <div className="border-b border-slate-300 pb-1 min-h-[56px] flex items-end gap-2 group/clsig">
            {a.clientSignatureUrl ? (
              <div className="relative group/csig flex-1">
                <img src={a.clientSignatureUrl} alt="Client signature" className="h-10 object-contain max-w-full" />
                <button
                  onMouseDown={(e) => { e.preventDefault(); updateAttributes({ clientSignatureUrl: null }); }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 group-hover/csig:opacity-100 transition"
                  title="Remove"
                >
                  &times;
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-slate-300 italic flex-1">Signature</span>
            )}
            <label
              className="shrink-0 text-[10px] text-indigo-400 hover:text-indigo-600 cursor-pointer opacity-0 group-hover/clsig:opacity-100 transition whitespace-nowrap"
              title="Upload client signature"
            >
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  updateAttributes({ clientSignatureUrl: URL.createObjectURL(f) });
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {/* Client name */}
          <input
            className="text-sm font-medium text-slate-700 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none w-full placeholder:text-slate-300 placeholder:italic placeholder:font-normal transition"
            value={a.clientName ?? ""}
            placeholder="Name"
            onChange={(e) => updateAttributes({ clientName: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()}
          />

          {/* Client title */}
          <input
            className="text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none w-full placeholder:text-slate-300 placeholder:italic transition"
            value={a.clientTitle ?? ""}
            placeholder="Title / Designation"
            onChange={(e) => updateAttributes({ clientTitle: e.target.value })}
            onMouseDown={(e) => e.stopPropagation()}
          />

          {/* Client date */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Date:</span>
            <input
              type="date"
              className="text-xs text-slate-500 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 outline-none placeholder:text-slate-300 transition"
              value={a.clientDate ?? ""}
              onChange={(e) => updateAttributes({ clientDate: e.target.value })}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* SERVICE PROVIDER (read-only, auto-filled from sidebar) */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {a.rightTitle ?? "SERVICE PROVIDER"}
          </p>

          {/* Provider signature */}
          <div className="border-b border-slate-300 pb-1 min-h-[56px] flex items-end">
            {a.providerSignatureUrl ? (
              <img src={a.providerSignatureUrl} alt="Provider signature" className="h-10 object-contain max-w-full" />
            ) : (
              <span className="text-[11px] text-slate-300 italic">Signature</span>
            )}
          </div>

          {/* Provider name */}
          <p className="text-sm font-medium text-slate-700 min-h-[1.4em]">
            {a.providerName || <span className="text-slate-300 italic font-normal text-xs">Name</span>}
          </p>

          {/* Provider title */}
          <p className="text-xs text-slate-500 min-h-[1.4em]">
            {a.providerTitle || <span className="text-slate-300 italic">Title / Designation</span>}
          </p>

          {/* Provider date */}
          <p className="text-xs text-slate-400">
            Date:{" "}
            {a.providerDate || <span className="text-slate-300">________________</span>}
          </p>
        </div>
      </div>
    </NodeViewWrapper>
  );
}


const SignaturesBlock = Node.create({
  name: "signaturesBlock",
  group: "block",
  atom: true,
  content: "",
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      leftTitle:            { default: "CLIENT" },
      rightTitle:           { default: "SERVICE PROVIDER" },
      clientName:           { default: "" },
      clientTitle:          { default: "" },
      clientSignatureUrl:   { default: null },
      clientDate:           { default: "" },
      providerName:         { default: "" },
      providerTitle:        { default: "" },
      providerSignatureUrl: { default: null },
      providerDate:         { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-signatures-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        "data-signatures-block":       "true",
        class:                         "signatures-block",
        "data-left-title":             HTMLAttributes.leftTitle            ?? "CLIENT",
        "data-right-title":            HTMLAttributes.rightTitle           ?? "SERVICE PROVIDER",
        "data-provider-name":          HTMLAttributes.providerName         ?? "",
        "data-provider-title":         HTMLAttributes.providerTitle        ?? "",
        "data-provider-signature-url": HTMLAttributes.providerSignatureUrl ?? "",
        "data-client-name":            HTMLAttributes.clientName           ?? "",
        "data-client-title":           HTMLAttributes.clientTitle          ?? "",
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SignaturesBlockView);
  },
});

// --------------------------------------------------
// Guided Paragraph
// --------------------------------------------------
// ---------------------------------------------------------------------
// Section-aware Ghost Placeholder (guardrail text for empty sections)
// Shows faint instructional text when the paragraph directly under a
// heading is empty. Disappears the moment the user types.
// ---------------------------------------------------------------------

// Map of heading keywords → structured skeleton lines (shown when section is completely empty)
// Each entry has 3 lines that guide the user through what belongs in that section.
const SECTION_GHOST_SKELETONS: Array<{
  keywords: string[];
  lines: [string, string, string];
}> = [
  {
    keywords: ["background", "context"],
    lines: [
      "The Client is currently facing challenges with [mention current pain point]…",
      "To address this, the project seeks to [primary business goal]…",
      "This initiative is critical for [expected long-term impact].",
    ],
  },
  {
    keywords: ["scope", "summary", "overview"],
    lines: [
      "The Service Provider shall deliver [describe core service or product]…",
      "This engagement covers [list key areas: design, development, testing]…",
      "All work shall adhere to the agreed timelines and quality standards.",
    ],
  },
  {
    keywords: ["objective", "goal", "requirement"],
    lines: [
      "The primary objective is to [Goal], to be achieved by [Target Date]…",
      "Success will be measured by [KPI or metric], targeting [specific threshold]…",
      "These objectives align with the Client's broader strategy of [strategic goal].",
    ],
  },
  {
    keywords: ["payment", "fee", "pricing", "compensation"],
    lines: [
      "The Client agrees to pay a total fee of [Amount], structured as [milestone/retainer]…",
      "Invoices are due within [N] days of issuance; late payments incur [N]% per month…",
      "All fees are exclusive of applicable taxes unless otherwise stated.",
    ],
  },
  {
    keywords: ["termination", "cancellation"],
    lines: [
      "Either party may terminate this agreement with [N] days' written notice…",
      "Upon termination, the Client shall pay for all work completed to date…",
      "Termination for cause requires written notice and a [N]-day cure period.",
    ],
  },
  {
    keywords: ["deliverable", "milestone"],
    lines: [
      "The Service Provider shall deliver [Deliverable Name] by [Date]…",
      "Each milestone requires written sign-off from the Client within [N] business days…",
      "Delays caused by the Client will extend the delivery schedule proportionally.",
    ],
  },
  {
    keywords: ["intellectual", "ip", "ownership"],
    lines: [
      "All work product created under this agreement shall be owned by [Party] upon full payment…",
      "The Service Provider retains ownership of all pre-existing tools and frameworks…",
      "A non-exclusive licence is granted for [specific purpose] in [Territory].",
    ],
  },
  {
    keywords: ["confidential", "nda", "non-disclosure"],
    lines: [
      "Both parties agree to keep all shared information strictly confidential…",
      "Confidential information may not be disclosed to third parties without written consent…",
      "This obligation survives termination of the agreement for a period of [N] years.",
    ],
  },
  {
    keywords: ["liability", "indemnif", "limitation"],
    lines: [
      "Neither party shall be liable for indirect, consequential or punitive damages…",
      "The total liability of either party is limited to the fees paid in the preceding [N] months…",
      "Each party shall indemnify the other against third-party claims arising from its own acts.",
    ],
  },
  {
    keywords: ["dispute", "governing", "jurisdiction"],
    lines: [
      "This agreement is governed by the laws of [Jurisdiction]…",
      "Any disputes shall first be escalated to senior management for good-faith resolution…",
      "Unresolved disputes shall be referred to [Arbitration body / Courts] in [Location].",
    ],
  },
  {
    keywords: ["amendment", "modification", "change"],
    lines: [
      "Any changes to this agreement must be made in writing and signed by both parties…",
      "Verbal agreements or email approvals shall not constitute a valid amendment…",
      "A change request form must be submitted at least [N] business days in advance.",
    ],
  },
];

function getGhostSkeletonForHeading(headingText: string): [string, string, string] | null {
  const lower = headingText.toLowerCase();
  for (const { keywords, lines } of SECTION_GHOST_SKELETONS) {
    if (keywords.some((k) => lower.includes(k))) return lines;
  }
  // Generic fallback
  const clean = headingText.replace(/^\d+\.\s*/, "").trim();
  return [
    `Describe the purpose and scope of the ${clean} section…`,
    `Include all relevant parties, obligations, and key terms…`,
    `Specify any timelines, conditions, or exceptions that apply.`,
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline AI Suggestion ("Tab to complete") system
// The suggestion text appears as a faint widget decoration after the cursor.
// Tab accepts it, Escape or any non-Tab keystroke dismisses it.
// ─────────────────────────────────────────────────────────────────────────────

const inlineSuggestionKey = new PluginKey<{ text: string; pos: number } | null>(
  "inlineSuggestion"
);

/** Creates the ProseMirror plugin that renders the ghost completion widget. */
function createInlineSuggestionPlugin() {
  return new Plugin<{ text: string; pos: number } | null>({
    key: inlineSuggestionKey,

    state: {
      init: () => null,
      apply(tr, prev) {
        // Allow external code to set/clear via meta
        const meta = tr.getMeta(inlineSuggestionKey);
        if (meta !== undefined) return meta;
        // Clear on any doc change (user typed, deleted, etc.)
        if (tr.docChanged) return null;
        return prev;
      },
    },

    props: {
      decorations(state) {
        const suggestion = inlineSuggestionKey.getState(state);
        if (!suggestion || !suggestion.text) return DecorationSet.empty;

        // Build a widget that renders the faint completion text after the cursor
        const widget = Decoration.widget(
          suggestion.pos,
          () => {
            const span = document.createElement("span");
            span.className = "inline-ai-suggestion";
            span.textContent = suggestion.text;
            span.setAttribute("aria-hidden", "true");
            return span;
          },
          { side: 1, key: "inline-suggestion" }
        );

        return DecorationSet.create(state.doc, [widget]);
      },

      handleKeyDown(view, event) {
        const suggestion = inlineSuggestionKey.getState(view.state);
        if (!suggestion) return false;

        // Tab → accept the suggestion
        if (event.key === "Tab") {
          event.preventDefault();
          const { tr } = view.state;
          tr.insertText(suggestion.text, suggestion.pos);
          tr.setMeta(inlineSuggestionKey, null);
          view.dispatch(tr);
          return true;
        }

        // Escape → dismiss
        if (event.key === "Escape") {
          event.preventDefault();
          const { tr } = view.state;
          tr.setMeta(inlineSuggestionKey, null);
          view.dispatch(tr);
          return true;
        }

        // Any other key → dismiss the suggestion (it may be stale after user types)
        // We let the keystroke through, the docChanged in apply() will clear state
        return false;
      },
    },
  });
}

import { Decoration, DecorationSet } from "prosemirror-view";

// ─────────────────────────────────────────────────────────────────────────────
// SectionGhostPlaceholder — Pure Decoration Plugin (v3)
//
// APPROACH: On every ProseMirror state update (including initial render),
// scan the doc for heading → consecutive empty paragraphs. For each empty
// paragraph in that position, inject a widget decoration that renders the
// ghost hint text directly into the DOM — no `appendTransaction`, no class
// toggling, no dependency on TipTap's `is-empty` class.
//
// Each paragraph independently shows/hides its own hint based purely on
// whether IT is empty. Typing into paragraph 1 removes only hint 1.
// Hints 2 and 3 remain visible until their own paragraphs have content.
//
// This approach works on initial load, on content set via setContent(),
// and on every edit — no manual trigger required.
// ─────────────────────────────────────────────────────────────────────────────

const ghostPlaceholderKey = new PluginKey("sectionGhostPlaceholder");

function buildGhostDecorations(doc: any): DecorationSet {
  const decorations: Decoration[] = [];

  doc.forEach((node: any, offset: number) => {
    if (node.type.name !== "heading") return;
    const headingText = node.textContent.trim();
    if (!headingText) return;

    const lines = getGhostSkeletonForHeading(headingText);
    if (!lines) return;

    // Look at up to 3 consecutive paragraphs immediately after the heading
    let pos = offset + node.nodeSize;
    let slotIndex = 0;

    while (slotIndex < 3) {
      const child = doc.nodeAt(pos);
      if (!child || child.type.name !== "paragraph") break;

      // Consider paragraph empty if it has no meaningful text content.
      // TipTap may keep a single zero-width br node internally (content.size === 1)
      // so we check textContent rather than content.size alone.
      const isEmpty = child.textContent.trim().length === 0;
      if (isEmpty) {
        const hintText = lines[slotIndex];
        const opacity = slotIndex === 0 ? 0.80 : slotIndex === 1 ? 0.58 : 0.38;
        const nodePos = pos; // capture for closure

        const widget = Decoration.widget(
          nodePos + 1, // inside the paragraph, at position 1
          () => {
            const span = document.createElement("span");
            span.className = "ghost-hint-text";
            span.setAttribute("data-ghost-slot", String(slotIndex + 1));
            span.textContent = hintText;
            span.style.cssText = [
              "float: left",
              "height: 0",
              "pointer-events: none",
              "user-select: none",
              "font-style: italic",
              "font-weight: 400",
              "letter-spacing: 0.01em",
              `color: #94a3b8`,
              `opacity: ${opacity}`,
            ].join(";");
            return span;
          },
          {
            side: -1,
            key: `ghost-hint-${nodePos}-${slotIndex}`,
            // Mark as ignorable so it doesn't affect cursor positioning
            ignoreSelection: true,
          }
        );

        decorations.push(widget);
        slotIndex++;
        pos += child.nodeSize;
      } else {
        // Paragraph has content — skip the hint for this slot, move on
        slotIndex++;
        pos += child.nodeSize;
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

const SectionGhostPlaceholder = Extension.create({
  name: "sectionGhostPlaceholder",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: ghostPlaceholderKey,

        state: {
          init(_, { doc }) {
            return buildGhostDecorations(doc);
          },
          apply(tr, old) {
            // Rebuild on any doc change; map decorations otherwise
            if (tr.docChanged) return buildGhostDecorations(tr.doc);
            return old.map(tr.mapping, tr.doc);
          },
        },

        props: {
          decorations(state) {
            return ghostPlaceholderKey.getState(state);
          },
        },
      }),
    ];
  },
});

const GuidedParagraph = Paragraph.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      field: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-field"),
        renderHTML: (attributes: any) => {
          if (!attributes.field) return {};
          return { "data-field": attributes.field };
        },
      },

      instructional: {
        default: false,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-instructional") === "true",
        renderHTML: (attributes: any) => {
          if (!attributes.instructional) return {};
          return { "data-instructional": "true" };
        },
      },

      required: {
        default: false,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-required") === "true",
        renderHTML: (attributes: any) => {
          if (!attributes.required) return {};
          return { "data-required": "true" };
        },
      },
    };
  },
});

// --------------------------------------------------
// Instructional auto-replace
// --------------------------------------------------
const InstructionalAutoReplace = Extension.create({
  name: "instructionalAutoReplace",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleTextInput(view, from, to, text) {
            const { state } = view;
            const { tr } = state;
            const $from = state.selection.$from;
            const parent = $from.parent;

            if (parent.attrs?.instructional) {
              const start = $from.start();
              const end = start + parent.content.size;

              view.dispatch(
                tr
                  .delete(start, end)
                  .insertText(text)
                  .setNodeMarkup($from.before(), undefined, {
                    instructional: false,
                  })
              );

              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

const InstructionalMark = Mark.create({
  name: "instructional",

  renderHTML() {
    return ["span", { "data-instructional": "true" }, 0];
  },
});

const CleanParagraphOnEnter = Extension.create({
  name: "cleanParagraphOnEnter",

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (editor.isActive("bulletList") || editor.isActive("orderedList")) {
          return false;
        }

        editor
          .chain()
          .splitBlock()
          .setTextAlign("left")
          .unsetAllMarks()
          .run();

        return true;
      },
    };
  },
});

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------
export function JsonEditor({
  initialDoc,
  fileName,
  onFileNameChange,
  onDocChange,
  onExport,
  onSave,
  initialMode,
  templateSlug,
  designKey,
  brand,
  signatory,
  variables,
  placeholderSchema,
  chrome = "full",
  zoom: zoomProp,
  onZoomChange,
  onEditorReady,
  onEditHeader,
}: JsonEditorProps) {
  const safeInitialDoc = useMemo(() => normalizeDoc(initialDoc), [initialDoc]);
  const isCanvas = chrome === "canvas";

  const [localFileName, setLocalFileName] = useState(fileName);
  const [docJson, setDocJson] = useState<any>(safeInitialDoc);

  const [localZoom, setLocalZoom] = useState(1);
  const zoom = zoomProp ?? localZoom;

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<EditorViewMode>(initialMode ?? "document");

  const [selectionInfo, setSelectionInfo] = useState<{
    text: string;
    from: number;
    to: number;
    coords: { top: number; left: number } | null;
  } | null>(null);

  function showSelectionBubble(editor: any) {
    const { from, to } = editor.state.selection;

    if (from === to) {
      setSelectionInfo(null);
      return;
    }

    const text = editor.state.doc.textBetween(from, to);

    if (text.trim().length < 10) {
      setSelectionInfo(null);
      return;
    }

    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) return;

    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelectionInfo({
      text,
      from,
      to,
      coords: {
        top: rect.top - 50,
        left: rect.left + rect.width / 2,
      },
    });
  }

  const [refineLoading, setRefineLoading] = useState(false);
  const [refineSuggestion, setRefineSuggestion] = useState<string | null>(null);

  // ── "Professionalize" paragraph state ─────────────────────────────────────
  const [polishInfo, setPolishInfo] = useState<{
    from: number;
    to: number;
    text: string;
    sectionHeading: string;
    coords: { top: number; left: number };
  } | null>(null);
  const [polishLoading, setPolishLoading] = useState(false);
  const [polishDone, setPolishDone] = useState(false); // flash "Done!" briefly

  // ── Review card state (shown INSTEAD of auto-applying) ────────────────────
  const [polishSuggestion, setPolishSuggestion] = useState<{
    from: number;
    to: number;
    original: string;
    suggested: string;
    note: string;
    coords: { top: number; left: number };
  } | null>(null);

  function detectPolishParagraph(editor: any) {
    if (!editor) return;
    const { $from } = editor.state.selection;
    const parent = $from.parent;

    // Must be a plain paragraph, not instructional, with real content
    if (parent.type.name !== "paragraph") { setPolishInfo(null); return; }
    if (parent.attrs?.instructional) { setPolishInfo(null); return; }

    const text = parent.textContent.trim();
    if (text.length < 20) { setPolishInfo(null); return; }

    // Find the nearest h2 heading above this paragraph
    const nodeStartPos = $from.before();
    let sectionHeading = "";
    editor.state.doc.nodesBetween(0, nodeStartPos, (node: any) => {
      if (node.type.name === "heading" && node.attrs?.level === 2) {
        sectionHeading = node.textContent.replace(/^\d+\.\s*/, "").trim();
      }
    });

    if (!sectionHeading) { setPolishInfo(null); return; }

    // Get screen coords of the paragraph start
    try {
      const domCoords = editor.view.coordsAtPos($from.start());
      setPolishInfo({
        from: $from.start(),
        to: $from.end(),
        text,
        sectionHeading,
        coords: { top: domCoords.top, left: domCoords.left },
      });
    } catch {
      setPolishInfo(null);
    }
  }

  // ── Extract field values from doc for context ──────────────────────────────
  function extractFieldValuesFromDoc(editor: any): Record<string, string> {
    if (!editor) return {};
    const ctx: Record<string, string> = {};
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === "formyxaField" && node.attrs?.key && node.attrs?.value) {
        ctx[node.attrs.key] = String(node.attrs.value);
      }
    });
    return ctx;
  }

  async function handleProfessionalize() {
    if (!polishInfo || !editor) return;
    try {
      setPolishLoading(true);
      const fieldContext = extractFieldValuesFromDoc(editor);

      const res = await fetch("/api/professionalize-paragraph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: polishInfo.text,
          sectionHeading: polishInfo.sectionHeading,
          fieldContext,
          templateSlug,
        }),
      });

      const data = await res.json();
      if (!data.professionalText) throw new Error("Empty response");

      // ── NEW: Show Review Card instead of auto-applying ──────────────────
      // Build a human-readable note about what the AI changed
      const note = data.changeNote
        || (data.professionalText.length < polishInfo.text.length
          ? "I tightened the language and removed redundancy."
          : "I elevated the tone and added professional framing.");

      setPolishSuggestion({
        from: polishInfo.from,
        to: polishInfo.to,
        original: polishInfo.text,
        suggested: data.professionalText,
        note,
        coords: polishInfo.coords,
      });
      setPolishInfo(null); // hide the trigger button

    } catch (err) {
      console.error("[professionalize]", err);
    } finally {
      setPolishLoading(false);
    }
  }

  function applyPolishSuggestion() {
    if (!polishSuggestion || !editor) return;
    editor.chain()
      .command(({ tr }: any) => {
        tr.insertText(polishSuggestion.suggested, polishSuggestion.from, polishSuggestion.to);
        return true;
      })
      .run();
    setPolishSuggestion(null);
    setPolishDone(true);
    setTimeout(() => setPolishDone(false), 2000);
  }

  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMouseDownRef = useRef(false);

  // ── Inline AI suggestion ("Tab to complete") ────────────────────────────────
  const inlineSuggestionDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const inlineFetchAbortRef = useRef<AbortController | null>(null);
  const [inlineSuggestionActive, setInlineSuggestionActive] = useState(false);

  // Fetch an AI inline completion for the current partial sentence
  function triggerInlineSuggestion(editorInstance: any) {
    if (!editorInstance) return;

    const { state } = editorInstance;
    const { $from } = state.selection;
    const parent = $from.parent;

    // Only trigger in a normal paragraph, not instructional, under a heading
    if (parent.type.name !== "paragraph") return;
    if (parent.attrs?.instructional) return;

    const cursorOffset = $from.parentOffset;
    const fullText = parent.textContent ?? "";
    const textBeforeCursor = fullText.slice(0, cursorOffset).trim();

    // Don't trigger on very short input or very long sentences (already complete)
    if (textBeforeCursor.length < 8 || textBeforeCursor.length > 120) return;

    // Find the section heading above the cursor
    const nodeStartPos = $from.before();
    let sectionHeading = "";
    state.doc.nodesBetween(0, nodeStartPos, (node: any) => {
      if (node.type.name === "heading" && node.attrs?.level === 2) {
        sectionHeading = node.textContent.replace(/^\d+\.\s*/, "").trim();
      }
    });
    if (!sectionHeading) return;

    // Cancel any in-flight fetch
    if (inlineFetchAbortRef.current) {
      inlineFetchAbortRef.current.abort();
    }
    const abort = new AbortController();
    inlineFetchAbortRef.current = abort;

    const cursorPos = $from.pos;

    setInlineSuggestionActive(true);

    fetch("/api/inline-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abort.signal,
      body: JSON.stringify({
        partialText: textBeforeCursor,
        sectionHeading,
        templateSlug,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (abort.signal.aborted) return;
        const completion = data?.completion?.trim();
        if (!completion) return;

        // Only insert if cursor hasn't moved to a different paragraph
        const currentState = editorInstance.state;
        const currentPos = currentState.selection.$from.pos;
        if (currentPos !== cursorPos) return;

        // Dispatch the suggestion into ProseMirror plugin state
        const { tr } = currentState;
        tr.setMeta(inlineSuggestionKey, { text: completion, pos: cursorPos });
        editorInstance.view.dispatch(tr);
      })
      .catch(() => {/* aborted or failed — silently ignore */})
      .finally(() => {
        setInlineSuggestionActive(false);
      });
  }

  const effectiveDesignKey = designKey ?? "offer_minimal_plain";

  const layout = useMemo(
    () => getLayoutForTemplateSlug(templateSlug, effectiveDesignKey),
    [templateSlug, effectiveDesignKey]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bold: false,
        paragraph: false,
      }),
      GuidedParagraph,
      InstructionalAutoReplace,
      CleanParagraphOnEnter,
      SectionGhostPlaceholder,

      Bold,
      BetterListEnter,
      ConfluenceClickBehavior,
      TextAlign.configure({
        types: ["heading", "paragraph", "tableCell"],
      }),
      TextStyle,
      FontFamily,
      Color,
      Highlight,
      LineHeight,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,

      ResizableImage.configure({
        inline: false,
        allowBase64: false,
      }),

      FormyxaField,
      FontSizeMark,
      UnderlineMark,
      PageBreak,
      SignaturesBlock,
      // Inline AI suggestion ("Tab to complete") plugin
      Extension.create({
        name: "inlineSuggestionPlugin",
        addProseMirrorPlugins() {
          return [createInlineSuggestionPlugin()];
        },
      }),
    ],

    content: initialDoc || {
      type: "doc",
      content: [{ type: "paragraph" }],
    },

    editable: true,

    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      setDocJson(json);
      onDocChange(json);

      // ── Debounced inline AI suggestion ──────────────────────────────────
      if (inlineSuggestionDebounceRef.current) {
        clearTimeout(inlineSuggestionDebounceRef.current);
      }
      inlineSuggestionDebounceRef.current = setTimeout(() => {
        triggerInlineSuggestion(editor);
      }, 1100); // 1.1s after user stops typing
    },

    onSelectionUpdate: ({ editor }) => {
      if (isMouseDownRef.current) return;
      detectPolishParagraph(editor);
    },
  });

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!editor) return;
    if (!safeInitialDoc) return;
    if (hasInitializedRef.current) return;

    try {
      editor.commands.setContent(safeInitialDoc, false);
      setDocJson(safeInitialDoc);
      hasInitializedRef.current = true;
    } catch (err) {
      console.error("Failed to init editor content", err);
    }
  }, [editor]);

  useEffect(() => {
    if (editor) onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    const handleScroll = () => setSelectionInfo(null);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  useEffect(() => {
    const handleMouseDown = () => {
      isMouseDownRef.current = true;
      setPolishInfo(null); // hide polish button while selecting
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      if (editor) {
        const { from, to } = editor.state.selection;
        if (from !== to) showSelectionBubble(editor);
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editor]);

  // Sync Signatory sidebar values -> signaturesBlock node attrs (live preview)
  useEffect(() => {
    if (!editor) return;

    const providerName         = signatory?.fullName          ?? "";
    const providerTitle        = signatory?.designation        ?? "";
    // sidebar stores it as signatureUrl; type declares signatureImageUrl
    const providerSignatureUrl = (signatory as any)?.signatureUrl ?? signatory?.signatureImageUrl ?? null;

    // Auto-insert block if signatory has data and block doesn't exist yet
    if (providerName || providerSignatureUrl) {
      const json = editor.getJSON();
      const hasSignatureBlock = (json.content ?? []).some((n: any) => n.type === "signaturesBlock");
      if (!hasSignatureBlock) {
        editor.commands.insertContent({
          type: "signaturesBlock",
          attrs: { leftTitle: "CLIENT", rightTitle: "SERVICE PROVIDER" },
        });
      }
    }

    // Push signatory values into every signaturesBlock node in the doc
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === "signaturesBlock") {
        const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          providerName,
          providerTitle,
          providerSignatureUrl,
        });
        editor.view.dispatch(tr);
      }
    });
  }, [editor, signatory]);

  useEffect(() => setLocalFileName(fileName), [fileName]);

  const toolbarDisabled = !editor || saving || exporting;

  const resetTemplate = () => {
    if (!editor) return;
    editor.commands.setContent(safeInitialDoc);
    setDocJson(safeInitialDoc);
    onDocChange(safeInitialDoc);
  };

  const handleExportClick = async () => {
    if (!docJson) return;
    try {
      setExporting(true);
      await onExport(docJson, localFileName || fileName);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveClick = async () => {
    if (!onSave || !docJson) return;
    try {
      setSaving(true);
      await onSave(docJson, localFileName || fileName);
    } finally {
      setSaving(false);
    }
  };

  const handleZoomChange = (value: number) => {
    if (zoomProp != null) onZoomChange?.(value);
    else setLocalZoom(value);
  };

  const handleFileNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalFileName(next);
    onFileNameChange(next);
  };

  async function handleRefine(mode: "improve" | "formal" | "simplify" | "tighten") {
    if (!selectionInfo || !editor) return;

    try {
      setRefineLoading(true);
      setRefineSuggestion(null);

      const res = await fetch("/api/refine-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectionInfo.text, mode }),
      });

      const data = await res.json();
      setRefineSuggestion(data.refinedText);
    } catch (err) {
      console.error(err);
    } finally {
      setRefineLoading(false);
    }
  }

  function applyRefinement() {
    if (!selectionInfo || !refineSuggestion || !editor) return;

    editor
      .chain()
      .focus()
      .deleteRange({ from: selectionInfo.from, to: selectionInfo.to })
      .insertContent(refineSuggestion)
      .run();

    setSelectionInfo(null);
    setRefineSuggestion(null);
  }

  const effectiveMode: EditorViewMode = isCanvas ? "document" : viewMode;

  // -------------------- CANVAS (Figma-style) --------------------
  if (isCanvas) {
    return (
      <div className="flex-1 overflow-visible px-4 py-8 bg-slate-50 dark:bg-slate-900">
        <div id="formyxa-doc-top" />

        <div className="max-w-[780px] mx-auto">
          {layout.shellVariant === "page" ? (
            editor ? (
              <div className="document-root">
                <DocumentPageShell
                  editor={editor}
                  layout={layout}
                  brand={brand}
                  signatory={signatory}
                  title={fileName}
                  zoom={zoom}
                  onEditHeader={onEditHeader}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg px-14 py-12 min-h-[11in] flex items-center justify-center">
                <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
              </div>
            )
          ) : (
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-16 min-h-[11in]"
                style={{ zoom }}
              >
                {editor && (
                  <EditorContent
                    editor={editor}
                    className="tiptap"
                    editorProps={{
                      attributes: {
                        class: "formyxa-doc-paper outline-none",
                      },
                    }}
                  />
                )}
              </div>
          )}
        </div>

        {/* ── Inline Refine Bubble ── */}
        {selectionInfo && (
          <div
            style={{
              position: "fixed",
              top: selectionInfo.coords?.top,
              left: selectionInfo.coords?.left,
              transform: "translateX(-50%)",
              zIndex: 9999,
            }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl px-3 py-2 flex gap-2 text-xs text-slate-700 dark:text-slate-300"
          >
            {!refineSuggestion ? (
              <>
                <button
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  onClick={() => handleRefine("improve")}
                >
                  Improve
                </button>
                <button
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  onClick={() => handleRefine("formal")}
                >
                  Formal
                </button>
                <button
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  onClick={() => handleRefine("simplify")}
                >
                  Simplify
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={applyRefinement}
                  className="text-indigo-600 dark:text-indigo-400 font-medium"
                >
                  Replace
                </button>
                <button
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => setRefineSuggestion(null)}
                >
                  Cancel
                </button>
              </>
            )}
            {refineLoading && (
              <span className="text-slate-400 dark:text-slate-500">Thinking…</span>
            )}
          </div>
        )}

        {/* ── ✨ Professionalize Paragraph Button ── */}
        {polishInfo && !polishLoading && (
          <div
            style={{
              position: "fixed",
              top: polishInfo.coords.top - 4,
              left: polishInfo.coords.left - 8,
              transform: "translateY(-100%)",
              zIndex: 9998,
              pointerEvents: "auto",
            }}
          >
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleProfessionalize();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 10px",
                background: "linear-gradient(135deg, #4f6de8, #7c3aed)",
                color: "#fff",
                border: "none",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(79,109,232,0.35)",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
                opacity: 0.92,
                transition: "opacity 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = "0.92";
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              ✨ Make Professional
            </button>
          </div>
        )}

        {/* ── ✨ Polish Review Card — shown BEFORE applying ── */}
        {polishSuggestion && (
          <div
            style={{
              position: "fixed",
              top: Math.min(polishSuggestion.coords.top - 8, window.innerHeight - 280),
              left: Math.max(polishSuggestion.coords.left, 16),
              zIndex: 9999,
              width: 380,
              maxWidth: "calc(100vw - 32px)",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                boxShadow: "0 8px 40px rgba(15,23,42,0.14)",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13 }}>✨</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", letterSpacing: "0.01em" }}>Review Suggestion</span>
                </div>
                <button
                  onMouseDown={(e) => { e.preventDefault(); setPolishSuggestion(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 14, lineHeight: 1, padding: 2 }}
                >
                  ✕
                </button>
              </div>

              {/* Note */}
              <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  💡 {polishSuggestion.note}
                </p>
              </div>

              {/* Before / After */}
              <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>Your Original</p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.55, fontStyle: "italic", maxHeight: 72, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {polishSuggestion.original}
                  </p>
                </div>
                <div style={{ height: 1, background: "#f1f5f9" }} />
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px 0" }}>AI Polished</p>
                  <p style={{ fontSize: 12, color: "#1e293b", margin: 0, lineHeight: 1.55, fontWeight: 500, maxHeight: 88, overflow: "hidden" }}>
                    {polishSuggestion.suggested}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "10px 14px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8 }}>
                <button
                  onMouseDown={(e) => { e.preventDefault(); applyPolishSuggestion(); }}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    background: "linear-gradient(135deg,#4f6de8,#7c3aed)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: "0.01em",
                  }}
                >
                  ✓ Insert Suggestion
                </button>
                <button
                  onMouseDown={(e) => { e.preventDefault(); setPolishSuggestion(null); }}
                  style={{
                    padding: "7px 14px",
                    background: "#f8fafc",
                    color: "#64748b",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Keep Mine
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Polish Loading Indicator ── */}
        {polishLoading && (
          <div
            style={{
              position: "fixed",
              bottom: 32,
              right: 24,
              zIndex: 9999,
              background: "linear-gradient(135deg, #4f6de8, #7c3aed)",
              color: "#fff",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 600,
              boxShadow: "0 4px 16px rgba(79,109,232,0.35)",
              display: "flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>✦</span>
            Professionalising…
          </div>
        )}

        {/* ── Polish Done Flash ── */}
        {polishDone && (
          <div
            style={{
              position: "fixed",
              bottom: 32,
              right: 24,
              zIndex: 9999,
              background: "#22c55e",
              color: "#fff",
              borderRadius: "20px",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: 600,
              boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
            }}
          >
            ✅ Paragraph updated
          </div>
        )}

        {/* ── Inline AI suggestion Tab hint ── */}
        {inlineSuggestionActive && (
          <div
            style={{
              position: "fixed",
              bottom: 32,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              background: "rgba(15,23,42,0.82)",
              color: "#cbd5e1",
              borderRadius: "10px",
              padding: "5px 12px",
              fontSize: "11px",
              fontWeight: 500,
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
              pointerEvents: "none",
            }}
          >
            <span style={{ opacity: 0.6, fontSize: "10px" }}>✦ AI thinking…</span>
          </div>
        )}
      </div>
    );
  }

  // -------------------- FULL (standalone) --------------------
  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-3">
          <input
            className="border-0 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 px-0 py-1 focus:outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={localFileName}
            onChange={handleFileNameInputChange}
          />

          <button
            type="button"
            onClick={resetTemplate}
            disabled={toolbarDisabled}
            className="px-2.5 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode("document")}
              className={`px-3 py-0.5 rounded-full font-medium transition ${
                viewMode === "document"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Document
            </button>

            <button
              type="button"
              onClick={() => setViewMode("blog")}
              className={`px-3 py-0.5 rounded-full font-medium transition ${
                viewMode === "blog"
                  ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Blog
            </button>
          </div>

          {onSave && (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={toolbarDisabled}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-indigo-500 dark:border-indigo-400 text-[13px] font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}

          <button
            type="button"
            onClick={handleExportClick}
            disabled={!editor || exporting}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-medium shadow-sm hover:bg-indigo-200 dark:hover:bg-indigo-900/60 disabled:opacity-50 transition-colors"
          >
            {exporting ? "Exporting…" : "Export DOCX"}
          </button>
        </div>
      </header>

      {effectiveMode === "document" ? (
        <main className="flex-1 flex justify-center items-start py-10 px-3 bg-background">
          <div className="bg-muted rounded-xl p-4">
            {layout.shellVariant === "page" ? (
              editor ? (
                <DocumentPageShell
                  editor={editor}
                  layout={layout}
                  brand={brand}
                  signatory={signatory}
                  title={fileName}
                  zoom={zoom}
                  variables={variables}
                  onEditHeader={onEditHeader}
                />
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-md mx-auto w-[794px] min-h-[1123px] flex items-center justify-center">
                  <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
                </div>
              )
            ) : (
              <div
                className="bg-white dark:bg-slate-800 rounded-md mx-auto w-[794px] min-h-[1123px] px-16 py-12 flex flex-col"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
              >
                {editor ? (
                  <EditorContent editor={editor} className="tiptap" />
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
                )}
              </div>
            )}
          </div>
        </main>
      ) : (
        <main className="flex-1 flex overflow-hidden bg-slate-50 dark:bg-slate-900">
          <div className="flex-1 py-6 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-8 py-8">
                {editor ? (
                  <EditorContent editor={editor} className="tiptap" />
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}