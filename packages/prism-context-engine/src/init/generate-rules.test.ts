import { describe, it, expect } from "vitest";
import { generateRuleSet } from "./generate-rules.js";
import type { ProjectDetection } from "./detect.js";
import type { ExtractedTokens } from "./tokens.js";
import { parseRuleSet } from "../rules/parse.js";
import { checkContent } from "../rules/engine.js";

const noDetection: ProjectDetection = {
  hasPackageJson: true,
  isNextjs: false,
  router: "none",
  hasTailwind: false,
};

const noTokens: ExtractedTokens = {
  colorTokens: [],
  cssFilesScanned: [],
  tailwindConfigColorCount: 0,
  tailwindConfigParsedViaRegexFallback: false,
};

describe("generateRuleSet", () => {
  it("emits a valid, advisory-only placeholder when nothing was detected", () => {
    const ruleSet = generateRuleSet(noDetection, noTokens);
    expect(ruleSet.rules).toHaveLength(1);
    expect(ruleSet.rules[0]!.check).toBeUndefined();
    // Must round-trip through the real v1 validator — this is what
    // "write a commented starter rather than failing" actually means:
    // valid JSON, self-documenting via `instruction`, never a parse error.
    expect(() => parseRuleSet(JSON.stringify(ruleSet))).not.toThrow();
  });

  it("emits a required_token rule from discovered color tokens, at block severity on code files only", () => {
    const tokens: ExtractedTokens = {
      ...noTokens,
      colorTokens: [
        { hex: "#06b6d4", varRef: "var(--brand-primary)", source: "app/globals.css" },
      ],
      cssFilesScanned: ["app/globals.css"],
    };
    const ruleSet = generateRuleSet(noDetection, tokens);
    const rule = ruleSet.rules.find((r) => r.id === "styling/design-tokens");
    expect(rule).toBeDefined();
    expect(rule!.severity).toBe("block");
    expect(rule!.extensions).toEqual([".tsx", ".jsx", ".ts", ".js", ".html"]);
    expect(rule!.check).toEqual({
      type: "required_token",
      tokenSet: "auto-detected-colors",
      tokenMap: { "#06b6d4": "var(--brand-primary)" },
      message: "Use the CSS variable token instead of the raw hex value.",
    });
  });

  it("never lets the generated token rule flag its own definition file (regression: globals.css self-flagging)", () => {
    const tokens: ExtractedTokens = {
      ...noTokens,
      colorTokens: [
        { hex: "#06b6d4", varRef: "var(--brand-primary)", source: "app/globals.css" },
      ],
      cssFilesScanned: ["app/globals.css"],
    };
    const ruleSet = generateRuleSet({ ...noDetection, hasTailwind: true }, tokens);
    // globals.css content — the very lines that DEFINE the tokens.
    const cssContent = ":root {\n  --brand-primary: #06b6d4;\n}\n";
    expect(checkContent("app/globals.css", cssContent, ruleSet)).toHaveLength(0);
    // The same literal in a code file is still caught, and blocks.
    const findings = checkContent(
      "app/Button.tsx",
      'export const c = <div style={{ background: "#06b6d4" }} />;\n',
      ruleSet,
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe("block");
  });

  it("emits an arbitrary_value rule whenever Tailwind is detected", () => {
    const ruleSet = generateRuleSet({ ...noDetection, hasTailwind: true }, noTokens);
    const rule = ruleSet.rules.find(
      (r) => r.id === "styling/no-arbitrary-tailwind-values",
    );
    expect(rule).toBeDefined();
    expect(rule!.check?.type).toBe("arbitrary_value");
  });

  it("produces a rule set that always validates against the real v1 parser", () => {
    const tokens: ExtractedTokens = {
      ...noTokens,
      colorTokens: [
        { hex: "#06b6d4", varRef: "var(--brand-primary)", source: "app/globals.css" },
      ],
    };
    const ruleSet = generateRuleSet({ ...noDetection, hasTailwind: true }, tokens);
    expect(() => parseRuleSet(JSON.stringify(ruleSet))).not.toThrow();
    expect(ruleSet.version).toBe(1);
  });
});
