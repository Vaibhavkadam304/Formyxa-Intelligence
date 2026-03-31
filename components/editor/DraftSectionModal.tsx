"use client";

/**
 * DraftSectionModal
 * ─────────────────
 * Shown when the user clicks "Draft Section" on a ghost/empty section.
 * Instead of just inserting AI text, it first asks a contextual question
 * ("What are the 3 main things you are delivering?"), then generates and
 * inserts the result surgically into the target section.
 *
 * Psychology: Filling vs Fixing. This modal = Filling.
 * ClauseReviewModal = Fixing.
 */

import { useState, useEffect, useRef } from "react";

export type DraftSectionTarget = {
  /** The heading text of the ghost section, e.g. "Project Purpose" */
  sectionName: string;
  /** A contextual prompt to show the user based on section type */
  prompt: string;
  /** Placeholder hint for the textarea */
  placeholder: string;
};

type Props = {
  target: DraftSectionTarget;
  /** Called with the user's answer and final AI text to insert */
  onAccept: (sectionName: string, userAnswer: string, generatedText: string) => void;
  onReject: () => void;
};

// ── Contextual prompt selection ───────────────────────────────────────────────
// Maps section name keywords → a helpful guiding question
const PROMPT_MAP: Array<{ keywords: string[]; prompt: string; placeholder: string }> = [
  {
    keywords: ["purpose", "objective", "background", "overview"],
    prompt: "What is the main goal of this project? Describe it in 2–3 sentences.",
    placeholder: "e.g. Build a customer portal that lets users track their orders in real time…",
  },
  {
    keywords: ["scope", "deliverable", "services", "work"],
    prompt: "What are the 3 main things you are delivering under this contract?",
    placeholder: "e.g. 1. A mobile app  2. Backend API  3. Admin dashboard…",
  },
  {
    keywords: ["payment", "fee", "price", "cost", "schedule"],
    prompt: "What are the payment milestones and amounts for this project?",
    placeholder: "e.g. 30% on signing, 40% on first delivery, 30% on final handover…",
  },
  {
    keywords: ["timeline", "deadline", "milestone", "schedule", "duration"],
    prompt: "What are the key milestones and their target dates?",
    placeholder: "e.g. Design complete by March 1, Beta by April 15, Launch by May 30…",
  },
  {
    keywords: ["termination", "cancel", "exit"],
    prompt: "Under what conditions can either party end this agreement?",
    placeholder: "e.g. 30 days notice, non-payment after 14 days, breach of confidentiality…",
  },
  {
    keywords: ["confidential", "nda", "secret", "proprietary"],
    prompt: "What information should be kept confidential, and for how long?",
    placeholder: "e.g. All client data, pricing, and source code — for 2 years after the contract ends…",
  },
  {
    keywords: ["intellectual", "ip", "ownership", "copyright"],
    prompt: "Who will own the work product created under this contract?",
    placeholder: "e.g. Client owns all deliverables upon final payment. Contractor retains portfolio rights…",
  },
  {
    keywords: ["liability", "indemnity", "risk", "warranty"],
    prompt: "What liability limits or warranties should apply?",
    placeholder: "e.g. Contractor's liability capped at contract value. 90-day bug fix warranty…",
  },
];

const DEFAULT_PROMPT = {
  prompt: "Describe what this section should cover. Be specific — the AI will use your answer.",
  placeholder: "e.g. This section should cover…",
};

export function getContextualPrompt(sectionName: string): { prompt: string; placeholder: string } {
  const lower = sectionName.toLowerCase();
  const match = PROMPT_MAP.find((m) => m.keywords.some((k) => lower.includes(k)));
  return match ?? DEFAULT_PROMPT;
}

// ─────────────────────────────────────────────────────────────────────────────

