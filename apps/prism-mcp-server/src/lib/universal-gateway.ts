/**
 * Universal Context Gateway — Ambient Governance for All AI Agents
 *
 * The pinnacle of context governance: one service, all protocols, always-on.
 *
 * This module exposes governance across:
 * 1. MCP (stdio) — Cursor, Claude Desktop, Windsurf, Continue
 * 2. REST API (HTTP) — Custom agents, CI/CD, GitHub Actions
 * 3. WebSocket (realtime) — Live validation as code is written
 * 4. File export — Copilot, Codeium, any tool that reads files
 * 5. Git hooks — Pre-commit enforcement
 *
 * The key insight: Governance should be AMBIENT. It shouldn't require
 * the AI to call a tool. It should always be watching, validating, and
 * guiding — no matter what agent, IDE, or tool is being used.
 */

import { compileRules, type CompiledRulePackage } from "./rule-compiler.js";
import {
  rankRulesByTask,
  formatRulesResponse,
  type RuleDoc,
} from "../middleware/smart-select.js";
import { queryMemories, formatMemoriesForContext } from "./governance-memory.js";
import { countTokensInText } from "../middleware/token-counter.js";

// =============================================================================
// Types
// =============================================================================

export type Protocol = "mcp" | "rest" | "websocket" | "file" | "git-hook";

export interface GatewayRequest {
  protocol: Protocol;
  action: "govern" | "validate" | "export" | "health";
  task?: string;
  code?: string;
  filePath?: string;
  projectId?: string;
  teamId?: string;
  budget?: number;
  format?: "markdown" | "json" | "copilot" | "cursor" | "windsurf" | "claude";
}

export interface GatewayResponse {
  success: boolean;
  protocol: Protocol;
  action: string;
  data: {
    context?: string;
    violations?: ViolationResult[];
    export?: ExportResult;
    savings?: SavingsReport;
    memory?: string;
  };
  meta: {
    rulesProcessed: number;
    rulesReturned: number;
    tokensUsed: number;
    savingsPercent: number;
    hasMemory: boolean;
    timestamp: string;
  };
}

export interface ViolationResult {
  ruleName: string;
  severity: "error" | "warning" | "info";
  line: number;
  column: number;
  matchedText: string;
  fix: string;
}

export interface ExportResult {
  format: string;
  content: string;
  filePath: string;
  tokenCount: number;
}

export interface SavingsReport {
  totalRules: number;
  returnedRules: number;
  tokensBefore: number;
  tokensAfter: number;
  savingsPercent: number;
  compiledValidators: number;
}

// =============================================================================
// Core Governance Engine
// =============================================================================

/**
 * Process a governance request through the Universal Context Gateway.
 * This is the single entry point for all governance operations.
 */
export async function processGovernanceRequest(
  request: GatewayRequest,
): Promise<GatewayResponse> {
  const timestamp = new Date().toISOString();

  try {
    switch (request.action) {
      case "govern":
        return await handleGovern(request, timestamp);
      case "validate":
        return await handleValidate(request, timestamp);
      case "export":
        return await handleExport(request, timestamp);
      case "health":
        return await handleHealth(request, timestamp);
      default:
        return {
          success: false,
          protocol: request.protocol,
          action: request.action,
          data: {},
          meta: { rulesProcessed: 0, rulesReturned: 0, tokensUsed: 0, savingsPercent: 0, hasMemory: false, timestamp },
        };
    }
  } catch (error) {
    return {
      success: false,
      protocol: request.protocol,
      action: request.action,
      data: {},
      meta: { rulesProcessed: 0, rulesReturned: 0, tokensUsed: 0, savingsPercent: 0, hasMemory: false, timestamp },
    };
  }
}

// =============================================================================
// Govern — Full governance context for a task
// =============================================================================

