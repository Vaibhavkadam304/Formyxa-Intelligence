// app/api/export-docx/route.js

export const runtime = "nodejs";

// Helper: make sure header values (like filename) don't contain
// characters that break ByteString (e.g. en dash “–”, smart quotes, ₹, etc.)
function sanitizeForHeader(value) {
  if (!value) return "";

  return value
    .normalize("NFKD")
    // Keep only basic printable ASCII (space to ~); replace others with "_"
    .replace(/[^\x20-\x7E]/g, "_");
}

function prepareDocForExport(node) {
  if (!node || typeof node !== "object") return node;

  if (Array.isArray(node)) {
    return node.map(prepareDocForExport);
  }

  // 🔥 Convert placeholderInline → text
  if (node.type === "placeholderInline") {
    const value = node.attrs?.value?.trim();

    return {
      type: "text",
      text: value && value.length > 0
        ? value
        : "____________________",
    };
  }

  const clone = { ...node };

  if (Array.isArray(clone.content)) {
    clone.content = clone.content.map(prepareDocForExport);
  }

  return clone;
}



export async function POST(req) {
  // Explicitly pull fields we care about (including designKey)
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
        designKey, // ✅ send selected visual design
        brand,
        signatory,
        baseTemplate: "default", // optional, keeps your Flask default behaviour
      }),
    });
  } catch (err) {
    console.error("DOCX service network error:", err);
    return new Response(
      JSON.stringify({
        error: "Flask export failed (network error)",
        details: String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("DOCX service error:", res.status, text);
    return new Response(
      JSON.stringify({
        error: "Flask export failed",
        status: res.status,
        details: text,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  
  // 🔧 Fix: sanitize filename so headers don't contain characters like “–” (8211)
  let safeFileName = sanitizeForHeader(fileName || "document");

  // Ensure we have a .docx extension, without doubling it
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
