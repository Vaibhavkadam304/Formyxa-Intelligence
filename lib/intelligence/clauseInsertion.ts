// ─────────────────────────────────────────────────────────────────────────────
// lib/intelligence/clauseInsertion.ts
//
// Context-aware clause insertion engine.
// Handles two scenarios:
//   A) Section exists → replace weak content IN PLACE
//   B) Section missing → find correct slot from template order, insert there
//
// After every operation: auto-scroll + green flash to show the user exactly
// where the change happened.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type InsertionResult = {
  success: boolean;
  pos: number;               // ProseMirror position of the changed block
  scenario: "replace" | "insert";
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise a heading string for fuzzy matching */
function norm(s: string): string {
  return s.toLowerCase().replace(/^\d+\.\s*/, "").trim();
}

/** Walk TipTap JSON content and collect heading strings in order */
function collectHeadings(content: any[]): string[] {
  const headings: string[] = [];
  function walk(nodes: any[]) {
    for (const n of nodes) {
      if (n.type === "heading") {
        const text = (n.content ?? []).map((c: any) => c.text || "").join("").trim();
        if (text) headings.push(norm(text));
      }
      if (n.content) walk(n.content);
    }
  }
  walk(content ?? []);
  return headings;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO A: In-place replacement of an existing section's body content
// ─────────────────────────────────────────────────────────────────────────────

function replaceWeakSection(
  editor: any,
  sectionTitle: string,
  newContent: string,
): InsertionResult | null {
  const doc = editor.state.doc;
  let targetHeadingPos: number | null = null;
  let targetBodyStart: number | null = null;
  let targetBodyEnd: number | null = null;

  // Walk ProseMirror doc to find the heading and its following content block
  doc.descendants((node: any, pos: number) => {
    if (targetHeadingPos !== null) return false; // stop early
    if (node.type.name === "heading" && node.attrs.level === 2) {
      const headingText = norm(node.textContent);
      if (headingText.includes(norm(sectionTitle)) || norm(sectionTitle).includes(headingText)) {
        targetHeadingPos = pos;
        const headingEnd = pos + node.nodeSize;
        // Find the first paragraph / bulletList / table block immediately after
        doc.nodesBetween(headingEnd, Math.min(headingEnd + 2000, doc.content.size), (child: any, childPos: number) => {
          if (targetBodyStart !== null) return false;
          if (["paragraph", "bulletList", "orderedList", "table"].includes(child.type.name)) {
            targetBodyStart = childPos;
            targetBodyEnd = childPos + child.nodeSize;
          }
        });
      }
    }
  });

  if (targetHeadingPos === null || targetBodyStart === null || targetBodyEnd === null) return null;

  // Replace the body content
  editor.chain()
    .focus()
    .command(({ tr }: any) => {
      tr.replaceWith(targetBodyStart!, targetBodyEnd!, editor.schema.nodes.paragraph.create(
        {},
        [editor.schema.text(newContent)],
      ));
      return true;
    })
    .run();

  return { success: true, pos: targetBodyStart, scenario: "replace" };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO B: Insert a missing section at the correct template-ordered slot
// ─────────────────────────────────────────────────────────────────────────────

function insertMissingSection(
  editor: any,
  templateContentJson: any,
  sectionTitle: string,
  newContent: string,
): InsertionResult {
  const doc = editor.state.doc;
  const cleanTitle = norm(sectionTitle);

  // 1. Build the ordered list of headings from the template
  const templateHeadings = collectHeadings((templateContentJson as any)?.content ?? []);

  // 2. Find where this section sits in the template order
  const templateIdx = templateHeadings.findIndex(
    (h) => h.includes(cleanTitle) || cleanTitle.includes(h),
  );

  // 3. Collect current doc heading positions
  const existingHeadings: Array<{ text: string; pos: number }> = [];
  doc.descendants((node: any, pos: number) => {
    if (node.type.name === "heading" && node.attrs.level === 2) {
      existingHeadings.push({ text: norm(node.textContent), pos });
    }
  });

  // 4. Find the insertion point: the position of the first subsequent
  //    template heading that already exists in the doc
  let insertPos = doc.content.size; // default: append at end

  if (templateIdx !== -1) {
    // Look for the next template heading after templateIdx that exists in current doc
    for (let i = templateIdx + 1; i < templateHeadings.length; i++) {
      const nextTemplateH = templateHeadings[i];
      const existing = existingHeadings.find(
        (e) => e.text.includes(nextTemplateH) || nextTemplateH.includes(e.text),
      );
      if (existing) {
        insertPos = existing.pos;
        break;
      }
    }
  }

  // 5. Insert heading + paragraph at the found position
  const headingText = sectionTitle.trim();
  // Preserve the original title casing — only capitalise first letter if entirely lowercase
  const displayHeading = headingText.charAt(0) === headingText.charAt(0).toUpperCase()
    ? headingText
    : headingText.replace(/^\w/, (c) => c.toUpperCase());

  const nodesToInsert = [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: displayHeading }] },
    { type: "paragraph", content: [{ type: "text", text: newContent }] },
  ];

  editor.chain().focus().insertContentAt(insertPos, nodesToInsert).run();

  return { success: true, pos: insertPos, scenario: "insert" };
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL + FLASH — premium UX that guides the user's eye
// ─────────────────────────────────────────────────────────────────────────────

