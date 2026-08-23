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

function write(dir: string, rel: string, content: string): void {
  const full = join(dir, rel);
  const parent = full.slice(0, Math.max(full.lastIndexOf("/"), full.lastIndexOf("\\")));
  if (parent) mkdirSync(parent, { recursive: true });
  writeFileSync(full, content);
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

describe("extractTokens Batch A - workspace CSS/SCSS walker", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });


  it("discovers custom properties in non-globals CSS and SCSS files", async () => {
    const dir = makeTmpDir("walker");
    dirs.push(dir);
    write(dir, join("styles", "theme.css"), ":root {\n  --brand-teal: #14b8a6;\n}\n");
    write(dir, join("scss", "_palette.scss"), ".card {\n  --space-y: #0ea5e9;\n}\n");
    write(dir, join("node_modules", "fake-pkg", "evil.css"), "--should-not-appear: #ff0000;\n");

    const result = await extractTokens(dir);

    const hexes = result.colorTokens.map((t) => t.hex);
    expect(hexes).toContain("#14b8a6"); // css found via walker
    expect(hexes).toContain("#0ea5e9"); // scss custom prop found ($vars not needed)
    expect(hexes).not.toContain("#ff0000"); // node_modules excluded

    expect(result.cssFilesScanned.some((f) => f.includes("theme.css"))).toBe(true);
    expect(result.cssFilesScanned.some((f) => f.endsWith("_palette.scss"))).toBe(true);
    expect(result.cssFilesScanned.some((f) => f.includes("fake-pkg"))).toBe(false);
  });

  it("deduplicates identical hex values across css and scss sources", async () => {
    const dir = makeTmpDir("dedup");
    dirs.push(dir);
    write(dir, "a.css", ":root {\n  --one: #123456;\n}\n");
    write(dir, "b.scss", ".x {\n  --two: #123456;\n}\n");

    const result = await extractTokens(dir);
    expect(result.colorTokens.filter((t) => t.hex === "#123456")).toHaveLength(1);
  });

  it("keeps priority globals.css display path first when walker runs", async () => {
    const dir = makeTmpDir("priority");
    dirs.push(dir);
    write(dir, join("app", "globals.css"), ":root {\n  --g: #abcdef;\n}\n");
    write(dir, "other.css", "--o: #123abc;\n");

    const result = await extractTokens(dir);
    expect(result.cssFilesScanned[0]).toBe("app/globals.css");
    expect(result.colorTokens.map((t) => t.hex)).toEqual(
      expect.arrayContaining(["#abcdef", "#123abc"]),
    );
  });
});
describe("extractTokens Batch B - Vue/Svelte style-block harvesting", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });


  it("harvests tokens from multiple Vue SFC style blocks and ignores script-side vars", async () => {
    const dir = makeTmpDir("vue");
    dirs.push(dir);
    write(
      dir,
      join("src", "App.vue"),
      `<script setup lang="ts">\n` +
        `const debugHex = "#000000"; // must NOT be extracted\n` +
        `</script>\n\n` +
        `<template><div class="card" /></template>\n\n` +
        `<style scoped>\n.card {\n  --card-bg: #101828;\n}\n</style>\n\n` +
        `<style lang="scss">\n.panel {\n  --panel-border: #334155;\n}\n</style>\n`,
    );

    const result = await extractTokens(dir);
    const hexes = result.colorTokens.map((t) => t.hex);
    expect(hexes).toContain("#101828"); // scoped block
    expect(hexes).toContain("#334155"); // lang=scss block
    expect(hexes).not.toContain("#000000"); // script-side ignored
    expect(result.cssFilesScanned.some((f) => f.endsWith("App.vue"))).toBe(true);
  });

  it("harvests Svelte style blocks", async () => {
    const dir = makeTmpDir("svelte");
    dirs.push(dir);
    write(
      dir,
      "src/App.svelte",
      "<script>\nlet x = '#123123';\n</script>\n\n<main>\n<h1>hi</h1>\n</main>\n\n<style>\nmain {\n  --page-pad: #22c55e;\n}\n</style>\n",
    );

    const result = await extractTokens(dir);
    const hexes = result.colorTokens.map((t) => t.hex);
    expect(hexes).toContain("#22c55e");
    expect(hexes).not.toContain("#123123");
  });

  it("detect flags Vue and Svelte projects from package.json", async () => {
    const { detectProject } = await import("./detect.js");
    const dir = makeTmpDir("detect");
    dirs.push(dir);
    write(
      dir,
      "package.json",
      JSON.stringify({
        dependencies: { vue: "^3.5.0" },
        devDependencies: { svelte: "^5.0.0" },
      }),
    );
    const d = detectProject(dir);
    expect(d.hasVue).toBe(true);
    expect(d.hasSvelte).toBe(true);
  });
});

describe("scanRepo customProperties (dashboard-facing)", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });
  it("aggregates custom props across css/scss/vue sources", async () => {
    const { scanRepo } = await import("../commands/repo-scanner.js");
    const dir = makeTmpDir("scanrepo");
    dirs.push(dir);
    write(dir, join("src", "tokens.css"), ":root {\n  --brand: #abcdef;\n}\n");
    write(dir, join("src", "App.vue"), "<style>\n.x {\n  --accent: #654321;\n}\n</style>\n");

    const report = await scanRepo(dir);
    expect(report.customProperties).toBeDefined();
    expect(report.customProperties!["#abcdef"]).toBe("var(--brand)");
    expect(report.customProperties!["#654321"]).toBe("var(--accent)");
  });
});
