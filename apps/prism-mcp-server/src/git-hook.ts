#!/usr/bin/env node
/**
 * Prism Git Hook — Pre-commit Governance Enforcement
 *
 * Validates staged files against governance rules before allowing commits.
 * Works with any git repository, any IDE, any language.
 *
 * Installation:
 *   npx prism-context-engine init-hooks
 *
 * Or manually add to .git/hooks/pre-commit:
 *   #!/bin/sh
 *   npx prism-git-hook
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";

const PASS = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const WARN = "\x1b[33m⚠\x1b[0m";

function getStagedFiles(): string[] {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf-8",
    });
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function getStagedContent(filePath: string): string {
  try {
    return execSync(`git show :${filePath}`, { encoding: "utf-8" });
  } catch {
    return "";
  }
}

async function validateFile(filePath: string, content: string): Promise<Array<{
  ruleName: string;
  severity: string;
  line: number;
  message: string;
}>> {
  const violations: Array<{
    ruleName: string;
    severity: string;
    line: number;
    message: string;
  }> = [];

  // Built-in checks (always run, no DB needed)
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Cross-app imports
    if (line.includes("../../apps/") || line.includes("../apps/")) {
      violations.push({
        ruleName: "no-cross-app-imports",
        severity: "error",
        line: i + 1,
        message: "Cross-app import detected. Use shared packages instead.",
      });
    }

    // Console.log in production code
    if (line.match(/console\.log\(/) && !filePath.includes("test") && !filePath.includes("spec")) {
      violations.push({
        ruleName: "no-console-log",
        severity: "warning",
        line: i + 1,
        message: "console.log detected. Use console.error or a logger.",
      });
    }

    // Inline styles in React
    if (line.match(/style=\{\{/) && (filePath.endsWith(".tsx") || filePath.endsWith(".jsx"))) {
      violations.push({
        ruleName: "no-inline-styles",
        severity: "warning",
        line: i + 1,
        message: "Inline style detected. Use Tailwind CSS classes.",
      });
    }

    // TODO/FIXME without ticket
    if (line.match(/\/\/\s*(TODO|FIXME|HACK)\b/i) && !line.match(/#\d+/)) {
      violations.push({
        ruleName: "todo-without-ticket",
        severity: "info",
        line: i + 1,
        message: "TODO/FIXME without issue number. Add a ticket reference.",
      });
    }

    // Hardcoded secrets
    if (line.match(/(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/i)) {
      violations.push({
        ruleName: "no-hardcoded-secrets",
        severity: "error",
        line: i + 1,
        message: "Possible hardcoded secret detected. Use environment variables.",
      });
    }
  }

  return violations;
}

async function main(): Promise<void> {
  const files = getStagedFiles();

  if (files.length === 0) {
    process.exit(0);
  }

  // Filter to source files
  const sourceFiles = files.filter((f) =>
    /\.(ts|tsx|js|jsx|mjs|cjs|vue|svelte)$/.test(f)
  );

  if (sourceFiles.length === 0) {
    process.exit(0);
  }

  let totalViolations = 0;
  let hasErrors = false;

  for (const file of sourceFiles) {
    const content = getStagedContent(file);
    if (!content) continue;

    const violations = await validateFile(file, content);

    if (violations.length > 0) {
      console.error(`\n${file}:`);
      for (const v of violations) {
        const icon = v.severity === "error" ? FAIL : v.severity === "warning" ? WARN : "ℹ️";
        console.error(`  ${icon} Line ${v.line}: [${v.ruleName}] ${v.message}`);
        totalViolations++;
        if (v.severity === "error") hasErrors = true;
      }
    }
  }

  if (totalViolations > 0) {
    console.error(`\n${totalViolations} governance violation(s) found.`);
    if (hasErrors) {
      console.error(`\n${FAIL} Commit blocked. Fix errors before committing.`);
      console.error(`   Run \`prism check\` for details or \`prism fix\` to auto-fix.\n`);
      process.exit(1);
    } else {
      console.error(`\n${WARN} Warnings found but commit allowed.\n`);
    }
  }
}

main().catch(() => {
  // Don't block commits on hook failure
  process.exit(0);
});
