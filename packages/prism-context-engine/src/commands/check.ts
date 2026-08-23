/**
 * check command — the Pass
 *
 * Local enforcement of .prism/rules.json against files an agent wrote.
 * Two modes:
 *   prism check <files...>          lint mode — prints findings, exit 1 on blocks
 *   prism check --hook              agent hook mode — reads a PostToolUse-style
 *                                   JSON event from stdin, exits 2 on blocks so
 *                                   the correction lands in the agent's context
 *
 * Hook mode fails open: missing/malformed rules, unreadable files, engine
 * errors and kill switch (PRISM_DISABLE=1) all exit 0 without blocking.
 */

import chalk from "chalk";
import { readFileSync, readdirSync, statSync } from "fs";
import { dirname, extname, join, resolve } from "path";
import { findRulesPath, loadRuleSet } from "../rules/parse.js";
import { applicableExtensions, checkContent } from "../rules/engine.js";
import { formatHookClaudeCode, formatPretty } from "../rules/format.js";
import type { Finding, RuleSet } from "../rules/types.js";

const MAX_STDIN_BYTES = 1024 * 1024;
const HOOK_TOOL_PATTERN = /Write|Edit/i;

interface CheckOptions {
  rules?: string;
  hook?: boolean;
  format?: string;
}

interface HookEvent {
  tool_name?: string;
  tool_input?: { file_path?: unknown };
}

export async function check(
  files: string[],
  options: CheckOptions = {},
): Promise<void> {
  if (options.hook) {
    await runHook();
    return;
  }
  runStandalone(files, options.rules);
}

async function runHook(): Promise<void> {
  if (process.env.PRISM_DISABLE === "1") return;

  const event = await readStdinJson();
  if (!event) return;
  if (
    typeof event.tool_name === "string" &&
    !HOOK_TOOL_PATTERN.test(event.tool_name)
  ) {
    return;
  }
  const filePath = event.tool_input?.file_path;
  if (typeof filePath !== "string" || filePath.length === 0) return;

  let ruleSet: RuleSet;
  try {
    const rulesPath = findRulesPath(dirname(resolve(filePath)));
    if (!rulesPath) {
      console.error("[prism] check skipped: no .prism/rules.json found");
      return;
    }
    ruleSet = loadRuleSet(rulesPath);
  } catch (err) {
    console.error(`[prism] check skipped: ${errorMessage(err)}`);
    return;
  }

  if (!applicableExtensions(ruleSet).has(extname(filePath).toLowerCase())) {
    return;
  }

  let content: string;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    console.error("[prism] check skipped: edited file is not readable");
    return;
  }

  let findings: Finding[];
  try {
    findings = checkContent(filePath, content, ruleSet);
  } catch (err) {
    console.error(`[prism] check skipped: engine error: ${errorMessage(err)}`);
    return;
  }

  const blocks = findings.filter((f) => f.severity === "block");
  if (blocks.length === 0) return;

  process.stderr.write(`${formatHookClaudeCode(filePath, blocks)}\n`);
  process.exitCode = 2;
}

function runStandalone(files: string[], rulesOverride?: string): void {
  if (files.length === 0) {
    console.error(chalk.red("prism check: no files given."));
    console.error("Usage: prism check <file|dir...> [--rules <path>]");
    process.exitCode = 2;
    return;
  }

  let ruleSet: RuleSet;
  try {
    const rulesPath = rulesOverride ?? findRulesPath(process.cwd());
    if (!rulesPath) {
      throw new Error(
        "no .prism/rules.json found (searched upward from the current directory)",
      );
    }
    ruleSet = loadRuleSet(rulesPath);
  } catch (err) {
    console.error(chalk.red(`prism check: ${errorMessage(err)}`));
    process.exitCode = 2;
    return;
  }

  const allowed = applicableExtensions(ruleSet);
  const targets = expandTargets(files, allowed);

  const byFile = new Map<string, Finding[]>();
  const readErrors: string[] = [];
  let blocks = 0;
  let warns = 0;

  for (const target of targets) {
    let content: string;
    try {
      content = readFileSync(target, "utf8");
    } catch (err) {
      readErrors.push(`cannot read ${target}: ${errorMessage(err)}`);
      continue;
    }
    const findings = checkContent(target, content, ruleSet);
    if (findings.length === 0) continue;
    byFile.set(target, findings);
    blocks += findings.filter((f) => f.severity === "block").length;
    warns += findings.filter((f) => f.severity === "warn").length;
  }

  console.log(formatPretty(byFile, blocks, warns));
  for (const error of readErrors) {
    console.error(chalk.red(`prism check: ${error}`));
  }
  if (readErrors.length > 0) {
    process.exitCode = 2;
  } else if (blocks > 0) {
    process.exitCode = 1;
  }
}

function expandTargets(inputs: string[], allowedExt: Set<string>): string[] {
  const out = new Set<string>();
  for (const input of inputs) {
    const resolved = resolve(input);
    let stats;
    try {
      stats = statSync(resolved);
    } catch {
      out.add(resolved);
      continue;
    }
    if (stats.isDirectory()) {
      walkDir(resolved, allowedExt, out);
    } else if (allowedExt.has(extname(resolved).toLowerCase())) {
      out.add(resolved);
    }
  }
  return [...out].sort();
}

function walkDir(dir: string, allowedExt: Set<string>, out: Set<string>): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(full, allowedExt, out);
    } else if (allowedExt.has(extname(full).toLowerCase())) {
      out.add(full);
    }
  }
}

async function readStdinJson(): Promise<HookEvent | null> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > MAX_STDIN_BYTES) return null;
    chunks.push(buf);
  }
  if (chunks.length === 0) return null;
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as HookEvent;
  } catch {
    return null;
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
