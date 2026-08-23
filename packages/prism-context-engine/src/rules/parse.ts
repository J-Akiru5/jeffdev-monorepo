import { existsSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import type {
  CheckBlock,
  PrismRule,
  RuleCategory,
  RuleSeverity,
  RuleSet,
} from "./types.js";

const CHECK_TYPES = [
  "forbidden_pattern",
  "required_token",
  "banned_import",
  "arbitrary_value",
  "naming_pattern",
  "file_placement",
  "required_import",
] as const;

const CATEGORIES: RuleCategory[] = [
  "architecture",
  "styling",
  "security",
  "testing",
];

const SEVERITIES: RuleSeverity[] = ["block", "warn"];

export class RulesParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RulesParseError";
  }
}

export function ruleSeverity(rule: PrismRule): RuleSeverity {
  return rule.severity ?? "warn";
}

export function normalizeExtension(ext: string): string {
  const lowered = ext.toLowerCase();
  return lowered.startsWith(".") ? lowered : `.${lowered}`;
}

export function parseRuleSet(raw: string): RuleSet {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new RulesParseError(
      `rules.json is not valid JSON: ${(err as Error).message}`,
    );
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new RulesParseError(
      "rules.json must be an object with a top-level 'rules' array",
    );
  }
  const obj = data as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new RulesParseError(
      `unsupported rules.json version: ${JSON.stringify(obj.version)} (expected 1)`,
    );
  }
  if (!Array.isArray(obj.rules)) {
    throw new RulesParseError("'rules' must be an array");
  }
  return { version: 1, rules: obj.rules.map(validateRule) };
}

function validateRule(entry: unknown, index: number): PrismRule {
  const label = `rules[${index}]`;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    throw new RulesParseError(`${label} must be an object`);
  }
  const rule = entry as Record<string, unknown>;

  if (typeof rule.id !== "string" || rule.id.trim().length === 0) {
    throw new RulesParseError(`${label}.id must be a non-empty string`);
  }
  const id = rule.id;

  if (
    typeof rule.category !== "string" ||
    !CATEGORIES.includes(rule.category as RuleCategory)
  ) {
    throw new RulesParseError(
      `${label}.category must be one of: ${CATEGORIES.join(", ")}`,
    );
  }

  if (
    rule.severity !== undefined &&
    !SEVERITIES.includes(rule.severity as RuleSeverity)
  ) {
    throw new RulesParseError(`${label}.severity must be "block" or "warn"`);
  }

  if (
    rule.instruction !== undefined &&
    typeof rule.instruction !== "string"
  ) {
    throw new RulesParseError(`${label}.instruction must be a string`);
  }

  let extensions: string[] | undefined;
  if (rule.extensions !== undefined) {
    if (
      !Array.isArray(rule.extensions) ||
      rule.extensions.some((e) => typeof e !== "string" || e.trim() === "")
    ) {
      throw new RulesParseError(
        `${label}.extensions must be an array of extension strings`,
      );
    }
    extensions = (rule.extensions as string[]).map(normalizeExtension);
  }

  let check: CheckBlock | undefined;
  if (rule.check !== undefined && rule.check !== null) {
    check = validateCheck(id, rule.check);
  }

  const parsed: PrismRule = {
    id,
    category: rule.category as RuleCategory,
  };
  if (rule.severity !== undefined) {
    parsed.severity = rule.severity as RuleSeverity;
  }
  if (rule.instruction !== undefined) {
    parsed.instruction = rule.instruction as string;
  }
  if (extensions !== undefined) {
    parsed.extensions = extensions;
  }
  if (check !== undefined) {
    parsed.check = check;
  }
  return parsed;
}

function validateCheck(ruleId: string, rawCheck: unknown): CheckBlock {
  if (typeof rawCheck !== "object" || rawCheck === null || Array.isArray(rawCheck)) {
    throw new RulesParseError(`rule "${ruleId}": check must be an object`);
  }
  const check = rawCheck as Record<string, unknown>;
  if (
    typeof check.type !== "string" ||
    !CHECK_TYPES.includes(check.type as (typeof CHECK_TYPES)[number])
  ) {
    throw new RulesParseError(
      `rule "${ruleId}": check.type must be one of: ${CHECK_TYPES.join(", ")}`,
    );
  }
  if (
    check.message !== undefined &&
    typeof check.message !== "string"
  ) {
    throw new RulesParseError(`rule "${ruleId}": check.message must be a string`);
  }

  switch (check.type) {
    case "forbidden_pattern":
      return validateForbiddenPattern(ruleId, check);
    case "required_token":
      return validateRequiredToken(ruleId, check);
    case "banned_import":
      return validateBannedImport(ruleId, check);
    case "arbitrary_value":
      return validateArbitraryValue(ruleId, check);
    case "naming_pattern":
      return validateNamingPattern(ruleId, check);
    case "file_placement":
      return validateFilePlacement(ruleId, check);
    case "required_import":
      return validateRequiredImport(ruleId, check);
  }
  throw new RulesParseError(`rule "${ruleId}": unknown check type`);
}

function requireNonEmptyString(
  ruleId: string,
  value: unknown,
  field: string,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new RulesParseError(
      `rule "${ruleId}": ${field} requires a non-empty string`,
    );
  }
  return value;
}

/** Phase 4 breadth validators. Each new type compiles its regexes here so a
 *  bad pattern fails at parse time instead of silently failing open at scan
 *  time. */
