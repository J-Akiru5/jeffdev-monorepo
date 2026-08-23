/**
 * prism_compile — Rule Compiler Tool
 *
 * Compiles governance rules into executable validators that enforce
 * rules at the code level, not just as suggestions.
 *
 * This is the key differentiator: instead of giving the AI markdown
 * rules to read (and potentially ignore), we give it:
 * 1. TypeScript type guards that make violating code fail to compile
 * 2. Compiled validators that run on any code string
 * 3. Deterministic fix templates (not AI-generated fixes)
 * 4. Injection context that constrains what the AI can generate
 *
 * Usage:
 * - Call prism_compile to get compiled validators for your rules
 * - The AI receives the injection context as a system-level constraint
 * - Code is validated against compiled validators (not regex matching)
 */

import type { ToolOutput, CompileInput } from "../types.js";
import { compileRules, type CompiledRulePackage } from "../lib/rule-compiler.js";
import type { RuleDoc } from "../middleware/smart-select.js";
import { getCached, setCached, getCacheKey } from "../middleware/cache.js";

export async function handlePrismCompile(
  input: CompileInput,
): Promise<ToolOutput> {
  const { projectId, category, task, format = "markdown" } = input;

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
    if (category) query = query.eq("category", category);

    const { data } = await query;
    const allRules = (data ?? []) as unknown as RuleDoc[];

    if (allRules.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No active rules found. Create rules with regex patterns to enable compilation.",
        }],
      };
    }

    // Check cache
    const cacheKey = getCacheKey("compiled", [projectId || "global", category || "all"]);
    const cached = getCached<CompiledRulePackage>(cacheKey);

    let compiled: CompiledRulePackage;
    if (cached) {
      compiled = cached;
    } else {
      compiled = compileRules(allRules);
      setCached(cacheKey, compiled);
    }

    if (compiled.rules.length === 0) {
      return {
        content: [{
          type: "text",
          text: "No rules with actionable patterns found. Add regex patterns to your rules to enable compilation.",
        }],
      };
    }

    if (format === "json") {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            rules: compiled.rules.map((r) => ({
              id: r.ruleId,
              name: r.ruleName,
              category: r.category,
              severity: r.severity,
              validators: r.validators.map((v) => ({
                type: v.type,
                name: v.name,
                description: v.description,
              })),
              fixes: r.fixes.length,
            })),
            stats: compiled.stats,
            injectionContext: compiled.injectionContext,
          }, null, 2),
        }],
        _meta: compiled.stats,
      };
    }

    // Markdown format
    const lines: string[] = [
      `# Compiled Rule Package`,
      ``,
      `## Stats`,
      ``,
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Rules compiled | ${compiled.stats.totalRules} of ${allRules.length} |`,
      `| Validators generated | ${compiled.stats.validatorsGenerated} |`,
      `| Fix templates | ${compiled.stats.fixesGenerated} |`,
      `| Injection context tokens | ~${compiled.stats.estimatedTokens} |`,
      ``,
    ];

    // Show each compiled rule
    for (const rule of compiled.rules) {
      const icon = rule.severity === "error" ? "⛔" : rule.severity === "warning" ? "⚠️" : "ℹ️";
      lines.push(`### ${icon} ${rule.ruleName}`);
      lines.push(`- **Category:** ${rule.category}`);
      lines.push(`- **Severity:** ${rule.severity}`);
      lines.push(`- **Validators:** ${rule.validators.map((v) => v.name).join(", ")}`);
      if (rule.fixes.length > 0) {
        lines.push(`- **Auto-fixes:** ${rule.fixes.length} template(s)`);
      }
      lines.push(``);
    }

    // Show the injection context
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Injection Context`);
    lines.push(``);
    lines.push(`This is what the AI should receive as a system-level constraint:`);
    lines.push(``);
    lines.push(compiled.injectionContext);

    // Show how to use with TypeScript
    lines.push(`---`);
    lines.push(``);
    lines.push(`## TypeScript Integration`);
    lines.push(``);
    lines.push(`To enforce these rules at compile time, add to your \`tsconfig.json\`:`);
    lines.push(``);
    lines.push("```json");
    lines.push(`{`);
    lines.push(`  "compilerOptions": {`);
    lines.push(`    "paths": {`);
    lines.push(`      "@prism/validators": ["./.prism/compiled-validators.ts"]`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push(`}`);
    lines.push("```");
    lines.push(``);
    lines.push(`Then import and use in your code:`);
    lines.push(``);
    lines.push("```typescript");
    lines.push(`import { validateCode } from "@prism/validators";`);
    lines.push(``);
    lines.push(`// This will cause a TypeScript error if the code violates rules`);
    lines.push(`const result = validateCode(myGeneratedCode);`);
    lines.push(`if (!result.passes) {`);
    lines.push(`  throw new Error(\`Rule violations: \${result.violations.map(v => v.matchedText).join(", ")}\`);`);
    lines.push(`}`);
    lines.push("```");

    const text = lines.join("\n");

    return {
      content: [{ type: "text", text }],
      _meta: compiled.stats,
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error compiling rules: ${error instanceof Error ? error.message : "Unknown error"}`,
      }],
      isError: true,
    };
  }
}
