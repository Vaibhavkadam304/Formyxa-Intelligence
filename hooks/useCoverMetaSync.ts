/**
 * useCoverMetaSync
 *
 * Bidirectional sync between the `coverMetadata` Tiptap node and React state.
 *
 * • When the user types in FormyxaSidebar → call setCoverMeta()
 *   → this hook updates the node attrs in the editor (editor → DOM updates instantly).
 *
 * • When something else updates the node (AI fill, paste, undo) → the hook
 *   reads the attrs and updates React state so the sidebar stays in sync.
 *
 * Usage in BuilderClient:
 *   const { coverMeta, setCoverMeta } = useCoverMetaSync(editor);
 *   // pass coverMeta and setCoverMeta to <FormyxaSidebar />
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { CoverMeta } from "@/components/editor/FormyxaSidebar";
import { EMPTY_COVER_META } from "@/components/editor/FormyxaSidebar";

export function useCoverMetaSync(editor: any) {
  const [coverMeta, setCoverMetaState] = useState<CoverMeta>(EMPTY_COVER_META);

  // Track last-known node position to avoid re-scanning every transaction
  const posRef = useRef<number | null>(null);

  /** Find the coverMetadata node and return its attrs + position */
  function readNodeAttrs(ed: any): { attrs: CoverMeta; pos: number } | null {
    if (!ed) return null;
    let result: { attrs: CoverMeta; pos: number } | null = null;
    ed.state.doc.descendants((node: any, pos: number) => {
      if (result) return false; // stop early
      if (node.type.name === "coverMetadata") {
        result = { attrs: node.attrs as CoverMeta, pos };
        return false;
      }
    });
    return result;
  }

  // ── Read from editor → update React state ────────────────────────────────
  useEffect(() => {
    if (!editor) return;

    const sync = () => {
      const found = readNodeAttrs(editor);
      if (!found) return;
      posRef.current = found.pos;
      setCoverMetaState((prev) => {
        const a = found.attrs;
        // Shallow-compare to avoid unnecessary re-renders
        if (
          prev.provider_company === a.provider_company &&
          prev.client_company   === a.client_company   &&
          prev.project_name     === a.project_name     &&
          prev.date             === a.date
        ) {
          return prev;
        }
        return { ...a };
      });
    };

    // Sync on every transaction (covers undo, AI fill, paste, etc.)
    editor.on("transaction", sync);
    // Initial read
    sync();

    return () => {
      editor.off("transaction", sync);
    };
  }, [editor]);

  // ── Write from React state → editor node attrs ────────────────────────────
  const setCoverMeta = useCallback(
    (meta: CoverMeta) => {
      setCoverMetaState(meta);

      if (!editor) return;

      // Find the node position (use cached if available)
      const found = readNodeAttrs(editor);
      if (!found) return;

      // Use setNodeAttributes at the node's position
      editor
        .chain()
        .command(({ tr }: any) => {
          tr.setNodeMarkup(found.pos, undefined, {
            ...found.attrs,
            ...meta,
          });
          return true;
        })
        .run();
    },
    [editor]
  );

  return { coverMeta, setCoverMeta };
}