/**
 * insertClauseAtSection.ts — FIXED v2
 * ─────────────────────────────────────
 * Handles two document structures:
 *
 *  A) Standard flat structure  — H2 heading nodes + paragraph nodes at doc root
 *  B) SemanticBlock structure  — custom block nodes with a `label` attribute
 *     (e.g. SemanticBlock("payment") → node.attrs.label = "3. Payment Terms")
 *
 * Root cause of the "wrong position" bug (v1):
 *   findSectionEnd only iterated `node.type.name === "heading"` nodes.
 *   When the editor uses SemanticBlock wrappers for sections (which render the
 *   numbered heading as `node.attrs.label`), no headings existed at the top
 *   level → sectionEnd was always null → every insert fell back to doc end.
 *
 * This version auto-detects the document style and uses the correct strategy.
 */

import type { Editor } from "@tiptap/react";
import type { Node as PMNode } from "@tiptap/pm/model";

// ── Public types ──────────────────────────────────────────────────────────────

export type InsertOptions = {
  /** Heading text / label to insert AFTER (case-insensitive substring match). */
  insertAfter: string;
  /** true = new section (heading + body); false = append body into existing section. */
  createNewSection: boolean;
  /** Explicit heading text for the new section (overrides auto-generated). */
  newHeading?: string;
  /** Body text to insert. Paragraphs separated by \n\n. */
  newBody: string;
  /** Suggested ordinal for auto-generated heading number. */
  suggestedSectionNumber?: number;
  /** Clause title used when newHeading is absent. */
  clauseTitle?: string;
};

// ── Internal result type ──────────────────────────────────────────────────────

type LocatedSection = {
  /** Absolute position at which to insert new content (after the section). */
  insertPos: number;
  /**
   * For SemanticBlock documents with createNewSection=false:
   * the insertion should happen INSIDE the found block (append to its content).
   * This is the position BEFORE the block's closing bracket.
   */
  appendInsidePos?: number;
  /** Whether the section was found via SemanticBlock matching. */
  isSemanticBlock: boolean;
  /** The SemanticBlock node type name (e.g. "payment") for creating siblings. */
  semanticBlockTypeName?: string;
};

// ── Text normaliser ───────────────────────────────────────────────────────────

/** Strip leading ordinal ("12. " or "A. ") so we can match by keyword. */
function stripOrdinal(s: string): string {
  return s.replace(/^[\dA-Z]+\.\s*/i, "").trim();
}

/** Returns true when `haystack` contains `needle` after normalising. */
function fuzzyMatch(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  const hs = stripOrdinal(h);
  const ns = stripOrdinal(n);
  return (
    h.includes(n) ||
    hs.includes(ns) ||
    ns.includes(hs) ||
    n.includes(hs)
  );
}

// ── Document structure detector ───────────────────────────────────────────────

/**
 * Returns true when the document's top-level nodes include custom block nodes
 * that carry a `label` attribute (i.e. SemanticBlock style).
 */
function documentUsesSemanticBlocks(editor: Editor): boolean {
  let found = false;
  editor.state.doc.forEach((node) => {
    if (!found && node.attrs?.label && node.type.name !== "heading") {
      found = true;
    }
  });
  return found;
}

// ── Strategy A: SemanticBlock locator ─────────────────────────────────────────

function locateSemanticSection(
  editor: Editor,
  insertAfter: string,
): LocatedSection | null {
  const doc = editor.state.doc;
  let targetEnd: number | null = null;
  let appendInside: number | null = null;
  let targetTypeName: string | undefined;
  let targetFound = false;

  doc.forEach((node, offset) => {
    if (targetEnd !== null) return; // already resolved

    // Any block node with a label attr counts as a SemanticBlock section
    if (node.attrs?.label != null) {
      const labelText = String(node.attrs.label);

      if (!targetFound) {
        if (fuzzyMatch(labelText, insertAfter)) {
          targetFound = true;
          targetTypeName = node.type.name;
          // "append inside" = position just before the node's closing bracket
          appendInside = offset + node.nodeSize - 1;
          // "insert after" = position right after this node
          targetEnd = offset + node.nodeSize;
        }
      } else {
        // We've already found the target; this is the NEXT block → section boundary
        targetEnd = offset;
      }
    }
  });

  if (!targetFound) return null;

  return {
    insertPos: targetEnd ?? doc.content.size,
    appendInsidePos: appendInside ?? undefined,
    isSemanticBlock: true,
    semanticBlockTypeName: targetTypeName,
  };
}

