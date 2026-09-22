/**
 * activity.ts — one-line-per-invocation log for the Pass hook.
 *
 * Every hook run (pre / post / stop) appends a single tab-separated line:
 *
 *   <ISO timestamp>\t<event>\t<file>\t<result>
 *
 * where result is CLEAN, `BLOCKED <rule-id>[,<rule-id>...]` or
 * `SKIPPED <reason>`. Logging is observability only: every failure is
 * swallowed so a read-only .prism directory or a full disk can never change
 * the hook's exit behavior.
 */

import { appendFileSync, existsSync } from "fs";
import { dirname, join } from "path";

export type ActivityEvent = "pre" | "post" | "stop";

export function formatActivityLine(
  event: ActivityEvent,
  file: string,
  result: string,
  now: Date = new Date(),
): string {
  return `${now.toISOString()}\t${event}\t${file}\t${result}`;
}

/** Resolve `.prism/activity.log` next to the ruleset when one was found,
 *  else from the event cwd if it already has a `.prism` directory. Returns
 *  null when neither is available — callers then skip logging silently. */
export function resolveActivityLogPath(
  rulesPath: string | null,
  cwd: string | null,
): string | null {
  if (rulesPath) return join(dirname(rulesPath), "activity.log");
  if (cwd) {
    const prismDir = join(cwd, ".prism");
    if (existsSync(prismDir)) return join(prismDir, "activity.log");
  }
  return null;
}

/** Append one line. Never throws: logging failure must not alter the exit
 *  code or stderr of the hook itself. */
export function appendActivity(logPath: string | null, line: string): boolean {
  if (!logPath) return false;
  try {
    appendFileSync(logPath, `${line}\n`);
    return true;
  } catch {
    return false;
  }
}
