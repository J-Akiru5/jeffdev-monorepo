import { describe, it, expect } from "vitest";
import { matchesGoImport, matchesPythonImport } from "./engine.js";
import { parseRuleSet } from "./parse.js";
import { checkContent } from "./engine.js";

/**
 * Phase 4 (Jeff ruling): the STRUCTURAL check family is language-agnostic
 * text/path matching and must run clean on mobile/systems stacks —
 * .dart (Flutter), .swift, .kt (Kotlin), .py, .go, .rs — with zero engine
 * changes. Token-based checks stay web-only by nature.
 */

const EXOTIC = ["dart", "swift", "kt", "py", "go", "rs"] as const;

function rulesWith(check: Record<string, unknown>, exts: string[]) {
  return parseRuleSet(
    JSON.stringify({
      version: 1,
      rules: [
        {
          id: "structural/test",
          category: "architecture",
          severity: "warn",
          extensions: exts.map((e) => `.${e}`),
          check,
        },
      ],
    }),
  );
}

describe("structural checks across mobile/systems extensions", () => {
  it("naming_pattern enforces snake_case on every exotic extension", () => {
    for (const ext of EXOTIC) {
      const rs = rulesWith({ type: "naming_pattern", pattern: "^[a-z0-9_]+$" }, [ext]);
      const good = checkContent(`lib/widgets/primary_button.${ext}`, "", rs);
      const bad = checkContent(`lib/widgets/PrimaryButton.${ext}`, "", rs);
      expect(good, ext).toHaveLength(0);
      expect(bad, ext).toHaveLength(1);
    }
  });

  it("file_placement routes matched files to their directory per stack", () => {
    for (const ext of EXOTIC) {
      const rs = rulesWith(
        { type: "file_placement", matchPattern: "^use|^Use", directory: "shared" },
        [ext],
      );
      const outside = checkContent(`app/useNetwork.${ext}`, "", rs);
      const inside = checkContent(`app/shared/useNetwork.${ext}`, "", rs);
      expect(outside, ext).toHaveLength(1);
      expect(inside, ext).toHaveLength(0);
    }
  });

  it("forbidden_pattern scans exotic files line by line", () => {
    for (const ext of EXOTIC) {
      const rs = rulesWith(
        { type: "forbidden_pattern", pattern: "\\bprint\\(" },
        [ext],
      );
      const clean = checkContent(`main.${ext}`, 'log("x")\n', rs);
      const dirty = checkContent(`main.${ext}`, 'print("debug")\n', rs);
      expect(clean, ext).toHaveLength(0);
      expect(dirty, ext).toHaveLength(1);
    }
  });

  it("extension gating holds: unlisted extensions are never scanned", () => {
    const rs = rulesWith({ type: "naming_pattern", pattern: "^[a-z]+$" }, [
      "py",
    ]);
    expect(checkContent("Main.kt", "", rs)).toHaveLength(0);
    expect(checkContent("Main.go", "", rs)).toHaveLength(0);
  });
});

describe("required_import speaks Python", () => {
  const spec = { type: "required_import", specifier: "requests" };

  it.each([
    ["import requests"],
    ["import requests, os"],
    ["from requests import get"],
    ["from requests.auth import AuthBase"],
    ["\timport requests"],
  ])("passes: %s", (line) => {
    expect(matchesPythonImport(line as string, "requests")).toBe(true);
  });

  it.each([
    ["import requests-mock"],
    ["from request_utils import wrap"],
    ['x = "requests"'],
    ["# import requests later"],
  ])("does not falsely satisfy: %s", (line) => {
    expect(matchesPythonImport(line as string, "requests")).toBe(false);
  });

  it("end to end: api client without the module is flagged", () => {
    const findings = checkContent(
      "src/api.py",
      "def get():\n    return fetch_all()\n",
      rulesWith(spec, ["py"]),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.offending).toBe("requests");
  });
});

describe("required_import includePattern scoping", () => {
  const scoped = {
    type: "required_import",
    specifier: "pytest",
    includePattern: "(^|/)(test_[^/]*|[^/]*_test)\\.py$",
  };

  it("flags a test_*.py missing the import", () => {
    const findings = checkContent(
      "tests/test_api.py",
      "def test_get():\n    assert True\n",
      rulesWith(scoped, ["py"]),
    );
    expect(findings).toHaveLength(1);
  });

  it("does not flag production files", () => {
    const findings = checkContent(
      "src/api.py",
      "def get():\n    return 1\n",
      rulesWith(scoped, ["py"]),
    );
    expect(findings).toHaveLength(0);
  });

  it("passes when the scoped file imports pytest", () => {
    const findings = checkContent(
      "tests/test_api.py",
      "import pytest\n\ndef test_get():\n    assert True\n",
      rulesWith(scoped, ["py"]),
    );
    expect(findings).toHaveLength(0);
  });
});

describe("required_import speaks Go", () => {
  const spec = { type: "required_import", specifier: "net/http" };

  it.each([
    ['import "net/http"'],
    ['    "net/http"'],
    ['    http "net/http"'],
    ['import http "net/http" // with comment'],
  ])("passes: %s", (line) => {
    expect(matchesGoImport(line as string, "net/http")).toBe(true);
  });

  it("matches submodule paths via prefix", () => {
    expect(matchesGoImport('    httputil "net/http/httputil"', "net/http")).toBe(
      true,
    );
  });

  it.each([
    ['status := "active"'],
    ['url := "https://example.com/net/http-docs"'],
    ["fmt.Println(\"net/http\")"],
  ])("does not falsely satisfy: %s", (line) => {
    expect(matchesGoImport(line as string, "net/http")).toBe(false);
  });

  it("end to end: handler without net/http is flagged", () => {
    const findings = checkContent(
      "handler.go",
      'func w() { fmt.Println("hi") }\n',
      rulesWith(spec, ["go"]),
    );
    expect(findings).toHaveLength(1);
  });
});
