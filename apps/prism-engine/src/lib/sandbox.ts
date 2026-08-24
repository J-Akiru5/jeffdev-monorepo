/**
 * Sandbox preview (Phase 3, re-architected in Phase 4.5): run a user's
 * constitution against sample code by SPAWNING the Prism rule engine as a
 * subprocess over the versioned `sandbox-eval` stdio contract.
 *
 * Why a subprocess (two independent reasons, one change):
 *  1. LICENSING - packages/prism-context-engine is moving to AGPL-3.0 while
 *     this app stays proprietary; an arm's-length process boundary is the
 *     clean side of that line.
 *  2. SECURITY - user-supplied regexes execute server-side. A catastrophic
 *     backtracking pattern can hang an in-process regex forever with no way
 *     to kill it; a child process gets SIGTERM then SIGKILL on a hard timer.
 *
 * Defense in depth on top of the timeout:
 *  - every user regex passes dual-layer safety validation BEFORE spawn
 *    (see ./regex-safety) - the timeout is the backstop, not the plan.
 *
 * The route's response shape and exported types are unchanged.
 */

import { z } from "zod";
import { spawn } from "child_process";
import { createRequire } from "module";
import { existsSync } from "fs";
import path from "path";
import {
  assessRegexSafety,
} from "./regex-safety";

export const SandboxFileSchema = z.object({
  path: z.string().min(1).max(300),
  content: z.string().max(64 * 1024),
});

export const SandboxRequestSchema = z.object({
  /** A full rules.json v1 envelope as a JSON string — same contract pull writes. */
  rulesJson: z.string().min(2).max(256 * 1024),
  files: z.array(SandboxFileSchema).min(1).max(20),
});

export type SandboxRequest = z.infer<typeof SandboxRequestSchema>;

export interface SandboxFinding {
  file: string;
  line: number;
  severity: "block" | "warn";
  ruleId: string;
  message: string;
  offending: string;
  replacement?: string;
}

export interface SandboxResult {
  ok: true;
  ruleCount: number;
  filesScanned: number;
  findings: SandboxFinding[];
  summary: { blocks: number; warns: number };
}

/** Invalid rules.json v1 envelope — same message contract as before. */
export class SandboxValidationError extends Error {}

/** A user pattern failed safety validation. Never reaches the engine. */
export class SandboxRejectedPatternError extends Error {
  readonly pattern: string;
  readonly reasons: string[];
  constructor(pattern: string, reasons: string[]) {
    super(
      `Pattern rejected as potentially catastrophic: ${pattern}. Reasons: ${reasons.join("; ")}`,
    );
    this.name = "SandboxRejectedPatternError";
    this.pattern = pattern;
    this.reasons = reasons;
  }
}

export type SandboxSpawnErrorCode =
  | "TIMEOUT"
  | "MALFORMED_OUTPUT"
  | "SPAWN_UNAVAILABLE"
  | "CHILD_ERROR";

export class SandboxSpawnError extends Error {
  readonly code: SandboxSpawnErrorCode;
  constructor(code: SandboxSpawnErrorCode, message: string) {
    super(message);
    this.name = "SandboxSpawnError";
    this.code = code;
  }
}

const DEFAULT_TIMEOUT_MS = Number(process.env.SANDBOX_TIMEOUT_MS || 5000);
const CHILD_MAX_OLD_SPACE_MB = 256;

/**
 * Resolve the CLI entry script to spawn.
 * Override hatch for tests/ops: PRISM_SANDBOX_CLI_ENTRY.
 */
export function resolveCliEntry(): string {
  if (process.env.PRISM_SANDBOX_CLI_ENTRY) {
    return process.env.PRISM_SANDBOX_CLI_ENTRY;
  }
  try {
    const require_ = createRequire(import.meta.url);
    const pkgJsonPath = require_.resolve("@prism-engine/cli/package.json");
    return path.join(path.dirname(pkgJsonPath), "bin", "prism.js");
  } catch {
    // Fallback: walk up looking for the workspace install (dev/tests).
    let dir = process.cwd();
    for (;;) {
      const candidate = path.join(
        dir,
        "node_modules",
        "@prism-engine",
        "cli",
        "bin",
        "prism.js",
      );
      if (existsSync(candidate)) return candidate;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    throw new SandboxSpawnError(
      "SPAWN_UNAVAILABLE",
      "@prism-engine/cli entry could not be resolved (is the package installed?)",
    );
  }
}

interface ChildOutcome {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

/**
 * Spawn node with a memory-capped child running the CLI subcommand,
 * feeding `input` on stdin. HARD timeout: SIGTERM first, then SIGKILL
 * after a short grace window regardless of whether the child exited.
 */
function runNodeWithInput(
  scriptArgs: string[],
  input: string,
  timeoutMs: number,
): Promise<ChildOutcome> {
  return new Promise((resolve, reject) => {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(
        process.execPath,
        ["--max-old-space-size=256", ...scriptArgs],
        { stdio: ["pipe", "pipe", "pipe"] },
      );
    } catch (err) {
      reject(new SandboxSpawnError("SPAWN_UNAVAILABLE", String(err)));
      return;
    }

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const killTimer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      // Grace window for cleanup, then the guarantee.
      setTimeout(() => {
        if (!settled) child.kill("SIGKILL");
      }, 1000);
    }, timeoutMs);

    child.stdout?.on("data", (d) => (stdout += d));
    child.stderr?.on("data", (d) => (stderr += d));

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      reject(new SandboxSpawnError("SPAWN_UNAVAILABLE", String(err)));
    });

    child.on("close", (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(killTimer);
      resolve({ code, signal, stdout, stderr, timedOut });
    });

    // If stdin errors (rare), still end so the child can finish.
    child.stdin?.on("error", () => {});
    child.stdin?.end(input);
  });
}

