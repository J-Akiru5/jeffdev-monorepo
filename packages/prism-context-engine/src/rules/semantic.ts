/**
 * semantic.ts — Gemini-powered semantic rule checking (the AI layer).
 *
 * The deterministic regex engine (engine.ts) is the fast first pass and is
 * unchanged. This module adds an intent-level check on top: it runs only when
 * the deterministic pass found no blocking violations, and only when the
 * operator opts in (PRISM_GEMINI_CHECK=1 with a key set). Its job is catching
 * the cases regex cannot see — code that technically avoids a banned pattern
 * while clearly working around the rule's intent.
 *
 * FAIL-OPEN CONTRACT (not optional): every failure mode — missing key,
 * disabled flag, HTTP error, malformed response, timeout — returns an empty
 * finding list. The hook then falls back to the deterministic engine's result
 * alone, exactly as it behaved before this layer existed. A slow or dead
 * Gemini can never block or hang the agent.
 *
 * The call is hard-capped via AbortController — default SEMANTIC_TIMEOUT_MS
 * (12s, well under the 30s hook ceiling), overridable with
 * PRISM_GEMINI_TIMEOUT_MS — leaving the rest of the 30s for the hook's own
 * processing and network slack.
 */

import { ruleSeverity } from "./parse.js";
import type { Finding, PrismRule, RuleSet } from "./types.js";

export const SEMANTIC_TIMEOUT_MS = 12000;
export const SEMANTIC_MAX_FINDINGS = 3;

/** Sanity bounds for the env override: never below 1s (a real call needs it),
 *  never at/above the 30s hook ceiling. */
export const SEMANTIC_TIMEOUT_MIN_MS = 1000;
export const SEMANTIC_TIMEOUT_MAX_MS = 29000;

/** Default model. Confirmed stable/GA (July 2026); overridable via
 *  PRISM_GEMINI_MODEL without a code change. */
export const SEMANTIC_DEFAULT_MODEL = "gemini-3.6-flash";

const API_HOST = "https://generativelanguage.googleapis.com/v1beta";

export interface SemanticOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

/** Opt-in gate: PRISM_GEMINI_CHECK=1 AND a key. PRISM_DISABLE=1 always wins
 *  (same kill switch the deterministic engine honors). */
export function semanticEnabled(): boolean {
  if (process.env.PRISM_DISABLE === "1") return false;
  const flag = process.env.PRISM_GEMINI_CHECK;
  if (flag !== "1" && flag !== "true") return false;
  return Boolean(
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GEMINI_API_KEY,
  );
}

/**
 * Run the semantic check. Never throws, never blocks: returns an empty array
 * on every failure path. Findings reference the ruleset's own rule IDs so the
 * correction formatter produces output indistinguishable from a regex catch
 * (unlabeled by design).
 */
export async function runSemanticCheck(
  filePath: string,
  content: string,
  ruleSet: RuleSet,
  options: SemanticOptions = {},
): Promise<Finding[]> {
  const apiKey =
    options.apiKey ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return [];

  const model = options.model ?? process.env.PRISM_GEMINI_MODEL ?? SEMANTIC_DEFAULT_MODEL;
  const timeoutMs = resolveTimeoutMs(options.timeoutMs);
  const fetchFn = options.fetchFn ?? globalThis.fetch;

  const prompt = buildPrompt(filePath, content, ruleSet);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(`${API_HOST}/models/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 1024,
        },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (process.env.PRISM_GEMINI_DEBUG === "1") {
        console.error(`[prism] semantic check skipped: HTTP ${response.status}`);
      }
      return [];
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];

    return parseSemanticFindings(text, filePath, content, ruleSet);
  } catch (err) {
    if (process.env.PRISM_GEMINI_DEBUG === "1") {
      console.error(
        `[prism] semantic check skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Explicit option wins; else the PRISM_GEMINI_TIMEOUT_MS env override;
 *  else the compiled-in default. Any invalid/out-of-bounds value falls back
 *  to the default rather than trusting garbage. */
export function resolveTimeoutMs(explicit?: number): number {
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) {
    return Math.min(Math.max(explicit, SEMANTIC_TIMEOUT_MIN_MS), SEMANTIC_TIMEOUT_MAX_MS);
  }
  const raw = process.env.PRISM_GEMINI_TIMEOUT_MS;
  if (raw !== undefined) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.min(Math.max(parsed, SEMANTIC_TIMEOUT_MIN_MS), SEMANTIC_TIMEOUT_MAX_MS);
    }
  }
  return SEMANTIC_TIMEOUT_MS;
}

