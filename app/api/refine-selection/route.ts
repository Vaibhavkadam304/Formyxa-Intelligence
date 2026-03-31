import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, mode } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Text is required" },
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

    const prompt = `
You are refining selected text in a professional business contract.

Mode: ${mode}

Instructions:
- Preserve original meaning.
- Do NOT add new clauses.
- Do NOT change legal intent.
- Improve clarity and precision.
- Maintain formal professional tone.
- Return only the rewritten paragraph.
- No markdown.
- No commentary.

Selected Text:
${text}
`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a legal drafting assistant. Output rewritten text only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const refinedText =
      completion.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({ refinedText });

  } catch (error) {
    console.error("Refine AI error:", error);

    return NextResponse.json(
      { error: "AI refinement failed" },
      { status: 500 }
    );
  }
}
