import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseRuleSet } from "./parse.js";
import { checkContent } from "./engine.js";

/**
 * The shipped example packs are user-facing documentation AND executable
 * rule sets. This suite loads them from disk and proves every convention
 * they encode actually fires - broken examples would be worse than none.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const EXAMPLES_DIR = join(HERE, "..", "..", "examples", "mobile-and-python");

function load(name: string) {
  return parseRuleSet(readFileSync(join(EXAMPLES_DIR, name), "utf8"));
}

describe("example pack: flutter-rules.json", () => {
  const rs = load("flutter-rules.json");

  it("parses as valid v1", () => {
    expect(rs.version).toBe(1);
    expect(rs.rules.length).toBeGreaterThanOrEqual(3);
  });

  it("flags print() but passes debugPrint", () => {
    const dirty = checkContent("lib/main.dart", 'print("debug");\n', rs);
    const clean = checkContent("lib/main.dart", 'debugPrint("debug");\n', rs);
    expect(dirty.some((f) => f.ruleId.includes("no-print"))).toBe(true);
    expect(clean).toHaveLength(0);
  });

  it("requires material import inside lib/widgets widget files", () => {
    const missing = checkContent(
      join("lib", "widgets", "PriceCard.dart"),
      "class PriceCard {}",
      rs,
    );
    expect(missing.some((f) => f.ruleId.includes("widgets-import-material"))).toBe(true);

    const present = checkContent(
      join("lib", "widgets", "PriceCard.dart"),
      "import 'package:flutter/material.dart';\n\nclass PriceCard {}",
      rs,
    );
    expect(present.some((f) => f.ruleId.includes("widgets-import-material"))).toBe(false);
  });

  it("places PascalCase widget files in lib/widgets via placement rule", () => {
    const outside = checkContent(join("lib", "views", "PriceCard.dart"), "", rs);
    expect(outside.some((f) => f.ruleId.includes("widgets-pascalcase"))).toBe(true);
    const inside = checkContent(join("lib", "widgets", "PriceCard.dart"), "", rs);
    expect(inside.some((f) => f.ruleId.includes("widgets-pascalcase"))).toBe(false);
  });
});

describe("example pack: kotlin-rules.json", () => {
  const rs = load("kotlin-rules.json");

  it("bans GlobalScope at block severity", () => {
    const dirty = checkContent("src/main/java/App.kt", 'GlobalScope.launch {}\n', rs);
    expect(dirty.some((f) => f.severity === "block" && f.ruleId.includes("globalscope"))).toBe(true);
  });

  it("flags !! assertions with the fix message", () => {
    const dirty = checkContent("src/main/java/Repo.kt", "val x = value!!\n", rs);
    expect(dirty.some((f) => f.ruleId.includes("no-bang-bang"))).toBe(true);
  });

  it("requires compose runtime import in Screen composables under ui/components", () => {
    const missing = checkContent(
      "src/main/java/ui/components/ProfileScreen.kt",
      "fun ProfileScreen() {}\n",
      rs,
    );
    expect(missing.some((f) => f.ruleId.includes("screens-are-composable"))).toBe(true);

    const present = checkContent(
      "src/main/java/ui/components/ProfileScreen.kt",
      "import androidx.compose.runtime.Composable\n\n@Composable\nfun ProfileScreen() {}\n",
      rs,
    );
    expect(present.some((f) => f.ruleId.includes("screens-are-composable"))).toBe(false);
  });
});

describe("example pack: python-rules.json", () => {
  const rs = load("python-rules.json");

  it("enforces snake_case module names and exempts dunders", () => {
    expect(checkContent("src/my_module.py", "", rs)).toHaveLength(0);
    const dunder = checkContent("__init__.py", "", rs);
    expect(dunder.filter((f) => f.ruleId.includes("snake-case"))).toHaveLength(0);
    const bad = checkContent("MyModule.py", "", rs);
    expect(bad.filter((f) => f.ruleId.includes("snake-case"))).toHaveLength(1);
  });

  it("routes test files to tests/ and requires pytest there", () => {
    const outside = checkContent("app/test_api.py", "def test_x():\n    assert True\n", rs);
    expect(outside.some((f) => f.ruleId.includes("tests-live-in-tests-dir"))).toBe(true);
    expect(outside.some((f) => f.ruleId.includes("tests-import-pytest"))).toBe(true);

    const insideWithPytest = checkContent(
      join("tests", "test_api.py"),
      "import pytest\n\ndef test_x():\n    assert True\n",
      rs,
    );
    expect(insideWithPytest).toHaveLength(0);
  });

  it("blocks committed debuggers and warns on bare except", () => {
    const dirty = checkContent("src/app.py", "breakpoint()\ntry:\n    pass\nexcept:\n    pass\n", rs);
    expect(dirty.some((f) => f.severity === "block" && f.ruleId.includes("no-debugger"))).toBe(true);
    expect(dirty.some((f) => f.ruleId.includes("no-bare-except"))).toBe(true);
  });
});