// ── Strategy B: Standard heading locator ─────────────────────────────────────

function locateHeadingSection(
  editor: Editor,
  insertAfter: string,
): LocatedSection | null {
  const doc = editor.state.doc;
  let targetFound = false;
  let sectionEnd: number | null = null;

  doc.forEach((node, offset) => {
    if (sectionEnd !== null) return;

    if (node.type.name === "heading" && node.attrs.level <= 2) {
      const text = node.textContent;
      if (!targetFound) {
        if (fuzzyMatch(text, insertAfter)) {
          targetFound = true;
        }
      } else {
        sectionEnd = offset;
      }
    }
  });

  if (!targetFound) return null;

  return {
    insertPos: sectionEnd ?? doc.content.size,
    isSemanticBlock: false,
  };
}

// ── Master locator ────────────────────────────────────────────────────────────

function locateSection(
  editor: Editor,
  insertAfter: string,
): LocatedSection | null {
  if (!insertAfter.trim()) return null;

  // Try SemanticBlock first (document might use both styles)
  const semantic = locateSemanticSection(editor, insertAfter);
  if (semantic) return semantic;

  // Fall back to standard heading scan
  const heading = locateHeadingSection(editor, insertAfter);
  return heading;
}

// ── Build ProseMirror paragraph nodes ────────────────────────────────────────

function buildParagraphs(
  state: Editor["state"],
  body: string,
): PMNode[] {
  return body
    .split(/\n\n+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) =>
      state.schema.nodes.paragraph.create(
        {},
        text ? state.schema.text(text) : undefined,
      ),
    );
}

// ── Build a SemanticBlock-style sibling node ──────────────────────────────────

function buildSemanticNode(
  state: Editor["state"],
  typeName: string,
  label: string,
  body: string,
): PMNode | null {
  const nodeType = state.schema.nodes[typeName];
  if (!nodeType) return null;

  const paragraphs = buildParagraphs(state, body);
  return nodeType.create({ label, id: null, helper: null }, paragraphs);
}

// ── Fallback: append at doc end ───────────────────────────────────────────────

function insertAtDocEnd(editor: Editor, opts: InsertOptions): boolean {
  const { createNewSection, newHeading, newBody, clauseTitle, suggestedSectionNumber } = opts;
  const { state, dispatch } = editor.view;
  const { tr } = state;

  let insertPos = state.doc.content.size;
  const heading =
    newHeading ??
    (suggestedSectionNumber
      ? `${suggestedSectionNumber}. ${clauseTitle ?? "New Section"}`
      : clauseTitle ?? "New Section");

  if (createNewSection) {
    const h = state.schema.nodes.heading.create(
      { level: 2 },
      state.schema.text(heading),
    );
    tr.insert(insertPos, h);
    insertPos += h.nodeSize;
  }

  buildParagraphs(state, newBody).forEach((p) => {
    tr.insert(insertPos, p);
    insertPos += p.nodeSize;
  });

  dispatch(tr);
  editor.view.focus();
  return true;
}

// ── Main public API ───────────────────────────────────────────────────────────

/**
 * Insert a clause into the TipTap document at the correct position.
 *
 * @param editor  TipTap Editor instance (must be mounted and ready).
 * @param opts    Insertion options including placement metadata.
 * @returns       true on success, false if the target section was not found
 *                (falls back to doc end in that case).
 */