async function handleGovern(
  request: GatewayRequest,
  timestamp: string,
): Promise<GatewayResponse> {
  const { task, projectId, teamId, budget = 4000, format = "markdown" } = request;

  if (!task) {
    return {
      success: false,
      protocol: request.protocol,
      action: "govern",
      data: {},
      meta: { rulesProcessed: 0, rulesReturned: 0, tokensUsed: 0, savingsPercent: 0, hasMemory: false, timestamp },
    };
  }

  const { getPrismDb } = await import("@syntaxure-labs/db/prism");
  const db = getPrismDb();

  let query = db
    .from("prism_rules")
    .select(
      "_id:id, name, content, priority, category, tags, pattern, severity",
    )
    .eq("is_active", true);
  if (projectId) query = query.eq("project_id", projectId);

  const { data } = await query;
  const allRules = (data ?? []) as unknown as RuleDoc[];

  // Compile rules
  const compiled = compileRules(allRules);

  // Smart select
  const ranked = await rankRulesByTask(task, allRules, budget);

  // Load memory
  let memoryContext = "";
  try {
    const memories = await queryMemories({ projectId, teamId, limit: 20 });
    if (memories.length > 0) {
      memoryContext = formatMemoriesForContext(memories);
    }
  } catch {
    // Non-fatal
  }

  // Calculate savings
  const totalTokens = allRules.reduce(
    (sum, r) => sum + countTokensInText((r.content as string) || ""),
    0,
  );
  const savingsPercent = totalTokens > 0
    ? Math.round(((totalTokens - ranked.tokenCount) / totalTokens) * 100)
    : 0;

  // Build context based on format
  let context: string;

  if (format === "copilot") {
    context = formatForCopilot(ranked.rules, memoryContext, compiled);
  } else if (format === "cursor") {
    context = formatForCursor(ranked.rules, memoryContext, compiled);
  } else if (format === "windsurf") {
    context = formatForWindsurf(ranked.rules, memoryContext, compiled);
  } else if (format === "claude") {
    context = formatForClaude(ranked.rules, memoryContext, compiled);
  } else {
    context = formatForMarkdown(ranked.rules, memoryContext, compiled, savingsPercent, ranked.tokenCount, budget);
  }

  return {
    success: true,
    protocol: request.protocol,
    action: "govern",
    data: {
      context,
      savings: {
        totalRules: allRules.length,
        returnedRules: ranked.rules.length,
        tokensBefore: totalTokens,
        tokensAfter: ranked.tokenCount,
        savingsPercent,
        compiledValidators: compiled.stats.validatorsGenerated,
      },
      memory: memoryContext || undefined,
    },
    meta: {
      rulesProcessed: allRules.length,
      rulesReturned: ranked.rules.length,
      tokensUsed: ranked.tokenCount,
      savingsPercent,
      hasMemory: memoryContext.length > 0,
      timestamp,
    },
  };
}

// =============================================================================
// Validate — Check code against governance rules
// =============================================================================

async function handleValidate(
  request: GatewayRequest,
  timestamp: string,
): Promise<GatewayResponse> {
  const { code, projectId } = request;

  if (!code) {
    return {
      success: false,
      protocol: request.protocol,
      action: "validate",
      data: { violations: [] },
      meta: { rulesProcessed: 0, rulesReturned: 0, tokensUsed: 0, savingsPercent: 0, hasMemory: false, timestamp },
    };
  }

  const { getPrismDb } = await import("@syntaxure-labs/db/prism");
  const db = getPrismDb();

  let query = db
    .from("prism_rules")
    .select(
      "_id:id, name, content, priority, category, tags, pattern, severity",
    )
    .eq("is_active", true)
    .not("pattern", "is", null);
  if (projectId) query = query.eq("project_id", projectId);

  const { data } = await query;
  const allRules = (data ?? []) as unknown as RuleDoc[];
  const compiled = compileRules(allRules);

  const result = compiled.combinedValidator(code);

  const violations: ViolationResult[] = result.violations.map((v) => ({
    ruleName: "Governance Rule",
    severity: "error" as const,
    line: v.line,
    column: v.column,
    matchedText: v.matchedText,
    fix: "See rule documentation for fix guidance",
  }));

  return {
    success: true,
    protocol: request.protocol,
    action: "validate",
    data: { violations },
    meta: {
      rulesProcessed: allRules.length,
      rulesReturned: 0,
      tokensUsed: 0,
      savingsPercent: 0,
      hasMemory: false,
      timestamp,
    },
  };
}

