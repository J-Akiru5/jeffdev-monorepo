/**
 * prism_kitchen — Context Budget Optimization Tool
 *
 * Analyzes and optimizes the context an AI coding assistant will receive.
 * Implements the "Kitchen" metaphor: prepare, trim, and serve rules within
 * a token budget to achieve 60-70% token reduction.
 *
 * Key strategies:
 * 1. Task-scoped filtering (only relevant rules)
 * 2. Priority-based truncation (high=full, medium=summary, low=skip)
 * 3. Deduplication (merge near-identical rules)
 * 4. Skill reference compression (don't inline skills, reference by ID)
 */

import type { ToolOutput, KitchenAnalyzeInput, KitchenPreviewInput } from "../types.js";
import { countTokensInText } from "../middleware/token-counter.js";
import {
  rankRulesByTask,
  formatRulesResponse,
  type RuleDoc,
} from "../middleware/smart-select.js";
import { getCached, setCached, getCacheKey } from "../middleware/cache.js";

const DEFAULT_BUDGET = 4000;

export async function handleKitchenAnalyze(
  input: KitchenAnalyzeInput,
): Promise<ToolOutput> {
  const { task, budget = DEFAULT_BUDGET, projectId, format = "markdown" } = input;

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
        content: [{ type: "text", text: "No active rules found. Create rules first via the dashboard or `prism sync`." }],
      };
    }

    // Run smart selection with the specified budget
    const ranked = await rankRulesByTask(task, allRules, budget);

    // Calculate savings
    const totalTokensIfSentAll = allRules.reduce(
      (sum, r) => sum + countTokensInText((r.content as string) || ""),
      0,
    );
    const actualTokens = ranked.tokenCount;
    const savingsPercent = totalTokensIfSentAll > 0
      ? Math.round(((totalTokensIfSentAll - actualTokens) / totalTokensIfSentAll) * 100)
      : 0;

    const response = formatRulesResponse(ranked, task, format);

    // Build analysis report
    const analysis = [
      `# Context Kitchen Analysis`,
      ``,
      `**Task:** "${task}"`,
      `**Budget:** ${budget} tokens`,
      ``,
      `## Token Savings`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total rules in DB | ${allRules.length} |`,
      `| Rules after filtering | ${ranked.rules.length} |`,
      `| Rules skipped | ${ranked.skippedRules} |`,
      `| Rules deduplicated | ${ranked.dedupedRules} |`,
      `| Tokens if sent all | ~${totalTokensIfSentAll.toLocaleString()} |`,
      `| Tokens after optimization | ~${actualTokens.toLocaleString()} |`,
      `| **Savings** | **${savingsPercent}%** |`,
      ``,
      savingsPercent >= 64
        ? `✅ **Target achieved!** ${savingsPercent}% reduction meets the 64% target.`
        : `⚠️ **Below target.** ${savingsPercent}% reduction (target: 64%). Consider narrowing the task description or reducing rule count.`,
      ``,
      `## Optimized Context`,
      ``,
      response,
    ].join("\n");

    return {
      content: [{ type: "text", text: analysis }],
      _meta: {
        totalRules: allRules.length,
        returnedRules: ranked.rules.length,
        skippedRules: ranked.skippedRules,
        dedupedRules: ranked.dedupedRules,
        tokenCount: actualTokens,
        savingsPercent,
        budgetUsed: Math.round((actualTokens / budget) * 100),
      },
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error in kitchen analysis: ${error instanceof Error ? error.message : "Unknown error"}`,
      }],
      isError: true,
    };
  }
}

export async function handleKitchenPreview(
  input: KitchenPreviewInput,
): Promise<ToolOutput> {
  const { task, projectId, budget = DEFAULT_BUDGET } = input;

  if (!task) {
    return {
      content: [{ type: "text", text: "Error: `task` is required." }],
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
    const ranked = await rankRulesByTask(task, allRules, budget);

    // Return just the context that would be sent to the AI
    const context = formatRulesResponse(ranked, task, "markdown");
    const tokenCount = countTokensInText(context);

    return {
      content: [{
        type: "text",
        text: [
          `# Context Preview`,
          ``,
          `**Tokens:** ${tokenCount} / ${budget} (${Math.round((tokenCount / budget) * 100)}% of budget)`,
          `**Rules:** ${ranked.rules.length} of ${allRules.length}`,
          ``,
          `---`,
          ``,
          context,
        ].join("\n"),
      }],
      _meta: { tokenCount, ruleCount: ranked.rules.length },
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
