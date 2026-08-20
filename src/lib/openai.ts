import OpenAI from "openai";

export const DEFAULT_OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
export const DEFAULT_OPENAI_VISION_MODEL =
  process.env.OPENAI_VISION_MODEL ?? DEFAULT_OPENAI_MODEL;

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return new OpenAI({ apiKey });
}
