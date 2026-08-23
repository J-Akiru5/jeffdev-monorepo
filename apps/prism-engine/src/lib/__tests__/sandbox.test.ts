import { describe, it, expect } from "vitest";
import {
  runSandbox,
  SandboxValidationError,
  SandboxRequestSchema,
} from "../sandbox";

// A real v1 envelope — the same shape `prism pull` writes and the Pass reads.
const RULES_JSON = JSON.stringify({
  version: 1,
  rules: [
    {
      id: "styling/design-tokens",
      category: "styling",
      severity: "block",
      extensions: [".tsx", ".jsx", ".ts", ".js"],
      check: {
        type: "required_token",
        tokenSet: "auto-detected-colors",
        tokenMap: { "#06b6d4": "var(--brand-primary)" },
        message: "Use the CSS variable token instead of the raw hex value.",
      },
    },
    {
      id: "styling/no-arbitrary",
      category: "styling",
      severity: "warn",
      extensions: [".tsx"],
      check: { type: "arbitrary_value", properties: ["w"] },
    },
  ],
});

const FILES = [
  {
    path: "app/Bad.tsx",
    content: 'export const c = <div style={{ background: "#06b6d4" }} className="w-[91px]" />;\n',
  },
  {
    path: "app/Good.tsx",
    content: 'export const c = <div style={{ background: "var(--brand-primary)" }} />;\n',
  },
];

describe("runSandbox", () => {
  it("reports block + warn findings using the REAL engine", () => {
    const result = runSandbox(
      SandboxRequestSchema.parse({ rulesJson: RULES_JSON, files: FILES }),
    );
    expect(result.ok).toBe(true);
    expect(result.ruleCount).toBe(2);
    expect(result.filesScanned).toBe(2);
    expect(result.summary.blocks).toBeGreaterThanOrEqual(1);
    // Good.tsx uses the token -> no required_token finding for it.
    const badFileFindings = result.findings.filter((f) => f.file === "app/Bad.tsx");
    expect(badFileFindings.some((f) => f.ruleId === "styling/design-tokens" && f.severity === "block")).toBe(true);
    expect(badFileFindings.some((f) => f.offending === "w-[91px]")).toBe(true);
    expect(result.findings.filter((f) => f.file === "app/Good.tsx")).toHaveLength(0);
  });

  it("throws a readable validation error for an invalid envelope", () => {
    expect(() =>
      runSandbox(
        SandboxRequestSchema.parse({
          rulesJson: JSON.stringify({ version: 2, rules: [] }),
          files: FILES,
        }),
      ),
    ).toThrow(SandboxValidationError);
  });

  it("rejects oversized submissions at the schema layer", () => {
    const big = "x".repeat(65 * 1024);
    const parsed = SandboxRequestSchema.safeParse({
      rulesJson: RULES_JSON,
      files: [{ path: "a.tsx", content: big }],
    });
    expect(parsed.success).toBe(false);
  });
});
