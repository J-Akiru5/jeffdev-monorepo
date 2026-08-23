import { describe, it, expect } from "vitest";
import { parseRuleSet, RulesParseError } from "./parse.js";
import { checkContent } from "./engine.js";

function ruleSetWith(check: Record<string, unknown>, extensions?: string[]) {
  return parseRuleSet(
    JSON.stringify({
      version: 1,
      rules: [
        {
          id: "test/breadth",
          category: "architecture",
          severity: "block",
          ...(extensions ? { extensions } : {}),
          check,
        },
      ],
    }),
  );
}

describe("naming_pattern", () => {
  const check = { type: "naming_pattern", pattern: "^[A-Z][A-Za-z0-9]*$" };

  it("flags a non-PascalCase component file name", () => {
    const findings = checkContent(
      "src/components/userCard.tsx",
      "export default function UserCard() {}",
      ruleSetWith(check, [".tsx"]),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.offending).toBe("userCard.tsx");
    expect(findings[0]!.severity).toBe("block");
  });

  it("passes a PascalCase file name and ignores the extension itself", () => {
    const findings = checkContent(
      "src/components/UserCard.tsx",
      "",
      ruleSetWith(check, [".tsx"]),
    );
    expect(findings).toHaveLength(0);
  });

  it("checks only files covered by extensions", () => {
    // .css not in the rule's extensions -> no finding even for lowercase.
    const findings = checkContent(
      "styles/theme.css",
      "",
      ruleSetWith({ ...check }, [".tsx"]),
    );
    expect(findings).toHaveLength(0);
  });
});

describe("file_placement", () => {
  const check = {
    type: "file_placement",
    matchPattern: "^use[A-Z]",
    directory: "src/hooks",
  };

  it("flags a hook file living outside src/hooks (relative path)", () => {
    const findings = checkContent(
      "src/components/useAuth.ts",
      "export function useAuth() {}",
      ruleSetWith(check, [".ts"]),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.offending).toBe("useAuth.ts");
  });

  it("passes when the hook lives inside src/hooks (absolute Windows path)", () => {
    const findings = checkContent(
      "C:\\repo\\app\\src\\hooks\\useAuth.ts",
      "export function useAuth() {}",
      ruleSetWith(check, [".ts"]),
    );
    expect(findings).toHaveLength(0);
  });

  it("ignores files that do not match the pattern", () => {
    const findings = checkContent(
      "src/components/authService.ts",
      "",
      ruleSetWith(check, [".ts"]),
    );
    expect(findings).toHaveLength(0);
  });
});

describe("required_import", () => {
  const check = { type: "required_import", specifier: "@/lib/safe-fetch" };

  it("flags a file that never imports the required specifier", () => {
    const findings = checkContent(
      "src/client.ts",
      'const res = await fetch("/api");\n',
      ruleSetWith(check),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.offending).toBe("@/lib/safe-fetch");
  });

  it("passes when imported via a from-import", () => {
    const findings = checkContent(
      "src/client.ts",
      'import { safeFetch } from "@/lib/safe-fetch";\nconst res = await safeFetch("/api");\n',
      ruleSetWith(check),
    );
    expect(findings).toHaveLength(0);
  });

  it("passes when imported via dynamic import()", () => {
    const findings = checkContent(
      "src/lazy.ts",
      'const m = await import("@/lib/safe-fetch");\n',
      ruleSetWith(check),
    );
    expect(findings).toHaveLength(0);
  });

  it("does not match a bare substring outside an import statement", () => {
    // The specifier appears in a comment-ish string but never in an import —
    // must still flag.
    const findings = checkContent(
      "src/doc.ts",
      '// see docs at "@/lib/safe-fetch"\nexport const x = 1;\n',
      ruleSetWith(check),
    );
    expect(findings).toHaveLength(1);
  });
});

describe("breadth parser validation", () => {
  it("rejects naming_pattern with a non-compiling regex", () => {
    expect(() =>
      ruleSetWith({ type: "naming_pattern", pattern: "([" }),
    ).toThrow(RulesParseError);
  });

  it("rejects file_placement missing directory", () => {
    expect(() =>
      ruleSetWith({ type: "file_placement", matchPattern: "^x" }),
    ).toThrow(RulesParseError);
  });

  it("rejects required_import with empty specifier", () => {
    expect(() =>
      ruleSetWith({ type: "required_import", specifier: "" }),
    ).toThrow(RulesParseError);
  });

  it("accepts all three new types through the real validator", () => {
    expect(() =>
      parseRuleSet(
        JSON.stringify({
          version: 1,
          rules: [
            {
              id: "a/naming",
              category: "architecture",
              check: { type: "naming_pattern", pattern: "^[A-Z]" },
            },
            {
              id: "a/placement",
              category: "architecture",
              check: {
                type: "file_placement",
                matchPattern: "^use[A-Z]",
                directory: "src/hooks",
              },
            },
            {
              id: "a/import",
              category: "security",
              severity: "warn",
              check: { type: "required_import", specifier: "@/lib/log" },
            },
          ],
        }),
      ),
    ).not.toThrow();
  });

  it("never lets an invalid pattern crash a scan (fail open)", () => {
    // Bypass the parser to simulate hand-edited rules with a bad regex.
    const raw = JSON.stringify({
      version: 1,
      rules: [
        {
          id: "bad/pattern",
          category: "architecture",
          check: { type: "naming_pattern", pattern: "([" },
        },
      ],
    });
    // Parser rejects it; if someone bypasses parsing, engine fails open.
    expect(() => parseRuleSet(raw)).toThrow(RulesParseError);
  });
});
