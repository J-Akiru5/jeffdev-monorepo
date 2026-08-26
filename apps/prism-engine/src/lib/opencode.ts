/**
 * OpenCode Zen client (Phase 3 AI layer)
 *
 * One gateway, many models: https://opencode.ai/zen/v1
 * - OpenAI-compatible /chat/completions
 * - Free tier models first (roadmap: "free models prioritised")
 * - MIMO default per roadmap v1.0 (mimo-v2.5-free)
 *
 * Multi-model selection: callers pass an explicit model id or use the
 * default chain. The catalog can be listed live via listOpenCodeModels().
 *
 * Env: OPENCODE_API_KEY, OPENCODE_BASE_URL (optional), OPENCODE_DEFAULT_MODEL
 * (optional).
 */

const BASE_URL = (
  process.env.OPENCODE_BASE_URL || "https://opencode.ai/zen/v1"
).replace(/\/$/, "");

/** Free models first — roadmap ordering. Default is MIMO. */
export const OPENCODE_DEFAULT_MODEL =
  process.env.OPENCODE_DEFAULT_MODEL || "mimo-v2.5-free";

export const OPENCODE_FREE_MODELS = [
  "mimo-v2.5-free",
  "big-pickle",
  "deepseek-v4-flash-free",
  "nemotron-3-ultra-free",
  "north-mini-code-free",
  "x-preview-f-free",
  "hy3-free",
] as const;

export function isOpenCodeConfigured(): boolean {
  return Boolean(process.env.OPENCODE_API_KEY);
}

export interface OpenCodeChatParams {
  systemPrompt: string;
  userPrompt: string;
  /** Explicit model override; falls back to OPENCODE_DEFAULT_MODEL. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /**
   * Ask the gateway for a JSON object response. Not every Zen model honours
   * response_format — callers must still validate/parse defensively.
   */
  json?: boolean;
  timeoutMs?: number;
}

export class OpenCodeError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "OpenCodeError";
    this.status = status;
  }
}

/**
 * Chat completion against the Zen gateway. Returns message.content only —
 * reasoning traces from reasoning-style models (e.g. mimo) are dropped.
 */
export async function opencodeChat(
  params: OpenCodeChatParams,
): Promise<string> {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new OpenCodeError("OPENCODE_API_KEY not configured");

  const model = params.model || OPENCODE_DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), params.timeoutMs ?? 60_000);

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.userPrompt },
        ],
        temperature: params.temperature ?? 0.3,
        max_tokens: params.maxTokens ?? 4000,
        ...(params.json ? { response_format: { type: "json_object" as const } } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new OpenCodeError(
        `OpenCode request failed (${response.status}): ${body.slice(0, 300)}`,
        response.status,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new OpenCodeError("OpenCode returned empty content");
    return content;
  } catch (error) {
    if (error instanceof OpenCodeError) throw error;
    if ((error as Error)?.name === "AbortError") {
      throw new OpenCodeError("OpenCode request timed out");
    }
    throw new OpenCodeError(
      `OpenCode transport error: ${(error as Error)?.message ?? String(error)}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Live model catalog from the gateway (for admin/debug surfaces). */
export async function listOpenCodeModels(): Promise<string[]> {
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new OpenCodeError("OPENCODE_API_KEY not configured");

  const response = await fetch(`${BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new OpenCodeError(
      `Failed to list models (${response.status})`,
      response.status,
    );
  }
  const data = (await response.json()) as { data?: Array<{ id: string }> };
  return (data.data ?? []).map((m) => m.id);
}
