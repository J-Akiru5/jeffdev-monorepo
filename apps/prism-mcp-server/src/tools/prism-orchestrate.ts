/**
 * prism_orchestrate — One-Call Governance Engine
 *
 * The single greatest optimization: instead of the model making 4-5 separate
 * tool calls (prism_compile → prism_kitchen → get_architectural_rules →
 * prism_intercept → prism_check), this tool does ALL of that in ONE call.
 *
 * The model calls prism_orchestrate with a task description and gets back:
 * 1. Compiled validators (executable constraints)
 * 2. Optimized rules (token-budget enforced)
 * 3. Pre-flight guard rails (forbidden/required patterns)
 * 4. Injection context (system-level constraint)
 *
 * This reduces tool calls from 5→1 and tokens by 60-70%.
 */

import type { ToolOutput, OrchestrateInput } from "../types.js";
import { compileRules } from "../lib/rule-compiler.js";
import {
  rankRulesByTask,
  formatRulesResponse,
  type RuleDoc,
} from "../middleware/smart-select.js";
import { countTokensInText } from "../middleware/token-counter.js";
import { getCached, setCached, getCacheKey } from "../middleware/cache.js";
import { queryMemories, formatMemoriesForContext } from "../lib/governance-memory.js";

const DEFAULT_BUDGET = 4000;