export function insertClauseAtSection(
  editor: Editor,
  opts: InsertOptions,
): boolean {
  const {
    insertAfter,
    createNewSection,
    newHeading,
    newBody,
    suggestedSectionNumber,
    clauseTitle,
  } = opts;

  // ── Locate target section ─────────────────────────────────────────────────

  const located = locateSection(editor, insertAfter);

  if (!located) {
    console.warn(
      `[insertClauseAtSection] Section "${insertAfter}" not found — falling back to doc end.`,
    );
    return insertAtDocEnd(editor, opts);
  }

  const { state, dispatch } = editor.view;
  const { tr } = state;

  const heading =
    newHeading ??
    (suggestedSectionNumber
      ? `${suggestedSectionNumber}. ${clauseTitle ?? "New Section"}`
      : clauseTitle ?? "New Section");

  // ── SemanticBlock document path ───────────────────────────────────────────

  if (located.isSemanticBlock) {
    if (createNewSection) {
      // Insert a new SemanticBlock sibling AFTER the found block
      const typeName = located.semanticBlockTypeName!;
      const newBlock = buildSemanticNode(state, typeName, heading, newBody);

      if (newBlock) {
        tr.insert(located.insertPos, newBlock);
        tr.setSelection(
          (state.selection.constructor as any).near(
            tr.doc.resolve(located.insertPos + 1),
          ),
        );
        dispatch(tr);
        editor.view.focus();
        return true;
      }

      // If the schema type isn't accessible, fall back to H2 + paragraphs
      console.warn(
        `[insertClauseAtSection] Schema type "${typeName}" not found. Inserting as H2.`,
      );
    } else {
      // Append paragraphs INSIDE the found SemanticBlock (before its closing bracket)
      const appendPos = located.appendInsidePos ?? located.insertPos;
      const paragraphs = buildParagraphs(state, newBody);
      let pos = appendPos;
      paragraphs.forEach((p) => {
        tr.insert(pos, p);
        pos += p.nodeSize;
      });
      tr.setSelection(
        (state.selection.constructor as any).near(
          tr.doc.resolve(appendPos + 1),
        ),
      );
      dispatch(tr);
      editor.view.focus();
      return true;
    }
  }

  // ── Standard heading document path ───────────────────────────────────────

  const { insertPos } = located;

  if (createNewSection) {
    const headingNode = state.schema.nodes.heading.create(
      { level: 2 },
      state.schema.text(heading),
    );
    const paragraphs = buildParagraphs(state, newBody);

    let pos = insertPos;
    tr.insert(pos, headingNode);
    pos += headingNode.nodeSize;
    paragraphs.forEach((p) => {
      tr.insert(pos, p);
      pos += p.nodeSize;
    });
  } else {
    const paragraphs = buildParagraphs(state, newBody);
    let pos = insertPos;
    paragraphs.forEach((p) => {
      tr.insert(pos, p);
      pos += p.nodeSize;
    });
  }

  tr.setSelection(
    (state.selection.constructor as any).near(
      tr.doc.resolve(insertPos + 1),
    ),
  );
  dispatch(tr);
  editor.view.focus();
  return true;
}

// ── Weak-clause rewrite (replace section body) ────────────────────────────────

/**
 * Replaces the body of a named section with new text.
 *
 * Works with both SemanticBlock and standard heading documents.
 * The heading/label itself is preserved; only the body content is replaced.
 */
export function replaceClauseText(
  editor: Editor,
  sectionHeading: string,
  newText: string,
): boolean {
  const doc = editor.state.doc;
  const { state, dispatch } = editor.view;
  const { tr } = state;

  // ── SemanticBlock path ────────────────────────────────────────────────────

  let semanticFound = false;
  let semanticStart: number | null = null;
  let semanticEnd: number | null = null;

  doc.forEach((node, offset) => {
    if (semanticStart !== null) return;
    if (node.attrs?.label != null) {
      if (fuzzyMatch(String(node.attrs.label), sectionHeading)) {
        // Content range is offset+1 (after opening bracket) to offset+nodeSize-1 (before closing)
        semanticStart = offset + 1;
        semanticEnd = offset + node.nodeSize - 1;
        semanticFound = true;
      }
    }
  });

  if (semanticFound && semanticStart !== null && semanticEnd !== null) {
    const paragraphs = buildParagraphs(state, newText);
    tr.delete(semanticStart, semanticEnd);
    let pos = semanticStart;
    paragraphs.forEach((p) => {
      tr.insert(pos, p);
      pos += p.nodeSize;
    });
    dispatch(tr);
    editor.view.focus();
    return true;
  }

  // ── Standard heading path ─────────────────────────────────────────────────

  const lower = sectionHeading.toLowerCase().trim();
  let sectionStart: number | null = null;
  let sectionEnd: number | null = null;
  let foundHeading = false;

  doc.forEach((node, offset) => {
    if (sectionEnd !== null) return;
    if (node.type.name === "heading" && node.attrs.level <= 2) {
      const text = node.textContent;
      if (!foundHeading) {
        if (fuzzyMatch(text, lower)) {
          foundHeading = true;
          sectionStart = offset + node.nodeSize;
        }
      } else {
        sectionEnd = offset;
      }
    }
  });

  if (!foundHeading || sectionStart === null) return false;

  const end = sectionEnd ?? doc.content.size;
  const paragraphs = buildParagraphs(state, newText);

  tr.delete(sectionStart, end);
  let pos = sectionStart;
  paragraphs.forEach((p) => {
    tr.insert(pos, p);
    pos += p.nodeSize;
  });

  dispatch(tr);
  editor.view.focus();
  return true;
}