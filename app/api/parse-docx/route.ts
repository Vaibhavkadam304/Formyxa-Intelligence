import mammoth from "mammoth"
import JSZip from "jszip"
import { XMLParser } from "fast-xml-parser"

/* ================= TYPES ================= */

type XmlDocNode = {
  paragraphIndex: number
  runIndex: number
  text: string
}

type AnchoredPlaceholder = {
  key: string
  label: string
  paragraphIndex: number
  runStart: number
  runEnd: number
  confidence?: "high" | "medium" | "low"
}

type TemplateType =
  | "SMART"
  | "SEMI_STRUCTURED"
  | "BLANK_LINE"
  | "MIXED"

/* ================= XML → DOC NODES ================= */

function buildDocNodesFromXml(documentXml: string): XmlDocNode[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: true,
  })

  const xml = parser.parse(documentXml)
  const nodes: XmlDocNode[] = []

  const document = xml.find((n: any) => n["w:document"])?.["w:document"]
  const body = document?.find((n: any) => n["w:body"])?.["w:body"]

  if (!Array.isArray(body)) return nodes

  let paragraphIndex = 0

  for (const el of body) {
    if (!el["w:p"]) continue

    const paragraph = el["w:p"]
    const runs = paragraph.filter((n: any) => n["w:r"])
    let runIndex = 0

    for (const r of runs) {
      const texts = r["w:r"].filter((n: any) => n["w:t"])
      if (!texts.length) {
        runIndex++
        continue
      }

      const text = texts
        .map((t: any) => t["w:t"]["#text"] || "")
        .join("")

      if (text.trim()) {
        nodes.push({
          paragraphIndex,
          runIndex,
          text,
        })
      }

      runIndex++
    }

    paragraphIndex++
  }

  return nodes
}

/* ================= TEMPLATE TYPE ================= */


function safeJsonParseLLM(content: string) {
  const cleaned = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim()

  return JSON.parse(cleaned)
}

function detectTemplateTypeFromText(text: string): TemplateType {
  if (text.includes("{{")) return "SMART"

  const hasUnderlines = /_{4,}/.test(text)
  const hasLabels = /(Phone|Designation|Address|Location|Mr\.|Ms\.)/i.test(text)

  if (hasLabels && !hasUnderlines) return "SEMI_STRUCTURED"
  if (hasUnderlines && !hasLabels) return "BLANK_LINE"
  if (hasLabels && hasUnderlines) return "MIXED"

  return "MIXED"
}

/* ================= LLM (WHAT ONLY) ================= */

async function detectPlaceholdersWithLLM({
  rawText,
  xmlDocNodes,
}: {
  rawText: string
  xmlDocNodes: XmlDocNode[]
}): Promise<AnchoredPlaceholder[]> {
  const prompt = `
You are analyzing a Word document that has already been parsed into
paragraphs and text runs.

Each node is:
{
  paragraphIndex: number,
  runIndex: number,
  text: string
}

IMPORTANT RULES:
- Decide WHAT the field is, NOT formatting
- Decide WHICH runs contain the variable
- Use ONLY the provided indices
- If unsure, SKIP the field
- Do NOT guess
- runStart and runEnd are inclusive

DOC NODES:
${JSON.stringify(xmlDocNodes.slice(0, 400), null, 2)}

OUTPUT FORMAT (JSON ONLY):
[
  {
    "key": "snake_case",
    "label": "Human readable label",
    "paragraphIndex": number,
    "runStart": number,
    "runEnd": number,
    "confidence": "high | medium | low"
  }
]

RAW TEXT (for understanding only):
"""
${rawText.slice(0, 4000)}
"""
`

  const res = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      }),
    }
  )

  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content) throw new Error("LLM returned empty response")

  return safeJsonParseLLM(content)
}

/* ================= VALIDATION ================= */

function validateAnchors(
  placeholders: AnchoredPlaceholder[],
  xmlDocNodes: XmlDocNode[]
): AnchoredPlaceholder[] {
  return placeholders.filter((p) => {
    if (
      typeof p.paragraphIndex !== "number" ||
      typeof p.runStart !== "number" ||
      typeof p.runEnd !== "number"
    ) return false

    if (p.runStart > p.runEnd) return false

    return xmlDocNodes.some(
      (n) =>
        n.paragraphIndex === p.paragraphIndex &&
        n.runIndex >= p.runStart &&
        n.runIndex <= p.runEnd
    )
  })
}

/* ================= POST HANDLER ================= */

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    /* ---------- DOCX XML (SOURCE OF TRUTH) ---------- */
    const zip = await JSZip.loadAsync(buffer)
    const documentXml = await zip
      .file("word/document.xml")
      ?.async("string")

    if (!documentXml) throw new Error("document.xml missing")

    const xmlDocNodes = buildDocNodesFromXml(documentXml)

    /* ---------- PREVIEW ONLY ---------- */
    const { value: rawText } = await mammoth.extractRawText({ buffer })
    const { value: html } = await mammoth.convertToHtml({ buffer })

    const templateType = detectTemplateTypeFromText(rawText)

    /* ---------- LLM (WHAT) ---------- */
    const rawPlaceholders = await detectPlaceholdersWithLLM({
      rawText,
      xmlDocNodes,
    })

    const placeholders = validateAnchors(
      rawPlaceholders,
      xmlDocNodes
    )

    return Response.json({
      html,            // preview only
      rawText,         // LLM context
      xmlDocNodes,     // source of truth
      templateType,
      placeholders,    // 🔑 paragraphIndex + runStart/runEnd
    })
  } catch (err) {
    console.error("PARSE-DOCX ERROR:", err)
    return Response.json(
      { error: "Failed to process document" },
      { status: 500 }
    )
  }
}
