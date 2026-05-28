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
 * Storage: Cosmos DB `governance_memory` collection
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

const MEMORY_COLLECTION = "governance_memory";

/**
 * Store a memory entry in the governance memory.
 */
export async function storeMemory(
  entry: Omit<MemoryEntry, "_id" | "createdAt" | "updatedAt">,
): Promise<MemoryEntry> {
  const { getCollection } = await import("@syntaxure-labs/db/cosmos");
  const memories = await getCollection(MEMORY_COLLECTION);

  const now = new Date().toISOString();
  const doc: MemoryEntry = {
    ...entry,
    createdAt: now,
    updatedAt: now,
  };

  const result = await memories.insertOne(doc as unknown as Record<string, unknown>);
  return { ...doc, _id: result.insertedId };
}

/**
 * Query memories from the governance memory.
 */
export async function queryMemories(query: MemoryQuery): Promise<MemoryEntry[]> {
  const { getCollection } = await import("@syntaxure-labs/db/cosmos");
  const memories = await getCollection(MEMORY_COLLECTION);

  const filter: Record<string, unknown> = {};

  if (query.type) filter.type = query.type;
  if (query.scope) filter.scope = query.scope;
  if (query.projectId) filter.projectId = query.projectId;
  if (query.teamId) filter.teamId = query.teamId;
  if (query.importance) filter.importance = query.importance;
  if (query.tags && query.tags.length > 0) {
    filter.tags = { $in: query.tags };
  }
  if (query.since) {
    filter.createdAt = { $gte: query.since };
  }
  // Don't return expired memories
  filter.$or = [
    { expiresAt: { $exists: false } },
    { expiresAt: null },
    { expiresAt: { $gt: new Date().toISOString() } },
  ];

  const limit = query.limit || 50;
  const results = await memories
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return results as unknown as MemoryEntry[];
}

/**
 * Get memory statistics.
 */
export async function getMemoryStats(
  projectId?: string,
  teamId?: string,
): Promise<MemoryStats> {
  const { getCollection } = await import("@syntaxure-labs/db/cosmos");
  const memories = await getCollection(MEMORY_COLLECTION);

  const filter: Record<string, unknown> = {};
  if (projectId) filter.projectId = projectId;
  if (teamId) filter.teamId = teamId;

  const all = await memories.find(filter).toArray() as unknown as MemoryEntry[];

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
  const { getCollection } = await import("@syntaxure-labs/db/cosmos");
  const memories = await getCollection(MEMORY_COLLECTION);

  const result = await memories.deleteMany({
    expiresAt: { $lt: new Date().toISOString() },
  });

  return result.deletedCount;
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
