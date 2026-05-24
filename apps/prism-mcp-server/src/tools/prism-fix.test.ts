import { describe, it, expect } from "vitest";
import { handlePrismFix } from "./prism-fix.js";
import type { Violation } from "./prism-check.js";

function getText(result: {
  content: Array<{ type: string; text: string }>;
}): string {
  return result.content[0]?.text || "";
}

describe("handlePrismFix", () => {
  it("returns error when violation missing", async () => {
    const result = await handlePrismFix({
      violation: undefined as unknown as Violation,
      code: "test",
    });
    expect(result.isError).toBe(true);
    expect(getText(result)).toContain("violation and code are required");
  });

  it("returns error when code missing", async () => {
    const result = await handlePrismFix({
      violation: {
        ruleId: "r1",
        ruleName: "test",
        pattern: "",
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
        matchedText: "",
        message: "",
        severity: "warning",
        suggestion: "",
      },
      code: "",
    });
    expect(result.isError).toBe(true);
  });

  it("fixes cross-app import pattern", async () => {
    const code = `import { Button } from "../../apps/dashboard/components/Button";`;
    const result = await handlePrismFix({
      violation: {
        ruleId: "r1",
        ruleName: "No cross-app imports",
        pattern: "../../apps/",
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
        matchedText: `../../apps/dashboard/components/Button`,
        message: "Use @repo imports instead",
        severity: "error",
        suggestion: 'Fix for "No cross-app imports"',
      },
      code,
    });

    const parsed = JSON.parse(getText(result));
    expect(parsed.correctedCode).toContain("@repo/dashboard");
    expect(parsed.correctedCode).not.toContain("../../apps/");
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.9);
    expect(parsed.appliedRule).toBe("No cross-app imports");
  });

  it("fixes inline style pattern", async () => {
    const code = `const el = <div style={{ color: "red" }}>hello</div>;`;
    const result = await handlePrismFix({
      violation: {
        ruleId: "r2",
        ruleName: "No inline styles",
        pattern: "style={",
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
        matchedText: `style={{ color: "red" }}`,
        message: "Inline style detected",
        severity: "warning",
        suggestion: "Use Tailwind classes",
      },
      code,
    });

    const parsed = JSON.parse(getText(result));
    expect(parsed.correctedCode).toContain("Tailwind");
    expect(parsed.correctedCode).not.toContain(`style={{`);
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("fixes console.log pattern", async () => {
    const code = `function foo() {\n  console.log("debug");\n  return bar;\n}`;
    const result = await handlePrismFix({
      violation: {
        ruleId: "r3",
        ruleName: "No console.log",
        pattern: "console\\.log",
        line: 2,
        column: 3,
        endLine: 2,
        endColumn: 1,
        matchedText: `console.log("debug")`,
        message: "Remove debug logs",
        severity: "warning",
        suggestion: "Remove console.log",
      },
      code,
    });

    const parsed = JSON.parse(getText(result));
    expect(parsed.correctedCode).toContain("// console.log");
    expect(parsed.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it("adds FIXME comment for unknown patterns", async () => {
    const code = `const x = someBadPattern();`;
    const result = await handlePrismFix({
      violation: {
        ruleId: "r4",
        ruleName: "Unknown rule",
        pattern: "someBadPattern",
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
        matchedText: "someBadPattern",
        message: "Avoid this pattern",
        severity: "error",
        suggestion: "Do something else",
      },
      code,
    });

    const parsed = JSON.parse(getText(result));
    expect(parsed.correctedCode).toContain("FIXME: Unknown rule");
    expect(parsed.confidence).toBeLessThan(0.5);
  });

  it("handles no-match pattern gracefully", async () => {
    const code = `const x = 1;`;
    const result = await handlePrismFix({
      violation: {
        ruleId: "r5",
        ruleName: "Some rule",
        pattern: "nonexistent",
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
        matchedText: "nonexistent",
        message: "Avoid this",
        severity: "error",
        suggestion: "Do something else",
      },
      code,
    });

    const parsed = JSON.parse(getText(result));
    expect(parsed.confidence).toBe(0.3);
    expect(parsed.changes).toHaveLength(1);
    expect(parsed.correctedCode).toContain("FIXME: Some rule");
  });
});
