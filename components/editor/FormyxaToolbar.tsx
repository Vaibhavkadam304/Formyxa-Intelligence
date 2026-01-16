"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FileDown,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  MoreVertical,
  Redo2,
  Save,
  Scissors,
  Table2,
  Underline,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Rows3 } from "lucide-react";
import { ArrowUpDown, AlignJustify } from "lucide-react";

type TipTapEditor = any;

export type FormyxaToolbarProps = {
  documentName: string;
  onDocumentNameChange: (name: string) => void;

  /** Tiptap editor instance for formatting actions (proposal uses active section editor) */
  editor: TipTapEditor | null;

  saving?: boolean;
  statusText?: string | null;
  onSave?: () => void;
  onExport?: () => void;

  /** 1 = 100% */
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
};

function useClickOutside(
  refs: Array<RefObject<HTMLElement>>,
  onOutside: () => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      for (const r of refs) {
        if (r.current && r.current.contains(target)) return;
      }
      onOutside();
    };

    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [enabled, onOutside, refs]);
}

export function FormyxaToolbar({
  documentName,
  onDocumentNameChange,
  editor,
  saving,
  statusText,
  onSave,
  onExport,
  zoom = 1,
  onZoomChange,
}: FormyxaToolbarProps) {
  const disabled = !editor;
  const tinyIconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors";
  const [textStyle, setTextStyle] = useState("normal");
  const [fontFamily, setFontFamily] = useState("inter");
  const [fontSize, setFontSize] = useState("11");

  const [insertOpen, setInsertOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const insertRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [lineSpacingOpen, setLineSpacingOpen] = useState(false);

  useClickOutside([insertRef], () => setInsertOpen(false), insertOpen);
  useClickOutside([moreRef], () => setMoreOpen(false), moreOpen);
  const [lineSpacing, setLineSpacing] = useState<string>("default");

  const zoomValue = useMemo(() => String(Math.round((zoom || 1) * 100)), [zoom]);
  
  const safeRun = (fn: (chain: any) => any) => {
    if (!editor) return;
    try {
      const chain = editor.chain().focus();
      fn(chain).run();
    } catch {
      // Some commands depend on extensions (esp. in proposal sections). Ignore.
    }
  };
  useEffect(() => {
    if (!editor) return;

    const syncLineSpacingFromSelection = () => {
      const { from, to } = editor.state.selection;

      const values = new Set<string>();

      editor.state.doc.nodesBetween(from, to, (node) => {
        const t = node.type.name;
        if (t !== "paragraph" && t !== "heading") return;

        const v = node.attrs?.lineHeight ? String(node.attrs.lineHeight) : "default";
        values.add(v);
      });

      // If selection is inside one paragraph, nodesBetween still works,
      // but fallback just in case:
      if (values.size === 0) {
        const attrs = editor.getAttributes("paragraph");
        setLineSpacing(attrs?.lineHeight ? String(attrs.lineHeight) : "default");
        return;
      }

      if (values.size === 1) {
        setLineSpacing(Array.from(values)[0]);
      } else {
        setLineSpacing("mixed");
      }
    };

    syncLineSpacingFromSelection();
    editor.on("selectionUpdate", syncLineSpacingFromSelection);
    editor.on("transaction", syncLineSpacingFromSelection);

    return () => {
      editor.off("selectionUpdate", syncLineSpacingFromSelection);
      editor.off("transaction", syncLineSpacingFromSelection);
    };
  }, [editor]);


  const isActive = (name: string, attrs?: any) => {
    if (!editor) return false;
    try {
      return editor.isActive(name, attrs);
    } catch {
      return false;
    }
  };
  const applyLineSpacing = (next: string) => {
    setLineSpacing(next);
    if (!editor) return;

    if (next === "default") safeRun((c) => c.unsetLineHeight());
    else safeRun((c) => c.setLineHeight(next));
  };

  const isAlignActive = (align: "left" | "center" | "right" | "justify") => {
    if (!editor) return false;
    try {
      return editor.isActive({ textAlign: align });
    } catch {
      return false;
    }
  };

  const toolBtn = (active: boolean) =>
    [
      "p-2 rounded-md transition-colors",
      active
      ? "bg-primary/10 text-primary"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
      disabled ? "opacity-40 pointer-events-none" : "",
    ].join(" ");

  const tinySelect =
    "h-8 rounded-md text-xs bg-transparent hover:bg-slate-100 border border-transparent focus:border-slate-200 outline-none px-2";

  const applyTextStyle = (next: string) => {
    setTextStyle(next);
    if (!editor) return;

    if (next === "normal") safeRun((c) => c.setParagraph());
    if (next === "heading1") safeRun((c) => c.toggleHeading({ level: 1 }));
    if (next === "heading2") safeRun((c) => c.toggleHeading({ level: 2 }));
    if (next === "heading3") safeRun((c) => c.toggleHeading({ level: 3 }));
  };

  const applyFontSize = (next: string) => {
    setFontSize(next);
    if (!editor) return;
    // JsonEditor supports a fontSize mark; proposal sections may not.
    safeRun((c) => c.setMark("fontSize", { size: `${next}pt` }));
  };

  const applyZoom = (pctString: string) => {
    const pct = Number(pctString);
    if (!Number.isFinite(pct)) return;
    const next = Math.max(0.25, Math.min(2, pct / 100));
    onZoomChange?.(next);
  };

  const insertTable = () => {
    if (!editor) return;
    const raw = window.prompt("Table size? (example: 3x4)", "3x3");
    if (!raw) return;
    const m = raw.trim().match(/^(\d+)\s*x\s*(\d+)$/i);
    if (!m) return;
    const rows = Math.max(1, Math.min(20, Number(m[1])));
    const cols = Math.max(1, Math.min(12, Number(m[2])));
    safeRun((c) => c.insertTable({ rows, cols, withHeaderRow: true }));
  };

  const insertPageBreak = () => {
    safeRun((c) => c.insertContent({ type: "pageBreak" }));
  };

  return (
    <div className="sticky top-0 z-50 bg-slate-50/95 backdrop-blur border-b border-slate-200">
      {/* Row 1 */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/90">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="tracking-tight">Formyxa</span>
            </Link>
          </div>
          <div className="h-5 w-px bg-slate-200" />
          <input
            value={documentName}
            onChange={(e) => onDocumentNameChange(e.target.value)}
            className="text-slate-700 font-medium outline-none border-none bg-transparent hover:bg-slate-50 px-2 py-1 rounded-md transition-colors"
            placeholder="Untitled Document"
          />
        </div>

        <div className="flex items-center gap-3">
          {statusText ? (
            <span className="hidden sm:inline text-sm text-slate-500">{statusText}</span>
          ) : null}

          {/* <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button> */}

          <button
            type="button"
            disabled={saving}
            onClick={onExport}
            className="
              inline-flex items-center gap-2
              px-4 py-1.5
              rounded-md
              bg-indigo-600 hover:bg-indigo-700
              text-white text-sm font-medium
              shadow-[0_1px_2px_rgba(0,0,0,0.08)]
              transition-colors
              disabled:opacity-50
            "
          >
            <FileDown className="w-4 h-4 opacity-90" />
            <span className="hidden sm:inline">Export</span>
          </button>

        </div>
      </div>

      {/* Row 2 */}
      <div className="h-12 flex items-center px-4 gap-2 overflow-visible">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={["p-2 hover:bg-slate-100 rounded-md", disabled ? "opacity-40" : ""].join(" ")}
            onClick={() => safeRun((c) => c.undo())}
            title="Undo"
          >
            <Undo2 className="w-4 h-4 text-slate-600" />
          </button>
          <button
            type="button"
            className={["p-2 hover:bg-slate-100 rounded-md", disabled ? "opacity-40" : ""].join(" ")}
            onClick={() => safeRun((c) => c.redo())}
            title="Redo"
          >
            <Redo2 className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-100" />

        <select value={zoomValue} onChange={(e) => applyZoom(e.target.value)} className={tinySelect}>
          {[50, 75, 100, 125, 150].map((v) => (
            <option key={v} value={String(v)}>
              {v}%
            </option>
          ))}
        </select>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        <div className="flex items-center gap-1.5">
          <select
            value={textStyle}
            onChange={(e) => applyTextStyle(e.target.value)}
            className={[tinySelect, "w-32"].join(" ")}
          >
            <option value="normal">Normal text</option>
            <option value="heading1">Heading 1</option>
            <option value="heading2">Heading 2</option>
            <option value="heading3">Heading 3</option>
          </select>

          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className={[tinySelect, "w-28"].join(" ")}
            title="Font family (UI only for now)"
          >
            <option value="inter">Inter</option>
            <option value="arial">Arial</option>
            <option value="times">Times</option>
            <option value="georgia">Georgia</option>
            <option value="courier">Courier</option>
          </select>

          <select value={fontSize} onChange={(e) => applyFontSize(e.target.value)} className={[tinySelect, "w-16"].join(" ")}>
            {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32].map((s) => (
              <option key={s} value={String(s)}>
                {s}
              </option>
            ))}
          </select>
          <div className="relative">
            <button
            type="button"
            className={tinyIconBtn}
            title="Line spacing"
            aria-label="Line spacing"
            onClick={() => setLineSpacingOpen((v) => !v)}
          >
            <span className="inline-flex items-center gap-1">
              <ArrowUpDown className="h-4 w-3" />
              <AlignJustify className="h-4 w-3" />
            </span>
          </button>

  {lineSpacingOpen && (
    <div className="absolute left-0 mt-2 w-40 rounded-xl border bg-white shadow-lg z-50">
      <button
        className="w-full px-3 py-2 text-left hover:bg-slate-50"
        onClick={() => { applyLineSpacing("1"); setLineSpacingOpen(false); }}
      >
        1.0
      </button>
      <button
        className="w-full px-3 py-2 text-left hover:bg-slate-50"
        onClick={() => { applyLineSpacing("1.15"); setLineSpacingOpen(false); }}
      >
        1.15
      </button>
      <button
        className="w-full px-3 py-2 text-left hover:bg-slate-50"
        onClick={() => { applyLineSpacing("1.5"); setLineSpacingOpen(false); }}
      >
        1.5
      </button>
      <button
        className="w-full px-3 py-2 text-left hover:bg-slate-50"
        onClick={() => { applyLineSpacing("2"); setLineSpacingOpen(false); }}
      >
        2.0
      </button>

      <div className="border-t" />

      <button
        className="w-full px-3 py-2 text-left hover:bg-slate-50"
        onClick={() => { applyLineSpacing("default"); setLineSpacingOpen(false); }}
      >
        Default
      </button>
    </div>
  )}
</div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        <div className="flex items-center gap-1">
          <button type="button" className={toolBtn(isActive("bold"))} onClick={() => safeRun((c) => c.toggleBold())} title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button type="button" className={toolBtn(isActive("italic"))} onClick={() => safeRun((c) => c.toggleItalic())} title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={toolBtn(isActive("underline"))}
            onClick={() => safeRun((c) => (c.toggleUnderline ? c.toggleUnderline() : c.toggleMark("underline")))}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        <div className="flex items-center gap-1">
          <button type="button" className={toolBtn(isAlignActive("left"))} onClick={() => safeRun((c) => c.setTextAlign("left"))} title="Align left">
            <AlignLeft className="w-4 h-4" />
          </button>
          <button type="button" className={toolBtn(isAlignActive("center"))} onClick={() => safeRun((c) => c.setTextAlign("center"))} title="Align center">
            <AlignCenter className="w-4 h-4" />
          </button>
          <button type="button" className={toolBtn(isAlignActive("right"))} onClick={() => safeRun((c) => c.setTextAlign("right"))} title="Align right">
            <AlignRight className="w-4 h-4" />
          </button>
          <button type="button" className={toolBtn(isAlignActive("justify"))} onClick={() => safeRun((c) => c.setTextAlign("justify"))} title="Justify">
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className={toolBtn(isActive("bulletList"))} onClick={() => safeRun((c) => c.toggleBulletList())} title="Bullets">
            <List className="w-4 h-4" />
          </button>
          <button type="button" className={toolBtn(isActive("orderedList"))} onClick={() => safeRun((c) => c.toggleOrderedList())} title="Numbered list">
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        <div className="relative" ref={insertRef}>
          <button
            type="button"
            onClick={() => setInsertOpen((v) => !v)}
            className="px-2.5 py-2 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1.5 text-slate-500 hover:text-slate-700"
            title="Insert"
          >
            <span className="text-lg leading-none">+</span>
            <span className="text-xs">Insert</span>
          </button>

          {insertOpen && (
            <div className="absolute z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-2">
              <button
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-slate-100 rounded text-sm flex items-center gap-2.5 text-slate-900"
                onClick={() => {
                  setInsertOpen(false);
                  const url = window.prompt("Image URL");
                  if (!url) return;
                  safeRun((c) => c.setImage({ src: url }));
                }}
              >
                <ImageIcon className="w-4 h-4 text-slate-600" />
                Image
              </button>

              <button
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-slate-100 rounded text-sm flex items-center gap-2.5 text-slate-900"
                onClick={() => {
                  setInsertOpen(false);
                  insertTable();
                }}
              >
                <Table2 className="w-4 h-4 text-slate-600" />
                Table
              </button>

              <div className="my-1.5 border-t border-slate-200" />

              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded text-sm flex items-center gap-2.5 text-slate-600"
                onClick={() => {
                  setInsertOpen(false);
                  insertPageBreak();
                }}
              >
                <Scissors className="w-4 h-4 text-slate-500" />
                Page break
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={moreRef}>
          <button type="button" onClick={() => setMoreOpen((v) => !v)} className="p-2 hover:bg-slate-100 rounded-md transition-colors" title="More">
            <MoreVertical className="w-4 h-4 text-slate-400" />
          </button>

          {moreOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg p-2">
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded text-sm"
                onClick={() => {
                  setMoreOpen(false);
                  window.alert("Document settings (coming soon)");
                }}
              >
                Document settings
              </button>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded text-sm"
                onClick={() => {
                  setMoreOpen(false);
                  window.alert("Page setup (coming soon)");
                }}
              >
                Page setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
