import { basename } from "path";
import type { Finding } from "./types.js";

const HOOK_MAX_FINDINGS = 5;

/** Hook output formats. `claude-code` is the original, verified contract —
 *  its output bytes must never change. Cursor/Antigravity differ only in the
 *  lead line; the numbered-corrections body is shared because correction
 *  quality IS the product on every agent. */
export type HookFormat = "claude-code" | "cursor" | "antigravity";

export const HOOK_FORMATS: HookFormat[] = [
  "claude-code",
  "cursor",
  "antigravity",
];

export function normalizeHookFormat(value: string | undefined): HookFormat {
  return HOOK_FORMATS.includes(value as HookFormat)
    ? (value as HookFormat)
    : "claude-code";
}

export function formatFindingLine(finding: Finding): string {
  const location = `${finding.file}:${finding.line}`;
  const what = finding.replacement
    ? `Found '${finding.offending}' — replace it with '${finding.replacement}'.`
    : `Found '${finding.offending}'.`;
  return `${location} [${finding.severity}] ${finding.ruleId}: ${finding.message} ${what}`;
}

export function formatPretty(
  findingsByFile: Map<string, Finding[]>,
  totalBlocks: number,
  totalWarns: number,
): string {
  const out: string[] = [];
  if (findingsByFile.size === 0) {
    out.push("prism check: no violations found.");
    return out.join("\n");
  }
  for (const [file, findings] of findingsByFile) {
    out.push(file);
    for (const finding of findings) {
      const marker = finding.severity === "block" ? "BLOCK" : "WARN ";
      out.push(`  ${marker} ${formatFindingLine(finding)}`);
    }
  }
  const parts: string[] = [];
  if (totalBlocks > 0) parts.push(`${totalBlocks} blocking`);
  if (totalWarns > 0) parts.push(`${totalWarns} warning`);
  out.push(
    `prism check: ${parts.join(", ")} violation(s) across ${findingsByFile.size} file(s).`,
  );
  return out.join("\n");
}

function leadLine(format: HookFormat, file: string, count: number): string {
  const noun = count === 1 ? "violation" : "violations";
  switch (format) {
    case "cursor":
      return `PRISM (Cursor) flagged ${count} ${noun} in ${file} — apply these fixes now:`;
    case "antigravity":
      return `PRISM (Antigravity) flagged ${count} ${noun} in ${basename(file)} — apply these fixes now:`;
    case "claude-code":
      return `PRISM PASS blocked write to ${basename(file)} — ${count} rule ${noun} must be fixed now:`;
  }
}

/**
 * Shared correction body for every agent format. The original Claude Code
 * output is preserved byte-identical by formatHookClaudeCode below; new
 * agents use this with a different lead line only.
 */
export function formatHookForAgent(
  format: HookFormat,
  file: string,
  findings: Finding[],
): string {
  const lines = [
    leadLine(format, file, findings.length),
    ...correctionLines(findings),
    closingLine(file),
  ];
  return lines.join("\n");
}

function correctionLines(findings: Finding[]): string[] {
  const shown = findings.slice(0, HOOK_MAX_FINDINGS);
  const lines = shown.map((finding, i) => {
    const fix = finding.replacement
      ? `replace '${finding.offending}' with '${finding.replacement}'`
      : `remove '${finding.offending}'`;
    return `${i + 1}. Line ${finding.line} (${finding.ruleId}): ${fix} — ${finding.message}`;
  });
  if (findings.length > shown.length) {
    lines.push(`...and ${findings.length - shown.length} more.`);
  }
  return lines;
}

function closingLine(file: string): string {
  return `Apply exactly these edits to ${basename(file)}, then continue your original task.`;
}

/**
 * ORIGINAL Claude Code formatter — preserved verbatim so the published,
 * demo-verified contract stays byte-identical. New agents use
 * formatHookForAgent instead.
 */
export function formatHookClaudeCode(
  file: string,
  blocks: Finding[],
): string {
  const name = basename(file);
  const noun = blocks.length === 1 ? "violation" : "violations";
  const lines: string[] = [
    `PRISM PASS blocked write to ${name} — ${blocks.length} rule ${noun} must be fixed now:`,
  ];
  const shown = blocks.slice(0, HOOK_MAX_FINDINGS);
  shown.forEach((finding, i) => {
    const fix = finding.replacement
      ? `replace '${finding.offending}' with '${finding.replacement}'`
      : `remove '${finding.offending}'`;
    lines.push(
      `${i + 1}. Line ${finding.line} (${finding.ruleId}): ${fix} — ${finding.message}`,
    );
  });
  if (blocks.length > shown.length) {
    lines.push(`...and ${blocks.length - shown.length} more.`);
  }
  lines.push(
    `Apply exactly these edits to ${name}, then continue your original task.`,
  );
  return lines.join("\n");
}
