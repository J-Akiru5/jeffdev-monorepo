/**
 * prism_intercept — Active Interception Agent
 *
 * Pre-generation validation tool that intercepts code BEFORE it's written.
 * Instead of generating code, finding violations, and fixing them (wasteful),
 * this tool tells the AI exactly what rules apply and what patterns to avoid.
 *
 * This prevents the generate→violate→fix cycle that wastes 40-60% of tokens.
 *
 * Usage:
 * - Call prism_intercept BEFORE generating code for a task
 * - Returns: applicable rules, forbidden patterns, required patterns, examples
 * - The AI uses this as a "guard rail" during generation
 */

import type { ToolOutput, InterceptInput } from "../types.js";
import { countTokensInText } from "../middleware/token-counter.js";
import { getCached, setCached, getCacheKey } from "../middleware/cache.js";

interface ForbiddenPattern {
  pattern: string;
  ruleName: string;
  severity: string;
  instead: string;
}

interface RequiredPattern {
  pattern: string;
  ruleName: string;
  example: string;
}

export async function handlePrismIntercept(
  input: InterceptInput,
): Promise<ToolOutput> {
  const { task, code, filePath, projectId } = input;

  if (!task && !code) {
    return {
      content: [{
        type: "text",
        text: "Error: provide either `task` (pre-generation) or `code` (post-generation validation).",
      }],
      isError: true,
    };
  }

  try {
    const { getPrismDb } = await import("@syntaxure-labs/db/prism");
    const db = getPrismDb();

    let query = db
      .from("prism_rules")
      .select("_id:id, name, content, priority, category, tags, pattern, severity")
      .eq("is_active", true)
      .not("pattern", "is", null);
    if (projectId) query = query.eq("project_id", projectId);

    const { data } = await query.order("priority", { ascending: true });
    const patternRules = data ?? [];

    if (patternRules.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No pattern-based rules found. Create rules with regex patterns to enable interception.",
        }],
      };
    }

    // Pre-generation mode: tell the AI what to avoid
    if (task && !code) {
      return buildPreGenerationGuide(task, patternRules, filePath);
    }

    // Post-generation mode: validate and provide feedback
    if (code) {
      return buildPostGenerationFeedback(code, patternRules, task, filePath);
    }

    return {
      content: [{ type: "text", text: "Provide `task` for pre-generation guide or `code` for validation." }],
      isError: true,
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

function buildPreGenerationGuide(
  task: string,
  patternRules: Array<Record<string, unknown>>,
  filePath?: string,
): ToolOutput {
  const forbidden: ForbiddenPattern[] = [];
  const required: RequiredPattern[] = [];

  for (const rule of patternRules) {
    const pattern = rule.pattern as string;
    const name = rule.name as string;
    const content = rule.content as string;
    const severity = (rule.severity as string) || "warning";

    // Extract actionable guidance from the rule content
    const guidance = extractGuidance(content);

    if (severity === "error") {
      forbidden.push({
        pattern,
        ruleName: name,
        severity,
        instead: guidance,
      });
    } else {
      required.push({
        pattern,
        ruleName: name,
        example: guidance,
      });
    }
  }

  const lines: string[] = [
    `# Prism Interception Guide`,
    ``,
    `**Task:** "${task}"`,
    filePath ? `**File:** ${filePath}` : "",
    ``,
    `## ⛔ Forbidden Patterns (MUST AVOID)`,
    ``,
    `These patterns will cause violations. Do NOT generate code matching them.`,
    ``,
  ];

  if (forbidden.length === 0) {
    lines.push(`No forbidden patterns found.`);
  } else {
    for (const f of forbidden) {
      lines.push(`### ${f.ruleName}`);
      lines.push(`- **Pattern:** \`${f.pattern}\``);
      lines.push(`- **Instead:** ${f.instead}`);
      lines.push(``);
    }
  }

  lines.push(`## ✅ Required Patterns (MUST FOLLOW)`);
  lines.push(``);

  if (required.length === 0) {
    lines.push(`No required patterns found.`);
  } else {
    for (const r of required) {
      lines.push(`### ${r.ruleName}`);
      lines.push(`- **Pattern:** \`${r.pattern}\``);
      lines.push(`- **Example:** ${r.example}`);
      lines.push(``);
    }
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(`**Instructions:** Generate code for the task above while respecting all forbidden and required patterns. This prevents violations and eliminates the need for fix iterations.`);

  const text = lines.filter(Boolean).join("\n");

  return {
    content: [{ type: "text", text }],
    _meta: {
      forbiddenPatterns: forbidden.length,
      requiredPatterns: required.length,
      tokenCount: countTokensInText(text),
      mode: "pre-generation",
    },
  };
}

function buildPostGenerationFeedback(
  code: string,
  patternRules: Array<Record<string, unknown>>,
  task?: string,
  filePath?: string,
): ToolOutput {
  const violations: Array<{
    ruleName: string;
    severity: string;
    matchedText: string;
    line: number;
    column: number;
    fix: string;
  }> = [];

  const lines = code.split("\n");

  for (const rule of patternRules) {
    const pattern = rule.pattern as string;
    if (!pattern) continue;

    try {
      const regex = new RegExp(pattern, "gm");
      let match: RegExpExecArray | null;

      while ((match = regex.exec(code)) !== null) {
        const matchedText = match[0];
        const beforeMatch = code.substring(0, match.index);
        const lineNum = beforeMatch.split("\n").length;
        const colNum = match.index - beforeMatch.lastIndexOf("\n");

        violations.push({
          ruleName: rule.name as string,
          severity: (rule.severity as string) || "warning",
          matchedText,
          line: lineNum,
          column: colNum,
          fix: extractGuidance(rule.content as string),
        });
      }
    } catch {
      // Skip invalid regex
    }
  }

  if (violations.length === 0) {
    return {
      content: [{
        type: "text",
        text: [
          `# Prism Interception Result`,
          ``,
          `✅ **No violations detected.** Code follows all ${patternRules.length} pattern rules.`,
          ``,
          task ? `**Task:** "${task}"` : "",
          filePath ? `**File:** ${filePath}` : "",
        ].filter(Boolean).join("\n"),
      }],
      _meta: { violations: 0, mode: "post-generation" },
    };
  }

  const response = [
    `# Prism Interception Result`,
    ``,
    `❌ **${violations.length} violation(s) detected.** Fix before proceeding.`,
    ``,
    task ? `**Task:** "${task}"` : "",
    filePath ? `**File:** ${filePath}` : "",
    ``,
    `## Violations`,
    ``,
  ];

  for (const v of violations) {
    const icon = v.severity === "error" ? "❌" : v.severity === "warning" ? "⚠️" : "ℹ️";
    response.push(`### ${icon} ${v.ruleName}`);
    response.push(`- **Line ${v.line}:${v.column}** — \`${v.matchedText.substring(0, 60)}\``);
    response.push(`- **Fix:** ${v.fix}`);
    response.push(``);
  }

  response.push(`---`);
  response.push(``);
  response.push(`**Instructions:** Regenerate the code fixing the violations above. Apply the suggested fixes.`);

  const text = response.join("\n");

  return {
    content: [{ type: "text", text }],
    _meta: {
      violations: violations.length,
      errorCount: violations.filter((v) => v.severity === "error").length,
      warningCount: violations.filter((v) => v.severity === "warning").length,
      mode: "post-generation",
    },
  };
}

function extractGuidance(content: string): string {
  // Extract actionable guidance from rule content
  // Look for "use X instead", "prefer X", "always X", "never X" patterns
  const useMatch = content.match(/(?:use|prefer|always)\s+([^.!?\n]+[.!?\n]?)/i);
  if (useMatch) return useMatch[1]!.trim();

  const neverMatch = content.match(/(?:never|don't|avoid|禁止)\s+([^.!?\n]+[.!?\n]?)/i);
  if (neverMatch) return `Avoid: ${neverMatch[1]!.trim()}`;

  // Fallback: first sentence
  const firstSentence = content.match(/[^.!?\n]+[.!?\n]*/);
  return firstSentence ? firstSentence[0].trim() : "See rule content for details.";
}
