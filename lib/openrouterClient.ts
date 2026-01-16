// lib/openrouterClient.ts
import OpenAI from "openai";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set");
}

export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  // These headers are recommended/required for project keys
  defaultHeaders: {
    "HTTP-Referer":
      process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    "X-Title": "Formyxa AI Blog Writer",
  },
});
