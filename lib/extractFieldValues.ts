// ─────────────────────────────────────────────────────────────────────────────
// Extract formyxaField attrs from a TipTap JSON doc
// Returns Record<fieldKey, value | null>
// ─────────────────────────────────────────────────────────────────────────────

export function extractFieldValues(doc: any): Record<string, string | null> {
  const result: Record<string, string | null> = {};

  function walk(node: any) {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.type === "formyxaField" && node.attrs?.key) {
      result[node.attrs.key] = node.attrs.value ?? null;
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }

  walk(doc);
  return result;
}
