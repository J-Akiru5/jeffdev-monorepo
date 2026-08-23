import { describe, it, expect } from "vitest";
import {
  parseRuleSet,
  findRulesPath,
  loadRuleSet,
  ruleSeverity,
  RulesParseError,
} from "./parse.js";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const VALID = JSON.stringify({
  version: 1,
  rules: [
    {
      id: "styling/no-hex",
      category: "styling",
      severity: "block",
      instruction: "Use tokens",
      check: {
        type: "forbidden_pattern",
        pattern: "#[0-9a-fA-F]{6}\\b",
        allowlist: ["#FFFFFF"],
        fix: "var(--brand-primary)",
        message: "Use the token.",
      },
    },
    { id: "arch/advisory", category: "architecture", instruction: "Be nice" },
  ],
});

function expectParseError(raw: string | unknown, fragment?: string) {
  try {
    parseRuleSet(typeof raw === "string" ? raw : JSON.stringify(raw));
  } catch (err) {
    expect(err).toBeInstanceOf(RulesParseError);
    if (fragment) expect((err as Error).message).toContain(fragment);
    return;
  }
  throw new Error("expected RulesParseError");
}

describe("parseRuleSet", () => {
  it("accepts a valid rule set", () => {
    const parsed = parseRuleSet(VALID);
    expect(parsed.version).toBe(1);
    expect(parsed.rules).toHaveLength(2);
  });

  it("defaults severity to warn", () => {
    const parsed = parseRuleSet(VALID);
    expect(ruleSeverity(parsed.rules[0])).toBe("block");
    expect(ruleSeverity(parsed.rules[1])).toBe("warn");
  });

  it("keeps advisory rules without a check", () => {
    const parsed = parseRuleSet(VALID);
    expect(parsed.rules[1].check).toBeUndefined();
  });

  it("normalizes extensions to lowercase dotted form", () => {
    const parsed = parseRuleSet(
      JSON.stringify({
        version: 1,
        rules: [
          {
            id: "x",
            category: "styling",
            extensions: ["TSX", ".Css"],
            check: { type: "forbidden_pattern", pattern: "x" },
          },
        ],
      }),
    );
    expect(parsed.rules[0].extensions).toEqual([".tsx", ".css"]);
  });

  it("rejects invalid JSON", () => {
    expectParseError("{not json");
  });

  it("rejects non-object roots and bare arrays", () => {
    expectParseError([1, 2]);
    expectParseError('"hello"');
  });

  it("rejects unsupported versions", () => {
    expectParseError({ version: 2, rules: [] }, "version");
  });

  it("rejects missing rules array", () => {
    expectParseError({ version: 1 });
  });

  it("rejects rules without id, with bad category, or with bad severity", () => {
    expectParseError({ version: 1, rules: [{ category: "styling" }] }, ".id");
    expectParseError(
      { version: 1, rules: [{ id: "a", category: "vibes" }] },
      "category",
    );
    expectParseError(
      { version: 1, rules: [{ id: "a", category: "styling", severity: "fatal" }] },
      "severity",
    );
  });

  it("rejects unknown check types", () => {
    expectParseError(
      {
        version: 1,
        rules: [
          { id: "a", category: "styling", check: { type: "vibes_check" } },
        ],
      },
      "check.type",
    );
  });

  it("rejects uncompilable regex patterns", () => {
    expectParseError(
      {
        version: 1,
        rules: [
          {
            id: "a",
            category: "styling",
            check: { type: "forbidden_pattern", pattern: "([" },
          },
        ],
      },
      "compile",
    );
  });

  it("rejects empty tokenMap and specifiers and properties", () => {
    expectParseError(
      {
        version: 1,
        rules: [
          {
            id: "a",
            category: "styling",
            check: { type: "required_token", tokenSet: "c", tokenMap: {} },
          },
        ],
      },
      "tokenMap",
    );
    expectParseError(
      {
        version: 1,
        rules: [
          {
            id: "b",
            category: "security",
            check: { type: "banned_import", specifiers: [] },
          },
        ],
      },
      "specifiers",
    );
    expectParseError(
      {
        version: 1,
        rules: [
          {
            id: "c",
            category: "styling",
            check: { type: "arbitrary_value", properties: ["W-[347px]"] },
          },
        ],
      },
      "properties",
    );
  });
});

describe("findRulesPath", () => {
  const base = join(tmpdir(), `prism-rules-path-${Date.now()}`);

  it("walks up to the nearest .prism/rules.json", () => {
    mkdirSync(join(base, ".prism"), { recursive: true });
    mkdirSync(join(base, "deep", "deeper"), { recursive: true });
    writeFileSync(join(base, ".prism", "rules.json"), VALID);

    const found = findRulesPath(join(base, "deep", "deeper"));
    expect(found).toBe(join(base, ".prism", "rules.json"));

    const orphan = join(tmpdir(), `prism-none-${Date.now()}`);
    mkdirSync(orphan, { recursive: true });
    expect(findRulesPath(orphan)).toBeNull();

    rmSync(base, { recursive: true, force: true });
    rmSync(orphan, { recursive: true, force: true });
  });

  it("loadRuleSet reads and validates the file", () => {
    const dir = join(tmpdir(), `prism-load-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "rules.json");
    writeFileSync(file, VALID);
    expect(loadRuleSet(file).rules).toHaveLength(2);
    rmSync(dir, { recursive: true, force: true });
  });
});
