"use server";

/**
 * Company Brain — capture & retrieve
 * ----------------------------------
 * Workspace-scoped memory entries ("why did we do X?") with best-effort
 * semantic search (Gemini embeddings + pgvector) and a keyword fallback.
 * R0 spike: explicit capture, timeline list, search, and ask-with-citations.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/log";
import { sanitizeIlikeTerm } from "@/lib/postgrest";
import { embedText } from "@/lib/embeddings";
import { generateText } from "@/lib/llm";
import type { Json } from "@/types/database.types";

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

/**
 * Curation (R2 · D7): mark a memory reviewed or archive it.
 * RLS limits this to the author or a workspace founder.
 */
export async function updateMemoryStatus(
  id: string,
  status: "reviewed" | "archived",
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("memory_entries")
    .update({ review_status: status } as never)
    .eq("id", id);
  if (error) {
    logger.error("brain.status.failed", { id, status, error: error.message });
    return { error: error.message };
  }

  logger.info("brain.status.updated", { id, status });
  revalidatePath("/brain");
  return { success: true };
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

  const llm = await generateText(prompt, {
    sessionId: `brain-ask-${workspaceId}`,
    maxTokens: 600,
  });
  if (!llm) {
    return { answer: "", citations, mode: "keyword" };
  }

  return {
    answer: llm.text,
    citations,
    mode: citations.some((c) => c.similarity !== null)
      ? "semantic"
      : "keyword",
  };
}

export interface DistillResult {
  success?: boolean;
  error?: string;
  entryId?: string;
  mode?: "ai" | "fallback";
  skipped?: boolean;
}

/**
 * Distill a task's comment thread into a memory entry (R1).
 * - One entry per thread: refreshed in place as the discussion grows.
 * - AI summary when an LLM key is configured (OpenCode preferred, Gemini
 *   fallback); deterministic fallback otherwise (so the feature works
 *   everywhere, including CI).
 * - `throttleMs` skips re-distillation that happened too recently (used by
 *   the opt-in auto path so bursts of comments don't fan out API calls).
 */
export async function distillTaskThread(
  taskId: string,
  options?: { throttleMs?: number },
): Promise<DistillResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, workspace_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task || !task.workspace_id) {
    return { error: "Task not found or you don't have access" };
  }

  const { data: comments } = await supabase
    .from("task_comments")
    .select("body, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true })
    .limit(50);
  if (!comments || comments.length === 0) {
    return { error: "No comments to distill yet" };
  }

  // Existing entry for this thread?
  const { data: existing } = await supabase
    .from("memory_entries")
    .select("id, updated_at")
    .eq("workspace_id", task.workspace_id)
    .eq("source_type", "comment-thread")
    .eq("source_id", taskId)
    .maybeSingle();

  if (
    existing &&
    options?.throttleMs &&
    Date.now() - new Date(existing.updated_at as string).getTime() <
      options.throttleMs
  ) {
    return { success: true, entryId: String(existing.id), skipped: true };
  }

  // Cost guardrail (D7): cap distillations per workspace per day
  const distillCap = Number(process.env.BRAIN_DISTILL_DAILY_CAP || "50");
  if (Number.isFinite(distillCap) && distillCap > 0) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("memory_entries")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", task.workspace_id)
      .eq("source_type", "comment-thread")
      .gte("updated_at", startOfDay.toISOString());
    if ((count ?? 0) >= distillCap) {
      logger.warn("brain.distill.cap_reached", {
        workspaceId: task.workspace_id,
        cap: distillCap,
      });
      return {
        error: `Daily distillation cap reached (${distillCap}). Try again tomorrow.`,
      };
    }
  }

  const thread = comments
    .map((c, i) => `(${i + 1}) ${String(c.body)}`)
    .join("\n");

  let summary = "";
  let mode: "ai" | "fallback" = "fallback";
  const prompt = `Summarize this task discussion into a decision record for a company memory. Respond in 2-4 sentences: what was discussed, what was decided, and why. Do not add anything that is not present in the thread.

Task: ${task.title}

Thread:
${thread}`;
  const llm = await generateText(prompt, {
    sessionId: `brain-distill-${taskId}`,
    maxTokens: 400,
  });
  if (llm) {
    summary = llm.text;
    mode = "ai";
  }
  if (!summary) {
    summary = `Discussion on "${task.title}": ${thread.slice(0, 600)}${
      thread.length > 600 ? "…" : ""
    }`;
  }

  const embedding = await embedText(`${task.title}\n${summary}`);

  const payload = {
    workspace_id: task.workspace_id,
    created_by: user.id,
    source_type: "comment-thread",
    source_id: taskId,
    title: task.title,
    summary,
    decisions: [] as Json,
    // pgvector columns surface as `string` in generated types (type-only cast).
    ...(embedding ? { embedding: embedding as unknown as string } : {}),
  };

  if (existing) {
    const { error } = await supabase
      .from("memory_entries")
      .update(payload as never)
      .eq("id", existing.id);
    if (error) return { error: error.message };
    logger.info("brain.distilled", {
      entryId: existing.id,
      taskId,
      mode,
      updated: true,
    });
    revalidatePath("/brain");
    return { success: true, entryId: String(existing.id), mode };
  }

  const { data, error } = await supabase
    .from("memory_entries")
    .insert(payload as never)
    .select("id")
    .single();
  if (error || !data) {
    return { error: error?.message || "Failed to save memory entry" };
  }
  logger.info("brain.distilled", {
    entryId: data.id,
    taskId,
    mode,
    updated: false,
  });
  revalidatePath("/brain");
  return { success: true, entryId: String(data.id), mode };
}
