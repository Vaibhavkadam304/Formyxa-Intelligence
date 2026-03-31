// app/api/export-docx/route.js

export const runtime = "nodejs";

// Helper: make sure header values (like filename) don't contain
// characters that break ByteString (e.g. en dash "–", smart quotes, ₹, etc.)
function sanitizeForHeader(value) {
  if (!value) return "";
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "_");
}

/**
 * Recursively walk the Tiptap JSON and convert non-standard inline nodes
 * into plain text/mark nodes that python-docx understands.
 *
 * Handled here (so Flask never needs to know about them):
 *   • formyxaField  → text node (value or "[Label]" placeholder)
 *   • placeholderInline → text node (unchanged behaviour)
 */
function prepareDocForExport(node) {
  if (!node || typeof node !== "object") return node;
  if (Array.isArray(node)) return node.map(prepareDocForExport);

  // ── formyxaField → text ──────────────────────────────────────────────────
  if (node.type === "formyxaField") {
    const attrs   = node.attrs ?? {};
    const value   = (attrs.value ?? "").trim();
    const label   = (attrs.label ?? "Field").trim();
    const isBold  = !!attrs.bold;

    return {
      type: "text",
      text: value.length > 0 ? value : `[${label}]`,
      marks: isBold ? [{ type: "bold" }] : [],
    };
  }

  // ── placeholderInline → text (legacy, keep unchanged) ───────────────────
  if (node.type === "placeholderInline") {
    const value = (node.attrs?.value ?? "").trim();
    return {
      type: "text",
      text: value.length > 0 ? value : "____________________",
    };
  }

  const clone = { ...node };
  if (Array.isArray(clone.content)) {
    clone.content = clone.content.map(prepareDocForExport);
  }
  return clone;
}


export async function POST(req) {
  const {
    contentJson,
    fileName,
    templateSlug,
    designKey,
    brand,
    signatory,
  } = await req.json();

  const cleanedContentJson = prepareDocForExport(contentJson);

  const flaskUrl =
    process.env.FLASK_DOCX_URL ?? "http://localhost:8001/generate-docx";

  let res;
  try {
    res = await fetch(flaskUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentJson: cleanedContentJson,
        fileName,
        templateSlug,
        designKey,
        brand,
        signatory,
        baseTemplate: "default",
      }),
    });
  } catch (err) {
    console.error("DOCX service network error:", err);
    return new Response(
      JSON.stringify({ error: "Flask export failed (network error)", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("DOCX service error:", res.status, text);
    return new Response(
      JSON.stringify({ error: "Flask export failed", status: res.status, details: text }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const arrayBuffer = await res.arrayBuffer();

  let safeFileName = sanitizeForHeader(fileName || "document");
  if (!safeFileName.toLowerCase().endsWith(".docx")) {
    safeFileName += ".docx";
  }

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
    },
  });
}