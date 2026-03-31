"use client";

import { useMemo, useState, useEffect } from "react";

import { JsonEditor } from "@/components/editor/JsonEditor";
import { FormyxaToolbar } from "@/components/editor/FormyxaToolbar";
import { FormyxaSidebar } from "@/components/editor/FormyxaSidebar";
import { ContractIntelligencePanel } from "@/components/editor/ContractIntelligencePanel";
import type { StructurePage } from "@/components/editor/FormyxaSidebar";
import { useCoverMetaSync } from "@/hooks/useCoverMetaSync";
// import { DocCanvasWrapper, useDocMetaFields } from "@/components/editor/DocCanvasWrapper";
import { contextAwareInsert } from "@/lib/intelligence/clauseInsertion";
// CHANGE 9: unified extractFieldValues import from riskEngine
import { extractFieldValues } from "@/lib/intelligence/riskEngine";

// ─── PATCH v4 NEW IMPORTS ────────────────────────────────────────────────────
import { ClauseReviewModal, type PendingClause } from "@/components/editor/ClauseReviewModal";
import { DraftSectionModal, getContextualPrompt, type DraftSectionTarget } from "@/components/editor/DraftSectionModal";
import { detectConflicts, getConflictsForSection } from "@/lib/intelligence/conflictDetector";
// ─────────────────────────────────────────────────────────────────────────────

import type { BrandProfile, SignatoryProfile } from "@/components/editor/types/doc-layout";
import {
  runRiskEngine,
  computeContractScore,
} from "@/lib/intelligence/riskEngine";

import { useContractIntelligence } from "@/components/editor/useContractIntelligence";


type BuilderClientProps = {
  docId: string;
  title: string;
  initialContentJson?: any;
  templateSlug: string;
  placeholderSchema?: Record<string, { label: string }>;
  brand: BrandProfile | null;
  signatory: SignatoryProfile | null;
  initialDesignKey?: string;
  templateContentJson?: any;
};

// ─────────────────────────────────────────────────────────────────────────────

function ensureDocxName(name: string) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "Untitled Document.docx";
  return trimmed.toLowerCase().endsWith(".docx") ? trimmed : `${trimmed}.docx`;
}

function extractHeadings(doc: any): Array<{ id: string; name: string; wordCount: number }> {
  const out: Array<{ id: string; name: string; wordCount: number }> = [];
  const nodes: any[] = Array.isArray(doc?.content) ? doc.content : [];

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n?.type === "heading") {
      const text =
        (n.content || []).map((c: any) => (c.type === "text" ? c.text : "")).join("").trim() ||
        "Heading";
      let words = 0;
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[j]?.type === "heading") break;
        const paraText = (nodes[j]?.content || [])
          .map((c: any) => (c.type === "text" ? c.text : ""))
          .join("")
          .trim();
        words += paraText ? paraText.split(/\s+/).filter(Boolean).length : 0;
      }
      out.push({ id: `h-${out.length + 1}`, name: text, wordCount: words });
    }
  }
  return out.slice(0, 12);
}

function renumberHeadings(editor: any) {
  if (!editor) return;
  const changes: Array<{ from: number; to: number; newText: string }> = [];
  let counter = 1;
  editor.state.doc.descendants((node: any, pos: number) => {
    if (node.type.name === "heading" && node.attrs.level === 2) {
      const rawText = node.textContent || "";
      const cleanText = rawText.replace(/^\d+\.\s*/, "").trim();
      const newText = `${counter}. ${cleanText}`;
      counter++;
      const from = pos + 1;
      const to = from + rawText.length;
      if (rawText !== newText) changes.push({ from, to, newText });
    }
  });
  if (changes.length === 0) return;
  changes.sort((a, b) => b.from - a.from);
  editor.chain().command(({ tr }: any) => {
    for (const { from, to, newText } of changes) tr.insertText(newText, from, to);
    return true;
  }).run();
}

function detectMissingSections(templateDoc: any, currentDoc: any) {
  const required: { key: string; text: string }[] = [];
  const existing: string[] = [];
  const walkTpl = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.type === "heading" && n.attrs?.required) {
        const text = (n.content ?? []).map((c: any) => c.text || "").join("").trim();
        if (text) required.push({ key: n.attrs.sectionKey ?? text, text });
      }
      if (n.content) walkTpl(n.content);
    }
  };
  const walkDoc = (nodes: any[]) => {
    for (const n of nodes) {
      if (n.type === "heading") {
        const text = (n.content ?? []).map((c: any) => c.text || "").join("").trim();
        if (text) existing.push(text.toLowerCase());
      }
      if (n.content) walkDoc(n.content);
    }
  };
  walkTpl(templateDoc?.content ?? []);
  walkDoc(currentDoc?.content ?? []);
  return required
    .filter((r) => !existing.some((e) => e.includes(r.text.toLowerCase())))
    .map((r) => ({ sectionText: r.text, sectionKey: r.key }));
}

type UnfilledSection = {
  sectionHeading: string;
  fields: Array<{ fieldKey: string; placeholder: string }>;
};

const PLACEHOLDER_PREFIXES = ["enter ", "provide ", "specify ", "describe ", "state ", "define "];
function isPlaceholderText(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  const lower = text.trim().toLowerCase();
  return PLACEHOLDER_PREFIXES.some((p) => lower.startsWith(p));
}

function detectUnfilledFields(doc: any): UnfilledSection[] {
  const sections: UnfilledSection[] = [];
  let currentHeading = "Document";
  const walkNode = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "heading")
      currentHeading = (node.content ?? []).map((c: any) => c.text || "").join("").trim() || "Section";
    if (node.type === "paragraph" && node.attrs?.field) {
      const text = (node.content ?? []).map((c: any) => c.text || "").join("").trim();
      if (isPlaceholderText(text)) {
        let group = sections.find((s) => s.sectionHeading === currentHeading);
        if (!group) { group = { sectionHeading: currentHeading, fields: [] }; sections.push(group); }
        group.fields.push({ fieldKey: node.attrs.field, placeholder: text });
      }
    }
    if (Array.isArray(node.content)) node.content.forEach(walkNode);
  };
  (doc?.content ?? []).forEach(walkNode);
  return sections;
}

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GHOST SECTION DETECTION
// A "ghost" section has a heading but zero real user-added words beneath it —
// only empty nodes, placeholder paragraphs, or instructional field prompts.
// These need "Draft" (Fill) not "Rewrite" (Fix).
// ─────────────────────────────────────────────────────────────────────────────

type GhostSection = {
  sectionName: string;
  /** 0–100. 0 = completely empty / ghost */
  clarityPct: number;
};