/** Collect every regex the engine will compile out of a parsed envelope. */
export function collectUserPatterns(parsedEnvelope: unknown): string[] {
  const patterns = new Set<string>();
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const obj = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (
        (key === "pattern" || key === "matchPattern") &&
        typeof value === "string"
      ) {
        patterns.add(value);
      } else if (value && typeof value === "object") {
        walk(value);
      }
    }
  };
  walk(parsedEnvelope);
  return [...patterns];
}

export interface RunSandboxOptions {
  /** Hard kill timer. Default SANDBOX_TIMEOUT_MS env or 5000ms. */
  timeoutMs?: number;
}

/**
 * Async entry point used by the route. Response shape identical to the
 * previous synchronous implementation.
 */
export async function runSandbox(
  request: SandboxRequest,
  options: RunSandboxOptions = {},
): Promise<SandboxResult> {
  // Parse locally FIRST: invalid envelopes get the exact legacy error, and
  // we need the parsed structure to enumerate user regexes anyway.
  let envelope: unknown;
  try {
    envelope = JSON.parse(request.rulesJson);
  } catch (err) {
    throw new SandboxValidationError(
      `rules.json is not valid: ${(err as Error).message}`,
    );
  }

  // Front door: reject catastrophic patterns before they reach any engine.
  const rejected: Array<{ pattern: string; reasons: string[] }> = [];
  for (const pattern of collectUserPatterns(envelope)) {
    const assessment = assessRegexSafety(pattern);
    if (!assessment.safe) {
      rejected.push({ pattern, reasons: assessment.reasons });
    }
  }
  if (rejected.length > 0) {
    throw new SandboxRejectedPatternError(
      rejected[0]!.pattern,
      rejected[0]!.reasons,
    );
  }

  const envRaw = process.env.SANDBOX_TIMEOUT_MS;
  const envDefault = Number(envRaw && Number(envRaw) > 0 ? envRaw : 5000);
  const fallback = Number.isFinite(envDefault) && envDefault > 0 ? envDefault : 5000;
  const timeoutMs =
    options.timeoutMs && options.timeoutMs > 0 ? options.timeoutMs : fallback;

  const cliEntry = resolveCliEntry();
  const stdinPayload = JSON.stringify({
    v: 1,
    rulesJson: request.rulesJson,
    files: request.files,
  });

  const outcome = await runNodeWithInput(
    [cliEntry, "sandbox-eval"],
    stdinPayload,
    timeoutMs,
  );

  if (outcome.timedOut) {
    throw new SandboxSpawnError(
      "TIMEOUT",
      `Sandbox evaluation exceeded ${timeoutMs}ms and was killed.`,
    );
  }

  // Contract: success JSON on stdout; error JSON on STDERR with exit 3.
  let stdoutEnvelope: {
    v?: number;
    ok?: boolean;
    result?: SandboxResult;
    error?: { code?: string; message?: string };
  } | null = null;
  try {
    if (outcome.stdout.trim()) stdoutEnvelope = JSON.parse(outcome.stdout);
  } catch {
    stdoutEnvelope = null;
  }

  // Prefer a stderr error envelope when present (contract's error channel).
  let stderrError: { code?: string; message?: string } | null = null;
  if (outcome.stderr.trim()) {
    try {
      const se = JSON.parse(outcome.stderr);
      if (se && se.ok === false && se.error) stderrError = se.error;
    } catch {
      /* stderr wasn't contract JSON — fall through */
    }
  }

  if (stderrError) {
    if (stderrError.code === "INVALID_RULES") {
      throw new SandboxValidationError(
        `rules.json is not valid: ${stderrError.message}`,
      );
    }
    throw new SandboxSpawnError(
      "CHILD_ERROR",
      `Evaluator failed: ${stderrError.message}`,
    );
  }

  if (!stdoutEnvelope || stdoutEnvelope.ok !== true || !stdoutEnvelope.result) {
    throw new SandboxSpawnError(
      "MALFORMED_OUTPUT",
      `Child produced malformed output (exit ${outcome.code}): ${
        outcome.stderr.slice(0, 300) || outcome.stdout.slice(0, 300)
      }`,
    );
  }

  // Preserve the exact historical response shape (ok lived inside result).
  return { ...stdoutEnvelope.result, ok: true };
}