export async function handlePrismOrchestrate(
  input: OrchestrateInput,
): Promise<ToolOutput> {
  const {
    task,
    code,
    filePath,
    projectId,
    budget = DEFAULT_BUDGET,
    mode = "full",
  } = input;

  if (!task) {
    return {
      content: [{ type: "text", text: "Error: `task` is required. Describe what you're about to code." }],
      isError: true,
    };
  }

  try {
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
          text: "No active rules found. Create rules first via the dashboard or `prism sync`.",
        }],
      };
    }

    // Phase 1: Load governance memory (lessons from past sessions)
    let memoryContext = "";
    try {
      const memories = await queryMemories({
        projectId,
        limit: 20,
      });
      if (memories.length > 0) {
        memoryContext = formatMemoriesForContext(memories);
      }
    } catch {
      // Memory load failure is non-fatal
    }

    // Phase 2: Compile rules into executable validators
    const compiled = compileRules(allRules);

    // Phase 3: Smart selection with token budget
    const ranked = await rankRulesByTask(task, allRules, budget);

    // Phase 4: Calculate savings
    const totalTokensIfSentAll = allRules.reduce(
      (sum, r) => sum + countTokensInText((r.content as string) || ""),
      0,
    );
    const savingsPercent = totalTokensIfSentAll > 0
      ? Math.round(((totalTokensIfSentAll - ranked.tokenCount) / totalTokensIfSentAll) * 100)
      : 0;

    // Phase 4: Build pre-flight guard rails from compiled rules
    const forbiddenPatterns: string[] = [];
    const requiredPatterns: string[] = [];

    for (const rule of compiled.rules) {
      for (const v of rule.validators) {
        if (v.type === "import") {
          forbiddenPatterns.push(v.description);
        } else if (v.type === "regex" || v.type === "semantic") {
          if (rule.severity === "error") {
            forbiddenPatterns.push(v.description);
          } else {
            requiredPatterns.push(v.description);
          }
        }
      }
    }

    // Phase 5: If code is provided, validate it
    let validationReport = "";
    if (code) {
      const result = compiled.combinedValidator(code);
      if (!result.passes) {
        validationReport = [
          ``,
          `## ❌ Validation Result`,
          ``,
          `${result.violations.length} violation(s) detected:`,
          ``,
          ...result.violations.slice(0, 5).map((v) =>
            `- Line ${v.line}: \`${v.matchedText.substring(0, 60)}\``
          ),
          result.violations.length > 5 ? `\n... and ${result.violations.length - 5} more` : "",
          ``,
          `Call \`prism_fix\` with these violations to auto-correct.`,
        ].filter(Boolean).join("\n");
      } else {
        validationReport = `\n## ✅ Validation Result\n\nCode passes all ${compiled.rules.length} compiled rules.`;
      }
    }

    // Phase 7: Build the single unified response
    const response = buildOrchestratedResponse({
      task,
      rules: ranked.rules,
      totalRules: allRules.length,
      compiledRules: compiled.rules.length,
      compiledValidators: compiled.stats.validatorsGenerated,
      forbiddenPatterns,
      requiredPatterns,
      injectionContext: compiled.injectionContext,
      memoryContext,
      savingsPercent,
      tokenCount: ranked.tokenCount,
      budget,
      validationReport,
      mode,
    });

    return {
      content: [{ type: "text", text: response }],
      _meta: {
        totalRules: allRules.length,
        returnedRules: ranked.rules.length,
        compiledRules: compiled.rules.length,
        compiledValidators: compiled.stats.validatorsGenerated,
        savingsPercent,
        tokenCount: ranked.tokenCount,
        budgetUsed: Math.round((ranked.tokenCount / budget) * 100),
        hasMemory: memoryContext.length > 0,
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

function buildOrchestratedResponse(ctx: {
  task: string;
  rules: Array<{ name: string; content: string; priority: number; category: string; similarity: number; truncated: boolean }>;
  totalRules: number;
  compiledRules: number;
  compiledValidators: number;
  forbiddenPatterns: string[];
  requiredPatterns: string[];
  injectionContext: string;
  memoryContext: string;
  savingsPercent: number;
  tokenCount: number;
  budget: number;
  validationReport: string;
  mode: "full" | "compact" | "minimal";
}): string {
  // Minimal mode: just the injection context
  if (ctx.mode === "minimal") {
    return ctx.injectionContext;
  }

  // Compact mode: guard rails + rules, no injection context
  if (ctx.mode === "compact") {
    return [
      `# Prism Governance — "${ctx.task}"`,
      ``,
      `╔══════════════════════════════════════════╗`,
      `║  💰 CONTEXT SAVINGS: ${ctx.savingsPercent}% reduction      ║`,
      `║  📊 ${ctx.rules.length}/${ctx.totalRules} rules | ${ctx.tokenCount}/${ctx.budget} tokens     ║`,
      `╚══════════════════════════════════════════╝`,
      ``,
      ctx.memoryContext,
      ctx.forbiddenPatterns.length > 0
        ? `## ⛔ FORBIDDEN\n${ctx.forbiddenPatterns.map((p) => `- ${p}`).join("\n")}\n`
        : "",
      ctx.requiredPatterns.length > 0
        ? `## ✅ REQUIRED\n${ctx.requiredPatterns.map((p) => `- ${p}`).join("\n")}\n`
        : "",
      `## Rules`,
      ``,
      ...ctx.rules.map((r) =>
        `### ${r.name} (${r.category}, P${r.priority})\n${r.content}\n`
      ),
      ctx.validationReport,
    ].filter(Boolean).join("\n");
  }

  // Full mode: everything
  return [
    `# Prism Orchestration — "${ctx.task}"`,
    ``,
    `╔══════════════════════════════════════════════════════╗`,
    `║  💰 CONTEXT SAVINGS: ${String(ctx.savingsPercent).padStart(2)}% reduction                ║`,
    `║  📊 ${String(ctx.rules.length).padStart(2)}/${String(ctx.totalRules).padEnd(2)} rules compiled │ ${String(ctx.tokenCount).padStart(4)}/${String(ctx.budget).padEnd(4)} tokens used  ║`,
    `║  🔒 ${String(ctx.compiledValidators).padStart(2)} executable validators generated         ║`,
    `╚══════════════════════════════════════════════════════╝`,
    ``,
    ctx.memoryContext,
    ``,
    `---`,
    ``,
    ctx.injectionContext,
    ``,
    `---`,
    ``,
    ctx.forbiddenPatterns.length > 0
      ? `## ⛔ Forbidden Patterns\n\nThese will cause violations. Do NOT generate code matching them.\n\n${ctx.forbiddenPatterns.map((p) => `- ${p}`).join("\n")}\n`
      : "",
    ctx.requiredPatterns.length > 0
      ? `## ✅ Required Patterns\n\nThese must be followed.\n\n${ctx.requiredPatterns.map((p) => `- ${p}`).join("\n")}\n`
      : "",
    `## Optimized Rules`,
    ``,
    ...ctx.rules.map((r) =>
      [
        `### ${r.name}`,
        `**Category:** ${r.category} | **Priority:** ${r.priority} | **Relevance:** ${Math.round(r.similarity * 100)}%`,
        r.truncated ? `*Summarized to fit budget*` : "",
        ``,
        r.content,
        ``,
        `---`,
        ``,
      ].filter(Boolean).join("\n")
    ),
    ctx.validationReport,
  ].filter(Boolean).join("\n");
}
