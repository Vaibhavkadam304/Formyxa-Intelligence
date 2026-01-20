import JSZip from "jszip"

type Mapping = {
  original_text: string
  placeholder: string
  default_value?: string // ✅ added, not used here
}

function textToDocxLooseRegex(text: string) {
  return text
    .split("")
    .map((char) => {
      // escape regex special chars per character
      const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      return `${escapedChar}(?:<[^>]+>)*`
    })
    .join("")
}

export async function POST(req: Request) {
  try {
    const { fileBuffer, mappings } = await req.json()

    if (!fileBuffer || !mappings?.length) {
      return new Response(
        JSON.stringify({ error: "Missing file or mappings" }),
        { status: 400 }
      )
    }

    const zip = await JSZip.loadAsync(
      Buffer.from(fileBuffer, "base64")
    )

    const xmlFiles = [
      "word/document.xml",
      ...Object.keys(zip.files).filter(
        (f) =>
          f.startsWith("word/header") ||
          f.startsWith("word/footer")
      ),
    ]

    for (const fileName of xmlFiles) {
      const file = zip.file(fileName)
      if (!file) continue

      let xml = await file.async("string")

      for (const m of mappings) {
        if (!m.original_text?.trim()) continue

        const escaped = textToDocxLooseRegex(m.original_text)

        xml = xml.replace(
          new RegExp(escaped, "g"),
          m.placeholder
        )
      }

      zip.file(fileName, xml)
    }

    const output = await zip.generateAsync({
      type: "nodebuffer",
    })

    return new Response(output, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition":
          "attachment; filename=offer-letter-template.docx",
      },
    })
  } catch (err) {
    console.error("MIGRATION ERROR:", err)
    return new Response(
      JSON.stringify({ error: "Template migration failed" }),
      { status: 500 }
    )
  }
}

function escapeForRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
