import { basename } from "path";
import type { Finding } from "./types.js";

const HOOK_MAX_FINDINGS = 5;

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
