"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ClauseReviewModal.tsx
//
// Pre-insert approval step for the Risk Reviewer.
// Shows BEFORE clicking "Accept & Insert":
//   1. Side-by-side diff (current vs AI suggested)
//   2. Variable input fields if AI text has [placeholder] tokens
//   3. Conflict alerts if two sections say contradictory things
//
// Flow:
//   A (no placeholders, no conflicts) → just show diff → Accept / Reject
//   B (has [placeholders]) → show input fields first → fill → preview updates live
//   C (has conflicts) → show conflict alert at top → user resolves → then diff
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ConflictAlert = {
  id: string;
  sectionA: string;
  valueA: string;
  sectionB: string;
  valueB: string;
  description: string;
};

export type PendingClause = {
  title: string;
  riskType: "missing" | "weak";
  cardKey: string;
  targetSectionHeading?: string;
  // What's currently in the doc (empty string = missing)
  existingText: string;
  // Raw AI suggestion (may contain [placeholder] tokens)
  suggestedText: string;
  // Issue description from the risk card
  issue: string;
  // Conflicts detected in the document for this topic
  conflicts?: ConflictAlert[];
};

type Props = {
  pending: PendingClause;
  onAccept: (finalText: string, pending: PendingClause) => void;
  onReject: () => void;
};

// ─────────────────────────────────────────────────────────────────────────────
// Detect [placeholder] tokens in AI text
// ─────────────────────────────────────────────────────────────────────────────

function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\[([^\]]+)\]/g) ?? [];
  // Deduplicate
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
}

