/**
 * Context Drip — Progressive Rule Disclosure System
 *
 * The ultimate token optimization: instead of giving the AI all rules at once,
 * drip-feed only what's needed, exactly when it's needed.
 *
 * Analogy: GPS for code generation
 *   Old way: Give the AI a full map (all rules) → wastes attention
 *   New way: Turn-by-turn directions (rules on demand) → minimal context
 *
 * How it works:
 *   1. AI calls prism_drip with current code snippet
 *   2. System detects what the AI is building (component, API, utility, etc.)
 *   3. Returns ONLY the rules that apply to THIS specific moment
 *   4. AI continues writing, calls drip again when context changes
 *   5. System tracks what rules have been given → never repeats
 *
 * Three-tier rule system:
 *   Tier 1 (Red Lines): Always given first. 2-3 critical rules. Never violate.
 *   Tier 2 (Context): Given when the AI is in a specific domain (React, API, etc.)
 *   Tier 3 (Edge Cases): Given only when approaching a violation
 *
 * Token savings: 80-90% compared to sending all rules upfront.
 */

import type { ToolOutput, DripInput } from "../types.js";
import { compileRules, type CompiledRulePackage } from "../lib/rule-compiler.js";
import { countTokensInText } from "../middleware/token-counter.js";
import { getCached, setCached, getCacheKey } from "../middleware/cache.js";
import type { RuleDoc } from "../middleware/smart-select.js";

// =============================================================================
// Types
// =============================================================================

interface DripState {
  sessionId: string;
  givenRules: Set<string>;       // Rule IDs already given
  currentContext: CodeContext;    // What the AI is building
  redLines: RuleDoc[];           // Tier 1: always given
  contextRules: RuleDoc[];       // Tier 2: given when in domain
  edgeCaseRules: RuleDoc[];      // Tier 3: given when approaching violation
  totalTokens: number;           // Tokens given so far
  maxTokens: number;             // Budget
}

type CodeContext =
  | "unknown"
  | "react-component"
  | "api-route"
  | "utility"
  | "config"
  | "test"
  | "style"
  | "database"
  | "auth"
  | "middleware";

interface DripResponse {
  rules: Array<{
    id: string;
    name: string;
    content: string;
    tier: 1 | 2 | 3;
    reason: string;
  }>;
  context: CodeContext;
  tokensGiven: number;
  totalTokensGiven: number;
  remainingBudget: number;
  redLinesExhausted: boolean;
  nextAction: string;
}

// =============================================================================
// Session Management (in-memory, per MCP connection)
// =============================================================================

const sessions = new Map<string, DripState>();

function getSession(sessionId: string): DripState {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      sessionId,
      givenRules: new Set(),
      currentContext: "unknown",
      redLines: [],
      contextRules: [],
      edgeCaseRules: [],
      totalTokens: 0,
      maxTokens: 4000,
    });
  }
  return sessions.get(sessionId)!;
}

// =============================================================================
// Context Detection — What is the AI building?
// =============================================================================

function detectContext(code: string, filePath?: string): CodeContext {
  const lower = code.toLowerCase();
  const path = (filePath || "").toLowerCase();

  // React component
  if (
    lower.includes("useclient") ||
    lower.includes("usestate") ||
    lower.includes("useeffect") ||
    lower.includes("jsx") ||
    lower.includes("tsx") ||
    path.includes("component") ||
    path.includes("/ui/") ||
    (path.endsWith(".tsx") && !path.includes("api"))
  ) {
    return "react-component";
  }

  // API route
  if (
    lower.includes("nextrequest") ||
    lower.includes("nextresponse") ||
    lower.includes("export async function get") ||
    lower.includes("export async function post") ||
    path.includes("/api/") ||
    path.includes("route.ts")
  ) {
    return "api-route";
  }

  // Database
  if (
    lower.includes("getcollection") ||
    lower.includes("findone") ||
    lower.includes("find(") ||
    lower.includes("insertone") ||
    lower.includes("updateone") ||
    lower.includes("mongoclient") ||
    path.includes("db") ||
    path.includes("database")
  ) {
    return "database";
  }

  // Auth
  if (
    lower.includes("supabase") ||
    lower.includes("auth.") ||
    lower.includes("getsession") ||
    lower.includes("getuser") ||
    path.includes("auth") ||
    path.includes("middleware")
  ) {
    return "auth";
  }

  // Config
  if (
    path.includes("config") ||
    path.includes(".env") ||
    path.includes("next.config") ||
    path.includes("tailwind.config") ||
    path.includes("tsconfig")
  ) {
    return "config";
  }

  // Test
  if (
    path.includes("test") ||
    path.includes("spec") ||
    path.includes("__tests__") ||
    lower.includes("describe(") ||
    lower.includes("it(") ||
    lower.includes("expect(")
  ) {
    return "test";
  }

  // Style
  if (
    path.includes(".css") ||
    path.includes(".scss") ||
    lower.includes("classname") ||
    lower.includes("tailwind")
  ) {
    return "style";
  }

  // Utility
  if (
    path.includes("lib/") ||
    path.includes("utils/") ||
    path.includes("helpers/")
  ) {
    return "utility";
  }

  return "unknown";
}

