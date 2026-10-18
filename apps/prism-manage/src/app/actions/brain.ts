"use server";

/**
 * Company Brain — capture & retrieve
 * ----------------------------------
 * Workspace-scoped memory entries ("why did we do X?") with best-effort
 * semantic search (Gemini embeddings + pgvector) and a keyword fallback.
 * R0 spike: explicit capture, timeline list, search, and ask-with-citations.
 */

import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/log";
import { sanitizeIlikeTerm } from "@/lib/postgrest";

export interface MemoryEntry {
  id: string;
  title: string;
  summary: string;
  sourceType: string;
  reviewStatus: string;
  createdAt: string;
  createdBy: string | null;
}

export interface BrainCitation {
  id: string;
  title: string;
  summary: string;
  similarity: number | null;
}

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

async function embedText(text: string): Promise<number[] | null> {
  const apiKey =
    process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    // Direct REST call: the SDK doesn't expose outputDimensionality, and the
    // schema stores 768-dim vectors.
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

function mapEntry(row: Record<string, unknown>): MemoryEntry {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary),
    sourceType: String(row.source_type),
    reviewStatus: String(row.review_status),
    createdAt: String(row.created_at),
    createdBy: row.created_by ? String(row.created_by) : null,
  };
}

export async function captureMemoryEntry(input: {
  workspaceId: string;
  title: string;
  summary: string;
  rationale?: string;
  sourceType?: "decision" | "manual";
  sourceId?: string;
}): Promise<{ success?: boolean; error?: string; id?: string }> {
  const title = input.title.trim();
  const summary = input.summary.trim();
  if (!title || title.length > 200) {
    return { error: "Title must be 1-200 characters" };
  }
  if (!summary) return { error: "Summary is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { error: "You are not a member of this workspace" };

  const decisions = input.rationale?.trim()
    ? [{ decision: title, rationale: input.rationale.trim() }]
    : [];

  const embedding = await embedText(`${title}\n${summary}`);

  const { data, error } = await supabase
    .from("memory_entries")
    .insert({
      workspace_id: input.workspaceId,
      created_by: user.id,
      source_type: input.sourceType ?? "decision",
      source_id: input.sourceId ?? null,
      title,
      summary,
      decisions,
      // pgvector columns surface as `string` in generated types; the runtime
      // accepts the numeric array (proven working) — cast is type-only.
      ...(embedding ? { embedding: embedding as unknown as string } : {}),
    })
    .select("id")
    .single();

  if (error || !data) {
    logger.error("brain.capture.failed", { error: error?.message });
    return { error: error?.message || "Failed to save memory entry" };
  }

  logger.info("brain.captured", {
    id: data.id,
    workspaceId: input.workspaceId,
    hasEmbedding: Boolean(embedding),
  });
  revalidatePath("/brain");
  return { success: true, id: String(data.id) };
}

export async function getMemoryEntries(
  workspaceId: string,
  limit = 50,
): Promise<MemoryEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("memory_entries")
    .select(
      "id, title, summary, source_type, review_status, created_at, created_by",
    )
    .eq("workspace_id", workspaceId)
    .neq("review_status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data || []).map(mapEntry);
}

export async function searchMemory(
  workspaceId: string,
  query: string,
): Promise<BrainCitation[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = await createClient();

  const embedding = await embedText(q);
  if (embedding) {
    const { data } = await supabase.rpc("match_memory_entries", {
      // Type-only cast: vector params surface as `string` in generated types.
      query_embedding: embedding as unknown as string,
      match_workspace: workspaceId,
      match_count: 8,
      min_similarity: 0.2,
    });
    if (data && data.length > 0) {
      return (data as Record<string, unknown>[]).map((row) => ({
        id: String(row.id),
        title: String(row.title),
        summary: String(row.summary),
        similarity:
          typeof row.similarity === "number" ? row.similarity : null,
      }));
    }
  }

  // Keyword fallback (no API key, no embedding, or nothing above threshold)
  const safe = sanitizeIlikeTerm(q);
  const { data } = await supabase
    .from("memory_entries")
    .select("id, title, summary")
    .eq("workspace_id", workspaceId)
    .or(`title.ilike.%${safe}%,summary.ilike.%${safe}%`)
    .limit(8);
  return (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary),
    similarity: null,
  }));
}

export async function askBrain(
  workspaceId: string,
  question: string,
): Promise<{
  answer: string;
  citations: BrainCitation[];
  mode: "semantic" | "keyword" | "none";
}> {
  const q = question.trim();
  if (!q) return { answer: "", citations: [], mode: "none" };

  const citations = await searchMemory(workspaceId, q);
  if (citations.length === 0) {
    return { answer: "", citations, mode: "none" };
  }

  const apiKey =
    process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { answer: "", citations, mode: "keyword" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const context = citations
      .map((c, i) => `[${i + 1}] ${c.title}\n${c.summary}`)
      .join("\n\n");
    const prompt = `You answer questions about this company's history and decisions using ONLY the memory entries below.
Cite the entries you use as [1], [2], etc. If the entries do not contain the answer, say you don't have a memory of that yet.

## Memory entries
${context}

## Question
${q}

Answer in 2-5 sentences, with citations.`;
    const result = await model.generateContent(prompt);
    return {
      answer: result.response.text(),
      citations,
      mode: citations.some((c) => c.similarity !== null)
        ? "semantic"
        : "keyword",
    };
  } catch (error) {
    logger.warn("brain.ask.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { answer: "", citations, mode: "keyword" };
  }
}
