/**
 * Governance Memory Layer — Persistent AI Agent Memory
 *
 * The epitome of context governance: AI agents remember.
 *
 * Problem: Every session starts fresh. The agent doesn't know:
 * - What rules it violated before
 * - What patterns work for this project
 * - What the team decided
 * - What conventions are already established
 *
 * Solution: A shared memory that persists across sessions and team members.
 *
 * Memory Types:
 * - decision: "We chose Tailwind over CSS modules on 2024-01-15"
 * - pattern: "All API routes follow: authenticate → validate → execute → respond"
 * - violation: "AI used inline styles 3 times last week. Now it avoids them."
 * - consensus: "Team voted to use Zod v3 over v4 for stability"
 * - incident: "Rule #5 added because of production incident on 2024-02-01"
 * - progress: "Working on auth module. 3 of 5 tasks complete."
 *
 * Storage: Postgres `prism_governance_memory` table (Supabase)
 * Access: All team agents via MCP tool `prism_memory`
 */

// =============================================================================
// Types
// =============================================================================

export type MemoryType =
  | "decision"
  | "pattern"
  | "violation"
  | "consensus"
  | "incident"
  | "progress"
  | "context";

export type MemoryScope = "project" | "team" | "global";

export interface MemoryEntry {
  _id?: { toString(): string };
  type: MemoryType;
  scope: MemoryScope;
  projectId?: string;
  teamId?: string;
  content: string;
  tags: string[];
  importance: "critical" | "high" | "medium" | "low";
  source: string; // who/what created this memory
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryQuery {
  type?: MemoryType;
  scope?: MemoryScope;
  projectId?: string;
  teamId?: string;
  tags?: string[];
  importance?: MemoryEntry["importance"];
  limit?: number;
  since?: string;
}

export interface MemoryStats {
  totalEntries: number;
  byType: Record<MemoryType, number>;
  byImportance: Record<string, number>;
  recentEntries: MemoryEntry[];
  topTags: Array<{ tag: string; count: number }>;
}

// =============================================================================
// Memory Manager
// =============================================================================

const MEMORY_SELECT =
  "_id:id, type, scope, projectId:project_id, teamId:team_id, content, tags, importance, source, sessionId:session_id, createdAt:created_at, updatedAt:updated_at, expiresAt:expires_at, metadata";

/**
 * Store a memory entry in the governance memory.
 */
export async function storeMemory(
  entry: Omit<MemoryEntry, "_id" | "createdAt" | "updatedAt">,
): Promise<MemoryEntry> {
  const { getPrismDb } = await import("@syntaxure-labs/db/prism");
  const db = getPrismDb();

  const now = new Date().toISOString();
  const { data, error } = await db
    .from("prism_governance_memory")
    .insert({
      type: entry.type,
      scope: entry.scope,
      project_id: entry.projectId ?? null,
      team_id: entry.teamId ?? null,
      content: entry.content,
      tags: entry.tags,
      importance: entry.importance,
      source: entry.source,
      session_id: entry.sessionId ?? null,
      expires_at: entry.expiresAt ?? null,
      metadata: entry.metadata ?? null,
      created_at: now,
      updated_at: now,
    })
    .select(MEMORY_SELECT)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to store memory entry");
  }

  return { ...(data as unknown as MemoryEntry), _id: { toString: () => data._id } };
}

/**
 * Query memories from the governance memory.
 */
export async function queryMemories(query: MemoryQuery): Promise<MemoryEntry[]> {
  const { getPrismDb } = await import("@syntaxure-labs/db/prism");
  const db = getPrismDb();

  let q = db.from("prism_governance_memory").select(MEMORY_SELECT);

  if (query.type) q = q.eq("type", query.type);
  if (query.scope) q = q.eq("scope", query.scope);
  if (query.projectId) q = q.eq("project_id", query.projectId);
  if (query.teamId) q = q.eq("team_id", query.teamId);
  if (query.importance) q = q.eq("importance", query.importance);
  if (query.tags && query.tags.length > 0) q = q.overlaps("tags", query.tags);
  if (query.since) q = q.gte("created_at", query.since);
  // Don't return expired memories
  q = q.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  const limit = query.limit || 50;
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as MemoryEntry[];
}

/**
 * Get memory statistics.
 */
export async function getMemoryStats(
  projectId?: string,
  teamId?: string,
): Promise<MemoryStats> {
  const { getPrismDb } = await import("@syntaxure-labs/db/prism");
  const db = getPrismDb();

  let q = db.from("prism_governance_memory").select(MEMORY_SELECT);
  if (projectId) q = q.eq("project_id", projectId);
  if (teamId) q = q.eq("team_id", teamId);

  const { data, error } = await q;
  if (error) throw error;
  const all = (data ?? []) as unknown as MemoryEntry[];

  const byType: Record<MemoryType, number> = {
    decision: 0,
    pattern: 0,
    violation: 0,
    consensus: 0,
    incident: 0,
    progress: 0,
    context: 0,
  };
  const byImportance: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  const tagCounts: Record<string, number> = {};

  for (const entry of all) {
    byType[entry.type] = (byType[entry.type] || 0) + 1;
    byImportance[entry.importance] = (byImportance[entry.importance] || 0) + 1;
    for (const tag of entry.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const recentEntries = all
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  return {
    totalEntries: all.length,
    byType,
    byImportance,
    recentEntries,
    topTags,
  };
}

/**
 * Delete expired memories (cleanup).
 */
export async function cleanupExpiredMemories(): Promise<number> {
  const { getPrismDb } = await import("@syntaxure-labs/db/prism");
  const db = getPrismDb();

  const { data, error } = await db
    .from("prism_governance_memory")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Format memories for AI consumption.
 * This is what the AI agent receives — compressed, actionable context.
 */
export function formatMemoriesForContext(
  memories: MemoryEntry[],
  maxTokens: number = 1000,
): string {
  if (memories.length === 0) return "";

  const lines: string[] = [
    `## 🧠 Governance Memory`,
    ``,
    `These are lessons learned from previous sessions and team decisions. Apply them.`,
    ``,
  ];

  // Group by type
  const grouped: Record<string, MemoryEntry[]> = {};
  for (const m of memories) {
    if (!grouped[m.type]) grouped[m.type] = [];
    grouped[m.type]!.push(m);
  }

  const typeLabels: Record<MemoryType, string> = {
    decision: "📋 Decisions Made",
    pattern: "🔄 Established Patterns",
    violation: "⚠️ Past Violations (avoid repeating)",
    consensus: "🤝 Team Consensus",
    incident: "🚨 Incidents & Lessons",
    progress: "📊 Development Progress",
    context: "📝 Context Notes",
  };

  for (const [type, entries] of Object.entries(grouped)) {
    const label = typeLabels[type as MemoryType] || type;
    lines.push(`### ${label}`);
    lines.push(``);

    for (const entry of entries.slice(0, 5)) {
      const importance = entry.importance === "critical" ? "🔴" :
        entry.importance === "high" ? "🟠" :
        entry.importance === "medium" ? "🟡" : "⚪";
      lines.push(`${importance} ${entry.content}`);
      if (entry.tags.length > 0) {
        lines.push(`   Tags: ${entry.tags.join(", ")}`);
      }
      lines.push(``);
    }
  }

  return lines.join("\n");
}
