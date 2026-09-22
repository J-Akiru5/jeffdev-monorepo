/**
 * transcript.ts — derive the files a Claude Code session actually edited.
 *
 * The Stop hook payload carries no changed-file list; it does carry
 * transcript_path (confirmed live on Claude Code 2.1.278, see the Step 1
 * feasibility evidence in docs/prism-midrun-enforcement-*.html). Transcripts
 * are JSONL: assistant messages embed `tool_use` blocks whose input carries
 * file_path for Write/Edit/MultiEdit. Parse defensively — malformed lines
 * are skipped, unknown shapes ignored, and any read failure returns [] so
 * the Stop gate can fall back to scanning the project source dir.
 */

import { readFileSync } from "fs";

const FILE_EDIT_TOOLS = new Set(["write", "edit", "multiedit"]);
const MAX_DEPTH = 10;

export function changedFilesFromTranscript(transcriptPath: string): string[] {
  let raw: string;
  try {
    raw = readFileSync(transcriptPath, "utf8");
  } catch {
    return [];
  }
  const files = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let entry: unknown;
    try {
      entry = JSON.parse(trimmed);
    } catch {
      continue;
    }
    collectToolUseFiles(entry, files, 0);
  }
  return [...files];
}

function collectToolUseFiles(
  node: unknown,
  files: Set<string>,
  depth: number,
): void {
  if (depth > MAX_DEPTH || node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectToolUseFiles(item, files, depth + 1);
    return;
  }
  const obj = node as Record<string, unknown>;
  if (
    obj.type === "tool_use" &&
    typeof obj.name === "string" &&
    FILE_EDIT_TOOLS.has(obj.name.toLowerCase())
  ) {
    const input = obj.input;
    if (input && typeof input === "object" && !Array.isArray(input)) {
      const filePath = (input as Record<string, unknown>).file_path;
      if (typeof filePath === "string" && filePath.length > 0) {
        files.add(filePath);
      }
    }
  }
  for (const key of ["message", "content", "input", "toolUse", "toolCall"]) {
    if (key in obj) collectToolUseFiles(obj[key], files, depth + 1);
  }
}