// =============================================================================
// Export — Generate governance files for any tool
// =============================================================================

async function handleExport(
  request: GatewayRequest,
  timestamp: string,
): Promise<GatewayResponse> {
  const { projectId, teamId, format = "copilot" } = request;

  const { getPrismDb } = await import("@syntaxure-labs/db/prism");
  const db = getPrismDb();

  let query = db
    .from("prism_rules")
    .select(
      "_id:id, name, content, priority, category, tags, pattern, severity",
    )
    .eq("is_active", true);
  if (projectId) query = query.eq("project_id", projectId);

  const { data } = await query;
  const allRules = (data ?? []) as unknown as RuleDoc[];

  // Load memory
  let memoryContext = "";
  try {
    const memories = await queryMemories({ projectId, teamId, limit: 10 });
    if (memories.length > 0) {
      memoryContext = formatMemoriesForContext(memories);
    }
  } catch {
    // Non-fatal
  }

  const compiled = compileRules(allRules);

  let content: string;
  let filePath: string;

  switch (format) {
    case "copilot":
      content = formatForCopilot(allRules.map((r) => ({
        name: r.name as string,
        content: r.content as string,
        priority: (r.priority as number) || 50,
        category: (r.category as string) || "general",
        similarity: 1,
        truncated: false,
      })), memoryContext, compiled);
      filePath = ".github/copilot-instructions.md";
      break;

    case "cursor":
      content = formatForCursor(allRules.map((r) => ({
        name: r.name as string,
        content: r.content as string,
        priority: (r.priority as number) || 50,
        category: (r.category as string) || "general",
        similarity: 1,
        truncated: false,
      })), memoryContext, compiled);
      filePath = ".cursorrules";
      break;

    case "windsurf":
      content = formatForWindsurf(allRules.map((r) => ({
        name: r.name as string,
        content: r.content as string,
        priority: (r.priority as number) || 50,
        category: (r.category as string) || "general",
        similarity: 1,
        truncated: false,
      })), memoryContext, compiled);
      filePath = ".windsurfrules";
      break;

    case "claude":
      content = formatForClaude(allRules.map((r) => ({
        name: r.name as string,
        content: r.content as string,
        priority: (r.priority as number) || 50,
        category: (r.category as string) || "general",
        similarity: 1,
        truncated: false,
      })), memoryContext, compiled);
      filePath = "CLAUDE.md";
      break;

    default:
      content = formatForMarkdown(allRules.map((r) => ({
        name: r.name as string,
        content: r.content as string,
        priority: (r.priority as number) || 50,
        category: (r.category as string) || "general",
        similarity: 1,
        truncated: false,
      })), memoryContext, compiled, 0, 0, 0);
      filePath = "governance-rules.md";
  }

  return {
    success: true,
    protocol: request.protocol,
    action: "export",
    data: {
      export: {
        format,
        content,
        filePath,
        tokenCount: countTokensInText(content),
      },
    },
    meta: {
      rulesProcessed: allRules.length,
      rulesReturned: allRules.length,
      tokensUsed: countTokensInText(content),
      savingsPercent: 0,
      hasMemory: memoryContext.length > 0,
      timestamp,
    },
  };
}

// =============================================================================
// Health — Gateway health check
// =============================================================================

async function handleHealth(
  request: GatewayRequest,
  timestamp: string,
): Promise<GatewayResponse> {
  const { projectId } = request;

  let ruleCount = 0;
  let memoryCount = 0;

  try {
    const { getPrismDb } = await import("@syntaxure-labs/db/prism");
    const db = getPrismDb();
    const countOpts = { count: "exact" as const, head: true };

    const { count: rc } = await db
      .from("prism_rules")
      .select("id", countOpts)
      .eq("is_active", true);
    ruleCount = rc ?? 0;

    let memQuery = db.from("prism_governance_memory").select("id", countOpts);
    if (projectId) memQuery = memQuery.eq("project_id", projectId);
    const { count: mc } = await memQuery;
    memoryCount = mc ?? 0;
  } catch {
    // DB not available
  }

  return {
    success: true,
    protocol: request.protocol,
    action: "health",
    data: {
      context: [
        `# Universal Context Gateway — Health`,
        ``,
        `**Status:** ✅ Operational`,
        `**Protocols:** MCP, REST, WebSocket, File Export, Git Hooks`,
        `**Rules:** ${ruleCount} active`,
        `**Memory entries:** ${memoryCount}`,
        `**Timestamp:** ${timestamp}`,
      ].join("\n"),
    },
    meta: {
      rulesProcessed: ruleCount,
      rulesReturned: 0,
      tokensUsed: 0,
      savingsPercent: 0,
      hasMemory: memoryCount > 0,
      timestamp,
    },
  };
}