// =============================================================================
// Rule Classification — Which tier does each rule belong to?
// =============================================================================

function classifyRules(rules: RuleDoc[]): {
  redLines: RuleDoc[];
  contextRules: RuleDoc[];
  edgeCaseRules: RuleDoc[];
} {
  const redLines: RuleDoc[] = [];
  const contextRules: RuleDoc[] = [];
  const edgeCaseRules: RuleDoc[] = [];

  for (const rule of rules) {
    const severity = (rule.severity as string) || "warning";
    const priority = (rule.priority as number) || 50;
    const content = ((rule.content as string) || "").toLowerCase();

    // Tier 1: Red Lines (critical severity or high priority)
    if (severity === "error" || priority <= 2) {
      redLines.push(rule);
    }
    // Tier 2: Context rules (have domain-specific keywords)
    else if (
      content.includes("component") ||
      content.includes("api") ||
      content.includes("import") ||
      content.includes("style") ||
      content.includes("test") ||
      content.includes("database") ||
      content.includes("auth") ||
      priority <= 5
    ) {
      contextRules.push(rule);
    }
    // Tier 3: Edge cases (everything else)
    else {
      edgeCaseRules.push(rule);
    }
  }

  return { redLines, contextRules, edgeCaseRules };
}

// =============================================================================
// Drip Logic — What to give next
// =============================================================================

function getNextDrip(
  state: DripState,
  currentCode: string,
  filePath?: string,
): DripResponse {
  const context = detectContext(currentCode, filePath);
  state.currentContext = context;

  const rules: DripResponse["rules"] = [];
  let tokensGiven = 0;

  // Phase 1: Give red lines (if not already given)
  for (const rule of state.redLines) {
    const id = rule._id.toString();
    if (state.givenRules.has(id)) continue;

    const content = rule.content as string;
    const tokens = countTokensInText(content);

    if (state.totalTokens + tokensGiven + tokens > state.maxTokens) break;

    rules.push({
      id,
      name: rule.name as string,
      content,
      tier: 1,
      reason: "Critical rule — must never violate",
    });

    state.givenRules.add(id);
    tokensGiven += tokens;

    // Only give 2-3 red lines per drip
    if (rules.filter((r) => r.tier === 1).length >= 3) break;
  }

  // Phase 2: Give context rules (if in a specific domain)
  if (context !== "unknown") {
    for (const rule of state.contextRules) {
      const id = rule._id.toString();
      if (state.givenRules.has(id)) continue;

      const content = rule.content as string;
      const lower = content.toLowerCase();

      // Check if this rule is relevant to the current context
      const contextKeywords: Record<CodeContext, string[]> = {
        "react-component": ["component", "react", "jsx", "tsx", "props", "hook", "state", "render"],
        "api-route": ["api", "route", "request", "response", "endpoint", "http", "fetch"],
        "utility": ["function", "helper", "util", "export", "import"],
        "config": ["config", "environment", "variable", "setting"],
        "test": ["test", "spec", "mock", "assert", "expect", "describe"],
        "style": ["style", "css", "tailwind", "class", "theme"],
        "database": ["database", "query", "collection", "document", "mongo"],
        "auth": ["auth", "session", "token", "login", "user", "permission"],
        "middleware": ["middleware", "request", "response", "next"],
        "unknown": [],
      };

      const keywords = contextKeywords[context] || [];
      const isRelevant = keywords.some((kw) => lower.includes(kw));

      if (!isRelevant) continue;

      const tokens = countTokensInText(content);

      if (state.totalTokens + tokensGiven + tokens > state.maxTokens) break;

      rules.push({
        id,
        name: rule.name as string,
        content,
        tier: 2,
        reason: `Relevant to ${context} context`,
      });

      state.givenRules.add(id);
      tokensGiven += tokens;

      // Only give 2-3 context rules per drip
      if (rules.filter((r) => r.tier === 2).length >= 3) break;
    }
  }

  // Phase 3: Check if current code approaches any edge case violations
  for (const rule of state.edgeCaseRules) {
    const id = rule._id.toString();
    if (state.givenRules.has(id)) continue;

    const pattern = rule.pattern as string | undefined;
    if (!pattern) continue;

    // Check if the current code is close to violating this rule
    try {
      const regex = new RegExp(pattern, "gm");
      if (regex.test(currentCode)) {
        const content = rule.content as string;
        const tokens = countTokensInText(content);

        if (state.totalTokens + tokensGiven + tokens > state.maxTokens) break;

        rules.push({
          id,
          name: rule.name as string,
          content,
          tier: 3,
          reason: "Approaching violation — rule injected just-in-time",
        });

        state.givenRules.add(id);
        tokensGiven += tokens;

        // Only give 1-2 edge case rules per drip
        if (rules.filter((r) => r.tier === 3).length >= 2) break;
      }
    } catch {
      // Invalid regex, skip
    }
  }

  state.totalTokens += tokensGiven;

  // Determine next action
  let nextAction = "Continue writing code. Call prism_drip again when context changes.";
  if (rules.length === 0) {
    nextAction = "No new rules needed. You're on track — continue coding.";
  } else if (rules.some((r) => r.tier === 1)) {
    nextAction = "RED LINE injected. Follow this rule strictly. Continue coding.";
  } else if (rules.some((r) => r.tier === 3)) {
    nextAction = "Edge case warning. Adjust your code to avoid this violation.";
  }

  return {
    rules,
    context,
    tokensGiven,
    totalTokensGiven: state.totalTokens,
    remainingBudget: state.maxTokens - state.totalTokens,
    redLinesExhausted: state.redLines.every((r) => state.givenRules.has(r._id.toString())),
    nextAction,
  };
}

