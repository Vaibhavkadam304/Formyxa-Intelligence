/**
 * useContractIntelligence.ts
 * ──────────────────────────
 * This hook was MISSING from the codebase — the root cause of clauses being
 * inserted at the wrong position (or always at the document end).
 *
 * What this provides:
 *  - handleRewriteClause  → wired to ContractIntelligencePanel's onRewriteClause
 *  - handleInsertClause   → wired to ContractIntelligencePanel's onInsertClause
 *  - handleRunReview      → calls /api/review-contract and sets contractReview
 *  - handleDraftSection   → calls /api/draft-section for ghost sections
 *  - handleResolveConflict → calls /api/resolve-conflict for conflict cards
 *  - handleAutoOptimize   → batch-fixes all low-severity issues
 *  - handleDismissCard    → removes a card from the review state
 *  - All riskGenerating / reviewLoading state
 *
 * Drop this hook into the page that mounts <ContractIntelligencePanel />
 * and spread its return value directly onto the panel's props.
 *
 * Usage:
 *
 *   const intelligence = useContractIntelligence(editor);
 *
 *   <ContractIntelligencePanel
 *     doc={editor?.getJSON()}
 *     {...intelligence}
 *   />
 */

"use client";

import { useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  insertClauseAtSection,
  replaceClauseText,
} from "@/components/editor/insertClauseAtSection";

// ── Types (must match ContractIntelligencePanel's Props) ──────────────────────

type ContractReview = {
  missingClauses?: MissingClause[];
  weakClauses?: WeakClause[];
};

type MissingClause = {
  title: string;
  reason: string;
  severity?: "HIGH" | "MEDIUM" | "LOW";
  insertAfter?: string;
  createNewSection?: boolean;
  suggestedSectionNumber?: number;
};

type WeakClause = {
  section: string;
  issue: string;
  severity?: "HIGH" | "MEDIUM" | "LOW";
};

type ScoreTrend = { delta: number; label: string };

// ── Hook return type ──────────────────────────────────────────────────────────