// =============================================================================
// Format Adapters — Output for each tool/IDE
// =============================================================================

interface RuleForFormat {
  name: string;
  content: string;
  priority: number;
  category: string;
  similarity: number;
  truncated: boolean;
}

function formatForCopilot(
  rules: RuleForFormat[],
  memory: string,
  compiled: CompiledRulePackage,
): string {
  // GitHub Copilot reads `.github/copilot-instructions.md`
  const lines: string[] = [
    `# Project Governance Rules`,
    ``,
    `These rules are enforced by Prism Context Engine. Follow them strictly.`,
    ``,
  ];

  if (memory) {
    lines.push(memory, ``);
  }

  for (const rule of rules) {
    lines.push(`## ${rule.name}`, ``, rule.content, ``);
  }

  if (compiled.stats.validatorsGenerated > 0) {
    lines.push(
      `## Compiled Validators`,
      ``,
      `${compiled.stats.validatorsGenerated} executable validators generated. These rules are enforced at the code level.`,
      ``,
    );
  }

  return lines.join("\n");
}

function formatForCursor(
  rules: RuleForFormat[],
  memory: string,
  compiled: CompiledRulePackage,
): string {
  // Cursor reads `.cursorrules`
  const lines: string[] = [];

  if (memory) {
    lines.push(memory, ``);
  }

  for (const rule of rules) {
    lines.push(`### ${rule.name}`, ``, rule.content, ``);
  }

  return lines.join("\n");
}

function formatForWindsurf(
  rules: RuleForFormat[],
  memory: string,
  compiled: CompiledRulePackage,
): string {
  // Windsurf reads `.windsurfrules`
  const lines: string[] = [];

  if (memory) {
    lines.push(memory, ``);
  }

  for (const rule of rules) {
    lines.push(`### ${rule.name}`, ``, rule.content, ``);
  }

  return lines.join("\n");
}

function formatForClaude(
  rules: RuleForFormat[],
  memory: string,
  compiled: CompiledRulePackage,
): string {
  // Claude reads `CLAUDE.md`
  const lines: string[] = [
    `# Project Rules`,
    ``,
    `Follow these rules strictly when generating code for this project.`,
    ``,
  ];

  if (memory) {
    lines.push(memory, ``);
  }

  for (const rule of rules) {
    lines.push(`## ${rule.name}`, ``, rule.content, ``);
  }

  return lines.join("\n");
}

function formatForMarkdown(
  rules: RuleForFormat[],
  memory: string,
  compiled: CompiledRulePackage,
  savingsPercent: number,
  tokenCount: number,
  budget: number,
): string {
  const lines: string[] = [
    `# Prism Governance Context`,
    ``,
    `╔══════════════════════════════════════════════════════╗`,
    `║  💰 CONTEXT SAVINGS: ${String(savingsPercent).padStart(2)}% reduction                ║`,
    `║  📊 ${String(rules.length).padStart(2)} rules │ ${String(tokenCount).padStart(4)}/${String(budget).padEnd(4)} tokens                    ║`,
    `║  🔒 ${String(compiled.stats.validatorsGenerated).padStart(2)} executable validators                   ║`,
    `╚══════════════════════════════════════════════════════╝`,
    ``,
  ];

  if (memory) {
    lines.push(memory, ``);
  }

  for (const rule of rules) {
    lines.push(`## ${rule.name}`, ``, rule.content, ``);
  }

  return lines.join("\n");
}
