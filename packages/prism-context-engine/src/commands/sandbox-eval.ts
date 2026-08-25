/**
 * `prism sandbox-eval` — Phase 4.5 arm's-length boundary contract v1.
 *
 * A versioned stdio contract so other processes (e.g. apps/prism-engine's
 * sandbox preview) can execute the rule engine WITHOUT importing this
 * package in-process — keeping proprietary services an arm's length from
 * AGPL code and letting callers hard-kill runaway evaluations.
 *
 * Contract v1 (stable; changes require bumping `v`):
 *   stdin  : {"v":1,"rulesJson":"<full rules.json v1 envelope as a string>",
 *             "files":[{"path":"relative/name.ext","content":"..."}, ...]}
 *           Max 20 files. Content ≤64KB each. rulesJson ≤256KB.
 *   stdout : {"v":1,"ok":true,
 *             "result":{"ruleCount":n,"filesScanned":n,
 *                       "findings":[{file,line,severity,ruleId,message,
 *                                    offending,replacement?}],
 *                       "summary":{"blocks":n,"warns":n}}}
 *   stderr : {"v":1,"ok":false,
 *             "error":{"code":"INPUT_MALFORMED"|"INPUT_INVALID"|
 *                      "INVALID_RULES"|"EVAL_ERROR",
 *                      "message":"human-readable"}}
 *   exit   : 0 on ok:true; 3 on any error (deliberately NOT 2 — that is the
 *            Pass hook's blocking contract and must stay unambiguous).
 */

import { parseRuleSet, RulesParseError } from "../rules/parse.js";
import { checkContent } from "../rules/engine.js";

const CONTRACT_VERSION = 1;

export interface SandboxEvalFile {
  path: string;
  content: string;
}

export interface SandboxEvalInput {
  v: number;
  rulesJson: string;
  files: SandboxEvalFile[];
}

export interface SandboxEvalErrorCodeInfo {
  code:
    | "INPUT_MALFORMED"
    | "INPUT_INVALID"
    | "INVALID_RULES"
    | "EVAL_ERROR";
  message: string;
}

export function parseSandboxEvalInput(raw: string): SandboxEvalInput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw evalError("INPUT_MALFORMED", "stdin is not valid JSON");
  }
  const input = parsed as Partial<SandboxEvalInput> | null;
  if (
    !input ||
    input.v !== CONTRACT_VERSION ||
    typeof input.rulesJson !== "string" ||
    !Array.isArray(input.files)
  ) {
    throw evalError(
      "INPUT_INVALID",
      `expected {"v":${CONTRACT_VERSION},"rulesJson":string,"files":[{path,content}]}`,
    );
  }
  return input as SandboxEvalInput;
}

function evalError(
  code: SandboxEvalErrorCodeInfo["code"],
  message: string,
): Error & { code: string } {
  const err = new Error(message) as Error & { code: string };
  err.code = code;
  return err;
}

export function runSandboxEval(input: SandboxEvalInput): unknown {
  let ruleSet;
  try {
    ruleSet = parseRuleSet(input.rulesJson);
  } catch (err) {
    // Distinguish bad envelopes (caller's fault -> fixable) from internal
    // evaluation crashes so subprocess callers can map them differently.
    if (err instanceof RulesParseError) {
      throw evalError("INVALID_RULES", err.message);
    }
    throw err;
  }

  const findings: Array<Record<string, unknown>> = [];
  let blocks = 0;
  let warns = 0;

  for (const file of input.files) {
    for (const finding of checkContent(file.path, file.content, ruleSet)) {
      findings.push({
        file: file.path,
        line: finding.line,
        severity: finding.severity,
        ruleId: finding.ruleId,
        message: finding.message,
        offending: finding.offending,
        ...(finding.replacement ? { replacement: finding.replacement } : {}),
      });
      if (finding.severity === "block") blocks++;
      else warns++;
    }
  }

  return {
    ruleCount: ruleSet.rules.length,
    filesScanned: input.files.length,
    findings,
    summary: { blocks, warns },
  };
}

function emitError(err: unknown): number {
  const codeErr = err as { code?: string };
  const code =
    typeof codeErr.code === "string"
      ? codeErr.code
      : codeErr instanceof RangeError && /JSON/i.test(codeErr.message ?? "")
        ? "INPUT_MALFORMED"
        : "EVAL_ERROR";
  process.stderr.write(
    `${JSON.stringify({
      v: CONTRACT_VERSION,
      ok: false,
      error: { code, message: err instanceof Error ? err.message : String(err) },
    })}\n`,
  );
  return 3;
}

/** Entry point wired into commander. Returns the process exit code. */
export async function sandboxEvalMain(): Promise<number> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  try {
    const input = parseSandboxEvalInput(
      Buffer.concat(chunks).toString("utf8"),
    );
    const result = runSandboxEval(input);
    process.stdout.write(
      `${JSON.stringify({ v: CONTRACT_VERSION, ok: true, result })}\n`,
    );
    return 0;
  } catch (err) {
    return emitError(err);
  }
}