function validateNamingPattern(
  ruleId: string,
  check: Record<string, unknown>,
): CheckBlock {
  const pattern = requireNonEmptyString(ruleId, check.pattern, "naming_pattern");
  try {
    new RegExp(pattern);
  } catch (err) {
    throw new RulesParseError(
      `rule "${ruleId}": pattern does not compile: ${(err as Error).message}`,
    );
  }
  const out: CheckBlock = { type: "naming_pattern", pattern };
  if (check.message !== undefined) out.message = check.message as string;
  return out;
}

function validateFilePlacement(
  ruleId: string,
  check: Record<string, unknown>,
): CheckBlock {
  const matchPattern = requireNonEmptyString(
    ruleId,
    check.matchPattern,
    "file_placement",
  );
  const directory = requireNonEmptyString(
    ruleId,
    check.directory,
    "file_placement",
  );
  try {
    new RegExp(matchPattern);
  } catch (err) {
    throw new RulesParseError(
      `rule "${ruleId}": matchPattern does not compile: ${(err as Error).message}`,
    );
  }
  const out: CheckBlock = {
    type: "file_placement",
    matchPattern,
    directory,
  };
  if (check.message !== undefined) out.message = check.message as string;
  return out;
}

function validateRequiredImport(
  ruleId: string,
  check: Record<string, unknown>,
): CheckBlock {
  const specifier = requireNonEmptyString(
    ruleId,
    check.specifier,
    "required_import",
  );
  const out: CheckBlock = { type: "required_import", specifier };
  if (check.message !== undefined) out.message = check.message as string;
  return out;
}

function validateForbiddenPattern(
  ruleId: string,
  check: Record<string, unknown>,
): CheckBlock {
  if (typeof check.pattern !== "string" || check.pattern.length === 0) {
    throw new RulesParseError(
      `rule "${ruleId}": forbidden_pattern requires a non-empty "pattern"`,
    );
  }
  if (check.flags !== undefined && typeof check.flags !== "string") {
    throw new RulesParseError(`rule "${ruleId}": flags must be a string`);
  }
  try {
    new RegExp(check.pattern, (check.flags as string) ?? "");
  } catch (err) {
    throw new RulesParseError(
      `rule "${ruleId}": pattern does not compile: ${(err as Error).message}`,
    );
  }
  if (
    check.allowlist !== undefined &&
    (!Array.isArray(check.allowlist) ||
      check.allowlist.some((a) => typeof a !== "string"))
  ) {
    throw new RulesParseError(
      `rule "${ruleId}": allowlist must be an array of strings`,
    );
  }
  if (check.fix !== undefined && typeof check.fix !== "string") {
    throw new RulesParseError(`rule "${ruleId}": fix must be a string`);
  }
  const out: CheckBlock = {
    type: "forbidden_pattern",
    pattern: check.pattern,
  };
  if (check.flags !== undefined) out.flags = check.flags as string;
  if (check.allowlist !== undefined)
    out.allowlist = check.allowlist as string[];
  if (check.fix !== undefined) out.fix = check.fix as string;
  if (check.message !== undefined) out.message = check.message as string;
  return out;
}

function validateRequiredToken(
  ruleId: string,
  check: Record<string, unknown>,
): CheckBlock {
  if (typeof check.tokenSet !== "string" || check.tokenSet.length === 0) {
    throw new RulesParseError(
      `rule "${ruleId}": required_token requires a non-empty "tokenSet"`,
    );
  }
  const tokenMap = check.tokenMap;
  if (
    !tokenMap ||
    typeof tokenMap !== "object" ||
    Array.isArray(tokenMap) ||
    Object.keys(tokenMap).length === 0 ||
    Object.entries(tokenMap).some(
      ([k, v]) => k.length === 0 || typeof v !== "string",
    )
  ) {
    throw new RulesParseError(
      `rule "${ruleId}": required_token requires a non-empty "tokenMap" of raw value -> token`,
    );
  }
  const out: CheckBlock = {
    type: "required_token",
    tokenSet: check.tokenSet,
    tokenMap: tokenMap as Record<string, string>,
  };
  if (check.message !== undefined) out.message = check.message as string;
  return out;
}

function validateBannedImport(
  ruleId: string,
  check: Record<string, unknown>,
): CheckBlock {
  if (
    !Array.isArray(check.specifiers) ||
    check.specifiers.length === 0 ||
    check.specifiers.some((s) => typeof s !== "string" || s.length === 0)
  ) {
    throw new RulesParseError(
      `rule "${ruleId}": banned_import requires a non-empty "specifiers" array`,
    );
  }
  const out: CheckBlock = {
    type: "banned_import",
    specifiers: check.specifiers as string[],
  };
  if (check.message !== undefined) out.message = check.message as string;
  return out;
}

function validateArbitraryValue(
  ruleId: string,
  check: Record<string, unknown>,
): CheckBlock {
  const invalid =
    !Array.isArray(check.properties) ||
    check.properties.length === 0 ||
    check.properties.some(
      (p) => typeof p !== "string" || !/^[a-z][a-z0-9-]*$/.test(p),
    );
  if (invalid) {
    throw new RulesParseError(
      `rule "${ruleId}": arbitrary_value requires a "properties" array of Tailwind utility names (lowercase letters, digits, dashes)`,
    );
  }
  const out: CheckBlock = {
    type: "arbitrary_value",
    properties: check.properties as string[],
  };
  if (check.message !== undefined) out.message = check.message as string;
  return out;
}

export function findRulesPath(startDir: string): string | null {
  let dir = resolve(startDir);
  for (;;) {
    const candidate = join(dir, ".prism", "rules.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function loadRuleSet(rulesPath: string): RuleSet {
  return parseRuleSet(readFileSync(rulesPath, "utf8"));
}
