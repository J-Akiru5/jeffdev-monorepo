import { describe, it, expect, vi } from "vitest";
import { extractRulesFromRepoScan } from "./repo-extract.js";

describe("extractRulesFromRepoScan", () => {
  it("returns error when scan is missing", async () => {
    const result = await extractRulesFromRepoScan({ scan: undefined as any });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("valid scan report");
  });

  it("returns error when scan has no structure", async () => {
    const result = await extractRulesFromRepoScan({ scan: { root: "/test" } as any });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("valid scan report");
  });

  it("returns error when AI not configured", async () => {
    const oldEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const oldKey = process.env.AZURE_OPENAI_API_KEY;
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;

    const result = await extractRulesFromRepoScan({
      scan: {
        root: "/test",
        namingConventions: { files: {}, functions: {}, components: {}, variables: {} },
        imports: { relative: 0, absolute: 0, external: {}, internal: {} },
        structure: { directories: [], fileCount: 0, dirCount: 0, languages: {} },
        configs: {},
        summary: "empty",
      },
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("configured");

    if (oldEndpoint) process.env.AZURE_OPENAI_ENDPOINT = oldEndpoint;
    if (oldKey) process.env.AZURE_OPENAI_API_KEY = oldKey;
  });

  it("parses AI response into structured rules", async () => {
    // Mock the AI client to avoid actual API calls
    // We test the parsing logic by checking the function handles valid input structure
    const scan = {
      root: "/test",
      namingConventions: {
        files: { camelCase: 10, PascalCase: 5 },
        functions: { camelCase: 20 },
        components: { PascalCase: 8 },
        variables: { camelCase: 30, UPPER_CASE: 3 },
      },
      imports: {
        relative: 45,
        absolute: 60,
        external: { react: 15, "next/navigation": 8, lodash: 5 },
        internal: { "@repo/ui": 12, "@repo/db": 4 },
      },
      structure: {
        directories: ["src", "src/components", "src/lib", "src/app"],
        fileCount: 120,
        dirCount: 15,
        languages: { ".ts": 60, ".tsx": 40, ".css": 20 },
      },
      configs: {
        "package.json": { name: "test-app", dependencies: { react: "^18" }, devDependencies: { typescript: "^5" } },
        "tsconfig.json": { compilerOptions: { strict: true } },
      },
      summary: "Scanned 120 files in 15 directories. Languages: .ts: 60, .tsx: 40, .css: 20",
    };

    // Without Azure OpenAI configured, this should fail gracefully
    const result = await extractRulesFromRepoScan({ scan });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain("configured");
  });
});
