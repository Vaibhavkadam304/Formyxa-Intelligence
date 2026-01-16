// app/api/documents/[id]/render/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import HTMLtoDOCX from "html-to-docx"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params

  try {
    const body = await req.json().catch(() => ({} as any))
    const format = body?.format ?? "docx"

    if (format !== "docx") {
      return NextResponse.json(
        { error: "Only docx export is supported right now" },
        { status: 400 },
      )
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      select: { title: true, contentHtml: true },
    })

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const title = (doc.title || "document").replace(/"/g, "")

    // 👇 this is what ensures italics/bold etc are kept
    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: "Times New Roman", serif;
              font-size: 12pt;
              line-height: 1.3;
            }

            p {
              margin: 0 0 6pt 0;
            }
          </style>
        </head>
        <body>
          ${doc.contentHtml ?? ""}
        </body>
      </html>
    `

    const buffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
    })

    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    )

    return new NextResponse(arrayBuffer as any, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${title}.docx"`,
      },
    })
  } catch (err) {
    console.error("DOCX render error:", err)
    return NextResponse.json({ error: "Failed to render document" }, { status: 500 })
  }
}