function resolvePlaceholders(text: string, values: Record<string, string>): string {
  return text.replace(/\[([^\]]+)\]/g, (_, key) => values[key] ?? `[${key}]`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Word-level diff for highlighting changes
// ─────────────────────────────────────────────────────────────────────────────

type DiffSegment = { text: string; type: "same" | "added" | "removed" };

function simpleDiff(before: string, after: string): { before: DiffSegment[]; after: DiffSegment[] } {
  // Tokenise by word
  const wordsA = before.split(/(\s+)/);
  const wordsB = after.split(/(\s+)/);

  // Build a quick LCS-based diff (good enough for clause-length text)
  const setA = new Set(wordsA.filter((w) => w.trim()));
  const setB = new Set(wordsB.filter((w) => w.trim()));

  const beforeSegs: DiffSegment[] = wordsA.map((w) => ({
    text: w,
    type: w.trim() && !setB.has(w.trim()) ? "removed" : "same",
  }));

  const afterSegs: DiffSegment[] = wordsB.map((w) => ({
    text: w,
    type: w.trim() && !setA.has(w.trim()) ? "added" : "same",
  }));

  return { before: beforeSegs, after: afterSegs };
}

function DiffText({ segments }: { segments: DiffSegment[] }) {
  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.type === "removed") {
          return <mark key={i} style={{ background: "#fee2e2", color: "#991b1b", borderRadius: "2px", padding: "0 1px", textDecoration: "line-through" }}>{seg.text}</mark>;
        }
        if (seg.type === "added") {
          return <mark key={i} style={{ background: "#dcfce7", color: "#166534", borderRadius: "2px", padding: "0 1px" }}>{seg.text}</mark>;
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Conflict Alert Banner
// ─────────────────────────────────────────────────────────────────────────────

function ConflictBanner({
  conflict,
  onResolve,
}: {
  conflict: ConflictAlert;
  onResolve: (chosenValue: string) => void;
}) {
  return (
    <div style={{
      background: "linear-gradient(135deg,#fef3c7,#fef9ee)",
      border: "1px solid #f59e0b",
      borderRadius: "10px",
      padding: "12px 14px",
      marginBottom: "12px",
    }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
        <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#92400e", margin: "0 0 3px" }}>
            Conflicting Sections Detected
          </p>
          <p style={{ fontSize: "11px", color: "#78350f", margin: 0, lineHeight: 1.5 }}>
            {conflict.description}
          </p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
        <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: "7px", padding: "8px 10px" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", margin: "0 0 3px" }}>{conflict.sectionA}</p>
          <p style={{ fontSize: "11px", color: "#1e293b", margin: 0, fontWeight: 600 }}>"{conflict.valueA}"</p>
        </div>
        <div style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: "7px", padding: "8px 10px" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", margin: "0 0 3px" }}>{conflict.sectionB}</p>
          <p style={{ fontSize: "11px", color: "#1e293b", margin: 0, fontWeight: 600 }}>"{conflict.valueB}"</p>
        </div>
      </div>
      <p style={{ fontSize: "10px", fontWeight: 700, color: "#92400e", margin: "0 0 6px" }}>
        Which value is correct?
      </p>
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={() => onResolve(conflict.valueA)} style={{
          flex: 1, fontSize: "10px", fontWeight: 700, padding: "6px 8px", borderRadius: "7px",
          border: "1px solid #f59e0b", background: "#fff", color: "#92400e", cursor: "pointer",
        }}>
          Use "{conflict.valueA}"
        </button>
        <button onClick={() => onResolve(conflict.valueB)} style={{
          flex: 1, fontSize: "10px", fontWeight: 700, padding: "6px 8px", borderRadius: "7px",
          border: "1px solid #f59e0b", background: "#fff", color: "#92400e", cursor: "pointer",
        }}>
          Use "{conflict.valueB}"
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Variable Input Field
// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderField({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Guess input type from the placeholder name
  const isDate    = /date|deadline|by|start|end|due/i.test(name);
  const isCurrency = /fee|amount|rate|cost|price|₹|\$/i.test(name);
  const isNumber  = /days|period|limit|count|number|%/i.test(name);

  const hint = isDate ? "e.g. 15 March 2026" : isCurrency ? "e.g. ₹50,000" : isNumber ? "e.g. 14" : "";

  return (
    <div style={{ marginBottom: "10px" }}>
      <label style={{
        display: "block", fontSize: "10px", fontWeight: 700,
        color: "#475569", marginBottom: "4px",
        textTransform: "capitalize",
      }}>
        {name}
        <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hint}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "7px 10px", borderRadius: "7px",
          border: value ? "1px solid #86efac" : "1px solid #e2e8f0",
          fontSize: "12px", color: "#0f172a",
          background: "#fff", outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
        onBlur={(e) => (e.target.style.borderColor = value ? "#86efac" : "#e2e8f0")}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────

export function ClauseReviewModal({ pending, onAccept, onReject }: Props) {
  const placeholders = useMemo(() => extractPlaceholders(pending.suggestedText), [pending.suggestedText]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(placeholders.map((p) => [p, ""])),
  );
  const [resolvedConflicts, setResolvedConflicts] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"variables" | "diff">(placeholders.length > 0 ? "variables" : "diff");

  // Live-resolve placeholders in the preview text
  const finalText = useMemo(() => {
    let text = resolvePlaceholders(pending.suggestedText, values);
    // Also apply conflict resolutions
    for (const [key, resolved] of Object.entries(resolvedConflicts)) {
      text = text.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), resolved);
    }
    return text;
  }, [pending.suggestedText, values, resolvedConflicts]);

  const allPlaceholdersFilled = placeholders.every((p) => values[p]?.trim());
  const unresolvedConflicts = (pending.conflicts ?? []).filter((c) => !resolvedConflicts[c.id]);

  const diff = useMemo(
    () => simpleDiff(pending.existingText || "", finalText),
    [pending.existingText, finalText],
  );

  // Trap focus inside modal
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  const canAccept = allPlaceholdersFilled && unresolvedConflicts.length === 0;

  return (
    // Backdrop
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(4px)",
        padding: "20px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onReject(); }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        style={{
          width: "min(820px, 100%)",
          maxHeight: "90vh",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(15,23,42,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          outline: "none",
        }}
      >
        {/* ── MODAL HEADER ── */}
        <div style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <span style={{ fontSize: "16px" }}>✦</span>
              <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Review AI Suggestion
              </h2>
            </div>
            <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
              <strong style={{ color: "#0f172a" }}>{pending.title}</strong>
              {" "}· {pending.issue}
            </p>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            {placeholders.length > 0 && (
              <>
                <StepDot active={step === "variables"} done={step === "diff"} label="1. Fill" />
                <div style={{ width: "20px", height: "1px", background: "#e2e8f0" }} />
                <StepDot active={step === "diff"} done={false} label="2. Review" />
                <div style={{ width: "12px" }} />
              </>
            )}
            <button onClick={onReject} style={{
              background: "none", border: "none", fontSize: "18px",
              color: "#94a3b8", cursor: "pointer", padding: "0 4px", lineHeight: 1,
            }}>×</button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px" }}>

          {/* Conflict alerts (always shown regardless of step) */}
          {unresolvedConflicts.map((conflict) => (
            <ConflictBanner
              key={conflict.id}
              conflict={conflict}
              onResolve={(val) => setResolvedConflicts((prev) => ({ ...prev, [conflict.id]: val }))}
            />
          ))}

          {/* Resolved conflicts confirmation */}
          {Object.entries(resolvedConflicts).length > 0 && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "8px 12px", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", color: "#15803d", margin: 0, fontWeight: 600 }}>
                ✓ Conflict resolved · The AI suggestion has been updated with your choice.
              </p>
            </div>
          )}

          {/* ─── STEP 1: VARIABLE INPUTS ─── */}
          {step === "variables" && placeholders.length > 0 && (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
                  Fill in the required values
                </p>
                <p style={{ fontSize: "11px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>
                  The AI identified <strong>{placeholders.length}</strong> placeholder{placeholders.length > 1 ? "s" : ""} in this clause. 
                  Fill them in and the final legal text will update automatically.
                </p>
              </div>

              {placeholders.map((p) => (
                <PlaceholderField
                  key={p}
                  name={p}
                  value={values[p] ?? ""}
                  onChange={(v) => setValues((prev) => ({ ...prev, [p]: v }))}
                />
              ))}

              {/* Live preview below inputs */}
              {allPlaceholdersFilled && (
                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                    Preview with your values
                  </p>
                  <div style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0",
                    borderRadius: "9px", padding: "12px 14px",
                  }}>
                    <p style={{ fontSize: "12px", color: "#334155", lineHeight: 1.7, margin: 0 }}>
                      {finalText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2: SIDE-BY-SIDE DIFF ─── */}
          {step === "diff" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

                {/* LEFT — CURRENT / BEFORE */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <span style={{
                      fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px",
                      background: pending.existingText ? "#fee2e2" : "#f1f5f9",
                      color: pending.existingText ? "#991b1b" : "#64748b",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      {pending.existingText ? "Current (Weak)" : "Missing"}
                    </span>
                  </div>
                  <div style={{
                    background: pending.existingText ? "#fef2f2" : "#f8fafc",
                    border: `1px solid ${pending.existingText ? "#fca5a5" : "#e2e8f0"}`,
                    borderRadius: "10px",
                    padding: "14px",
                    minHeight: "120px",
                  }}>
                    {pending.existingText ? (
                      <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.7, margin: 0 }}>
                        <DiffText segments={diff.before} />
                      </p>
                    ) : (
                      <div style={{ textAlign: "center", paddingTop: "20px" }}>
                        <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>📄</span>
                        <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>
                          This section is currently missing from your document.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT — AI SUGGESTED / AFTER */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <span style={{
                      fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px",
                      background: "#dcfce7", color: "#15803d",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      ✦ AI Suggested
                    </span>
                  </div>
                  <div style={{
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    borderRadius: "10px",
                    padding: "14px",
                    minHeight: "120px",
                    position: "relative",
                  }}>
                    {/* Has unfilled placeholders warning */}
                    {!allPlaceholdersFilled && (
                      <div style={{
                        position: "absolute", inset: 0, borderRadius: "10px",
                        background: "rgba(248,250,252,0.85)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backdropFilter: "blur(2px)",
                      }}>
                        <p style={{ fontSize: "11px", color: "#64748b", textAlign: "center", padding: "0 16px" }}>
                          Fill in the values on the left to preview the final clause.
                        </p>
                      </div>
                    )}
                    <p style={{ fontSize: "12px", color: "#166534", lineHeight: 1.7, margin: 0 }}>
                      <DiffText segments={diff.after} />
                    </p>
                  </div>
                </div>
              </div>

              {/* Change summary */}
              <div style={{ marginTop: "14px", background: "#f8fafc", borderRadius: "9px", padding: "10px 14px" }}>
                <p style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 3px" }}>
                  What changes
                </p>
                <p style={{ fontSize: "11px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                  {pending.issue}
                  {pending.riskType === "missing"
                    ? " — This clause will be inserted in the correct position in your document."
                    : " — The existing weak text will be replaced in place. No content will be moved or duplicated."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER / ACTION BUTTONS ── */}
        <div style={{
          padding: "14px 22px",
          borderTop: "1px solid #f1f5f9",
          background: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: "12px",
        }}>
          <button onClick={onReject} style={{
            fontSize: "12px", fontWeight: 600, padding: "8px 16px", borderRadius: "9px",
            border: "1px solid #e2e8f0", background: "#fff", color: "#64748b",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            Reject
          </button>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {/* Back button (diff → variables) */}
            {step === "diff" && placeholders.length > 0 && (
              <button onClick={() => setStep("variables")} style={{
                fontSize: "12px", fontWeight: 600, padding: "8px 14px", borderRadius: "9px",
                border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", cursor: "pointer",
              }}>
                ← Back
              </button>
            )}

            {/* Next / Accept */}
            {step === "variables" ? (
              <button
                disabled={!allPlaceholdersFilled}
                onClick={() => setStep("diff")}
                style={{
                  fontSize: "12px", fontWeight: 700, padding: "8px 20px", borderRadius: "9px",
                  border: "none",
                  background: allPlaceholdersFilled ? "linear-gradient(135deg,#4f6de8,#6366f1)" : "#e2e8f0",
                  color: allPlaceholdersFilled ? "#fff" : "#94a3b8",
                  cursor: allPlaceholdersFilled ? "pointer" : "not-allowed",
                  boxShadow: allPlaceholdersFilled ? "0 2px 8px rgba(79,109,232,0.3)" : "none",
                  transition: "all 0.15s",
                }}
              >
                Preview Diff →
              </button>
            ) : (
              <button
                disabled={!canAccept}
                onClick={() => onAccept(finalText, pending)}
                style={{
                  fontSize: "12px", fontWeight: 700, padding: "8px 22px", borderRadius: "9px",
                  border: "none",
                  background: canAccept
                    ? "linear-gradient(135deg,#22c55e,#16a34a)"
                    : "#e2e8f0",
                  color: canAccept ? "#fff" : "#94a3b8",
                  cursor: canAccept ? "pointer" : "not-allowed",
                  boxShadow: canAccept ? "0 2px 10px rgba(34,197,94,0.35)" : "none",
                  display: "flex", alignItems: "center", gap: "6px",
                  transition: "all 0.15s",
                }}
              >
                ✓ Accept & Insert
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step Dot (step indicator)
// ─────────────────────────────────────────────────────────────────────────────

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={{
        width: "20px", height: "20px", borderRadius: "50%",
        background: done ? "#22c55e" : active ? "#6366f1" : "#e2e8f0",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background 0.3s",
      }}>
        {done
          ? <span style={{ fontSize: "10px", color: "#fff" }}>✓</span>
          : <span style={{ fontSize: "9px", fontWeight: 700, color: active ? "#fff" : "#94a3b8" }}>
              {label.split(".")[0]}
            </span>
        }
      </div>
      <span style={{ fontSize: "9px", color: active ? "#6366f1" : "#94a3b8", fontWeight: active ? 700 : 400 }}>
        {label.split(". ")[1]}
      </span>
    </div>
  );
}