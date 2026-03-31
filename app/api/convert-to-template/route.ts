import { NextResponse } from "next/server"
import JSZip from "jszip"
import { XMLParser, XMLBuilder } from "fast-xml-parser"

/* ================= TYPES ================= */

type AnchoredPlaceholder = {
  key: string
  paragraphIndex: number
  runStart: number
  runEnd: number
}

/* ================= XML HELPERS ================= */

function injectPlaceholders(
  documentXml: string,
  placeholders: AnchoredPlaceholder[]
): string {
  const parser = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: true,
  })

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    preserveOrder: true,
  })

  const xml = parser.parse(documentXml)

  const document = xml.find((n: any) => n["w:document"])?.["w:document"]
  const body = document?.find((n: any) => n["w:body"])?.["w:body"]

  if (!Array.isArray(body)) return documentXml

  for (const p of placeholders) {
    const para = body[p.paragraphIndex]?.["w:p"]
    if (!Array.isArray(para)) continue

    const runs = para.filter((n: any) => n["w:r"])
    if (!runs.length) continue

    // Remove runs in [runStart..runEnd]
    const before = runs.slice(0, p.runStart)
    const after = runs.slice(p.runEnd + 1)

    const placeholderRun = {
      "w:r": [
        {
          "w:t": [
            {
              "#text": `{{${p.key}}}`,
            },
          ],
        },
      ],
    }

    const newRuns = [...before, placeholderRun, ...after]

    // Rebuild paragraph keeping non-run nodes untouched
    let runCursor = 0
    for (let i = 0; i < para.length; i++) {
      if (para[i]["w:r"]) {
        para[i] = newRuns[runCursor++] || null
      }
    }

    // Clean nulls
    for (let i = para.length - 1; i >= 0; i--) {
      if (para[i] === null) para.splice(i, 1)
    }
  }

  return builder.build(xml)
}

/* ================= POST HANDLER ================= */

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const placeholdersRaw = formData.get("placeholders") as string | null

    if (!file || !placeholdersRaw) {
      return NextResponse.json(
        { error: "Missing file or placeholders" },
        { status: 400 }
      )
    }

    const placeholders: AnchoredPlaceholder[] = JSON.parse(placeholdersRaw)
    const buffer = Buffer.from(await file.arrayBuffer())

    const zip = await JSZip.loadAsync(buffer)
    const documentXml = await zip
      .file("word/document.xml")
      ?.async("string")
++++
    if (!documentXml) {
      return NextResponse.json(
        { error: "document.xml missing" },
        { status: 500 }
      )
    }

    const updatedXml = injectPlaceholders(documentXml, placeholders)
    zip.file("word/document.xml", updatedXml)

    const out = await zip.generateAsync({ type: "nodebuffer" })

    return new NextResponse(out, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition":
          "attachment; filename=template.docx",
      },
    })
  } catch (err) {
    console.error("CONVERT TEMPLATE ERROR:", err)
    return NextResponse.json(
      { error: "Template conversion failed" },
      { status: 500 }
    )
  }
}
