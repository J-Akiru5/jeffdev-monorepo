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
 * Observability (logging only): each fail-open path reports a canonical
 * SemanticSkipReason to the optional onSkip observer so the activity log can
 * distinguish a degraded check (429, timeout, network, malformed) from a
 * genuine clean verdict. The observer never affects the return value, timing,
 * or the fail-open contract.
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
/** One retry absorbs transient 5xx/network failures. */
export const SEMANTIC_MAX_ATTEMPTS = 2;

/** Sanity bounds for the env override: never below 1s (a real call needs it),
 *  never at/above the 30s hook ceiling. */
export const SEMANTIC_TIMEOUT_MIN_MS = 1000;
export const SEMANTIC_TIMEOUT_MAX_MS = 29000;

/** Default model. Confirmed stable/GA (July 2026); overridable via
 *  PRISM_GEMINI_MODEL without a code change. */
export const SEMANTIC_DEFAULT_MODEL = "gemini-3.6-flash";

const API_HOST = "https://generativelanguage.googleapis.com/v1beta";

/** Canonical fail-open reasons surfaced to observers (activity log). Values
 *  are stable, grep-friendly tokens derived from the same conditions the
 *  PRISM_GEMINI_DEBUG stderr lines already report; the raw HTTP status or
 *  error message stays in the debug output. */
export type SemanticSkipReason =
  | "NO-KEY"
  | "429-RATE-LIMIT"
  | `HTTP-${number}`
  | "TIMEOUT"
  | "NETWORK-ERROR"
  | "EMPTY-RESPONSE"
  | "MALFORMED-RESPONSE";

export interface SemanticOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  /** Observability only: called exactly once when the layer fails open.
   *  Never affects the return value, timing, or the fail-open contract —
   *  observer errors are swallowed. */
  onSkip?: (reason: SemanticSkipReason) => void;
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
 *
 * Reliability: temperature 0 keeps the verdict stable run-to-run, and one
 * bounded retry absorbs transient 5xx/network failures (observed in the
 * wild: Gemini returning 503). Both attempts share the single timeout
 * budget, so the worst case stays exactly where it was — fail-open after
 * timeoutMs.
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
  if (!apiKey) {
    notifySkip(options, "NO-KEY");
    return [];
  }

  const model = options.model ?? process.env.PRISM_GEMINI_MODEL ?? SEMANTIC_DEFAULT_MODEL;
  const timeoutMs = resolveTimeoutMs(options.timeoutMs);
  const fetchFn = options.fetchFn ?? globalThis.fetch;

  const prompt = buildPrompt(filePath, content, ruleSet);
  const deadline = Date.now() + timeoutMs;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 1024,
      temperature: 0,
    },
  });

  for (let attempt = 1; attempt <= SEMANTIC_MAX_ATTEMPTS; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);

    try {
      const response = await fetchFn(
        `${API_HOST}/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body,
          signal: controller.signal,
        },
      );
      if (!response.ok) {
        if (response.status >= 500 && attempt < SEMANTIC_MAX_ATTEMPTS) {
          continue;
        }
        notifySkip(
          options,
          response.status === 429
            ? "429-RATE-LIMIT"
            : (`HTTP-${response.status}` as SemanticSkipReason),
        );
        if (process.env.PRISM_GEMINI_DEBUG === "1") {
          console.error(
            `[prism] semantic check skipped: HTTP ${response.status}`,
          );
        }
        return [];
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        notifySkip(options, "EMPTY-RESPONSE");
        return [];
      }

      const parsed = tryParseSemanticFindings(text, filePath, content, ruleSet);
      if (!parsed.ok) {
        notifySkip(options, "MALFORMED-RESPONSE");
        return [];
      }
      return parsed.findings;
    } catch (err) {
      if (attempt < SEMANTIC_MAX_ATTEMPTS && Date.now() < deadline) {
        continue;
      }
      notifySkip(options, classifyFetchFailure(err));
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
  // Budget exhausted between attempts — the retry never got to run.
  notifySkip(options, "TIMEOUT");
  return [];
}

/** Report a fail-open reason without ever letting the observer change the
 *  hook's behavior. */
function notifySkip(
  options: SemanticOptions,
  reason: SemanticSkipReason,
): void {
  try {
    options.onSkip?.(reason);
  } catch {
    // A broken observer must never affect the fail-open contract.
  }
}

/** AbortController timeouts surface as AbortError (or an "aborted" message
 *  from test doubles); everything else that reaches here is a transport
 *  failure. */
function classifyFetchFailure(err: unknown): SemanticSkipReason {
  if (err instanceof Error) {
    if (err.name === "AbortError" || /abort/i.test(err.message)) {
      return "TIMEOUT";
    }
  }
  return "NETWORK-ERROR";
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
 *
 * Collapses "valid empty array" and "unparseable output" to the same [] —
 * runSemanticCheck uses tryParseSemanticFindings internally when it needs to
 * tell those two apart for logging.
 */
export function parseSemanticFindings(
  raw: string,
  filePath: string,
  content: string,
  ruleSet: RuleSet,
): Finding[] {
  const parsed = tryParseSemanticFindings(raw, filePath, content, ruleSet);
  return parsed.ok ? parsed.findings : [];
}

type SemanticParseOutcome =
  | { ok: true; findings: Finding[] }
  | { ok: false; reason: "MALFORMED-RESPONSE" };

/** Richer internal variant of parseSemanticFindings: a valid JSON array —
 *  including an empty one — is a successful verdict; anything that cannot be
 *  read as an array is malformed (a skipped check, not a clean pass). */
function tryParseSemanticFindings(
  raw: string,
  filePath: string,
  content: string,
  ruleSet: RuleSet,
): SemanticParseOutcome {
  const byId = new Map<string, PrismRule>(
    ruleSet.rules.map((rule) => [rule.id, rule]),
  );
  const lineCount = content.split(/\r?\n/).length;

  const items = extractJsonArray(raw);
  if (items === null) return { ok: false, reason: "MALFORMED-RESPONSE" };

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
  return { ok: true, findings };
}

function extractJsonArray(raw: string): RawSemanticFinding[] | null {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (entry): entry is RawSemanticFinding =>
        typeof entry === "object" && entry !== null && !Array.isArray(entry),
    );
  } catch {
    return null;
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
