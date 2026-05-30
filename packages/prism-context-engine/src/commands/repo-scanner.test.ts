import { describe, it, expect } from "vitest";
import {
  scanRepo,
  formatScanReport,
  type RepoScanReport,
} from "./repo-scanner.js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("scanRepo", () => {
  it("scans a simple directory structure", async () => {
    const tmp = join(tmpdir(), `prism-scan-test-${Date.now()}`);
    mkdirSync(join(tmp, "src", "components"), { recursive: true });
    mkdirSync(join(tmp, "src", "lib"), { recursive: true });

    writeFileSync(
      join(tmp, "src", "index.ts"),
      `import { foo } from "./lib/bar";\nconst x = 1;\n`,
    );
    writeFileSync(
      join(tmp, "src", "components", "Button.tsx"),
      `import React from "react";\nexport function Button() { return <button />; }`,
    );
    writeFileSync(
      join(tmp, "src", "lib", "utils.ts"),
      `export function formatDate(d: Date) { return d.toISOString(); }`,
    );
    writeFileSync(
      join(tmp, "package.json"),
      JSON.stringify({ name: "test", dependencies: { react: "^18" } }),
    );
    writeFileSync(
      join(tmp, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true } }),
    );

    const report = await scanRepo(tmp);

    expect(report.structure.fileCount).toBeGreaterThanOrEqual(2);
    expect(report.structure.dirCount).toBeGreaterThanOrEqual(2);
    expect(report.configs).toHaveProperty("package.json");
    expect(report.configs).toHaveProperty("tsconfig.json");
    expect(Object.keys(report.namingConventions.files).length).toBeGreaterThan(
      0,
    );
  });

  it("detects naming conventions", async () => {
    const tmp = join(tmpdir(), `prism-scan-naming-${Date.now()}`);
    mkdirSync(join(tmp, "src"), { recursive: true });

    writeFileSync(join(tmp, "src", "camelCaseFile.ts"), `const camelVar = 1;`);
    writeFileSync(
      join(tmp, "src", "PascalComponent.tsx"),
      `export const MyComponent = () => null;`,
    );
    writeFileSync(join(tmp, "src", "kebab-file.ts"), `const kebab_var = 1;`);

    const report = await scanRepo(tmp);

    expect(report.namingConventions.files.camelCase).toBeGreaterThanOrEqual(1);
    expect(report.namingConventions.files.PascalCase).toBeGreaterThanOrEqual(1);
  });

  it("detects import patterns", async () => {
    const tmp = join(tmpdir(), `prism-scan-imports-${Date.now()}`);
    mkdirSync(join(tmp, "src"), { recursive: true });

    writeFileSync(
      join(tmp, "src", "app.tsx"),
      [
        `import React from "react";`,
        `import { Button } from "./components/Button";`,
        `import { db } from "@repo/db";`,
        `import { foo } from "../../apps/other/bar";`,
      ].join("\n"),
    );

    const report = await scanRepo(tmp);

    expect(report.imports.external).toHaveProperty("react");
    expect(report.imports.internal).toHaveProperty("@repo/db");
    expect(report.imports.relative).toBeGreaterThanOrEqual(1);
  });

  it("returns summary string", async () => {
    const tmp = join(tmpdir(), `prism-scan-summary-${Date.now()}`);
    mkdirSync(join(tmp, "src"), { recursive: true });
    writeFileSync(join(tmp, "src", "index.ts"), `const x = 1;`);

    const report = await scanRepo(tmp);
    expect(report.summary).toContain("Scanned");
    expect(report.summary).toContain("files");
  });
});

describe("formatScanReport", () => {
  it("formats a report into markdown", () => {
    const report: RepoScanReport = {
      root: "/test",
      namingConventions: {
        files: { camelCase: 5, PascalCase: 3 },
        functions: {},
        components: {},
        variables: { camelCase: 10 },
      },
      imports: {
        relative: 20,
        absolute: 30,
        external: { react: 5 },
        internal: { "@repo/ui": 3 },
      },
      structure: {
        directories: ["src", "src/components"],
        fileCount: 15,
        dirCount: 5,
        languages: { ".ts": 10, ".tsx": 5 },
      },
      configs: { "package.json": { name: "test" } },
      summary: "Scanned 15 files",
    };

    const output = formatScanReport(report);
    expect(output).toContain("camelCase");
    expect(output).toContain("PascalCase");
    expect(output).toContain("react");
    expect(output).toContain("package.json");
    expect(output).toContain("15");
  });
});
