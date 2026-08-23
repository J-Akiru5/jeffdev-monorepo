/**
 * Sandbox preview (Phase 3): run a user's constitution against sample code
 * using the REAL Prism rule engine — the exact parser and matcher the CLI
 * hook executes (prism-context-engine/rules subpath). Deterministic, no AI.
 *
 * Pure logic lives here; the route adds auth, rate limiting, size caps.
 */

import { z } from "zod";
import { parseRuleSet } from "@prism-engine/cli/rules";
import { checkContent, type Finding } from "@prism-engine/cli/rules";

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

export class SandboxValidationError extends Error {}

/**
 * Parse + run. Throws SandboxValidationError with a readable message when
 * the rulesJson isn't a valid v1 envelope — that's the feature, not a bug:
 * users see exactly what the Pass would reject before deploying.
 */
export function runSandbox(request: SandboxRequest): SandboxResult {
  let ruleSet;
  try {
    ruleSet = parseRuleSet(request.rulesJson);
  } catch (err) {
    throw new SandboxValidationError(
      `rules.json is not valid: ${(err as Error).message}`,
    );
  }

  const findings: SandboxFinding[] = [];
  let blocks = 0;
  let warns = 0;

  for (const file of request.files) {
    // checkContent scans line by line and never throws on rule content.
    for (const finding of checkContent(
      file.path,
      file.content,
      ruleSet,
    ) as Finding[]) {
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
    ok: true,
    ruleCount: ruleSet.rules.length,
    filesScanned: request.files.length,
    findings,
    summary: { blocks, warns },
  };
}
