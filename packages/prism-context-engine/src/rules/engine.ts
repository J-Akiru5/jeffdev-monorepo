import { readFileSync } from "fs";
import { basename, extname } from "path";
import { ruleSeverity } from "./parse.js";
import type {
  CheckBlock,
  Finding,
  PrismRule,
  RuleSet,
} from "./types.js";

const DEFAULT_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".scss",
  ".html",
  ".vue",
  ".svelte",
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function applicableExtensions(ruleSet: RuleSet): Set<string> {
  const set = new Set<string>();
  for (const rule of ruleSet.rules) {
    if (!rule.check) continue;
    if (rule.extensions && rule.extensions.length > 0) {
      for (const ext of rule.extensions) set.add(ext);
    } else {
      for (const ext of DEFAULT_EXTENSIONS) set.add(ext);
    }
  }
  return set;
}

export function isFileApplicable(filePath: string, ruleSet: RuleSet): boolean {
  const ext = extname(filePath).toLowerCase();
  return applicableExtensions(ruleSet).has(ext);
}

export function checkFile(filePath: string, ruleSet: RuleSet): Finding[] {
  const content = readFileSync(filePath, "utf8");
  return checkContent(filePath, content, ruleSet);
}

export function checkContent(
  filePath: string,
  content: string,
  ruleSet: RuleSet,
): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split(/\r?\n/);
  const ext = extname(filePath).toLowerCase();
  for (const rule of ruleSet.rules) {
    const check = rule.check;
    if (!check) continue;
    if (rule.extensions && !rule.extensions.includes(ext)) continue;
    scanRule(filePath, lines, rule, check, findings);
  }
  return findings;
}

function baseMessage(rule: PrismRule, check: CheckBlock): string {
  return (
    check.message ??
    rule.instruction ??
    `violates ${rule.category} rule ${rule.id}`
  );
}

function pushFinding(
  filePath: string,
  rule: PrismRule,
  check: CheckBlock,
  line: number,
  offending: string,
  replacement: string | undefined,
  findings: Finding[],
): void {
  findings.push({
    ruleId: rule.id,
    severity: ruleSeverity(rule),
    category: rule.category,
    file: filePath,
    line,
    offending,
    ...(replacement !== undefined ? { replacement } : {}),
    message: baseMessage(rule, check),
  });
}

function scanRule(
  filePath: string,
  lines: string[],
  rule: PrismRule,
  check: CheckBlock,
  findings: Finding[],
): void {
  switch (check.type) {
    case "forbidden_pattern":
      scanForbiddenPattern(filePath, lines, rule, check, findings);
      break;
    case "required_token":
      scanRequiredToken(filePath, lines, rule, check, findings);
      break;
    case "banned_import":
      scanBannedImport(filePath, lines, rule, check, findings);
      break;
    case "arbitrary_value":
      scanArbitraryValue(filePath, lines, rule, check, findings);
      break;
    case "naming_pattern":
      scanNamingPattern(filePath, rule, check, findings);
      break;
    case "file_placement":
      scanFilePlacement(filePath, rule, check, findings);
      break;
    case "required_import":
      scanRequiredImport(filePath, lines, rule, check, findings);
      break;
  }
}

function forEachMatch(
  lines: string[],
  regex: RegExp,
  onMatch: (line: number, match: RegExpExecArray) => boolean,
): void {
  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i] ?? "";
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lineText)) !== null) {
      const keepGoing = onMatch(i + 1, match);
      if (match.index === regex.lastIndex) regex.lastIndex++;
      if (!keepGoing) return;
    }
  }
}

function scanForbiddenPattern(
  filePath: string,
  lines: string[],
  rule: PrismRule,
  check: Extract<CheckBlock, { type: "forbidden_pattern" }>,
  findings: Finding[],
): void {
  const flags = check.flags?.includes("g") ? check.flags : `${check.flags ?? ""}g`;
  const regex = new RegExp(check.pattern, flags);
  const allowlist = new Set(
    (check.allowlist ?? []).map((a) => a.trim().toLowerCase()),
  );
  forEachMatch(lines, regex, (line, match) => {
    const text = match[0];
    if (allowlist.has(text.trim().toLowerCase())) return true;
    pushFinding(filePath, rule, check, line, text, check.fix, findings);
    return true;
  });
}

function scanRequiredToken(
  filePath: string,
  lines: string[],
  rule: PrismRule,
  check: Extract<CheckBlock, { type: "required_token" }>,
  findings: Finding[],
): void {
  const keys = Object.keys(check.tokenMap).sort((a, b) => b.length - a.length);
  const regex = new RegExp(keys.map(escapeRegex).join("|"), "gi");
  const lookup = new Map(
    keys.map((key) => [key.toLowerCase(), check.tokenMap[key]]),
  );
  forEachMatch(lines, regex, (line, match) => {
    const raw = match[0];
    const replacement = lookup.get(raw.toLowerCase());
    if (replacement === undefined) return true;
    pushFinding(filePath, rule, check, line, raw, replacement, findings);
    return true;
  });
}

