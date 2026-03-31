// app/api/generate-clause-fix/route.ts
// UPDATED: prompt now instructs AI to return bullet points and markdown tables
// when the section warrants it — so the JS parser can correctly convert them
// into Tiptap bulletList / table nodes instead of dumping plain markdown text.

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { title, existingClauseText, documentText, mode } = await req.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Formyxa",
      },
    });

    // ── Determine output format hint based on section name ────────────────────
    // Some sections are naturally lists or tables — tell the AI explicitly.
    const sectionLower = title.toLowerCase();

    const isBulletSection =
      sectionLower.includes("scope") ||
      sectionLower.includes("exclusion") ||
      sectionLower.includes("deliverable") ||
      sectionLower.includes("objective") ||
      sectionLower.includes("obligation") ||
      sectionLower.includes("service");

    const isTableSection =
      sectionLower.includes("milestone") ||
      sectionLower.includes("schedule") ||
      sectionLower.includes("timeline") ||
      sectionLower.includes("payment schedule");

    const formatInstruction = isTableSection
      ? `IMPORTANT: This section uses a table. Return the content as a GitHub-flavour markdown table (| Col | Col | format) with a header row and data rows. Do NOT return prose.`
      : isBulletSection
      ? `IMPORTANT: This section uses bullet points. Return the content as a list — one item per line, each line starting with "- ". Do NOT return prose paragraphs.`
      : `Return the content as one or two concise prose paragraphs. Do NOT use markdown.`;

    const prompt = `
You are a senior commercial contract lawyer reviewing an agreement.

Clause title:
"${title}"

Existing clause:
"${existingClauseText || "Clause is empty or missing"}"

Full contract context:
"${(documentText ?? "").slice(0, 4000)}"

TASK:
${mode === "addition"
  ? `This clause section exists but needs more content. Write appropriate content to add.`
  : `1. If clause is missing → provide a standard SME-balanced template clause.
2. If clause exists but is weak → provide improved replacement wording.`
}

FORMAT RULES (MUST FOLLOW):
${formatInstruction}
- Keep language commercially balanced.
- Keep concise — 3 to 6 items for lists, 2–4 rows for tables, 2 paragraphs max for prose.
- Do NOT repeat the section title in your output.
- Do NOT add markdown headings or bold text.

RETURN STRICT JSON in this format:

{
  "type": "missing" | "weak" | "addition",
  "issue": "one sentence explanation of what was added or improved",
  "replace_from": null,
  "replace_with": "<your formatted content here>"
}
`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior commercial contract lawyer. Return ONLY valid JSON. Follow the FORMAT RULES exactly.",
        },
        { role: "user", content: prompt },
      ],
    });

    const parsed = JSON.parse(
      completion.choices[0]?.message?.content || "{}"
    );

    return NextResponse.json(parsed);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Clause generation failed" },
      { status: 500 }
    );
  }
}