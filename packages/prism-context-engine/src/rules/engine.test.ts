import { describe, it, expect } from "vitest";
import { checkContent, applicableExtensions, isFileApplicable } from "./engine.js";
import { formatHookClaudeCode, formatFindingLine, formatPretty } from "./format.js";
import type { PrismRule, RuleSet } from "./types.js";

function ruleSet(rules: PrismRule[]): RuleSet {
  return { version: 1, rules };
}

describe("forbidden_pattern", () => {
  const rule: PrismRule = {
    id: "styling/no-hex",
    category: "styling",
    severity: "block",
    check: {
      type: "forbidden_pattern",
      pattern: "#[0-9a-fA-F]{6}\\b",
      allowlist: ["#FFFFFF"],
      fix: "var(--brand-primary)",
      message: "Use the design token, not a hex literal.",
    },
  };

  it("flags hex literals with line number and exact replacement", () => {
    const findings = checkContent(
      "src/Button.tsx",
      'export const c = {\n  bg: "#06b6d4",\n};',
      ruleSet([rule]),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      ruleId: "styling/no-hex",
      severity: "block",
      file: "src/Button.tsx",
      line: 2,
      offending: "#06b6d4",
      replacement: "var(--brand-primary)",
    });
  });

  it("honors the allowlist case-insensitively", () => {
    const findings = checkContent(
      "src/a.tsx",
      'const white = "#FFFFFF";\nconst whiteLow = "#ffffff";\nconst blue = "#3B82F6";',
      ruleSet([rule]),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].offending).toBe("#3B82F6");
  });

  it("finds every occurrence on one line", () => {
    const findings = checkContent(
      "f.tsx",
      'const pair = ["#111111", "#222222"];',
      ruleSet([rule]),
    );
    expect(findings).toHaveLength(2);
  });

  it("handles CRLF input", () => {
    const findings = checkContent(
      "f.tsx",
      'one\r\n"#ABCDEF"\r\nthree',
      ruleSet([rule]),
    );
    expect(findings[0].line).toBe(2);
  });
});

describe("required_token", () => {
  const rule: PrismRule = {
    id: "styling/brand-colors",
    category: "styling",
    severity: "block",
    instruction: "Brand colors must come from the token set.",
    check: {
      type: "required_token",
      tokenSet: "brand-colors",
      tokenMap: { "#06b6d4": "var(--brand-primary)" },
    },
  };

  it("maps raw values to their tokens exactly", () => {
    const findings = checkContent(
      "b.tsx",
      'background: "#06b6d4"',
      ruleSet([rule]),
    );
    expect(findings[0].replacement).toBe("var(--brand-primary)");
    expect(findings[0].offending).toBe("#06b6d4");
  });

  it("matches case-insensitively", () => {
    const findings = checkContent(
      "b.tsx",
      'background: "#06B6D4"',
      ruleSet([rule]),
    );
    expect(findings[0].replacement).toBe("var(--brand-primary)");
  });

  it("ignores colors outside the token map", () => {
    const findings = checkContent(
      "b.tsx",
      'background: "#123456"',
      ruleSet([rule]),
    );
    expect(findings).toHaveLength(0);
  });
});

describe("banned_import", () => {
  const rule: PrismRule = {
    id: "architecture/no-direct-db",
    category: "architecture",
    severity: "block",
    check: {
      type: "banned_import",
      specifiers: ["lodash", "@syntaxure-labs/db"],
    },
  };

  it.each([
    ['import _ from "lodash";', true],
    ['import _ from "lodash/fp";', true],
    ['const _ = require("lodash");', true],
    ['const x = await import("lodash");', true],
    ['import "lodash";', true],
    ['export { db } from "@syntaxure-labs/db";', true],
    ['import { getPrismDb } from "@syntaxure-labs/db/prism";', true],
  ])("flags %s", (line) => {
    expect(checkContent("f.ts", line, ruleSet([rule]))).toHaveLength(1);
  });

  it.each([
    ['// lodash is nice but we do not import it here', 0],
    ['import { chunk } from "lodash-es";', 0],
    ['const s = "from \\"lodash\\" in a string literal only";', 0],
  ])("does not flag %s", (line, count) => {
    expect(checkContent("f.ts", line, ruleSet([rule]))).toHaveLength(count);
  });
});

describe("arbitrary_value", () => {
  const rule: PrismRule = {
    id: "styling/no-arbitrary",
    category: "styling",
    severity: "warn",
    check: {
      type: "arbitrary_value",
      properties: ["w", "max-w", "text"],
    },
  };

  it("flags arbitrary values", () => {
    const findings = checkContent(
      "c.tsx",
      '<div class="w-[347px] text-[13px]">',
      ruleSet([rule]),
    );
    expect(findings.map((f) => f.offending)).toEqual([
      "w-[347px]",
      "text-[13px]",
    ]);
  });

  it("does not match scale utilities", () => {
    const findings = checkContent(
      "c.tsx",
      '<div class="w-full text-sm">',
      ruleSet([rule]),
    );
    expect(findings).toHaveLength(0);
  });

  it("does not double-match max-w as w", () => {
    const findings = checkContent(
      "c.tsx",
      '<div class="max-w-[600px]">',
      ruleSet([rule]),
    );
    expect(findings.map((f) => f.offending)).toEqual(["max-w-[600px]"]);
  });
});

describe("applicability", () => {
  it("per-rule extension gates apply", () => {
    const rule: PrismRule = {
      id: "t/only-css",
      category: "styling",
      extensions: [".css"],
      check: { type: "forbidden_pattern", pattern: "evil" },
    };
    const set = ruleSet([rule]);
    expect(isFileApplicable("a.css", set)).toBe(true);
    expect(isFileApplicable("a.tsx", set)).toBe(false);
    expect(applicableExtensions(set)).toEqual(new Set([".css"]));
  });

  it("default extensions cover common code files", () => {
    const rule: PrismRule = {
      id: "g/all",
      category: "styling",
      check: { type: "forbidden_pattern", pattern: "evil" },
    };
    const set = ruleSet([rule]);
    expect(isFileApplicable("a.tsx", set)).toBe(true);
    expect(isFileApplicable("a.md", set)).toBe(false);
  });
});