function looksLikeImportLine(line: string): boolean {
  return /\b(?:import|require|export)\b/.test(line);
}

function scanBannedImport(
  filePath: string,
  lines: string[],
  rule: PrismRule,
  check: Extract<CheckBlock, { type: "banned_import" }>,
  findings: Finding[],
): void {
  const alternatives = check.specifiers.map((specifier) => {
    const escaped = escapeRegex(specifier);
    const withSubpaths = `${escaped}(?:/[\\w.\\-]+)*`;
    return [
      `\\bfrom\\s*["']${withSubpaths}["']`,
      `\\bimport\\s*\\(\\s*["']${withSubpaths}["']`,
      `\\brequire\\s*\\(\\s*["']${withSubpaths}["']`,
      `\\bimport\\s+["']${withSubpaths}["']`,
    ].join("|");
  });
  const regex = new RegExp(`(?:${alternatives.join("|")})`, "g");
  for (let i = 0; i < lines.length; i++) {
    if (!looksLikeImportLine(lines[i] ?? "")) continue;
    const lineText = lines[i] ?? "";
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lineText)) !== null) {
      pushFinding(filePath, rule, check, i + 1, match[0], undefined, findings);
      if (match.index === regex.lastIndex) regex.lastIndex++;
    }
  }
}

function scanArbitraryValue(
  filePath: string,
  lines: string[],
  rule: PrismRule,
  check: Extract<CheckBlock, { type: "arbitrary_value" }>,
  findings: Finding[],
): void {
  const props = [...check.properties].sort((a, b) => b.length - a.length);
  const regex = new RegExp(
    `(?<![\\w-])(?:${props.map(escapeRegex).join("|")})-\\[[^\\]\\s]+\\]`,
    "g",
  );
  forEachMatch(lines, regex, (line, match) => {
    pushFinding(filePath, rule, check, line, match[0], undefined, findings);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Phase 4 breadth: path-aware check types. These run once per FILE (not per
// line) and receive the file path the caller passed in — absolute in hook
// mode, as-given in standalone mode.
// ---------------------------------------------------------------------------

/** Line number reported for whole-file violations (naming/placement). */
const WHOLE_FILE_LINE = 1;

function scanNamingPattern(
  filePath: string,
  rule: PrismRule,
  check: Extract<CheckBlock, { type: "naming_pattern" }>,
  findings: Finding[],
): void {
  const base = basename(filePath);
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  let regex: RegExp;
  try {
    regex = new RegExp(check.pattern);
  } catch {
    // An invalid pattern must never crash a scan — fail open like every
    // other engine error path.
    return;
  }
  if (!regex.test(stem)) {
    pushFinding(
      filePath,
      rule,
      check,
      WHOLE_FILE_LINE,
      base,
      undefined,
      findings,
    );
  }
}

function normalizePathForMatch(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase();
}

function scanFilePlacement(
  filePath: string,
  rule: PrismRule,
  check: Extract<CheckBlock, { type: "file_placement" }>,
  findings: Finding[],
): void {
  const base = basename(filePath);
  let regex: RegExp;
  try {
    regex = new RegExp(check.matchPattern);
  } catch {
    return;
  }
  if (!regex.test(base)) return;

  const normalized = normalizePathForMatch(filePath);
  const dir = normalizePathForMatch(check.directory).replace(/\/+$/, "");
  // Match either "<dir>/..." or a path ending exactly at ".../<dir>/<file>"
  // so relative and absolute callers behave identically.
  const ok =
    normalized.startsWith(`${dir}/`) || normalized.includes(`/${dir}/`);
  if (!ok) {
    pushFinding(
      filePath,
      rule,
      check,
      WHOLE_FILE_LINE,
      base,
      undefined,
      findings,
    );
  }
}

function looksLikeImportPath(line: string, specifier: string): boolean {
  const escaped = escapeRegex(specifier);
  const regex = new RegExp(
    `\\b(?:from|import|require)\\s*\\(?\\s*["']${escaped}(?:/[\\w.\\-]+)*["']`,
  );
  return regex.test(line);
}

function scanRequiredImport(
  filePath: string,
  lines: string[],
  rule: PrismRule,
  check: Extract<CheckBlock, { type: "required_import" }>,
  findings: Finding[],
): void {
  for (const line of lines) {
    if (looksLikeImportPath(line, check.specifier)) return;
  }
  pushFinding(
    filePath,
    rule,
    check,
    WHOLE_FILE_LINE,
    check.specifier,
    undefined,
    findings,
  );
}
