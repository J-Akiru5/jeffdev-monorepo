import { describe, it, expect, vi, afterEach } from "vitest";
import {
  parseSemanticFindings,
  resolveTimeoutMs,
  runSemanticCheck,
  semanticEnabled,
  SEMANTIC_MAX_FINDINGS,
  SEMANTIC_TIMEOUT_MS,
  SEMANTIC_TIMEOUT_MIN_MS,
  SEMANTIC_TIMEOUT_MAX_MS,
} from "./semantic.js";
import type { RuleSet } from "./types.js";

const RULES: RuleSet = {
  version: 1,
  rules: [
    {
      id: "styling/design-tokens",
      category: "styling",
      severity: "block",
      instruction: "Use the brand token instead of the raw color.",
      check: {
        type: "required_token",
        tokenSet: "brand",
        tokenMap: { "#06b6d4": "var(--brand-primary)" },
        message: "Use the brand token instead of the raw color.",
      },
    },
    {
      id: "security/no-lodash",
      category: "security",
      severity: "block",
      check: { type: "banned_import", specifiers: ["lodash"] },
    },
  ],
};

const CONTENT = [
  "export function Button() {",
  "  const color = \"rgb(6, 182, 212)\";",
  "  return <button style={{ color }}>go</button>;",
  "}",
].join("\n");

function findingLine(
  ruleId: string,
  line: number,
  offending: string,
  replacement?: string,
) {
  const out: Record<string, unknown> = { ruleId, line, offending };
  if (replacement !== undefined) out.replacement = replacement;
  return out;
}

describe("parseSemanticFindings", () => {
  it("maps a valid finding onto the ruleset's rule info (unlabeled output)", () => {
    const raw = JSON.stringify([
      findingLine("styling/design-tokens", 2, "rgb(6, 182, 212)", "var(--brand-primary)"),
    ]);
    const findings = parseSemanticFindings(raw, "src/Button.tsx", CONTENT, RULES);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      ruleId: "styling/design-tokens",
      severity: "block",
      category: "styling",
      file: "src/Button.tsx",
      line: 2,
      offending: "rgb(6, 182, 212)",
      replacement: "var(--brand-primary)",
      message: "Use the brand token instead of the raw color.",
    });
  });

  it("falls back to the rule's instruction when no check message exists", () => {
    const raw = JSON.stringify([findingLine("security/no-lodash", 1, "_.map")]);
    const findings = parseSemanticFindings(raw, "src/a.ts", "const _ = {};\n", RULES);
    expect(findings[0].message).toBe("violates security rule security/no-lodash");
  });

  it("drops findings with unknown rule ids (never invents ids)", () => {
    const raw = JSON.stringify([
      findingLine("styling/made-up-rule", 1, "x"),
      findingLine("styling/design-tokens", 2, "y"),
    ]);
    const findings = parseSemanticFindings(raw, "src/Button.tsx", CONTENT, RULES);
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("styling/design-tokens");
  });

  it("clamps out-of-range line numbers into the file", () => {
    const raw = JSON.stringify([findingLine("styling/design-tokens", 999, "z")]);
    const findings = parseSemanticFindings(raw, "src/Button.tsx", CONTENT, RULES);
    expect(findings).toHaveLength(1);
    expect(findings[0].line).toBe(4);
  });

  it("handles markdown-fenced JSON responses", () => {
    const raw = `\`\`\`json\n${JSON.stringify([
      findingLine("styling/design-tokens", 2, "rgb(6, 182, 212)"),
    ])}\n\`\`\``;
    const findings = parseSemanticFindings(raw, "src/Button.tsx", CONTENT, RULES);
    expect(findings).toHaveLength(1);
  });

  it("returns [] for non-JSON and non-array responses", () => {
    expect(parseSemanticFindings("I saw no problems", "a.ts", CONTENT, RULES)).toEqual([]);
    expect(parseSemanticFindings("{\"nope\": 1}", "a.ts", CONTENT, RULES)).toEqual([]);
    expect(parseSemanticFindings("", "a.ts", CONTENT, RULES)).toEqual([]);
  });

  it("caps findings at SEMANTIC_MAX_FINDINGS and dedupes by rule+line", () => {
    const items = Array.from({ length: 6 }, (_, i) =>
      findingLine("styling/design-tokens", (i % 3) + 1, `off-${i}`),
    );
    const findings = parseSemanticFindings(
      JSON.stringify(items),
      "src/Button.tsx",
      CONTENT,
      RULES,
    );
    expect(findings.length).toBeLessThanOrEqual(SEMANTIC_MAX_FINDINGS);
    const keys = new Set(findings.map((f) => `${f.ruleId}:${f.line}`));
    expect(keys.size).toBe(findings.length);
  });

  it("uses the line's own text when offending is missing", () => {
    const raw = JSON.stringify([{ ruleId: "styling/design-tokens", line: 2 }]);
    const findings = parseSemanticFindings(raw, "src/Button.tsx", CONTENT, RULES);
    expect(findings[0].offending).toBe("  const color = \"rgb(6, 182, 212)\";");
  });
});