function buildPrompt(
  filePath: string,
  content: string,
  ruleSet: RuleSet,
): string {
  const rulesText = ruleSet.rules
    .map((rule) => {
      const parts = [
        `- id: ${rule.id}`,
        `  category: ${rule.category}`,
        `  severity: ${ruleSeverity(rule)}`,
      ];
      if (rule.instruction) parts.push(`  instruction: ${rule.instruction}`);
      if (rule.check) parts.push(`  check: ${JSON.stringify(rule.check)}`);
      return parts.join("\n");
    })
    .join("\n");

  return [
    "You are Prism, a code-governance checker. A developer's agent just wrote the file below.",
    "You are given the project's rule set. Flag ONLY intent-level violations that a literal",
    "regex scan could plausibly miss — e.g. the code clearly works around a rule's intent",
    "without literally matching the banned pattern (re-encoding a banned value, splitting",
    "a banned import, computing a forbidden token at runtime, obfuscating a secret).",
    "Do NOT flag anything the regex rules would already catch verbatim. Do NOT invent",
    "violations for code that satisfies the rules. When in doubt, return no finding.",
    "",
    `File: ${filePath}`,
    "",
    "Rule set:",
    rulesText,
    "",
    "File content (line numbers are part of the content):",
    numbered(content),
    "",
    "Respond with a JSON array only, of at most 3 objects, each:",
    `{"ruleId":"<one of the rule ids above, verbatim>","line":<1-based line number in the file>,"offending":"<the exact text on that line that violates the rule>","replacement":"<exact replacement text, or omit>","message":"<one short sentence why this is an intent-level violation>"}`,
    "If there are no intent-level violations, respond with [].",
  ].join("\n");
}

function numbered(content: string): string {
  return content
    .split(/\r?\n/)
    .map((line, index) => `${index + 1}: ${line}`)
    .join("\n");
}

export interface RawSemanticFinding {
  ruleId?: unknown;
  line?: unknown;
  offending?: unknown;
  replacement?: unknown;
  message?: unknown;
}

/**
 * Strict, fail-safe parser. Unknown rule ids, non-numeric lines and anything
 * that does not parse are dropped rather than guessed — an invented rule id
 * must never surface in the output. Findings are capped and deduped.
 */
export function parseSemanticFindings(
  raw: string,
  filePath: string,
  content: string,
  ruleSet: RuleSet,
): Finding[] {
  const byId = new Map<string, PrismRule>(
    ruleSet.rules.map((rule) => [rule.id, rule]),
  );
  const lineCount = content.split(/\r?\n/).length;

  const items = extractJsonArray(raw);
  if (items.length === 0) return [];

  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (findings.length >= SEMANTIC_MAX_FINDINGS) break;
    const finding = coerceFinding(item, byId, lineCount, content, filePath);
    if (!finding) continue;
    const key = `${finding.ruleId}:${finding.line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push(finding);
  }
  return findings;
}

function extractJsonArray(raw: string): RawSemanticFinding[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end <= start) return [];
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is RawSemanticFinding =>
        typeof entry === "object" && entry !== null && !Array.isArray(entry),
    );
  } catch {
    return [];
  }
}

function coerceFinding(
  item: RawSemanticFinding,
  byId: Map<string, PrismRule>,
  lineCount: number,
  content: string,
  filePath: string,
): Finding | null {
  if (typeof item.ruleId !== "string") return null;
  const rule = byId.get(item.ruleId);
  if (!rule) return null;

  const line = typeof item.line === "number" && Number.isInteger(item.line)
    ? Math.min(Math.max(item.line, 1), lineCount)
    : null;
  if (line === null) return null;

  const offending =
    typeof item.offending === "string" && item.offending.length > 0
      ? item.offending.slice(0, 200)
      : (content.split(/\r?\n/)[line - 1] ?? "").slice(0, 200);

  const message = baseMessage(rule, item.message);

  const finding: Finding = {
    ruleId: rule.id,
    severity: ruleSeverity(rule),
    category: rule.category,
    file: filePath,
    line,
    offending,
    message,
  };
  if (typeof item.replacement === "string" && item.replacement.length > 0) {
    finding.replacement = item.replacement.slice(0, 200);
  }
  return finding;
}

/** Mirror of engine.ts's baseMessage so semantic findings read identically
 *  to regex findings (unlabeled by design): the rule's own check message or
 *  instruction wins; the model's sentence is only a last resort. */
function baseMessage(rule: PrismRule, modelMessage: unknown): string {
  const check = rule.check as { message?: string } | undefined;
  if (check?.message) return check.message;
  if (rule.instruction) return rule.instruction;
  if (typeof modelMessage === "string" && modelMessage.length > 0) {
    return modelMessage.slice(0, 200);
  }
  return `violates ${rule.category} rule ${rule.id}`;
}