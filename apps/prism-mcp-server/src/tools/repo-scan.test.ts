import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  detectCurrentProject,
  scanCurrentRepo,
  formatScanReport,
  type RepoScanReport,
} from "./repo-scan.js";

let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `prism-scan-test-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe("detectCurrentProject", () => {
  it("returns unknown framework when no package.json", () => {
    const info = detectCurrentProject(testDir);
    expect(info.framework).toBe("unknown");
    expect(info.name).toBeTruthy();
    expect(info.stack).toEqual([]);
  });

  it("detects Next.js project", () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        name: "my-app",
        description: "Test app",
        dependencies: { next: "16.0.0", react: "19.0.0" },
        devDependencies: { typescript: "5.9.0", tailwindcss: "4.0.0" },
      }),
    );

    const info = detectCurrentProject(testDir);
    expect(info.name).toBe("my-app");
    expect(info.description).toBe("Test app");
    expect(info.framework).toBe("nextjs");
    expect(info.stack).toContain("Next.js");
    expect(info.stack).toContain("React");
    expect(info.stack).toContain("TypeScript");
    expect(info.stack).toContain("Tailwind CSS");
  });

  it("detects React project", () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "19.0.0" },
      }),
    );

    const info = detectCurrentProject(testDir);
    expect(info.framework).toBe("react");
  });

  it("detects Express project", () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        dependencies: { express: "4.18.0" },
      }),
    );

    const info = detectCurrentProject(testDir);
    expect(info.framework).toBe("express");
  });

  it("detects Vite project", () => {
    writeFileSync(
      join(testDir, "package.json"),
      JSON.stringify({
        devDependencies: { vite: "5.0.0" },
      }),
    );

    const info = detectCurrentProject(testDir);
    expect(info.framework).toBe("vite");
  });

  it("adds TypeScript from tsconfig.json even without dep", () => {
    writeFileSync(join(testDir, "tsconfig.json"), "{}");

    const info = detectCurrentProject(testDir);
    expect(info.stack).toContain("TypeScript");
  });

  it("handles unreadable package.json gracefully", () => {
    writeFileSync(join(testDir, "package.json"), "not-json");

    const info = detectCurrentProject(testDir);
    expect(info.framework).toBe("unknown");
  });
});

describe("scanCurrentRepo", () => {
  it("scans a project with source files", async () => {
    mkdirSync(join(testDir, "src"), { recursive: true });
    writeFileSync(
      join(testDir, "src/index.ts"),
      `import React from "react";
import { Button } from "./components/Button";
export function App() { return <div>Hello</div>; }
const config = { debug: true };
`,
    );
    writeFileSync(
      join(testDir, "src/utils.ts"),
      `export function formatDate(d: Date): string { return d.toISOString(); }
export const MAX_RETRIES = 3;
`,
    );
    writeFileSync(join(testDir, "package.json"), "{}");

    const report = await scanCurrentRepo(testDir);

    expect(report.root).toBe(testDir);
    expect(report.structure.fileCount).toBeGreaterThanOrEqual(2);
    expect(report.structure.languages[".ts"]).toBeGreaterThanOrEqual(2);
    expect(report.namingConventions.files["camelCase"]).toBeGreaterThanOrEqual(1);
    expect(report.imports.relative).toBeGreaterThanOrEqual(1);
    expect(report.imports.external).toHaveProperty("react");
    expect(report.summary).toBeTruthy();
  });

  it("skips node_modules and dist directories", () => {
    mkdirSync(join(testDir, "node_modules/pkg"), { recursive: true });
    mkdirSync(join(testDir, "dist"), { recursive: true });
    writeFileSync(join(testDir, "node_modules/pkg/index.ts"), "export {};");
    writeFileSync(join(testDir, "dist/index.js"), "module.exports = {};");

    return scanCurrentRepo(testDir).then((report) => {
      expect(report.structure.dirCount).toBe(0);
    });
  });

  it("reads config files", () => {
    writeFileSync(
      join(testDir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true } }),
    );

    return scanCurrentRepo(testDir).then((report) => {
      expect(report.configs).toHaveProperty("tsconfig.json");
    });
  });

  it("respects depth limit", () => {
    // Create deeply nested dirs
    let dir = testDir;
    for (let i = 0; i < 10; i++) {
      dir = join(dir, `level${i}`);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "file.ts"), "export {};");
    }

    return scanCurrentRepo(testDir).then((report) => {
      // Should not crash, files at depth > 8 are skipped
      expect(report.structure.fileCount).toBeGreaterThan(0);
    });
  });
});

describe("formatScanReport", () => {
  it("formats a report with data", () => {
    const report: RepoScanReport = {
      root: "/test",
      namingConventions: {
        files: { "kebab-case": 10, PascalCase: 5 },
        functions: { camelCase: 15 },
        components: { PascalCase: 8 },
        variables: { camelCase: 20, UPPER_CASE: 3 },
      },
      imports: {
        relative: 30,
        absolute: 15,
        external: { react: 5, next: 3 },
        internal: { "@repo/ui": 4 },
      },
      structure: {
        directories: ["src", "components"],
        fileCount: 15,
        dirCount: 2,
        languages: { ".ts": 10, ".tsx": 5 },
      },
      configs: { "tsconfig.json": {} },
      summary: "Test summary",
    };

    const formatted = formatScanReport(report);

    expect(formatted).toContain("# Repo Scan Report");
    expect(formatted).toContain("/test");
    expect(formatted).toContain("kebab-case");
    expect(formatted).toContain("react");
    expect(formatted).toContain("@repo/ui");
    expect(formatted).toContain("tsconfig.json");
  });

  it("handles empty report", () => {
    const report: RepoScanReport = {
      root: "/empty",
      namingConventions: { files: {}, functions: {}, components: {}, variables: {} },
      imports: { relative: 0, absolute: 0, external: {}, internal: {} },
      structure: { directories: [], fileCount: 0, dirCount: 0, languages: {} },
      configs: {},
      summary: "",
    };

    const formatted = formatScanReport(report);

    expect(formatted).toContain("none detected");
    expect(formatted).toContain("None found");
  });
});
