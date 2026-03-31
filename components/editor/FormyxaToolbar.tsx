"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  Bold,
  FileDown,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Undo2,
  FileText,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

type TipTapEditor = any;

export type FormyxaToolbarProps = {
  documentName: string;
  onDocumentNameChange: (name: string) => void;
  editor: TipTapEditor | null;
  saving?: boolean;
  statusText?: string | null;
  onSave?: () => void;
  onExport?: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  templateSlug: string;
  onGenerateFromAI: (description: string) => Promise<void>;
  onRunRiskReview: () => Promise<void>;
  // Intelligence panel
  onOpenIntelligence?: () => void;
  intelligenceActive?: boolean;
  intelligenceIssueCount?: number;
  contractScore?: number;
};

function useClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
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

/**
 * Enterprise-grade Toolbar Button Component
 * Standardizes size, hover states, and active states.
 */
const ToolbarButton = ({
  active,
  disabled,
  onClick,
  children,
  title,
  className = "",
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      h-8 w-8 inline-flex items-center justify-center rounded-md transition-all duration-200
      ${
        active
          ? "bg-indigo-100 text-indigo-700 shadow-inner dark:bg-indigo-900/60 dark:text-indigo-300"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
      }
      ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
      ${className}
    `}
  >
    {children}
  </button>
);

const Divider = () => (
  <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2 self-center" />
);

export function FormyxaToolbar({
  documentName,
  onDocumentNameChange,
  editor,
  saving,
  statusText,
  onExport,
  zoom = 1,
  onZoomChange,
  templateSlug,
  onGenerateFromAI,
  onRunRiskReview,
  onOpenIntelligence,
  intelligenceActive,
  intelligenceIssueCount = 0,
  contractScore,
}: FormyxaToolbarProps) {
  const disabled = !editor;

  const [insertOpen, setInsertOpen] = useState(false);
  const insertRef = useRef<HTMLDivElement>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  useClickOutside([insertRef], () => setInsertOpen(false), insertOpen);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const aiMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside([aiMenuRef], () => setAiMenuOpen(false), aiMenuOpen);

  const [aiStatus, setAiStatus] = useState<"idle" | "reviewed">("idle");
  const [aiIssuesCount, setAiIssuesCount] = useState<number>(0);

  const zoomValue = useMemo(
    () => String(Math.round((zoom || 1) * 100)),
    [zoom],
  );

  const safeRun = (fn: (chain: any) => any) => {
    if (!editor) return;
    try {
      const chain = editor.chain().focus();
      fn(chain).run();
    } catch {}
  };

  const isActive = (name: string) => {
    if (!editor) return false;
    try {
      return editor.isActive(name);
    } catch {
      return false;
    }
  };

  const applyZoom = (pctString: string) => {
    const pct = Number(pctString);
    if (!Number.isFinite(pct)) return;
    const next = Math.max(0.25, Math.min(2, pct / 100));
    onZoomChange?.(next);
  };

  return (
    <>
      {/* ================================================================
          TOOLBAR SHELL
          bg-white            → dark: bg-slate-900
          border-slate-200    → dark: border-slate-700
      ================================================================ */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_rgba(0,0,0,0.3)]">

        {/* --- Top Row: File Management & Global Actions --- */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-4 min-w-0">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 group-hover:bg-indigo-700 transition-colors">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight hidden sm:inline-block">
                Formyxa
              </span>
            </Link>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 rotate-12" />

            {/* Title + AI Status Group */}
            <div className="flex items-center gap-3">

              {/* Document Title */}
              <input
                value={documentName}
                onChange={(e) => onDocumentNameChange(e.target.value)}
                className="
                  text-sm font-medium text-slate-700 dark:text-slate-200
                  bg-transparent border border-transparent
                  hover:border-slate-200 hover:bg-slate-50
                  dark:hover:border-slate-600 dark:hover:bg-slate-800
                  focus:bg-white focus:border-indigo-400
                  dark:focus:bg-slate-800 dark:focus:border-indigo-500
                  focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20
                  focus:outline-none
                  px-3 py-1.5 rounded-md
                  transition-all duration-200
                  w-[260px]
                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                "
                placeholder="Untitled document"
              />

              {/* AI Status */}
              <div className="flex items-center gap-2 text-xs">
                {aiStatus === "idle" && (
                  <span className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-full text-slate-500 dark:text-slate-400 font-medium">
                    Not reviewed
                  </span>
                )}

                {aiStatus === "reviewed" && (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Reviewed
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {aiIssuesCount} issues found
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="flex items-center gap-3">

            {/* Status Indicator */}
            {statusText && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                {saving ? (
                  <span className="animate-pulse">Saving...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />
                    <span>{statusText}</span>
                  </>
                )}
              </div>
            )}

            {/* AI Tools Dropdown */}
            <div className="relative" ref={aiMenuRef}>
              <button
                onClick={() => setAiMenuOpen((p) => !p)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all
                  ${
                    aiMenuOpen
                      ? "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-100 dark:ring-purple-800/50"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                  }
                `}
              >
                {reviewLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-purple-600 dark:text-purple-400">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    <span>✨ Generate / Review</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                  </>
                )}
              </button>

              {aiMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-[0_12px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.4)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Assistance
                  </div>
                  <button
                    onClick={() => {
                      setAiMenuOpen(false);
                      setAiOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-purple-700 dark:hover:text-purple-300 rounded-md flex items-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                    Generate from Brief
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Compliance
                  </div>
                  <button
                    disabled={reviewLoading}
                    onClick={async () => {
                      setAiMenuOpen(false);
                      setReviewLoading(true);
                      try {
                        await onRunRiskReview();
                        setAiStatus("reviewed");
                        setAiIssuesCount(3);
                      } finally {
                        setReviewLoading(false);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-2 transition-colors ${
                      reviewLoading
                        ? "opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-500"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-amber-700 dark:hover:text-amber-400"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    {reviewLoading ? "Running Review..." : "Run Risk Review"}
                  </button>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            {/* 🛡 Contract Intelligence Button */}
            {onOpenIntelligence && (
              <button
                type="button"
                onClick={onOpenIntelligence}
                title="Contract Intelligence — live risk, score & validation"
                className={`
                  relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${intelligenceActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }
                `}
              >
                🛡
                {contractScore !== undefined && (
                  <span style={{
                    fontSize: "11px", fontWeight: 700,
                    color: intelligenceActive ? "#fff" :
                      contractScore >= 80 ? "#16a34a" :
                      contractScore >= 60 ? "#d97706" : "#dc2626",
                  }}>
                    {contractScore}
                  </span>
                )}
                {intelligenceIssueCount > 0 && (
                  <span style={{
                    position: "absolute", top: "-4px", right: "-4px",
                    background: "#ef4444", color: "#fff",
                    fontSize: "9px", fontWeight: 700,
                    width: "14px", height: "14px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{intelligenceIssueCount > 9 ? "9+" : intelligenceIssueCount}</span>
                )}
              </button>
            )}

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            {/* Export Button */}
            <button
              type="button"
              disabled={saving}
              onClick={onExport}
              className="
                inline-flex items-center gap-2
                px-4 py-1.5
                rounded-md
                bg-slate-900 hover:bg-slate-800
                dark:bg-slate-100 dark:hover:bg-white
                text-white dark:text-slate-900
                text-sm font-medium
                shadow-[0_4px_12px_rgba(0,0,0,0.08)]
                dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
                transition-all active:scale-95
                disabled:opacity-50 disabled:pointer-events-none
              "
            >
              <FileDown className="w-4 h-4 opacity-90" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* --- Bottom Row: Formatting Tools --- */}
        <div className="h-10 flex items-center px-2 bg-slate-50 dark:bg-slate-800/60 overflow-x-auto no-scrollbar">

          <div className="flex items-center px-2 gap-0.5">
            <ToolbarButton
              onClick={() => safeRun((c) => c.undo())}
              title="Undo (Ctrl+Z)"
              disabled={disabled}
            >
              <Undo2 className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => safeRun((c) => c.redo())}
              title="Redo (Ctrl+Y)"
              disabled={disabled}
            >
              <Redo2 className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <Divider />

          {/* Zoom Selector */}
          <div className="relative group px-2">
            <select
              value={zoomValue}
              onChange={(e) => applyZoom(e.target.value)}
              className="
                appearance-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700
                text-xs font-medium text-slate-600 dark:text-slate-300
                pl-2 pr-6 py-1 rounded-md cursor-pointer outline-none
                focus:ring-2 focus:ring-blue-500/20
                dark:bg-transparent
              "
            >
              {[50, 75, 100, 125, 150].map((v) => (
                <option
                  key={v}
                  value={String(v)}
                  className="dark:bg-slate-800 dark:text-slate-200"
                >
                  {v}%
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <Divider />

          <div className="flex items-center px-2 gap-0.5">
            <ToolbarButton
              active={isActive("bold")}
              onClick={() => safeRun((c) => c.toggleBold())}
              title="Bold (Ctrl+B)"
              disabled={disabled}
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={isActive("italic")}
              onClick={() => safeRun((c) => c.toggleItalic())}
              title="Italic (Ctrl+I)"
              disabled={disabled}
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
          </div>

          <Divider />

          <div className="flex items-center px-2 gap-0.5">
            <ToolbarButton
              active={isActive("bulletList")}
              onClick={() => safeRun((c) => c.toggleBulletList())}
              title="Bullet List"
              disabled={disabled}
            >
              <List className="w-4 h-4" />
            </ToolbarButton>

            <ToolbarButton
              active={isActive("orderedList")}
              onClick={() => safeRun((c) => c.toggleOrderedList())}
              title="Ordered List"
              disabled={disabled}
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* ================================================================
          AI MODAL
          bg-slate-900/20 backdrop → dark: bg-slate-900/60 (more opaque)
          bg-white panel          → dark: bg-slate-800
          border-slate-100        → dark: border-slate-700
      ================================================================ */}
      {aiOpen && (
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 w-[520px] rounded-xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 ring-1 ring-slate-900/5 dark:ring-white/5 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-900/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Generate with AI
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Describe what you want to create and let Formyxa draft it.
                </p>
              </div>
            </div>

            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              className="
                w-full
                border border-slate-200 dark:border-slate-600
                bg-white dark:bg-slate-900
                text-slate-800 dark:text-slate-200
                rounded-lg p-3 text-sm min-h-[140px]
                focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-500
                outline-none resize-none
                placeholder:text-slate-400 dark:placeholder:text-slate-500
              "
              placeholder="e.g. Create a Statement of Work for a CRM redesign project..."
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setAiOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                disabled={generating}
                onClick={async () => {
                  if (!aiInput.trim()) return;
                  try {
                    setGenerating(true);
                    await onGenerateFromAI(aiInput);
                    setAiInput("");
                    setAiOpen(false);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setGenerating(false);
                  }
                }}
                className="
                  flex items-center gap-2
                  px-5 py-2
                  text-sm font-medium
                  rounded-lg
                  bg-purple-600 hover:bg-purple-700
                  text-white
                  shadow-sm shadow-purple-200 dark:shadow-purple-900/40
                  transition-all active:scale-95
                  disabled:opacity-70 disabled:pointer-events-none
                "
              >
                {generating ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {generating ? "Generating..." : "Generate Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}