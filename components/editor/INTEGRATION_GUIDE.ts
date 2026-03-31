/**
 * INTEGRATION GUIDE — ContractIntelligencePanel (fixed)
 * ─────────────────────────────────────────────────────
 *
 * Drop-in replacement for your existing onRewriteClause handler in whatever
 * page/component mounts <ContractIntelligencePanel />.
 *
 * The key change: onRewriteClause now receives 3 extra params from the panel:
 *   targetSectionHeading  — where to insert (insertAfter)
 *   createNewSection      — true = new H2 heading, false = append to section
 *   suggestedSectionNumber — optional numbering hint
 *
 * Minimal page wiring example (Next.js App Router / TipTap):
 */

"use client";

import { useEditor } from "@tiptap/react";
import { useState, useCallback } from "react";
import { ContractIntelligencePanel } from "@/components/editor/ContractIntelligencePanel";
import {
  insertClauseAtSection,
  replaceClauseText,
} from "@/components/editor/insertClauseAtSection";

// --- In your page component ---

export function ContractEditorPage() {
  const editor = useEditor({ /* your extensions */ } as any);
  const [contractReview, setContractReview] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [riskGenerating, setRiskGenerating] = useState<Record<string, boolean>>({});
  const [showPanel, setShowPanel] = useState(false);

  // ── FIXED onRewriteClause ─────────────────────────────────────────────────
  //
  // Previously this handler had no knowledge of WHERE to insert the clause,
  // so it always defaulted to the "Limitation of Liability" section.
  //
  // Now it receives targetSectionHeading + createNewSection from the panel's
  // enriched placement data, and uses insertClauseAtSection / replaceClauseText
  // to put the content in exactly the right place.

  const handleRewriteClause = useCallback(async (
    title: string,
    riskType: "missing" | "weak",
    cardKey: string,
    targetSectionHeading?: string,
    createNewSection?: boolean,
    suggestedSectionNumber?: number,
  ) => {
    if (!editor) return;

    setRiskGenerating((prev) => ({ ...prev, [cardKey]: true }));

    try {
      // 1. Call your clause-generation API
      const res = await fetch("/api/generate-clause-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          mode: riskType === "missing" ? "addition" : "rewrite",
          documentText: editor.getText(),
          targetSection: targetSectionHeading,
          createNewSection,
          suggestedSectionNumber,
        }),
      });

      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();

      // data.replace_with = the generated clause text
      const generatedText: string = data.replace_with ?? "";
      if (!generatedText.trim()) return;

      if (riskType === "weak" && targetSectionHeading) {
        // ── Weak clause: replace text in the target section ────────────────
        replaceClauseText(editor, targetSectionHeading, generatedText);
      } else if (riskType === "missing") {
        // ── Missing clause: insert in the correct position ─────────────────
        insertClauseAtSection(editor, {
          insertAfter: targetSectionHeading ?? "Termination",
          createNewSection: createNewSection ?? true,
          clauseTitle: title,
          newBody: generatedText,
          suggestedSectionNumber,
        });
      }

      // Dismiss the card after successful insertion
      // onDismissCard(riskType, title);  ← call your dismiss handler here

    } catch (err) {
      console.error("[handleRewriteClause] Error:", err);
    } finally {
      setRiskGenerating((prev) => ({ ...prev, [cardKey]: false }));
    }
  }, [editor]);

  // ── onInsertClause: creates a brand-new section (heading + body) ──────────
  //
  // Used by the panel when it has pre-generated heading+body text to insert.
  // (Less common — most insertions go through handleRewriteClause above.)

  const handleInsertClause = useCallback((heading: string, body: string) => {
    if (!editor) return;
    // No known insertAfter — append at end of document
    insertClauseAtSection(editor, {
      insertAfter: "", // triggers fallback to doc end
      createNewSection: true,
      newHeading: heading,
      newBody: body,
    });
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex h-screen">
      {/* ... your editor ... */}

      {showPanel && (
        <ContractIntelligencePanel
          doc={editor.getJSON()}
          onClose={() => setShowPanel(false)}

          // ── Pass the FIXED handler ──
          onRewriteClause={handleRewriteClause}
          onInsertClause={handleInsertClause}

          contractReview={contractReview}
          reviewLoading={reviewLoading}
          onRunReview={async () => {
            setReviewLoading(true);
            try {
              const res = await fetch("/api/review-contract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentText: editor.getText() }),
              });
              const data = await res.json();
              setContractReview(data);
            } finally {
              setReviewLoading(false);
            }
          }}
          riskGenerating={riskGenerating}
          onDismissCard={(type, identifier) => {
            setContractReview((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                missingClauses: type === "missing"
                  ? (prev.missingClauses ?? []).filter((c: any) => c.title !== identifier)
                  : prev.missingClauses,
                weakClauses: type === "weak"
                  ? (prev.weakClauses ?? []).filter((c: any) => c.section !== identifier)
                  : prev.weakClauses,
              };
            });
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WHAT TO UPDATE IN YOUR /api/review-contract PROMPT
// ─────────────────────────────────────────────────────────────────────────────
//
// For the PixelForge / NovaTech AI retainer, your AI review API should return
// these specific missing-clause entries (with placement metadata pre-filled so
// the panel doesn't have to guess). Example response shape:
//
// {
//   missingClauses: [
//     {
//       title: "Monthly Retainer Amount",
//       reason: "Retainer fee not specified. Should state $8,500/month.",
//       severity: "HIGH",
//       insertAfter: "Retainer",
//       createNewSection: false,
//     },
//     {
//       title: "Overage Rate",
//       reason: "Overage rate blank. Should state $150/hour.",
//       severity: "HIGH",
//       insertAfter: "Retainer",
//       createNewSection: false,
//     },
//     {
//       title: "Hour Rollover Policy",
//       reason: "Up to 10 unused hours carry over to next month only; expire after 30 days.",
//       severity: "HIGH",
//       insertAfter: "Retainer",
//       createNewSection: false,
//     },
//     {
//       title: "Late Payment Terms",
//       reason: "1.5%/month after 5-day grace period; work paused if 10+ days overdue.",
//       severity: "HIGH",
//       insertAfter: "Payment Terms",
//       createNewSection: false,
//     },
//     {
//       title: "No Guarantee of Marketing Results",
//       reason: "No disclaimer for SEO rankings, ROAS, traffic or revenue. Critical for ad campaigns.",
//       severity: "HIGH",
//       insertAfter: "Scope of Services",
//       createNewSection: true,
//       suggestedSectionNumber: 4,
//     },
//     {
//       title: "Intellectual Property",
//       reason: "IP section missing. Must cover templates, methodologies, AI systems, reusable assets.",
//       severity: "HIGH",
//       insertAfter: "Termination",
//       createNewSection: true,
//       suggestedSectionNumber: 8,
//     },
//     {
//       title: "Confidentiality",
//       reason: "Confidentiality must survive 3 years post-termination as a standalone section.",
//       severity: "HIGH",
//       insertAfter: "Intellectual Property",
//       createNewSection: true,
//       suggestedSectionNumber: 9,
//     },
//     {
//       title: "Non-Solicitation",
//       reason: "Client must not hire Provider employees/contractors for 12 months post-termination.",
//       severity: "HIGH",
//       insertAfter: "Confidentiality",
//       createNewSection: true,
//       suggestedSectionNumber: 10,
//     },
//     {
//       title: "Force Majeure",
//       reason: "Neither party liable for performance failures due to circumstances beyond reasonable control.",
//       severity: "MEDIUM",
//       insertAfter: "Non-Solicitation",
//       createNewSection: true,
//       suggestedSectionNumber: 11,
//     },
//     {
//       title: "Data Protection",
//       reason: "Client responsible for GDPR/CCPA compliance. Provider not liable for third-party platform breaches.",
//       severity: "HIGH",
//       insertAfter: "Confidentiality",
//       createNewSection: true,
//       suggestedSectionNumber: 10,
//     },
//     {
//       title: "No Partnership or Agency Authority",
//       reason: "Neither party may bind the other. No joint venture. Independent contractors only.",
//       severity: "MEDIUM",
//       insertAfter: "Force Majeure",
//       createNewSection: true,
//       suggestedSectionNumber: 12,
//     },
//     {
//       title: "Governing Law & Arbitration",
//       reason: "Delaware governing law and AAA arbitration not specified.",
//       severity: "HIGH",
//       insertAfter: "Force Majeure",
//       createNewSection: true,
//       suggestedSectionNumber: 13,
//     },
//   ],
//   weakClauses: [
//     {
//       section: "Limitation of Liability",
//       issue: "Liability cap says 'in the months' — the number 6 is missing. Also missing platform suspension carve-out.",
//       severity: "HIGH",
//     },
//     {
//       section: "Scope of Services",
//       issue: "Out-of-scope exclusions (website redesign, backend dev, rebranding, video) should explicitly state a separate SOW + separate pricing is required.",
//       severity: "MEDIUM",
//     },
//   ],
// }
