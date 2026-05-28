/**
 * prism_memory — Governance Memory Tool
 *
 * Persistent memory for AI agents. Stores decisions, patterns, violations,
 * and team consensus that persists across sessions and team members.
 *
 * This is the key to context governance at scale:
 * - Decisions made in one session are visible to all team agents
 * - Past violations prevent repeating mistakes
 * - Established patterns ensure consistency
 * - Development progress is tracked across sessions
 *
 * Usage:
 * - action: "read" — Query memories (what should I know?)
 * - action: "write" — Store a new memory (what happened?)
 * - action: "stats" — Get memory statistics
 * - action: "cleanup" — Remove expired memories
 */

import type { ToolOutput, MemoryReadInput, MemoryWriteInput } from "../types.js";
import {
  storeMemory,
  queryMemories,
  getMemoryStats,
  cleanupExpiredMemories,
  formatMemoriesForContext,
  type MemoryType,
  type MemoryScope,
} from "../lib/governance-memory.js";

export async function handlePrismMemory(
  input: MemoryReadInput | MemoryWriteInput,
): Promise<ToolOutput> {
  const action = input.action;

  try {
    switch (action) {
      case "read":
        return handleMemoryRead(input as MemoryReadInput);
      case "write":
        return handleMemoryWrite(input as MemoryWriteInput);
      case "stats":
        return handleMemoryStats(input as MemoryReadInput);
      case "cleanup":
        return handleMemoryCleanup();
      default:
        return {
          content: [{ type: "text", text: `Error: Unknown action "${action}". Use: read, write, stats, cleanup.` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      }],
      isError: true,
    };
  }
}

async function handleMemoryRead(input: MemoryReadInput): Promise<ToolOutput> {
  const memories = await queryMemories({
    type: input.type as MemoryType | undefined,
    scope: input.scope as MemoryScope | undefined,
    projectId: input.projectId,
    teamId: input.teamId,
    tags: input.tags,
    importance: input.importance as "critical" | "high" | "medium" | "low" | undefined,
    limit: input.limit,
    since: input.since,
  });

  if (memories.length === 0) {
    return {
      content: [{
        type: "text",
        text: "No memories found matching your query. This might be a fresh project — start building governance memory by writing decisions, patterns, and lessons learned.",
      }],
    };
  }

  const formatted = formatMemoriesForContext(memories);

  return {
    content: [{ type: "text", text: formatted }],
    _meta: {
      count: memories.length,
      types: [...new Set(memories.map((m) => m.type))],
    },
  };
}

async function handleMemoryWrite(input: MemoryWriteInput): Promise<ToolOutput> {
  if (!input.content) {
    return {
      content: [{ type: "text", text: "Error: `content` is required for writing a memory." }],
      isError: true,
    };
  }

  const entry = await storeMemory({
    type: (input.type as MemoryType) || "context",
    scope: (input.scope as MemoryScope) || "project",
    projectId: input.projectId,
    teamId: input.teamId,
    content: input.content,
    tags: input.tags || [],
    importance: input.importance || "medium",
    source: input.source || "ai-agent",
    sessionId: input.sessionId,
    expiresAt: input.expiresAt,
    metadata: input.metadata,
  });

  const icon = entry.importance === "critical" ? "🔴" :
    entry.importance === "high" ? "🟠" :
    entry.importance === "medium" ? "🟡" : "⚪";

  return {
    content: [{
      type: "text",
      text: [
        `${icon} Memory stored successfully.`,
        ``,
        `**Type:** ${entry.type}`,
        `**Scope:** ${entry.scope}`,
        `**Importance:** ${entry.importance}`,
        `**Content:** ${entry.content}`,
        entry.tags.length > 0 ? `**Tags:** ${entry.tags.join(", ")}` : "",
        ``,
        `This memory will be available to all team agents in future sessions.`,
      ].filter(Boolean).join("\n"),
    }],
    _meta: { memoryId: entry._id?.toString() },
  };
}

async function handleMemoryStats(input: MemoryReadInput): Promise<ToolOutput> {
  const stats = await getMemoryStats(input.projectId, input.teamId);

  const lines: string[] = [
    `# Governance Memory Stats`,
    ``,
    `**Total entries:** ${stats.totalEntries}`,
    ``,
    `## By Type`,
    ``,
    ...Object.entries(stats.byType)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `- **${type}:** ${count}`),
    ``,
    `## By Importance`,
    ``,
    ...Object.entries(stats.byImportance)
      .filter(([, count]) => count > 0)
      .map(([level, count]) => `- **${level}:** ${count}`),
  ];

  if (stats.topTags.length > 0) {
    lines.push(``, `## Top Tags`, ``);
    for (const { tag, count } of stats.topTags) {
      lines.push(`- **${tag}:** ${count}`);
    }
  }

  if (stats.recentEntries.length > 0) {
    lines.push(``, `## Recent Memories`, ``);
    for (const entry of stats.recentEntries.slice(0, 5)) {
      lines.push(`- [${entry.type}] ${entry.content.substring(0, 80)}${entry.content.length > 80 ? "..." : ""}`);
    }
  }

  return {
    content: [{ type: "text", text: lines.join("\n") }],
    _meta: { totalEntries: stats.totalEntries },
  };
}

async function handleMemoryCleanup(): Promise<ToolOutput> {
  const deleted = await cleanupExpiredMemories();

  return {
    content: [{
      type: "text",
      text: `Cleaned up ${deleted} expired memory entries.`,
    }],
    _meta: { deleted },
  };
}