function detectGhostSections(doc: any): GhostSection[] {
  const results: GhostSection[] = [];
  const nodes: any[] = doc?.content ?? [];

  // Node types that count as "real structural content" regardless of text
  const STRUCTURAL_TYPES = new Set([
    "table",
    "bulletList",
    "orderedList",
    "codeBlock",
    "blockquote",
    "signaturesBlock",
    "coverMetadata",
  ]);

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n?.type !== "heading") continue;

    // ── FIX 1: Skip level-1 headings (document titles like "STATEMENT OF WORK")
    // These are cover/title nodes, not draftable section containers.
    if (n?.attrs?.level === 1) continue;

    const headingText = (n.content ?? []).map((c: any) => c.text ?? "").join("").trim();
    if (!headingText) continue;

    let realWordCount = 0;
    let totalNodes = 0;
    let hasStructuralContent = false;

    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[j]?.type === "heading") break;
      totalNodes++;
      const node = nodes[j];

      // ── FIX 2: Structural nodes (tables, lists, etc.) = section is NOT empty
      if (STRUCTURAL_TYPES.has(node?.type)) {
        hasStructuralContent = true;
        break; // no need to keep scanning — section is filled
      }

      // Plain text counting (unchanged)
      const rawText = (node?.content ?? [])
        .map((c: any) => c.text ?? "")
        .join("")
        .trim();
      if (!rawText) continue;
      if (isPlaceholderText(rawText)) continue;
      realWordCount += rawText.split(/\s+/).filter(Boolean).length;
    }

    // ── If section has a table/list/etc, it is NOT a ghost — skip it
    if (hasStructuralContent) continue;

    if (totalNodes > 0 && realWordCount === 0) {
      results.push({ sectionName: headingText, clarityPct: 0 });
    } else if (totalNodes > 0 && realWordCount < 5) {
      results.push({ sectionName: headingText, clarityPct: Math.round((realWordCount / 5) * 20) });
    }
  }

  return results;
}

