import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { extractTokens } from "./tokens.js";

function makeTmpDir(label: string): string {
  const dir = join(
    tmpdir(),
    `prism-tokens-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("extractTokens", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("returns nothing when no CSS file or Tailwind config exists", async () => {
    const dir = makeTmpDir("empty");
    dirs.push(dir);
    const result = await extractTokens(dir);
    expect(result.colorTokens).toEqual([]);
    expect(result.cssFilesScanned).toEqual([]);
    expect(result.tailwindConfigFile).toBeUndefined();
  });

  it("extracts hex-valued custom properties from app/globals.css", async () => {
    const dir = makeTmpDir("css");
    dirs.push(dir);
    mkdirSync(join(dir, "app"), { recursive: true });
    writeFileSync(
      join(dir, "app", "globals.css"),
      `:root {\n  --brand-primary: #06b6d4;\n  --brand-accent: #8B5CF6;\n  --spacing-unit: 4px;\n}\n`,
    );

    const result = await extractTokens(dir);
    expect(result.cssFilesScanned).toEqual(["app/globals.css"]);
    expect(result.colorTokens).toHaveLength(2);
    const byHex = new Map(result.colorTokens.map((t) => [t.hex, t.varRef]));
    expect(byHex.get("#06b6d4")).toBe("var(--brand-primary)");
    // value should be lowercased for stable tokenMap keys
    expect(byHex.get("#8b5cf6")).toBe("var(--brand-accent)");
  });

  it("also picks up Tailwind v4 @theme custom properties (same syntax)", async () => {
    const dir = makeTmpDir("theme-v4");
    dirs.push(dir);
    mkdirSync(join(dir, "app"), { recursive: true });
    writeFileSync(
      join(dir, "app", "globals.css"),
      `@theme {\n  --color-brand-500: #22d3ee;\n}\n`,
    );
    const result = await extractTokens(dir);
    expect(result.colorTokens).toHaveLength(1);
    expect(result.colorTokens[0]!.hex).toBe("#22d3ee");
  });

  it("dedupes repeated hex values, keeping the first occurrence", async () => {
    const dir = makeTmpDir("dedupe");
    dirs.push(dir);
    mkdirSync(join(dir, "app"), { recursive: true });
    writeFileSync(
      join(dir, "app", "globals.css"),
      `:root {\n  --brand-primary: #06b6d4;\n  --duplicate-of-primary: #06b6d4;\n}\n`,
    );
    const result = await extractTokens(dir);
    expect(result.colorTokens).toHaveLength(1);
    expect(result.colorTokens[0]!.varRef).toBe("var(--brand-primary)");
  });

  it("reads a plain .js Tailwind config via dynamic import", async () => {
    const dir = makeTmpDir("tw-js");
    dirs.push(dir);
    writeFileSync(
      join(dir, "tailwind.config.js"),
      `export default { theme: { extend: { colors: { primary: { 500: "#123456" }, accent: "#abcdef" } } } };\n`,
    );
    const result = await extractTokens(dir);
    expect(result.tailwindConfigFile).toBe("tailwind.config.js");
    expect(result.tailwindConfigParsedViaRegexFallback).toBe(false);
    expect(result.tailwindConfigColorCount).toBe(2);
  });

  it("falls back to regex extraction for a .ts Tailwind config", async () => {
    const dir = makeTmpDir("tw-ts");
    dirs.push(dir);
    writeFileSync(
      join(dir, "tailwind.config.ts"),
      `import type { Config } from "tailwindcss";\nexport default {\n  theme: { extend: { colors: { primary: "#00ff00", secondary: "#ff00ff" } } },\n} satisfies Config;\n`,
    );
    const result = await extractTokens(dir);
    expect(result.tailwindConfigFile).toBe("tailwind.config.ts");
    expect(result.tailwindConfigParsedViaRegexFallback).toBe(true);
    expect(result.tailwindConfigColorCount).toBe(2);
  });

  it("falls back to regex when a .js config throws on import", async () => {
    const dir = makeTmpDir("tw-throws");
    dirs.push(dir);
    writeFileSync(
      join(dir, "tailwind.config.js"),
      `throw new Error("boom");\n// colors: { primary: '#111111' }\n`,
    );
    const result = await extractTokens(dir);
    expect(result.tailwindConfigParsedViaRegexFallback).toBe(true);
  });
});