describe("semanticEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled without the opt-in flag", () => {
    vi.stubEnv("GEMINI_API_KEY", "sk-test");
    expect(semanticEnabled()).toBe(false);
  });

  it("is disabled without a key", () => {
    vi.stubEnv("PRISM_GEMINI_CHECK", "1");
    expect(semanticEnabled()).toBe(false);
  });

  it("is enabled with flag + key", () => {
    vi.stubEnv("PRISM_GEMINI_CHECK", "1");
    vi.stubEnv("GEMINI_API_KEY", "sk-test");
    expect(semanticEnabled()).toBe(true);
  });

  it("honors GOOGLE_GEMINI_API_KEY as an alternative key name", () => {
    vi.stubEnv("PRISM_GEMINI_CHECK", "1");
    vi.stubEnv("GOOGLE_GEMINI_API_KEY", "sk-test");
    expect(semanticEnabled()).toBe(true);
  });

  it("PRISM_DISABLE=1 always wins", () => {
    vi.stubEnv("PRISM_DISABLE", "1");
    vi.stubEnv("PRISM_GEMINI_CHECK", "1");
    vi.stubEnv("GEMINI_API_KEY", "sk-test");
    expect(semanticEnabled()).toBe(false);
  });
});

describe("runSemanticCheck fail-open contract", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns [] when no key is configured", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("PRISM_GEMINI_CHECK", "1");
    const fetchFn = vi.fn();
    const findings = await runSemanticCheck("a.ts", CONTENT, RULES, { fetchFn });
    expect(findings).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("returns [] when the fetch throws", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("network down"));
    const findings = await runSemanticCheck("a.ts", CONTENT, RULES, {
      apiKey: "sk-test",
      fetchFn,
    });
    expect(findings).toEqual([]);
  });

  it("returns [] on HTTP error status", async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const findings = await runSemanticCheck("a.ts", CONTENT, RULES, {
      apiKey: "sk-test",
      fetchFn,
    });
    expect(findings).toEqual([]);
  });

  it("returns [] on a malformed model response", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] }),
    });
    const findings = await runSemanticCheck("a.ts", CONTENT, RULES, {
      apiKey: "sk-test",
      fetchFn,
    });
    expect(findings).toEqual([]);
  });

  it("hard-caps at the timeout and falls back to [] (never hangs)", async () => {
    const fetchFn = vi.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          // never resolves on its own; only the AbortController can end it
          init?.signal?.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        }),
    );
    const started = Date.now();
    const findings = await runSemanticCheck("a.ts", CONTENT, RULES, {
      apiKey: "sk-test",
      timeoutMs: 100,
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    const elapsed = Date.now() - started;
    expect(findings).toEqual([]);
    expect(elapsed).toBeLessThan(2000);
  });

  it("returns parsed findings on a valid response", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    findingLine("styling/design-tokens", 2, "rgb(6, 182, 212)", "var(--brand-primary)"),
                  ]),
                },
              ],
            },
          },
        ],
      }),
    });
    const findings = await runSemanticCheck("src/Button.tsx", CONTENT, RULES, {
      apiKey: "sk-test",
      fetchFn,
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].ruleId).toBe("styling/design-tokens");
    const call = fetchFn.mock.calls[0];
    expect(String(call[0])).toContain("gemini-3.6-flash");
  });

  it("resolves the timeout from the env override", () => {
    vi.stubEnv("PRISM_GEMINI_TIMEOUT_MS", "15000");
    expect(resolveTimeoutMs()).toBe(15000);
  });

  it("clamps out-of-bounds values to the safety limits", () => {
    vi.stubEnv("PRISM_GEMINI_TIMEOUT_MS", "999999");
    expect(resolveTimeoutMs()).toBe(SEMANTIC_TIMEOUT_MAX_MS);
    vi.stubEnv("PRISM_GEMINI_TIMEOUT_MS", "1");
    expect(resolveTimeoutMs()).toBe(SEMANTIC_TIMEOUT_MIN_MS);
    vi.stubEnv("PRISM_GEMINI_TIMEOUT_MS", "garbage");
    expect(resolveTimeoutMs()).toBe(SEMANTIC_TIMEOUT_MS);
  });

  it("prefers the explicit option over the env override", () => {
    vi.stubEnv("PRISM_GEMINI_TIMEOUT_MS", "15000");
    expect(resolveTimeoutMs(6000)).toBe(6000);
    expect(resolveTimeoutMs(-5)).toBe(15000);
  });

  it("defaults to the compiled-in SEMANTIC_TIMEOUT_MS when no override is set", () => {
    expect(SEMANTIC_TIMEOUT_MS).toBe(12000);
    expect(resolveTimeoutMs()).toBe(12000);
  });
});