export default function BuilderClient({
  docId,
  title,
  initialContentJson,
  templateContentJson,
  templateSlug,
  placeholderSchema,
  brand,
  signatory,
  initialDesignKey,
}: BuilderClientProps) {
  const initialDoc = useMemo(
    () => initialContentJson ?? { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }] },
    [initialContentJson],
  );

  const [contentJson, setContentJson] = useState<any>(initialDoc);
  const [editor, setEditor] = useState<any>(null);
  const [fileName, setFileName] = useState(ensureDocxName(title || "Untitled Document"));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const designKey = initialDesignKey ?? "standard";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] =
    useState<"structure" | "snippets" | "variables" | "brand" | "signatory">("structure");
  const [brandState, setBrandState] = useState<BrandProfile | null>(brand);
  const [signatoryState, setSignatoryState] = useState<SignatoryProfile | null>(signatory);

  const [hasSignaturesBlock, setHasSignaturesBlock] = useState(false);

  const { coverMeta, setCoverMeta } = useCoverMetaSync(editor);


  ////////////////////////////////////////////////////////
  const intelligence = useContractIntelligence(editor);

  useEffect(() => {
    if (!contentJson?.content) return;
    setHasSignaturesBlock(
      contentJson.content.some((n: any) => n.type === "signaturesBlock")
    );
  }, [contentJson]);

  function handleAddSignaturesBlock() {
    if (!editor) return;
    const json = editor.getJSON();
    if ((json.content ?? []).some((n: any) => n.type === "signaturesBlock")) return;
    editor.commands.insertContentAt(editor.state.doc.content.size, {
      type: "signaturesBlock",
      attrs: { leftTitle: "CLIENT", rightTitle: "SERVICE PROVIDER" },
    });
  }

  function handleRemoveSignaturesBlock() {
    if (!editor) return;
    editor.state.doc.descendants((node: any, pos: number) => {
      if (node.type.name === "signaturesBlock") {
        editor.view.dispatch(
          editor.state.tr.delete(pos, pos + node.nodeSize)
        );
      }
    });
  }

  const [aiRanOnce, setAiRanOnce] = useState(false);
  const [missingSections, setMissingSections] = useState<
    Array<{ sectionText: string; sectionKey: string; generating: boolean }>
  >([]);
  const [unfilledSections, setUnfilledSections] = useState<UnfilledSection[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<
    Array<{ title: string; reason: string; content: string }>
  >([]);

  const [extraInfo, setExtraInfo] = useState<
    Array<{ label: string; content: string; section: string; inserted?: boolean }>
  >([]);

  // CHANGE 2: Added reviewLoading state alongside contractReview
  const [contractReview, setContractReview]   = useState<any>(null);
  const [reviewLoading, setReviewLoading]     = useState(false);
  const [riskGenerating, setRiskGenerating]   = useState<Record<string, boolean>>({});

  // ─── PATCH v4: NEW STATE ─────────────────────────────────────────────────
  const [pendingClause, setPendingClause] = useState<PendingClause | null>(null);
  const [docConflicts, setDocConflicts] = useState<any[]>([]);
  // ─── Ghost section drafting (Fill vs Fix) ────────────────────────────────
  const [draftTarget, setDraftTarget] = useState<DraftSectionTarget | null>(null);
  const [ghostSections, setGhostSections] = useState<GhostSection[]>([]);
  // ─────────────────────────────────────────────────────────────────────────

  const [sectionSuggestions, setSectionSuggestions] = useState<
    Record<string, { loading: boolean; suggested: string | null }>
  >({});
  const [insertedSections, setInsertedSections] = useState<Set<string>>(new Set());

  const SHORT_THRESHOLD = 15;

  function handleSuggestSection(sectionName: string) {
    if (sectionName === "__open_panel__") {
      setRightPanelMode("completeness");
      return;
    }
    setRightPanelMode("completeness");
    fetchSectionSuggestion(sectionName);
  }

  async function fetchSectionSuggestion(sectionName: string) {
    if (!editor) return;
    setSectionSuggestions((prev) => ({
      ...prev,
      [sectionName]: { loading: true, suggested: null },
    }));
    try {
      const res = await fetch("/api/generate-clause-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionName,
          existingClauseText: null,
          documentText: editor.getText(),
          mode: "addition",
        }),
      });
      const data = await res.json();
      const suggested = data?.replace_with
        ? data.replace_with.replace(new RegExp(`^${sectionName}\\.?\\s*`, "i"), "").trim()
        : null;
      setSectionSuggestions((prev) => ({
        ...prev,
        [sectionName]: { loading: false, suggested },
      }));
    } catch (err) {
      console.error("❌ Section suggestion failed:", err);
      setSectionSuggestions((prev) => ({
        ...prev,
        [sectionName]: { loading: false, suggested: null },
      }));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SMART SECTION INSERTION
  // ─────────────────────────────────────────────────────────────────────────────

  function parseAITextToTiptapNodes(text: string): any[] {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) return [];

    // ── Table detection ──────────────────────────────────────────────────────
    // A table line starts AND ends with "|" and has at least one "|" inside
    const tableLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|") && l.length > 2);
    if (tableLines.length >= 2) {
      // Strip separator rows like |---|---| or | :--- | :---: |
      const isSeparator = (l: string) => /^\|[\s|:=-]+\|$/.test(l);
      const dataLines = tableLines.filter((l) => !isSeparator(l));

      const rows = dataLines.map((line) =>
        line.split("|").slice(1, -1).map((cell) => cell.trim()),
      );

      if (rows.length === 0) return [{ type: "paragraph", content: [{ type: "text", text }] }];

      const [headerRow, ...bodyRows] = rows;

      // Guard: skip if header cells are all empty
      if (headerRow.every((c) => !c)) return [{ type: "paragraph", content: [{ type: "text", text }] }];

      const tableNode: any = {
        type: "table",
        content: [
          {
            type: "tableRow",
            content: headerRow.map((cell) => ({
              type: "tableHeader",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: cell ? [{ type: "text", text: cell }] : [] }],
            })),
          },
          ...bodyRows.map((row) => ({
            type: "tableRow",
            content: row.map((cell) => ({
              type: "tableCell",
              attrs: { colspan: 1, rowspan: 1, colwidth: null },
              content: [{ type: "paragraph", content: cell ? [{ type: "text", text: cell }] : [] }],
            })),
          })),
        ],
      };
      return [tableNode];
    }

    // ── Bullet / numbered list detection ─────────────────────────────────────
    const bulletPattern = /^([-•*]|\d+[.):])\s+/;
    const bulletLines = lines.filter((l) => bulletPattern.test(l));
    if (bulletLines.length >= 2 || (bulletLines.length >= 1 && lines.length === bulletLines.length)) {
      const listItems = bulletLines.map((line) => {
        const cleaned = line.replace(bulletPattern, "").trim();
        return {
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text: cleaned }] }],
        };
      });
      return [{ type: "bulletList", content: listItems }];
    }

    // ── Plain paragraph (possibly multi-line) ─────────────────────────────────
    return lines.map((line) => ({
      type: "paragraph",
      content: [{ type: "text", text: line }],
    }));
  }

  /** Returns true if text looks like a markdown table */
  function looksLikeTable(text: string): boolean {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const tableLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|") && l.length > 2);
    return tableLines.length >= 2;
  }

  /** Returns true if text looks like a markdown list */
  function looksLikeList(text: string): boolean {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const bulletPattern = /^([-•*]|\d+[.):])\s+/;
    return lines.filter((l) => bulletPattern.test(l)).length >= 2;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // JSON-BASED SECTION REPLACEMENT
  // Works entirely in doc JSON space — no ProseMirror positions, no drift.
  // Finds the heading by scanning content[], splices in new nodes, setContent().
  // ─────────────────────────────────────────────────────────────────────────────

  function matchesSectionName(headingNode: any, targetName: string): boolean {
    const hText = (headingNode.content ?? [])
      .map((c: any) => c.text ?? "")
      .join("")
      .replace(/^\d+\.\s*/, "")
      .trim()
      .toLowerCase();
    const target = targetName.replace(/^\d+\.\s*/, "").trim().toLowerCase();
    return hText.includes(target) || target.includes(hText);
  }

  /**
   * Replaces all content nodes in a named section with `newNodes`.
   * Preserves everything before the heading and after the next heading.
   * Returns the updated doc JSON, or null if the section wasn't found.
   */
  function replaceSectionInJson(
    docJson: any,
    sectionName: string,
    newNodes: any[],
  ): any | null {
    const nodes: any[] = docJson?.content ?? [];

    // Find the heading index
    const headingIdx = nodes.findIndex(
      (n) => n.type === "heading" && matchesSectionName(n, sectionName),
    );
    if (headingIdx === -1) return null;

    // Find the next heading (= section end boundary)
    let nextHeadingIdx = nodes.length;
    for (let i = headingIdx + 1; i < nodes.length; i++) {
      if (nodes[i].type === "heading") {
        nextHeadingIdx = i;
        break;
      }
    }

    // Splice: keep everything before heading, keep heading, insert new, keep rest
    const newContent = [
      ...nodes.slice(0, headingIdx + 1),   // everything up to AND including heading
      ...newNodes,                           // replacement content
      ...nodes.slice(nextHeadingIdx),        // from next heading onwards (untouched)
    ];

    return { ...docJson, content: newContent };
  }

  /**
   * Applies a section replacement to the live editor via setContent.
   * Returns true if the section was found and replaced.
   */
  function replaceSectionContent(sectionName: string, newNodes: any[]): boolean {
    const docJson   = editor.getJSON();
    const newDocJson = replaceSectionInJson(docJson, sectionName, newNodes);
    if (!newDocJson) return false;

    // setContent with false = don't emit history entry (keeps undo clean)
    editor.commands.setContent(newDocJson, false);
    return true;
  }

  // Keep getSectionRange for the few places that still need position info
  // (sectionHasTable, sectionHasBulletList, smartFillBullets)
  function getSectionRange(
    editor: any,
    sectionName: string,
  ): { headingPos: number; sectionStart: number; sectionEnd: number; nodesInSection: any[] } | null {
    const topLevel: Array<{ type: string; pos: number; nodeSize: number }> = [];
    editor.state.doc.forEach((child: any, offset: number) => {
      topLevel.push({ type: child.type.name, pos: offset, nodeSize: child.nodeSize });
    });

    const targetName = sectionName.replace(/^\d+\.\s*/, "").trim().toLowerCase();
    const headingIdx = topLevel.findIndex((n) => {
      if (n.type !== "heading") return false;
      const node = editor.state.doc.nodeAt(n.pos);
      if (!node) return false;
      const hText = node.textContent.replace(/^\d+\.\s*/, "").trim().toLowerCase();
      return hText.includes(targetName) || targetName.includes(hText);
    });

    if (headingIdx === -1) return null;

    const headingEntry = topLevel[headingIdx];
    const headingPos   = headingEntry.pos;
    const sectionStart = headingPos + headingEntry.nodeSize;
    let   sectionEnd   = editor.state.doc.content.size;

    for (let i = headingIdx + 1; i < topLevel.length; i++) {
      if (topLevel[i].type === "heading") { sectionEnd = topLevel[i].pos; break; }
    }

    const nodesInSection: any[] = [];
    for (let i = headingIdx + 1; i < topLevel.length; i++) {
      if (topLevel[i].pos >= sectionEnd) break;
      nodesInSection.push(topLevel[i]);
    }

    return { headingPos, sectionStart, sectionEnd, nodesInSection };
  }

  function smartFillBullets(editor: any, sectionStart: number, sectionEnd: number, newItems: any[]): boolean {
    let filled = false;
    const emptyItemPositions: number[] = [];
    editor.state.doc.nodesBetween(sectionStart, sectionEnd, (node: any, pos: number) => {
      if (node.type.name === "listItem" && !node.textContent.trim()) {
        emptyItemPositions.push(pos);
      }
    });
    if (emptyItemPositions.length === 0) return false;

    const itemsToFill   = newItems.slice(0, emptyItemPositions.length);
    const itemsToAppend = newItems.slice(emptyItemPositions.length);
    let tr = editor.state.tr;

    for (let i = itemsToFill.length - 1; i >= 0; i--) {
      const newText = itemsToFill[i]?.content?.[0]?.content?.[0]?.text ?? "";
      if (!newText) continue;
      const emptyItemNode = editor.state.doc.nodeAt(emptyItemPositions[i]);
      if (!emptyItemNode) continue;
      const paraPos  = emptyItemPositions[i] + 1;
      const paraNode = editor.state.doc.nodeAt(paraPos);
      if (!paraNode || paraNode.type.name !== "paragraph") continue;
      tr = tr.insertText(newText, paraPos + 1);
      filled = true;
    }
    if (filled) editor.view.dispatch(tr);

    if (itemsToAppend.length > 0) {
      let bulletListEnd = sectionEnd;
      editor.state.doc.nodesBetween(sectionStart, sectionEnd, (node: any, pos: number) => {
        if (node.type.name === "bulletList") bulletListEnd = pos + node.nodeSize;
      });
      editor.chain().insertContentAt(bulletListEnd, itemsToAppend).run();
    }
    return true;
  }

  function sectionHasTable(editor: any, sectionStart: number, sectionEnd: number): boolean {
    let found = false;
    editor.state.doc.nodesBetween(sectionStart, sectionEnd, (node: any) => {
      if (node.type.name === "table") found = true;
    });
    return found;
  }

  function sectionHasBulletList(editor: any, sectionStart: number, sectionEnd: number): boolean {
    let found = false;
    editor.state.doc.nodesBetween(sectionStart, sectionEnd, (node: any) => {
      if (node.type.name === "bulletList") found = true;
    });
    return found;
  }

  function insertSectionSuggestion(sectionName: string, suggested: string) {
    if (!editor) return;
    const parsedNodes   = parseAITextToTiptapNodes(suggested);
    const firstNodeType = parsedNodes[0]?.type ?? "paragraph";
    const range         = getSectionRange(editor, sectionName);

    if (!range) {
      editor.chain().insertContentAt(editor.state.doc.content.size, parsedNodes).run();
    } else {
      const { sectionStart, sectionEnd } = range;
      if (firstNodeType === "bulletList" && sectionHasBulletList(editor, sectionStart, sectionEnd)) {
        const newItems  = parsedNodes[0]?.content ?? [];
        const wasFilled = smartFillBullets(editor, sectionStart, sectionEnd, newItems);
        if (!wasFilled) editor.chain().insertContentAt(sectionEnd, parsedNodes).run();
      } else if (firstNodeType === "table" && sectionHasTable(editor, sectionStart, sectionEnd)) {
        console.log("[insertSectionSuggestion] Table already exists — skipping duplicate insert.");
      } else {
        editor.chain().insertContentAt(sectionEnd, parsedNodes).run();
      }
    }

    const updatedDoc = editor.getJSON();
    setContentJson(updatedDoc);
    handleSave(updatedDoc);
    setSectionSuggestions((prev) => { const next = { ...prev }; delete next[sectionName]; return next; });
    setInsertedSections((prev) => new Set(prev).add(sectionName));
  }

  // CHANGE 1: "risk" removed from RightPanelMode — unified into "intelligence"
  type RightPanelMode = "none" | "completion" | "completeness" | "suggestions" | "intelligence" | "extrainfo";
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>("none");

  const liveScore = useMemo(() => {
    const fields = extractFieldValues(contentJson);
    const flags  = runRiskEngine(fields);
    return computeContractScore(flags, fields);
  }, [contentJson]);

  // ─── Ghost sections update live as the doc changes ────────────────────────
  // This ensures "Project Purpose" and other empty sections are ALWAYS detected,
  // even before the user runs a full AI review.
  useEffect(() => {
    setGhostSections(detectGhostSections(contentJson));
  }, [contentJson]);

  const showCompletionPanel =
    aiRanOnce && rightPanelMode === "completion" && (missingSections.length > 0 || unfilledSections.length > 0);

  useEffect(() => {
    if (initialContentJson) setContentJson(initialContentJson);
  }, [initialContentJson]);

  function fillFieldsFromAttrs(node: any, variables: Record<string, string>): any {
    if (!node) return node;
    if (Array.isArray(node)) return node.map((n) => fillFieldsFromAttrs(n, variables));
    if (typeof node !== "object") return node;
    const newNode: any = { ...node, attrs: node.attrs ? { ...node.attrs } : undefined };
    if (newNode.type === "formyxaField" && newNode.attrs?.key) {
      const value = variables?.[newNode.attrs.key];
      if (value && String(value).trim()) newNode.attrs = { ...newNode.attrs, value: String(value) };
      return newNode;
    }
    if (newNode.type === "paragraph" && newNode.attrs?.field) {
      const value = variables?.[newNode.attrs.field];
      if (value && String(value).trim()) {
        newNode.content = [{ type: "text", text: String(value) }];
        delete newNode.attrs.instructional;
      }
      return newNode;
    }
    if (Array.isArray(node.content)) {
      newNode.content = node.content.map((c: any) => fillFieldsFromAttrs(c, variables));
    }
    return newNode;
  }

  async function handleDownload() {
    try {
      const res = await fetch(`/api/export-docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentJson, fileName, brand: brandState, signatory }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Export failed");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Export failed:", err);
    }
  }

  async function handleAIGeneration(description: string) {
    if (!editor) return;
    try {
      const res  = await fetch("/api/generate-from-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateSlug, description }),
      });
      const data = await res.json();
      if (!data.fieldValues) return;

      const baseDoc    = editor.getJSON();
      const updatedDoc = fillFieldsFromAttrs(JSON.parse(JSON.stringify(baseDoc)), data.fieldValues);

      editor.commands.setContent(updatedDoc, false);
      setContentJson(updatedDoc);
      setTimeout(() => editor.view.updateState(editor.state), 50);
      await handleSave(updatedDoc);

      setAiRanOnce(true);
      setRightPanelMode("completion");
      if (templateContentJson) {
        const absent = detectMissingSections(templateContentJson, updatedDoc);
        setMissingSections(absent.map((s) => ({ ...s, generating: false })));
      }
      setUnfilledSections(detectUnfilledFields(updatedDoc));

      if (Array.isArray(data.suggestedClauses)) setAiSuggestions(data.suggestedClauses);
      if (Array.isArray(data.extraInfo) && data.extraInfo.length > 0) {
        setExtraInfo(data.extraInfo);
        setRightPanelMode("extrainfo");
      } else if (Array.isArray(data.suggestedClauses) && data.suggestedClauses.length > 0) {
        setRightPanelMode("suggestions");
      }
    } catch (err) {
      console.error("❌ AI generation failed:", err);
    }
  }

  async function handleGenerateMissingSection(sectionText: string, idx: number) {
    if (!editor) return;
    setMissingSections((prev) => prev.map((s, i) => (i === idx ? { ...s, generating: true } : s)));
    try {
      const res  = await fetch("/api/generate-clause-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sectionText, existingClauseText: null, documentText: editor.getText() }),
      });
      const data = await res.json();
      if (!data) return;
      const cleanTitle  = sectionText.replace(/^\d+\.\s*/, "");
      const cleanClause = data.replace_with?.replace(new RegExp(`^${sectionText}\\.?\\s*`, "i"), "")?.trim();
      editor.chain().focus().insertContent([
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: cleanTitle }] },
        { type: "paragraph", content: [{ type: "text", text: cleanClause }] },
      ]).run();
      renumberHeadings(editor);
      const updatedDoc = editor.getJSON();
      setContentJson(updatedDoc);
      await handleSave(updatedDoc);
      setMissingSections((prev) => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error("❌ Section generation failed:", err);
      setMissingSections((prev) => prev.map((s, i) => (i === idx ? { ...s, generating: false } : s)));
    }
  }

  // CHANGE 4: handleContractReview opens intelligence panel immediately with spinner
  async function handleContractReview() {
    if (!editor) return;
    setReviewLoading(true);
    setRightPanelMode("intelligence"); // open unified panel immediately — shows spinner
    const docJson = editor.getJSON();
    const fields  = extractFieldValues(docJson);
    try {
      const res  = await fetch("/api/review-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: docJson, templateSlug, fields }),
      });
      const data = await res.json();

      // ── Deduplicate clauses from API (same title/section = same card) ────────
      const deduped = {
        ...data,
        missingClauses: data.missingClauses
          ? Array.from(
              new Map(data.missingClauses.map((m: any) => [m.title?.toLowerCase(), m])).values()
            )
          : [],
        weakClauses: data.weakClauses
          ? Array.from(
              new Map(data.weakClauses.map((w: any) => [w.section?.toLowerCase(), w])).values()
            )
          : [],
      };

      setContractReview(deduped);
      setRiskGenerating({});

      // ─── PATCH v4: Detect conflicts after review loads ───────────────────
      const freshConflicts = detectConflicts(docJson);
      setDocConflicts(freshConflicts);
      // ─── Detect ghost sections (fill vs fix separation) ──────────────────
      setGhostSections(detectGhostSections(docJson));
      // ─────────────────────────────────────────────────────────────────────
    } finally {
      setReviewLoading(false);
    }
  }

  // CHANGE 3: onDismissCard handler
  function handleDismissCard(type: "missing" | "weak", identifier: string) {
    setContractReview((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        missingClauses: type === "missing"
          ? prev.missingClauses?.filter((m: any) => m.title !== identifier)
          : prev.missingClauses,
        weakClauses: type === "weak"
          ? prev.weakClauses?.filter((w: any) => w.section !== identifier)
          : prev.weakClauses,
      };
    });
  }

  // ─── CONFLICT RESOLUTION ─────────────────────────────────────────────────
  // Generates an AI fix for a conflict between two sections.
  // Uses sectionA as the primary target — rewrites it to align with sectionB.
  async function handleResolveConflict(sectionA: string, sectionB: string, cardKey: string) {
    if (!editor) return;
    setRiskGenerating((prev) => ({ ...prev, [cardKey]: true }));
    try {
      const docJson = editor.getJSON();
      const documentText = editor.getText();

      // Extract current text of sectionA for context
      let existingText = "";
      editor.state.doc.descendants((node: any, pos: number) => {
        if (existingText) return false;
        if (node.type.name === "heading") {
          const ht = node.textContent.toLowerCase().replace(/^\d+\.\s*/, "");
          const sl = sectionA.toLowerCase().replace(/^\d+\.\s*/, "");
          if (ht.includes(sl) || sl.includes(ht)) {
            const headingEnd = pos + node.nodeSize;
            editor.state.doc.nodesBetween(
              headingEnd,
              Math.min(headingEnd + 2000, editor.state.doc.content.size),
              (child: any) => {
                if (existingText) return false;
                if (child.type.name === "paragraph") existingText = child.textContent;
              },
            );
          }
        }
      });

      const res = await fetch("/api/generate-clause-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionA,
          existingClauseText: existingText || null,
          documentText,
          conflictingSection: sectionB,
          mode: "conflict-resolution",
        }),
      });
      const data = await res.json();
      if (!data?.replace_with) return;

      const suggestedText = data.replace_with
        .replace(new RegExp(`^${sectionA}\\.?\\s*`, "i"), "")
        .trim();

      setPendingClause({
        title: sectionA,
        riskType: "weak",
        cardKey,
        targetSectionHeading: sectionA,
        existingText,
        suggestedText,
        issue: `Conflict with "${sectionB}": ${data.issue ?? "Payment due date is defined differently between these sections."}`,
        conflicts: [],
      });
    } catch (err) {
      console.error("❌ Conflict resolution failed:", err);
    } finally {
      setRiskGenerating((prev) => ({ ...prev, [cardKey]: false }));
    }
  }



  // ─── PATCH v4 C: UPDATED handleRiskGenerateFix — opens modal, no direct insert ───
  async function handleRiskGenerateFix(
    title: string,
    riskType: "missing" | "weak",
    cardKey: string,
    targetSectionHeading?: string,
  ) {
    if (!editor) return;
    setRiskGenerating((prev) => ({ ...prev, [cardKey]: true }));
    try {
      const docJson = editor.getJSON();
      const documentText = editor.getText();

      // ── Extract existing text from the section (for the diff view) ────────
      let existingText = "";
      const sectionTarget = targetSectionHeading ?? title;
      editor.state.doc.descendants((node: any, pos: number) => {
        if (existingText) return false;
        if (node.type.name === "heading") {
          const ht = node.textContent.toLowerCase().replace(/^\d+\.\s*/, "");
          const sl = sectionTarget.toLowerCase().replace(/^\d+\.\s*/, "");
          if (ht.includes(sl) || sl.includes(ht)) {
            const headingEnd = pos + node.nodeSize;
            editor.state.doc.nodesBetween(
              headingEnd,
              Math.min(headingEnd + 2000, editor.state.doc.content.size),
              (child: any) => {
                if (existingText) return false;
                if (child.type.name === "paragraph") existingText = child.textContent;
              },
            );
          }
        }
      });

      // ── Call AI for suggestion ────────────────────────────────────────────
      const res = await fetch("/api/generate-clause-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionTarget,
          existingClauseText: existingText || null,
          documentText,
          mode: riskType === "missing" ? "addition" : undefined,
        }),
      });
      const data = await res.json();
      if (!data?.replace_with) return;

      const suggestedText = data.replace_with
        .replace(new RegExp(`^${title}\\.?\\s*`, "i"), "")
        .trim();

      // ── Detect conflicts relevant to this section ─────────────────────────
      const allConflicts = detectConflicts(docJson);
      const relevantConflicts = getConflictsForSection(allConflicts, sectionTarget);
      setDocConflicts(allConflicts);

      // ── Get issue text from the contractReview card ───────────────────────
      const issueText =
        contractReview?.weakClauses?.find(
          (w: any) => w.section?.toLowerCase() === title.toLowerCase(),
        )?.issue ??
        contractReview?.missingClauses?.find(
          (m: any) => m.title?.toLowerCase() === title.toLowerCase(),
        )?.reason ??
        data.issue ??
        "AI-generated improvement";

      // ── Open the review modal (DO NOT INSERT YET) ─────────────────────────
      setPendingClause({
        title,
        riskType,
        cardKey,
        targetSectionHeading: sectionTarget,
        existingText,
        suggestedText,
        issue: issueText,
        conflicts: relevantConflicts,
      });
    } catch (err) {
      console.error("❌ Risk fix generation failed:", err);
    } finally {
      setRiskGenerating((prev) => ({ ...prev, [cardKey]: false }));
    }
  }

  // ─── WEAK SECTION IN-PLACE REPLACE ───────────────────────────────────────
  // Uses JSON-based replacement — no ProseMirror positions.
  function replaceWeakSectionContent(
    targetSection: string,
    parsedNodes: any[],
  ): boolean {
    return replaceSectionContent(targetSection, parsedNodes);
  }

  // ─── PATCH v4 D: handleAcceptClause — runs after user clicks "Accept & Insert" ───
  async function handleAcceptClause(finalText: string, clause: PendingClause) {
    if (!editor || !clause || !finalText) return;
    setPendingClause(null); // close modal immediately for responsiveness

    const parsedNodes  = parseAITextToTiptapNodes(finalText);
    const targetSection = clause.targetSectionHeading ?? clause.title;
    const isStructured  = looksLikeTable(finalText) || looksLikeList(finalText);

    if (clause.riskType === "weak") {
      // ── WEAK: replace in-place using JSON splice (works for any node type) ──
      const replaced = replaceWeakSectionContent(targetSection, parsedNodes);
      if (!replaced) {
        // Section not found by name — try contextAwareInsert as fallback
        // (it will try to find or create the section at the right template position)
        contextAwareInsert(
          editor,
          templateContentJson,
          targetSection,
          finalText,
          "weak",
        );
      }

    } else if (isStructured) {
      // ── MISSING + STRUCTURED: table or list ──────────────────────────────────
      // Check if section already has the same structure type — if so, replace it.
      // Otherwise append the new content at the end of the section.
      const range = getSectionRange(editor, targetSection);
      if (range) {
        const { sectionStart, sectionEnd } = range;
        const hasTable  = sectionHasTable(editor, sectionStart, sectionEnd);
        const hasList   = sectionHasBulletList(editor, sectionStart, sectionEnd);

        if ((parsedNodes[0]?.type === "table" && hasTable) ||
            (parsedNodes[0]?.type === "bulletList" && hasList)) {
          // Replace entire section content (remove old structure + add new)
          replaceSectionContent(targetSection, parsedNodes);
        } else if (parsedNodes[0]?.type === "bulletList" && hasList) {
          const newItems  = parsedNodes[0]?.content ?? [];
          const wasFilled = smartFillBullets(editor, sectionStart, sectionEnd, newItems);
          if (!wasFilled) replaceSectionContent(targetSection, parsedNodes);
        } else {
          // Append new structured content at end of section (via JSON splice)
          const docJson    = editor.getJSON();
          const nodes: any[] = docJson?.content ?? [];
          const headingIdx = nodes.findIndex(
            (n) => n.type === "heading" && matchesSectionName(n, targetSection),
          );
          if (headingIdx !== -1) {
            let insertIdx = nodes.length;
            for (let i = headingIdx + 1; i < nodes.length; i++) {
              if (nodes[i].type === "heading") { insertIdx = i; break; }
            }
            const newContent = [
              ...nodes.slice(0, insertIdx),
              ...parsedNodes,
              ...nodes.slice(insertIdx),
            ];
            editor.commands.setContent({ ...docJson, content: newContent }, false);
          } else {
            editor.chain().insertContentAt(editor.state.doc.content.size, parsedNodes).run();
          }
        }
      } else {
        editor.chain().insertContentAt(editor.state.doc.content.size, parsedNodes).run();
      }

    } else {
      // ── MISSING + PLAIN TEXT ────────────────────────────────────────────────
      // STEP 1: Try JSON-based in-place replacement first. This works for ANY
      // node type under the heading (paragraphs, formyxaField, tables, lists).
      // This correctly handles sections that exist but are filled with placeholder
      // content or unfilled formyxaField nodes.
      const replaced = replaceSectionContent(targetSection, parsedNodes);

      if (!replaced) {
        // STEP 2: Section truly does not exist in the doc — insert it at the
        // correct template-ordered position via contextAwareInsert.
        contextAwareInsert(
          editor,
          templateContentJson,
          targetSection,
          finalText,
          clause.riskType,
        );
      }
    }

    // Renumber headings and save
    await new Promise((r) => setTimeout(r, 50));
    renumberHeadings(editor);
    const updatedDoc = editor.getJSON();
    setContentJson(updatedDoc);
    await handleSave(updatedDoc);

    // Remove the resolved risk card from the sidebar
    setContractReview((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        missingClauses: prev.missingClauses?.filter(
          (m: any) => m.title?.toLowerCase() !== clause.title.toLowerCase(),
        ),
        weakClauses: prev.weakClauses?.filter(
          (w: any) => w.section?.toLowerCase() !== clause.title.toLowerCase(),
        ),
      };
    });

    // Re-scan for conflicts after the change
    setTimeout(() => {
      const freshDoc = editor.getJSON();
      setDocConflicts(detectConflicts(freshDoc));
    }, 100);
  }

  // ─── PATCH v4 E: handleRejectClause — user dismissed the modal ──────────────
  function handleRejectClause() {
    setPendingClause(null);
  }

  // ─── GHOST SECTION: Open draft modal ────────────────────────────────────
  // Called from ContractIntelligencePanel when user clicks "Draft Section"
  // on a ghost/empty section card.
  function handleDraftSection(sectionName: string) {
    const { prompt, placeholder } = getContextualPrompt(sectionName);
    setDraftTarget({ sectionName, prompt, placeholder });
  }

  // ─── GHOST SECTION: Accept the generated draft and insert surgically ─────
  async function handleAcceptDraft(
    sectionName: string,
    _userAnswer: string,
    generatedText: string,
  ) {
    if (!editor || !generatedText.trim()) return;
    setDraftTarget(null); // close modal immediately

    // Parse AI text into Tiptap JSON nodes (handles tables, lists, paragraphs)
    const parsedNodes = parseAITextToTiptapNodes(generatedText);

    // ── JSON-based replacement — no ProseMirror positions, no drift ──────────
    // replaceSectionContent finds the heading by name in the doc JSON array,
    // splices in new nodes, and calls setContent. 100% reliable.
    const replaced = replaceSectionContent(sectionName, parsedNodes);

    if (!replaced) {
      // Section heading not found — append at end as fallback
      editor.chain().insertContentAt(editor.state.doc.content.size, parsedNodes).run();
    }

    await new Promise((r) => setTimeout(r, 50));
    renumberHeadings(editor);

    const updatedDoc = editor.getJSON();
    setContentJson(updatedDoc);
    await handleSave(updatedDoc);

    // Remove from ghost sections list (it's been filled)
    setGhostSections((prev) =>
      prev.filter((g) => g.sectionName.toLowerCase() !== sectionName.toLowerCase()),
    );

    // Re-scan conflicts
    setTimeout(() => setDocConflicts(detectConflicts(editor.getJSON())), 100);
  }

  async function handleSave(docOverride?: any) {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentJson: docOverride ?? contentJson, brand: brandState, signatory }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Saved");
    } catch (err) {
      console.error(err);
      setMessage("Could not save");
    } finally {
      setSaving(false);
    }
  }

  const pages: StructurePage[] = useMemo(() => {
    const headings = extractHeadings(contentJson);
    return [{
      id: "page-1",
      name: "Document",
      sections: headings.map((h) => ({
        id: h.id,
        name: h.name,
        wordCount: h.wordCount,
        onClick: () => document.getElementById("formyxa-doc-top")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      })),
    }];
  }, [contentJson]);

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">

      {/* ─── PATCH v4 F: ClauseReviewModal — rendered at root level, above everything ─ */}
      {pendingClause && (
        <ClauseReviewModal
          pending={pendingClause}
          onAccept={handleAcceptClause}
          onReject={handleRejectClause}
        />
      )}

      {/* ─── Ghost section draft modal (Fill, not Fix) ─────────────────────── */}
      {draftTarget && (
        <DraftSectionModal
          target={draftTarget}
          onAccept={handleAcceptDraft}
          onReject={() => setDraftTarget(null)}
        />
      )}

      {/* ── TOOLBAR ── */}
      <FormyxaToolbar
        templateSlug={templateSlug}
        onGenerateFromAI={handleAIGeneration}
        onRunRiskReview={handleContractReview}
        documentName={fileName}
        onDocumentNameChange={(n) => setFileName(ensureDocxName(n))}
        editor={editor}
        saving={saving}
        statusText={message}
        onSave={() => handleSave()}
        onExport={handleDownload}
        zoom={zoom}
        onZoomChange={setZoom}
        onOpenIntelligence={() => setRightPanelMode(rightPanelMode === "intelligence" ? "none" : "intelligence")}
        intelligenceActive={rightPanelMode === "intelligence"}
        contractScore={liveScore.total}
        intelligenceIssueCount={
          ghostSections.length +
          (liveScore.breakdown.payment < 60 || liveScore.breakdown.termination < 60 ? 1 : 0)
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <FormyxaSidebar
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          activeTab={activeTab as any}
          onTabChange={setActiveTab as any}
          pages={pages}
          brand={brandState}
          onBrandChange={setBrandState}
          signatory={signatoryState}
          onSignatoryChange={setSignatoryState}
          onSuggestSection={handleSuggestSection}
          hasSignaturesBlock={hasSignaturesBlock}
          onAddSignaturesBlock={handleAddSignaturesBlock}
          onRemoveSignaturesBlock={handleRemoveSignaturesBlock}
          coverMeta={coverMeta}
          onCoverMetaChange={setCoverMeta}
        />

        <JsonEditor
          chrome="canvas"
          zoom={zoom}
          onZoomChange={setZoom}
          onEditorReady={setEditor}
          initialDoc={contentJson}
          fileName={fileName}
          onFileNameChange={(n) => setFileName(ensureDocxName(n))}
          onDocChange={(doc) => setContentJson(doc)}
          onSave={handleSave}
          templateSlug={templateSlug}
          placeholderSchema={placeholderSchema}
          designKey={designKey}
          brand={brandState || undefined}
          signatory={signatoryState || undefined}
        />

        {/* ══ COMPLETENESS PANEL ══════════════════════════════════════════════ */}
        {rightPanelMode === "completeness" && (() => {
          const shortSections = pages.flatMap((p) => p.sections).filter(
            (s) =>
              typeof s.wordCount === "number" &&
              s.wordCount < SHORT_THRESHOLD &&
              !insertedSections.has(s.name)
          );
          return (
            <div className="w-[340px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-200/60 dark:border-slate-700/60 shadow-[-10px_0_40px_rgba(2,6,23,0.08)] flex flex-col overflow-hidden">
              <div className="px-6 pt-6 pb-5 border-b border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-indigo-50/40 via-white to-white dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🟡</span>
                    <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white tracking-tight">Completeness Check</h3>
                  </div>
                  <button onClick={() => { setRightPanelMode("none"); setSectionSuggestions({}); setInsertedSections(new Set()); }} className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700">✕</button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                  {shortSections.length} section{shortSections.length !== 1 ? "s" : ""} could use more content. Get an AI suggestion, then insert it.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                {shortSections.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">All sections look complete!</p>
                  </div>
                )}
                {shortSections.map((section) => {
                  const st        = sectionSuggestions[section.name];
                  const isLoading = st?.loading;
                  const suggested = st?.suggested ?? null;
                  const failed    = st && !isLoading && !suggested;
                  return (
                    <div key={section.id} className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10 overflow-hidden">
                      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 flex-1 truncate">{section.name}</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 shrink-0">~{section.wordCount}w</span>
                      </div>
                      {!st && (<div className="px-3 pb-3"><button onClick={() => fetchSectionSuggestion(section.name)} className="w-full text-[11px] font-semibold py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition">✦ Get AI Suggestion</button></div>)}
                      {isLoading && (<div className="px-3 pb-3 flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400"><span className="animate-spin inline-block">✦</span><span>Generating…</span></div>)}
                      {!isLoading && suggested && (
                        <div className="px-3 pb-3 space-y-2">
                          <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 p-2.5">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Suggested Addition</p>
                            <p className="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">{suggested}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => insertSectionSuggestion(section.name, suggested)} className="flex-1 text-[11px] font-bold py-1.5 rounded-lg text-white transition" style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>✓ Insert</button>
                            <button onClick={() => setSectionSuggestions((prev) => { const n = { ...prev }; delete n[section.name]; return n; })} className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">Dismiss</button>
                          </div>
                        </div>
                      )}
                      {failed && (<div className="px-3 pb-3 space-y-1.5"><p className="text-[11px] text-red-500">Could not generate.</p><button onClick={() => fetchSectionSuggestion(section.name)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition">Retry</button></div>)}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <button onClick={() => { setRightPanelMode("none"); setSectionSuggestions({}); setInsertedSections(new Set()); }} className="w-full text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition py-1 rounded">Close</button>
              </div>
            </div>
          );
        })()}

        {/* ══ CONTRACT INTELLIGENCE PANEL — PATCH v4 G: now receives docConflicts ══ */}
        {rightPanelMode === "intelligence" && (
          <ContractIntelligencePanel
            doc={contentJson}
            onClose={() => setRightPanelMode("none")}
            onRewriteClause={handleRiskGenerateFix}  // now opens modal, not direct insert
            contractReview={contractReview}
            reviewLoading={reviewLoading}
            onRunReview={handleContractReview}
            riskGenerating={riskGenerating}
            onDismissCard={handleDismissCard}
            docConflicts={docConflicts}               // ← conflict cards
            ghostSections={ghostSections}             // ← empty sections needing drafting
            onDraftSection={handleDraftSection}       // ← opens DraftSectionModal
            onResolveConflict={handleResolveConflict} // ← generate fix for conflicts
            onInsertClause={(heading, body) => {
              if (!editor) return;
              const endPos = editor.state.doc.content.size;
              editor.chain()
                .insertContentAt(endPos, [
                  { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: heading }] },
                  { type: "paragraph", content: [{ type: "text", text: body }] },
                ])
                .run();
              setTimeout(() => {
                renumberHeadings(editor);
                const updatedDoc = editor.getJSON();
                setContentJson(updatedDoc);
                handleSave(updatedDoc);
              }, 50);
            }}
          />
        )}

        {/* ══ POST-AI COMPLETION SIDEBAR ════════════════════════════════════ */}
        {rightPanelMode === "completion" && showCompletionPanel && (
          <div className="w-[300px] bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-[-4px_0_24px_rgba(15,23,42,0.07)] flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">AI Completion Review</h3>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                Here's what the AI filled and what still needs your attention.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {missingSections.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Missing Sections ({missingSections.length})</span>
                  </div>
                  <div className="space-y-2 pl-1">
                    {missingSections.map((section, i) => (
                      <div key={i} className="border border-amber-200 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 space-y-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{section.sectionText}</p>
                        <div className="flex gap-2">
                          <button disabled={section.generating} onClick={() => handleGenerateMissingSection(section.sectionText, i)}
                            className="flex-1 text-xs font-semibold py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 transition">
                            {section.generating ? "Generating…" : "Generate"}
                          </button>
                          <button disabled={section.generating} onClick={() => setMissingSections((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-50 transition">
                            Skip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {unfilledSections.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Needs Your Input ({unfilledSections.reduce((s, g) => s + g.fields.length, 0)})</span>
                  </div>
                  <div className="space-y-2 pl-1">
                    {unfilledSections.map((group, i) => (
                      <div key={i} className="border border-blue-100 bg-blue-50/60 rounded-xl p-3 space-y-1.5">
                        <p className="text-[11px] font-semibold text-slate-700">{group.sectionHeading}</p>
                        {group.fields.map((f, j) => (
                          <div key={j} className="flex items-start gap-1.5 pl-1">
                            <span className="text-blue-400 text-xs mt-0.5 shrink-0">›</span>
                            <span className="text-xs text-slate-600"><span className="font-medium">{f.fieldKey.replace(/_/g, " ")}</span></span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => { setMissingSections([]); setUnfilledSections([]); setAiRanOnce(false); setRightPanelMode("none"); }}
                className="w-full text-[11px] text-slate-400 hover:text-slate-600 transition py-1 rounded">
                Dismiss all
              </button>
            </div>
          </div>
        )}

        {/* ══ EXTRA INFO FROM PROMPT (not in template) ══════════════════════ */}
        {rightPanelMode === "extrainfo" && extraInfo.length > 0 && (
          <div className="w-[300px] bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-[-4px_0_24px_rgba(15,23,42,0.07)] flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">From Your Brief</h3>
                </div>
                <button
                  onClick={() => { setExtraInfo([]); setRightPanelMode("none"); }}
                  className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                >✕</button>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                Your brief contained {extraInfo.length} item{extraInfo.length !== 1 ? "s" : ""} not covered by template fields. Insert them as clauses below.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {extraInfo.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3 space-y-2 transition-all ${
                    item.inserted
                      ? "border-green-200 bg-green-50/60 dark:bg-green-900/10 opacity-60"
                      : "border-indigo-100 bg-indigo-50/50 dark:bg-indigo-900/10 dark:border-indigo-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {item.inserted ? "✓ " : ""}{item.label}
                    </span>
                    {(item.insertAfter || item.section) && (
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide whitespace-nowrap"
                        style={{
                          background: item.createNewSection ? "rgba(20,184,166,0.12)" : "rgba(100,116,139,0.10)",
                          color:      item.createNewSection ? "#0d9488" : "#475569",
                          border:     item.createNewSection ? "1px solid #99f6e4" : "1px solid #e2e8f0",
                        }}
                      >
                        {item.createNewSection ? "✦ New § after " : "↓ inside "}
                        {(item.insertAfter ?? item.section ?? "").replace(/^\d+\.\s*/, "").slice(0, 18)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {item.content}
                  </p>
                  {!item.inserted ? (
                    <div className="flex gap-2 pt-0.5">
                      <button
                        onClick={() => {
                          if (!editor) return;

                          // ── KEY FIX: use placement metadata from API response ──
                          // item.createNewSection = true  → create H2 heading + body
                          // item.createNewSection = false → append paragraph to section
                          // item.insertAfter = which section heading to position after

                          const insertAfter   = item.insertAfter ?? item.section ?? "";
                          const newSection    = item.createNewSection ?? false;

                          if (newSection) {
                            // Create a brand-new H2 section heading + paragraph
                            // using contextAwareInsert which knows how to find the
                            // right position in the template-ordered document.
                            contextAwareInsert(
                              editor,
                              templateContentJson,
                              item.label,          // used as section title
                              item.content,        // body text
                              "missing",           // triggers insertMissingSection path
                            );
                          } else {
                            // Append as a paragraph inside the target section
                            let insertPos = editor.state.doc.content.size;
                            const targetSectionLower = insertAfter.toLowerCase().replace(/^\d+\.\s*/, "");
                            if (targetSectionLower) {
                              editor.state.doc.descendants((node: any, pos: number) => {
                                if (node.type.name === "heading") {
                                  const hText = node.textContent.replace(/^\d+\.\s*/, "").trim().toLowerCase();
                                  if (hText.includes(targetSectionLower) || targetSectionLower.includes(hText)) {
                                    const docSize    = editor.state.doc.content.size;
                                    let   sectionEnd = docSize;
                                    const sectionStart = pos + node.nodeSize;
                                    editor.state.doc.nodesBetween(sectionStart, docSize, (n: any, p: number) => {
                                      if (sectionEnd !== docSize) return false;
                                      if (n.type.name === "heading") { sectionEnd = p; return false; }
                                    });
                                    insertPos = sectionEnd;
                                  }
                                }
                              });
                            }
                            editor.chain()
                              .insertContentAt(insertPos, {
                                type: "paragraph",
                                content: [{ type: "text", text: item.content }],
                              })
                              .run();
                          }

                          const updatedDoc = editor.getJSON();
                          setContentJson(updatedDoc);
                          handleSave(updatedDoc);
                          setExtraInfo((prev) => prev.map((x, idx) => idx === i ? { ...x, inserted: true } : x));
                        }}
                        className="flex-1 text-[11px] font-bold py-1.5 rounded-lg text-white transition"
                        style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                      >
                        ↓ Insert
                      </button>
                      <button
                        onClick={() => setExtraInfo((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      >
                        Skip
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Inserted into document</p>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex gap-2">
              {aiSuggestions.length > 0 && (
                <button
                  onClick={() => setRightPanelMode("suggestions")}
                  className="flex-1 text-[11px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium py-1 rounded transition"
                >
                  Also see {aiSuggestions.length} clause suggestion{aiSuggestions.length !== 1 ? "s" : ""}
                </button>
              )}
              <button
                onClick={() => { setExtraInfo([]); setRightPanelMode("none"); }}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition py-1 px-3 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ══ AI CLAUSE SUGGESTIONS ════════════════════════════════════════ */}
        {rightPanelMode === "suggestions" && aiSuggestions.length > 0 && (
          <div className="w-[300px] bg-gradient-to-b from-white to-slate-50 border-l border-slate-200 shadow-[-8px_0_30px_rgba(15,23,42,0.06)] p-6 space-y-6 overflow-y-auto">
            <h3 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">AI Risk Suggestions ({aiSuggestions.length})</h3>
            {aiSuggestions.map((s, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-all">
                <div className="font-medium text-sm text-slate-800">{s.title}</div>
                <div className="text-xs text-slate-500">⚠ {s.reason}</div>
                <button
                  onClick={() => {
                    if (!editor) return;
                    editor.chain().focus()
                      .insertContent({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: s.title }] })
                      .insertContent({ type: "paragraph", content: [{ type: "text", text: s.content?.replace(/<[^>]+>/g, "") || "" }] })
                      .run();
                    renumberHeadings(editor);
                    setAiSuggestions((prev) => prev.filter((_, index) => index !== i));
                  }}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition">
                  Insert Clause
                </button>
              </div>
            ))}
          </div>
        )}

        {/* CHANGE 7: Old standalone "risk" panel removed — risk cards now live inside ContractIntelligencePanel */}

      </div>
    </div>
  );
}