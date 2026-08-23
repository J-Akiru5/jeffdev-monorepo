import { describe, it, expect, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { detectProject } from "./detect.js";

function makeTmpDir(label: string): string {
  const dir = join(tmpdir(), `prism-detect-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("detectProject", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("reports nothing detected when there's no package.json", () => {
    const dir = makeTmpDir("no-pkg");
    dirs.push(dir);
    const result = detectProject(dir);
    expect(result.hasPackageJson).toBe(false);
    expect(result.isNextjs).toBe(false);
    expect(result.hasTailwind).toBe(false);
    expect(result.router).toBe("none");
  });

  it("degrades gracefully on malformed package.json instead of throwing", () => {
    const dir = makeTmpDir("bad-pkg");
    dirs.push(dir);
    writeFileSync(join(dir, "package.json"), "{ not valid json");
    expect(() => detectProject(dir)).not.toThrow();
    const result = detectProject(dir);
    expect(result.hasPackageJson).toBe(true);
    expect(result.isNextjs).toBe(false);
  });

  it("detects Next.js + app router + Tailwind from package.json and directory layout", () => {
    const dir = makeTmpDir("next-app");
    dirs.push(dir);
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({
        dependencies: { next: "^15.1.0" },
        devDependencies: { tailwindcss: "^3.4.1" },
      }),
    );
    mkdirSync(join(dir, "app"), { recursive: true });

    const result = detectProject(dir);
    expect(result.isNextjs).toBe(true);
    expect(result.nextVersion).toBe("^15.1.0");
    expect(result.router).toBe("app");
    expect(result.hasTailwind).toBe(true);
    expect(result.tailwindMajor).toBe(3);
  });

  it("detects the pages router under src/pages", () => {
    const dir = makeTmpDir("pages-router");
    dirs.push(dir);
    writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { next: "14.0.0" } }));
    mkdirSync(join(dir, "src", "pages"), { recursive: true });

    const result = detectProject(dir);
    expect(result.router).toBe("pages");
  });

  it("detects Tailwind v4 by major version", () => {
    const dir = makeTmpDir("tw4");
    dirs.push(dir);
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ devDependencies: { tailwindcss: "^4.0.0" } }),
    );
    const result = detectProject(dir);
    expect(result.tailwindMajor).toBe(4);
  });
});