export type UseContractIntelligenceReturn = {
  contractReview: ContractReview | null;
  reviewLoading: boolean;
  riskGenerating: Record<string, boolean>;
  scoreTrend: ScoreTrend | null;
  onRunReview: () => Promise<void>;
  onRewriteClause: (
    title: string,
    riskType: "missing" | "weak",
    cardKey: string,
    targetSectionHeading?: string,
    createNewSection?: boolean,
    suggestedSectionNumber?: number,
  ) => Promise<void>;
  onInsertClause: (heading: string, body: string) => void;
  onDismissCard: (type: "missing" | "weak", identifier: string) => void;
  onDraftSection: (sectionName: string) => Promise<void>;
  onResolveConflict: (sectionA: string, sectionB: string, cardKey: string) => Promise<void>;
  onAutoOptimize: () => Promise<void>;
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useContractIntelligence(
  editor: Editor | null | undefined,
): UseContractIntelligenceReturn {
  const [contractReview, setContractReview] = useState<ContractReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [riskGenerating, setRiskGenerating] = useState<Record<string, boolean>>({});
  const [scoreTrend, setScoreTrend] = useState<ScoreTrend | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const setCardLoading = (cardKey: string, val: boolean) =>
    setRiskGenerating((prev) => ({ ...prev, [cardKey]: val }));

  // ── Run review ────────────────────────────────────────────────────────────

  const onRunReview = useCallback(async () => {
    if (!editor) return;
    setReviewLoading(true);
    try {
      const res = await fetch("/api/review-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: editor.getText() }),
      });
      if (!res.ok) throw new Error(`review-contract failed: ${res.status}`);
      const data = await res.json();
      setContractReview(data);
    } catch (err) {
      console.error("[useContractIntelligence] onRunReview error:", err);
    } finally {
      setReviewLoading(false);
    }
  }, [editor]);

  // ── Rewrite / Insert clause ───────────────────────────────────────────────
  //
  // THIS IS THE CRITICAL FUNCTION. Previously the page was calling
  // editor.commands.insertContent() which always appended near the cursor or
  // at the end of the document. Now we use insertClauseAtSection() which
  // reads the placement metadata from the panel and puts it in exactly the
  // right place.

  const onRewriteClause = useCallback(async (
    title: string,
    riskType: "missing" | "weak",
    cardKey: string,
    targetSectionHeading?: string,
    createNewSection?: boolean,
    suggestedSectionNumber?: number,
  ) => {
    if (!editor) return;
    setCardLoading(cardKey, true);

    try {
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
      if (!res.ok) throw new Error(`generate-clause-fix failed: ${res.status}`);
      const data = await res.json();

      const generatedText: string = data.replace_with ?? data.text ?? data.content ?? "";
      if (!generatedText.trim()) {
        console.warn("[useContractIntelligence] Empty generated text for:", title);
        return;
      }

      if (riskType === "weak" && targetSectionHeading) {
        // ── Weak clause: replace existing section body in-place ──────────
        const replaced = replaceClauseText(editor, targetSectionHeading, generatedText);
        if (!replaced) {
          console.warn(
            `[useContractIntelligence] replaceClauseText could not find section "${targetSectionHeading}". Appending instead.`,
          );
          insertClauseAtSection(editor, {
            insertAfter: targetSectionHeading ?? "Limitation of Liability",
            createNewSection: false,
            newBody: generatedText,
            clauseTitle: title,
          });
        }
      } else if (riskType === "missing") {
        // ── Missing clause: insert at the correct position ───────────────
        const inserted = insertClauseAtSection(editor, {
          insertAfter: targetSectionHeading ?? "Termination",
          createNewSection: createNewSection ?? true,
          clauseTitle: title,
          newBody: generatedText,
          suggestedSectionNumber,
        });

        // Update score trend on successful insert
        if (inserted) {
          setScoreTrend({ delta: 8, label: `${title} Added` });
          setTimeout(() => setScoreTrend(null), 6000);
        }
      }

      // Auto-dismiss the card after insertion
      onDismissCard(riskType, riskType === "weak" ? (targetSectionHeading ?? title) : title);

    } catch (err) {
      console.error("[useContractIntelligence] onRewriteClause error:", err);
    } finally {
      setCardLoading(cardKey, false);
    }
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Direct insert (used by onInsertClause prop) ───────────────────────────

  const onInsertClause = useCallback((heading: string, body: string) => {
    if (!editor) return;
    // No known insertAfter — fall back to doc end
    insertClauseAtSection(editor, {
      insertAfter: "",
      createNewSection: true,
      newHeading: heading,
      newBody: body,
    });
  }, [editor]);

  // ── Dismiss card ──────────────────────────────────────────────────────────

  const onDismissCard = useCallback((type: "missing" | "weak", identifier: string) => {
    setContractReview((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        missingClauses:
          type === "missing"
            ? (prev.missingClauses ?? []).filter((c) => c.title !== identifier)
            : prev.missingClauses,
        weakClauses:
          type === "weak"
            ? (prev.weakClauses ?? []).filter((c) => c.section !== identifier)
            : prev.weakClauses,
      };
    });
  }, []);

  // ── Draft ghost section ───────────────────────────────────────────────────

  const onDraftSection = useCallback(async (sectionName: string) => {
    if (!editor) return;
    const cardKey = `draft-${sectionName}`;
    setCardLoading(cardKey, true);
    try {
      const res = await fetch("/api/draft-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionName,
          documentText: editor.getText(),
        }),
      });
      if (!res.ok) throw new Error(`draft-section failed: ${res.status}`);
      const data = await res.json();
      const draft: string = data.draft ?? data.text ?? data.content ?? "";
      if (draft.trim()) {
        // Replace the empty section's body with the drafted content
        replaceClauseText(editor, sectionName, draft);
      }
    } catch (err) {
      console.error("[useContractIntelligence] onDraftSection error:", err);
    } finally {
      setCardLoading(cardKey, false);
    }
  }, [editor]);

  // ── Resolve conflict ──────────────────────────────────────────────────────

  const onResolveConflict = useCallback(async (
    sectionA: string,
    sectionB: string,
    cardKey: string,
  ) => {
    if (!editor) return;
    setCardLoading(cardKey, true);
    try {
      const res = await fetch("/api/resolve-conflict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionA,
          sectionB,
          documentText: editor.getText(),
        }),
      });
      if (!res.ok) throw new Error(`resolve-conflict failed: ${res.status}`);
      const data = await res.json();

      // Apply fix to each conflicting section
      if (data.fixA) replaceClauseText(editor, sectionA, data.fixA);
      if (data.fixB) replaceClauseText(editor, sectionB, data.fixB);
    } catch (err) {
      console.error("[useContractIntelligence] onResolveConflict error:", err);
    } finally {
      setCardLoading(cardKey, false);
    }
  }, [editor]);

  // ── Auto-optimize: batch-fix all "MEDIUM" and "LOW" missing clauses ───────

  const onAutoOptimize = useCallback(async () => {
    if (!editor || !contractReview) return;
    const autoTargets = (contractReview.missingClauses ?? []).filter(
      (c) => (c.severity ?? "HIGH") !== "HIGH",
    );
    for (const clause of autoTargets) {
      const cardKey = `missing-${clause.title}`;
      await onRewriteClause(
        clause.title,
        "missing",
        cardKey,
        clause.insertAfter,
        clause.createNewSection,
        clause.suggestedSectionNumber,
      );
      // Small delay between insertions to let ProseMirror settle
      await new Promise((r) => setTimeout(r, 300));
    }
  }, [editor, contractReview, onRewriteClause]);

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    contractReview,
    reviewLoading,
    riskGenerating,
    scoreTrend,
    onRunReview,
    onRewriteClause,
    onInsertClause,
    onDismissCard,
    onDraftSection,
    onResolveConflict,
    onAutoOptimize,
  };
}