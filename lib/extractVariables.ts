// lib/extractVariables.ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

type PlaceholderSchema = Record<
  string,
  { label: string; type?: string; hint?: string }
>;

type Args = {
  templateSlug: string;
  templateName: string | null;
  placeholderSchema: PlaceholderSchema | null;
  rawText: string;
};

export async function extractVariablesWithLLM({
  templateSlug,
  templateName,
  placeholderSchema,
  rawText,
}: Args): Promise<Record<string, string>> {
  // 🔴 LOG 0: Function entry
  console.log("🧠 [LLM] extractVariablesWithLLM CALLED");
  console.log("🧠 [LLM] Template slug:", templateSlug);
  console.log("🧠 [LLM] Template name:", templateName);
  console.log(
    "🧠 [LLM] Placeholder keys:",
    Object.keys(placeholderSchema ?? {})
  );
  console.log("🧠 [LLM] Raw user text:\n", rawText);

  // If no schema → nothing to extract
  if (!placeholderSchema || Object.keys(placeholderSchema).length === 0) {
    console.warn(
      "⚠️ [LLM] No placeholderSchema found — skipping LLM extraction"
    );
    return {};
  }

  const fieldsDescription = Object.entries(placeholderSchema)
    .map(([key, def]) => {
      const hintPart = def.hint ? ` Hint: ${def.hint}` : "";
      return `- "${key}" – ${def.label}.${hintPart}`;
    })
    .join("\n");

  const systemPrompt = `
You are a strict JSON API that extracts structured variables
for a document template.

Template slug: "${templateSlug}"
Template name: "${templateName ?? templateSlug}"

Rules:
- Respond with ONE valid JSON object only.
- Use EXACTLY the keys listed below (no extra keys).
- All values must be strings.
- If a value is missing or unclear, return an empty string.
- Do not include explanations, markdown, or text outside JSON.

Fields to extract:
${fieldsDescription}

Return ONLY the JSON object.
  `.trim();

  const userPrompt = `User input:\n"""${rawText}"""`;

  try {
    console.log("🚀 [LLM] Sending request to OpenRouter…");

    const completion = await client.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const rawContent = completion.choices[0].message.content ?? "";

    // 🔴 LOG 1: Raw LLM response
    console.log("🧠 [LLM] RAW RESPONSE:\n", rawContent);

    // Safety: isolate first JSON object if model adds noise
    let raw = rawContent;
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) raw = match[0];

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (jsonErr) {
      console.error("❌ [LLM] Failed to parse JSON from LLM:", raw);
      throw jsonErr;
    }

    // Normalize output to schema keys
    const result: Record<string, string> = {};
    for (const key of Object.keys(placeholderSchema)) {
      result[key] =
        typeof parsed[key] === "string" ? parsed[key] : "";
    }

    // 🔴 LOG 2: Parsed + normalized variables
    console.log("🧠 [LLM] PARSED VARIABLES:", result);

    return result;
  } catch (err) {
    console.error(
      "❌ [LLM] extractVariablesWithLLM FAILED — returning empty variables",
      err
    );

    // Safe fallback
    const result: Record<string, string> = {};
    for (const key of Object.keys(placeholderSchema)) {
      result[key] = "";
    }
    return result;
  }
}