const FLASH_CLASS = "formyxa-clause-flash";

/** Inject flash keyframe CSS once into document head */
function ensureFlashStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("formyxa-flash-style")) return;
  const style = document.createElement("style");
  style.id = "formyxa-flash-style";
  style.textContent = `
    @keyframes formyxa-flash-in {
      0%   { background-color: rgba(34,197,94,0.30); outline: 2px solid rgba(34,197,94,0.5); border-radius: 4px; }
      60%  { background-color: rgba(34,197,94,0.15); outline: 2px solid rgba(34,197,94,0.3); border-radius: 4px; }
      100% { background-color: transparent; outline: 2px solid transparent; border-radius: 4px; }
    }
    .${FLASH_CLASS} {
      animation: formyxa-flash-in 1.6s ease forwards;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Scroll the ProseMirror editor view to a given document position,
 * then flash the DOM element at that position green for 1.6 seconds.
 */
export function scrollAndFlash(editor: any, docPos: number): void {
  if (!editor) return;
  ensureFlashStyles();

  // Small delay so any content changes have rendered
  setTimeout(() => {
    try {
      // 1. Move cursor to pos so TipTap's built-in scroll works
      editor.chain().focus().setTextSelection(docPos + 1).scrollIntoView().run();

      // 2. Get the DOM element at that position
      const { node: domNode } = editor.view.domAtPos(docPos + 1);
      if (!domNode) return;

      // Walk up to the nearest block-level element
      let el = domNode instanceof Element ? domNode : domNode.parentElement;
      while (el && window.getComputedStyle(el).display === "inline") {
        el = el.parentElement;
      }
      if (!el) return;

      // 3. Smooth scroll to the element
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      // 4. Flash animation
      el.classList.remove(FLASH_CLASS);
      // Force reflow so re-adding the class triggers the animation
      void (el as HTMLElement).offsetWidth;
      el.classList.add(FLASH_CLASS);
      setTimeout(() => el!.classList.remove(FLASH_CLASS), 1800);
    } catch (e) {
      // Non-fatal — scroll/flash is enhancement only
      console.warn("[clauseInsertion] scroll/flash failed:", e);
    }
  }, 80);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — context-aware insert dispatcher
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Perform a context-aware clause insert/replace.
 *
 * @param editor          — TipTap editor instance
 * @param templateJson    — the template's contentJson (for section ordering)
 * @param title           — section heading from the risk card
 * @param newContent      — AI-generated replacement text
 * @param riskType        — "weak" → replace in place | "missing" → insert at correct slot
 */
export function contextAwareInsert(
  editor: any,
  templateJson: any,
  title: string,
  newContent: string,
  riskType: "weak" | "missing",
): InsertionResult {
  // Scenario A: try in-place replacement first regardless of riskType
  // (sometimes a section is marked "missing" by AI but structurally exists)
  const replaceResult = replaceWeakSection(editor, title, newContent);
  if (replaceResult) {
    scrollAndFlash(editor, replaceResult.pos);
    return replaceResult;
  }

  // Scenario B: section truly doesn't exist — find the right slot
  const insertResult = insertMissingSection(editor, templateJson, title, newContent);
  scrollAndFlash(editor, insertResult.pos);
  return insertResult;
}