export function DraftSectionModal({ target, onAccept, onReject }: Props) {
  const [userAnswer, setUserAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus the answer textarea when modal opens
    setTimeout(() => textareaRef.current?.focus(), 80);
  }, []);

  async function handleGenerate() {
    if (!userAnswer.trim()) return;
    setLoading(true);
    setError(null);
    setGeneratedText(null);

    try {
      const res = await fetch("/api/generate-clause-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: target.sectionName,
          existingClauseText: null,
          documentText: `User described this section as: ${userAnswer}`,
          mode: "addition",
          userContext: userAnswer,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();

      const text = data?.replace_with
        ? data.replace_with
            .replace(new RegExp(`^${target.sectionName}\\.?\\s*`, "i"), "")
            .trim()
        : null;

      if (!text) throw new Error("No content returned");
      setGeneratedText(text);
      setEditedText(text);
    } catch (err) {
      setError("Could not generate draft. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    const final = editing ? editedText : (generatedText ?? "");
    if (!final.trim()) return;
    onAccept(target.sectionName, userAnswer, final);
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onReject();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !generatedText) handleGenerate();
  }

  return (
    // ── Backdrop ────────────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onReject(); }}
      onKeyDown={handleKeyDown}
    >
      {/* ── Modal card ────────────────────────────────────────────────────── */}
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Icon badge */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                ✍️
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-0.5">
                  Draft Section
                </p>
                <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {target.sectionName}
                </h2>
              </div>
            </div>
            <button
              onClick={onReject}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg leading-none mt-0.5 transition"
            >
              ✕
            </button>
          </div>
          {/* Explain the flow */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
            This section is empty. Answer the question below so the AI can generate content that actually fits your project — not a generic placeholder.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Step 1 — User answer */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
              <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                {target.prompt}
              </label>
            </div>
            <textarea
              ref={textareaRef}
              value={userAnswer}
              onChange={(e) => { setUserAnswer(e.target.value); setGeneratedText(null); setError(null); }}
              placeholder={target.placeholder}
              disabled={loading}
              rows={4}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-800 dark:text-slate-200 placeholder-slate-400 px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 transition disabled:opacity-60"
            />
            <p className="text-[10px] text-slate-400 text-right">⌘↵ to generate</p>
          </div>

          {/* Generate button — only show before generation */}
          {!generatedText && !loading && (
            <button
              onClick={handleGenerate}
              disabled={!userAnswer.trim()}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              ✦ Generate Draft
            </button>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center gap-3 py-6">
              <span className="text-2xl animate-spin">✦</span>
              <div>
                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">Generating draft…</p>
                <p className="text-[11px] text-slate-400">Using your answer to write the clause</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3">
              <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
              <button onClick={handleGenerate} className="mt-1.5 text-[11px] font-semibold text-red-500 hover:underline">
                Retry →
              </button>
            </div>
          )}

          {/* Step 2 — Generated result */}
          {generatedText && !loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                  Review the draft — edit if needed, then insert.
                </label>
              </div>
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/10 overflow-hidden">
                {editing ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={8}
                    className="w-full bg-transparent text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed px-4 py-3 resize-none focus:outline-none"
                  />
                ) : (
                  <div className="px-4 py-3">
                    <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {generatedText}
                    </p>
                  </div>
                )}
                <div className="px-4 py-2 border-t border-emerald-100 dark:border-emerald-800 flex items-center gap-3 bg-white/40 dark:bg-slate-800/40">
                  <button
                    onClick={() => { setEditing(!editing); }}
                    className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {editing ? "Done editing" : "✎ Edit"}
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button
                    onClick={() => { setGeneratedText(null); setEditedText(""); setEditing(false); }}
                    className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 hover:underline"
                  >
                    ↺ Regenerate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center gap-3">
          {generatedText && !loading ? (
            <>
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-bold text-white transition"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                ↓ Insert into Document
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2.5 rounded-xl text-[12px] text-slate-400 hover:text-slate-600 border border-slate-200 dark:border-slate-700 transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onReject}
              className="ml-auto text-[12px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}