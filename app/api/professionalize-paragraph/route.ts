import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONALIZE PARAGRAPH
// Takes the user's messy paragraph + structured field context from the doc,
// returns a single formally drafted replacement paragraph.
// This is NOT a full-doc AI generator — it's a surgical paragraph rewriter.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { rawText, sectionHeading, fieldContext, templateSlug } = await req.json() as {
      rawText: string;
      sectionHeading: string;
      fieldContext: Record<string, string>;
      templateSlug?: string;
    };

    if (!rawText?.trim()) {
      return NextResponse.json({ error: "rawText is required" }, { status: 400 });
    }

    // ── Build field context string (only filled fields) ────────────────────
    const filledFields = Object.entries(fieldContext)
      .filter(([, v]) => v && v.trim().length > 0)
      .map(([k, v]) => `  • ${k.replace(/_/g, " ")}: ${v}`)
      .join("\n");

    const fieldContextBlock = filledFields
      ? `\nThe following structured fields have already been confirmed in this document — incorporate them naturally where relevant:\n${filledFields}`
      : "";

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Formyxa",
      },
    });

    const prompt = `You are a senior commercial drafting assistant specialising in ${
      templateSlug?.includes("sow") ? "Statements of Work" :
      templateSlug?.includes("retainer") ? "Retainer Agreements" :
      "professional service contracts"
    }.

Your task: rewrite the user's informal notes for the "${sectionHeading}" section into a single, formally drafted paragraph suitable for a binding professional contract.

STRICT RULES:
1. Output ONE paragraph only. No headings, no bullet points, no lists.
2. Formal contract register — no casual language, no first person ("I", "we").
3. Do NOT invent facts, amounts, dates, or names that are not in the input or field context.
4. Do NOT add new clauses — only formalise what the user wrote.
5. Do NOT include the section heading in your output.
6. No markdown. No commentary. Return the paragraph text only.
7. If the user's notes mention a timeline, work it into the paragraph naturally.
8. Keep it concise — 2 to 4 sentences is ideal for a narrative section.
${fieldContextBlock}

User's draft notes for "${sectionHeading}":
${rawText}`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.15,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: "You are a legal drafting assistant. Output one plain-text paragraph only. No markdown, no lists, no commentary.",
        },
        { role: "user", content: prompt },
      ],
    });

    const professionalText = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!professionalText) {
      return NextResponse.json({ error: "AI returned empty result" }, { status: 500 });
    }

    return NextResponse.json({ professionalText });

  } catch (err) {
    console.error("[professionalize-paragraph] error:", err);
    return NextResponse.json({ error: "Professionalisation failed" }, { status: 500 });
  }
}
