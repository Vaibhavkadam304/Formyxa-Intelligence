import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// ─────────────────────────────────────────────────────────────────────────────
// INLINE SUGGEST
// Given the user's partial sentence and the section heading, returns a short
// professional completion (10–25 words) that the user can accept with Tab.
// This is the "AI Help" part of the Ghost Suggestion guardrail:
//   User types: "the client wants a site"
//   AI suggests: " to modernize their digital presence and increase conversions."
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { partialText, sectionHeading, templateSlug } = (await req.json()) as {
      partialText: string;
      sectionHeading?: string;
      templateSlug?: string;
    };

    if (!partialText?.trim()) {
      return NextResponse.json({ error: "partialText is required" }, { status: 400 });
    }

    const docType = templateSlug?.includes("sow")
      ? "Statement of Work"
      : templateSlug?.includes("retainer")
      ? "Retainer Agreement"
      : "professional service agreement";

    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Formyxa",
      },
    });

    const prompt = `You are completing a sentence for the "${sectionHeading ?? "document"}" section of a ${docType}.

The user has typed this partial sentence:
"${partialText}"

Complete the sentence professionally. Output ONLY the completion (the part that comes after what the user has typed). 
Rules:
- 8 to 20 words maximum
- Formal, professional contract language
- Complete the thought naturally — do not repeat the user's text
- No quotation marks, no markdown, no commentary
- Start with a space if needed to connect grammatically`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 60,
      messages: [
        {
          role: "system",
          content:
            "You complete partial contract sentences professionally. Return only the completion text, nothing else.",
        },
        { role: "user", content: prompt },
      ],
    });

    const result = completion.choices[0]?.message?.content?.trim() ?? "";

    if (!result) {
      return NextResponse.json({ completion: null });
    }

    return NextResponse.json({ completion: result });
  } catch (err) {
    console.error("[inline-suggest] error:", err);
    return NextResponse.json({ completion: null }, { status: 500 });
  }
}