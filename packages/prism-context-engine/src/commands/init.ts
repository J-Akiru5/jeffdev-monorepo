/**
 * init command — the local onboarding path
 *
 * Zero network, zero account. Inspects the project's own package.json,
 * globals.css, and Tailwind config to generate a starter `.prism/rules.json`
 * (the same v1 shape `prism check` already parses and `prism pull` fetches
 * from the dashboard), then wires the Claude Code PostToolUse hook into
 * `.claude/settings.json` so the Pass starts enforcing immediately.
 *
 * Never overwrites `.prism/rules.json` or `.claude/settings.json` without
 * confirmation — see writeRulesFile() and wireClaudeHook().
 */

import chalk from "chalk";
import { existsSync } from "fs";
import { join } from "path";
import { atomicWriteFileSync } from "../util/atomic-write.js";
import { promptYesNo } from "../util/prompt.js";
import {
  detectProject,
} from "../init/detect.js";
import { extractTokens } from "../init/tokens.js";
import { generateRuleSet } from "../init/generate-rules.js";
import {
  wireAntigravityHook,
  wireClaudeHook,
  wireCursorHook,
  type AgentWireResult,
} from "../init/hook.js";

export interface InitOptions {
  yes?: boolean;
  force?: boolean;
  /** Internal — lets tests point init() at a fixture directory instead of
   *  the real process.cwd(). Not exposed as a CLI flag. */
  cwd?: string;
}

export async function init(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  console.log(chalk.bold("◈ Prism Context Engine — init\n"));
  console.log(chalk.dim("  Scanning this project. No network calls.\n"));

  const detection = detectProject(cwd);
  const tokens = await extractTokens(cwd);
  const ruleSet = generateRuleSet(detection, tokens);

  printDetection(detection);
  printTokens(tokens);

  const rulesPath = join(cwd, ".prism", "rules.json");
  const rulesWritten = await writeRulesFile(rulesPath, ruleSet, options);

  const hookResult = wireClaudeHook(cwd);
  printHookResult(hookResult);

  // Phase 4: Cursor + Antigravity wiring (best-effort, additive). Claude
  // Desktop has no hooks system — MCP advisory only, handled by ide-setup.
  for (const [agent, result] of [
    ["Cursor", wireCursorHook(cwd)],
    ["Antigravity", wireAntigravityHook(cwd)],
  ] as Array<[string, AgentWireResult]>) {
    printAgentHookResult(agent, result);
  }

  printSummary(ruleSet, rulesWritten, rulesPath);
}

function printAgentHookResult(
  agent: string,
  result: AgentWireResult,
): void {
  switch (result.outcome) {
    case "created":
      console.log(`${chalk.green("✓")} Created ${agent} hook (${result.path})`);
      break;
    case "merged":
      console.log(`${chalk.green("✓")} Merged Pass into existing ${agent} hooks`);
      break;
    case "already-present":
      console.log(`${chalk.green("✓")} ${agent} already has the Pass wired in`);
      break;
    case "invalid-json":
      console.log(
        chalk.yellow(`⚠ ${agent} config exists but isn't valid JSON — left untouched.`),
      );
      break;
  }
}

function printDetection(detection: ReturnType<typeof detectProject>): void {
  if (!detection.hasPackageJson) {
    console.log(
      chalk.yellow("⚠ No package.json found — detection is limited.\n"),
    );
    return;
  }
  const parts: string[] = [];
  parts.push(
    detection.isNextjs
      ? `Next.js ${detection.nextVersion ?? ""}`.trim()
      : "Next.js: not detected",
  );
  if (detection.isNextjs) {
    const router =
      detection.router === "both"
        ? "app + pages routers"
        : detection.router === "none"
          ? "router not found"
          : `${detection.router} router`;
    parts.push(router);
  }
  parts.push(
    detection.hasTailwind
      ? `Tailwind ${detection.tailwindVersion ?? ""}`.trim()
      : "Tailwind: not detected",
  );
  console.log(`Detected: ${chalk.cyan(parts.join(" · "))}\n`);
}

