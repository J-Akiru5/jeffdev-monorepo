/**
 * Gemini embeddings (best-effort)
 * -------------------------------
 * Direct REST call: the SDK doesn't expose outputDimensionality, and the
 * memory schema stores 768-dim vectors. Returns null when unconfigured or
 * on any failure — callers fall back to keyword search.
 */

import { logger } from "@/lib/log";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

export async function embedText(text: string): Promise<number[] | null> {
  const apiKey =
    process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`embedContent ${res.status}: ${detail.slice(0, 200)}`);
    }
    const json = (await res.json()) as { embedding?: { values?: number[] } };
    return json.embedding?.values ?? null;
  } catch (error) {
    logger.warn("brain.embed.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
