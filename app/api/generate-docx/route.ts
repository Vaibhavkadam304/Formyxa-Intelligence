import { NextResponse } from "next/server"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const templateFile = formData.get("template") as File | null
    const valuesRaw = formData.get("values") as string | null

    if (!templateFile || !valuesRaw) {
      return NextResponse.json(
        { error: "Missing template or values" },
        { status: 400 }
      )
    }

    const values = JSON.parse(valuesRaw)
    const buffer = Buffer.from(await templateFile.arrayBuffer())

    const zip = new PizZip(buffer)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    })

    doc.render(values)

    const out = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    })

    return new NextResponse(out, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=offer-letter.docx",
      },
    })
  } catch (err) {
    console.error("EXPORT DOCX ERROR:", err)
    return NextResponse.json(
      { error: "Template rendering failed" },
      { status: 500 }
    )
  }
}