// =============================================================================
// Main Handler
// =============================================================================

export async function handlePrismDrip(input: DripInput): Promise<ToolOutput> {
  const {
    code,
    filePath,
    projectId,
    sessionId = "default",
    budget = 4000,
    action = "drip",
  } = input;

  try {
    // Handle reset action
    if (action === "reset") {
      sessions.delete(sessionId);
      return {
        content: [{
          type: "text",
          text: "Drip session reset. All given rules cleared.",
        }],
      };
    }

    // Handle status action
    if (action === "status") {
      const state = getSession(sessionId);
      return {
        content: [{
          type: "text",
          text: [
            `# Drip Session Status`,
            ``,
            `**Session:** ${sessionId}`,
            `**Context:** ${state.currentContext}`,
            `**Rules given:** ${state.givenRules.size}`,
            `**Tokens given:** ${state.totalTokens}/${state.maxTokens}`,
            `**Red lines exhausted:** ${state.redLines.every((r) => state.givenRules.has(r._id.toString())) ? "Yes" : "No"}`,
          ].join("\n"),
        }],
      };
    }

    // Drip action — load rules and give next batch
    if (!code) {
      return {
        content: [{
          type: "text",
          text: "Error: `code` is required for drip action. Provide your current code snippet.",
        }],
        isError: true,
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

    if (allRules.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No active rules found. Create rules first.",
        }],
      };
    }

    // Get or create session
    const state = getSession(sessionId);
    state.maxTokens = budget;

    // Classify rules into tiers (on first call)
    if (state.redLines.length === 0) {
      const classified = classifyRules(allRules);
      state.redLines = classified.redLines;
      state.contextRules = classified.contextRules;
      state.edgeCaseRules = classified.edgeCaseRules;
    }

    // Get next drip
    const drip = getNextDrip(state, code, filePath);

    // Format response
    if (drip.rules.length === 0) {
      return {
        content: [{
          type: "text",
          text: [
            `✅ No new rules needed for this context.`,
            ``,
            `**Context:** ${drip.context}`,
            `**Rules given so far:** ${state.givenRules.size}`,
            `**Tokens used:** ${drip.totalTokensGiven}/${state.maxTokens}`,
            ``,
            drip.nextAction,
          ].join("\n"),
        }],
        _meta: {
          rulesGiven: 0,
          totalRulesGiven: state.givenRules.size,
          tokensGiven: 0,
          totalTokensGiven: drip.totalTokensGiven,
          context: drip.context,
        },
      };
    }

    const lines: string[] = [
      `# Context Drip`,
      ``,
      `╔══════════════════════════════════════════════════════╗`,
      `║  📍 Context: ${drip.context.padEnd(39)}║`,
      `║  💧 Rules this drip: ${String(drip.rules.length).padEnd(31)}║`,
      `║  📊 Total given: ${String(state.givenRules.size).padEnd(34)}║`,
      `║  💰 Tokens: ${String(drip.totalTokensGiven).padStart(4)}/${String(state.maxTokens).padEnd(4)} (${String(Math.round((drip.totalTokensGiven / state.maxTokens) * 100)).padStart(2)}% used)          ║`,
      `╚══════════════════════════════════════════════════════╝`,
      ``,
    ];

    for (const rule of drip.rules) {
      const tierIcon = rule.tier === 1 ? "🔴" : rule.tier === 2 ? "🟡" : "🔵";
      const tierLabel = rule.tier === 1 ? "RED LINE" : rule.tier === 2 ? "CONTEXT" : "EDGE CASE";

      lines.push(`### ${tierIcon} ${rule.name} [${tierLabel}]`);
      lines.push(`*${rule.reason}*`);
      lines.push(``);
      lines.push(rule.content);
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    }

    lines.push(`**Next:** ${drip.nextAction}`);

    return {
      content: [{ type: "text", text: lines.join("\n") }],
      _meta: {
        rulesGiven: drip.rules.length,
        totalRulesGiven: state.givenRules.size,
        tokensGiven: drip.tokensGiven,
        totalTokensGiven: drip.totalTokensGiven,
        context: drip.context,
        redLinesExhausted: drip.redLinesExhausted,
      },
    };
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
