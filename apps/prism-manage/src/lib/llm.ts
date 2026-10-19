/**
 * LLM provider layer (Company Brain)
 * ----------------------------------
 * Prefers the OpenCode inference API (OpenAI-compatible chat completions —
 * OpenCode Go or Console, both under https://opencode.ai/inference) when
 * OPENCODE_API_KEY is configured; falls back to Google Gemini when a Gemini
 * key is present; returns null when nothing is configured so callers can
 * degrade deterministically (thread-mode summaries, closest-match answers).
 *
 * Env:
 *   OPENCODE_API_KEY  — Go / Console key (Bearer token)
 *   OPENCODE_MODEL    — default "deepseek-v4.1-flash"
 *   OPENCODE_BASE_URL — default "https://opencode.ai/inference/go/openai/v1"
 *                       (Console inference: "https://opencode.ai/inference/openai/v1")
 *   GEMINI_API_KEY / GOOGLE_GEMINI_API_KEY — Gemini fallback
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/log";

export interface GenerateTextOptions {
  /** Stable session id per conversation (routing/caching hint for OpenCode). */
  sessionId?: string;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LlmResult {
  text: string;
  provider: "opencode" | "gemini";
  model: string;
}

const OPENCODE_DEFAULT_BASE = "https://opencode.ai/inference/go/openai/v1";
const OPENCODE_DEFAULT_MODEL = "deepseek-v4.1-flash";
const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

/** Which provider a call would use right now (health + diagnostics). */
export function llmProviderName(): "opencode" | "gemini" | null {
  if (process.env.OPENCODE_API_KEY) return "opencode";
  if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) {
    return "gemini";
  }
  return null;
}

async function generateWithOpenCode(
  prompt: string,
  options: GenerateTextOptions,
): Promise<LlmResult> {
  const key = process.env.OPENCODE_API_KEY!;
  const base = (process.env.OPENCODE_BASE_URL || OPENCODE_DEFAULT_BASE).replace(
    /\/+$/,
    "",
  );
  const model = process.env.OPENCODE_MODEL || OPENCODE_DEFAULT_MODEL;

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      // Identify the client and keep a stable session id per conversation —
      // OpenCode Go's request guidance for routing + prompt caching.
      "User-Agent": "prism-manage/1.0",
      ...(options.sessionId ? { "x-opencode-session": options.sessionId } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: options.maxTokens ?? 1024,
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(`OpenCode inference ${res.status}: ${detail}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("OpenCode inference returned empty content");
  return { text, provider: "opencode", model };
}

async function generateWithGemini(prompt: string): Promise<LlmResult> {
  const key =
    process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: GEMINI_DEFAULT_MODEL });
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  if (!text) throw new Error("Gemini returned empty content");
  return { text, provider: "gemini", model: GEMINI_DEFAULT_MODEL };
}

/**
 * Generates text with the configured provider, falling back provider by
 * provider. Returns null when no provider is configured or every provider
 * failed (details land in the llm.* warn logs).
 */
export async function generateText(
  prompt: string,
  options: GenerateTextOptions = {},
): Promise<LlmResult | null> {
  if (process.env.OPENCODE_API_KEY) {
    try {
      return await generateWithOpenCode(prompt, options);
    } catch (error) {
      logger.warn("llm.opencode.failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) {
    try {
      return await generateWithGemini(prompt);
    } catch (error) {
      logger.warn("llm.gemini.failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return null;
}