function printTokens(tokens: Awaited<ReturnType<typeof extractTokens>>): void {
  if (tokens.cssFilesScanned.length > 0) {
    console.log(
      `${chalk.green("✓")} Scanned ${tokens.cssFilesScanned.join(", ")}`,
    );
  } else {
    console.log(`${chalk.yellow("⚠")} No globals.css found in common locations`);
  }
  console.log(
    `${chalk.green("✓")} Found ${chalk.bold(String(tokens.colorTokens.length))} color token(s) as CSS custom properties`,
  );
  if (tokens.tailwindConfigFile) {
    const via = tokens.tailwindConfigParsedViaRegexFallback
      ? "regex fallback, best-effort"
      : "parsed directly";
    console.log(
      `${chalk.green("✓")} ${tokens.tailwindConfigFile} found (${via}) — ${tokens.tailwindConfigColorCount} theme color(s) (informational; enforced via the CSS token rule above, not directly)`,
    );
  }
  console.log("");
}

async function writeRulesFile(
  rulesPath: string,
  ruleSet: Awaited<ReturnType<typeof generateRuleSet>>,
  options: InitOptions,
): Promise<boolean> {
  const exists = existsSync(rulesPath);
  if (exists && !options.force) {
    let proceed: boolean;
    if (options.yes) {
      console.log(
        chalk.yellow(
          "⚠ .prism/rules.json already exists — leaving it untouched (pass --force to regenerate).",
        ),
      );
      proceed = false;
    } else {
      proceed = await promptYesNo(
        ".prism/rules.json already exists. Overwrite it with a freshly generated starter?",
        false,
      );
      if (!proceed) {
        console.log(chalk.dim("  Kept the existing .prism/rules.json.\n"));
      }
    }
    if (!proceed) return false;
  }

  atomicWriteFileSync(rulesPath, `${JSON.stringify(ruleSet, null, 2)}\n`);
  console.log(
    `${chalk.green("✓")} Wrote ${chalk.bold(String(ruleSet.rules.length))} rule(s) to .prism/rules.json`,
  );
  console.log("");
  return true;
}

function printHookResult(result: ReturnType<typeof wireClaudeHook>): void {
  switch (result.outcome) {
    case "created":
      console.log(`${chalk.green("✓")} Created .claude/settings.json with the Pass hook wired in`);
      break;
    case "merged":
      console.log(`${chalk.green("✓")} Merged the Pass hook into the existing .claude/settings.json`);
      break;
    case "already-present":
      console.log(`${chalk.green("✓")} .claude/settings.json already has the Pass hook wired in`);
      break;
    case "invalid-json":
      console.log(
        chalk.yellow(
          "⚠ .claude/settings.json exists but isn't valid JSON — left it untouched. Add the hook manually:",
        ),
      );
      console.log(
        chalk.dim(
          '  { "hooks": { "PostToolUse": [{ "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "npx @prism-engine/cli check --hook --format claude-code" }] }] } }',
        ),
      );
      break;
  }
  console.log("");
}

function printSummary(
  ruleSet: Awaited<ReturnType<typeof generateRuleSet>>,
  rulesWritten: boolean,
  rulesPath: string,
): void {
  console.log(chalk.bold("Done.\n"));
  if (rulesWritten) {
    for (const rule of ruleSet.rules) {
      const kind = rule.check ? rule.check.type : "advisory-only";
      console.log(`  ${chalk.cyan("•")} ${rule.id} ${chalk.dim(`(${kind})`)}`);
    }
    console.log("");
  }
  console.log(chalk.dim(`  rules file: ${rulesPath}`));
  console.log(
    chalk.bold("\nNext: ") +
      "write or edit a file in this project — the hook runs automatically.",
  );
  console.log(
    chalk.dim(
      "  Or check by hand:  ",
    ) + chalk.cyan("prism check <file>"),
  );
  console.log(
    chalk.dim("  Team on the dashboard? Sync their rules:  ") +
      chalk.cyan("prism pull"),
  );
}
