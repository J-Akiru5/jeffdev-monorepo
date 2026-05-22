import { generateContent } from "../lib/ai-router.js";

const CHAT_MODEL = process.env.GEMINI_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gemini-3.5-flash";

export interface RepoScanData {
  root: string;
  namingConventions: {
    files: Record<string, number>;
    functions: Record<string, number>;
    components: Record<string, number>;
    variables: Record<string, number>;
  };
  imports: {
    relative: number;
    absolute: number;
    external: Record<string, number>;
    internal: Record<string, number>;
  };
  structure: {
    directories: string[];
    fileCount: number;
    dirCount: number;
    languages: Record<string, number>;
  };
  configs: Record<string, unknown>;
  summary: string;
}

export interface RepoExtractInput {
  scan: RepoScanData;
  model?: string;
}

export interface ExtractedRule {
  name: string;
  category: string;
  content: string;
  priority: number;
  tags: string[];
  source: "repo";
  pattern?: string;
  severity?: "error" | "warning" | "info";
}

export async function extractRulesFromRepoScan(input: RepoExtractInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}> {
  const { scan, model } = input;

  if (!scan || !scan.structure) {
    return { content: [{ type: "text", text: "Error: valid scan report is required." }], isError: true };
  }

  try {
    const deploymentName = model || CHAT_MODEL;

    const dirsSample = scan.structure.directories.slice(0, 30).join("\n");
    const topExt = Object.entries(scan.imports.external).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const topInt = Object.entries(scan.imports.internal).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const configSummary = Object.entries(scan.configs).map(([k, v]) => {
      if (k === "package.json" && typeof v === "object" && v !== null) {
        const pkg = v as Record<string, unknown>;
        return `${k}: name=${pkg.name || "?"}, deps=${Object.keys((pkg.dependencies as Record<string, string>) || {}).length + Object.keys((pkg.devDependencies as Record<string, string>) || {}).length}`;
      }
      return k;
    }).join("\n");

    const prompt = `You are a senior front-end architect. Analyze this repository scan report and generate 5-15 architectural governance rules.

## Naming Conventions
- Files: ${formatMap(scan.namingConventions.files)}
- Functions: ${formatMap(scan.namingConventions.functions)}
- Components: ${formatMap(scan.namingConventions.components)}
- Variables: ${formatMap(scan.namingConventions.variables)}

## Import Patterns
- Relative imports: ${scan.imports.relative}
- Absolute imports: ${scan.imports.absolute}
- Top external packages: ${topExt.map(([p, c]) => `${p} (${c})`).join(", ")}
- Internal packages: ${topInt.map(([p, c]) => `${p} (${c})`).join(", ")}

## Project Structure (${scan.structure.fileCount} files, ${scan.structure.dirCount} dirs)
${dirsSample || "(flat structure)"}

## Config Files
${configSummary || "None detected"}

## Summary
${scan.summary}

---

Generate rules as a JSON array. Each rule object:
{
  "name": "Short title",
  "category": "architecture|styling|security|performance|testing|documentation|custom",
  "content": "Detailed rule description with specific values from the scan",
  "priority": 1-100 (1=highest),
  "tags": ["relevant", "tags"],
  "pattern": "optional regex pattern for automated checking",
  "severity": "error|warning|info"
}

Cover these areas:
1. Naming conventions (based on detected patterns)
2. Import style (relative vs alias, barrel files, etc.)
3. Component organization
4. Code style based on config files
5. Any architecture patterns inferred from the structure

Return ONLY the JSON array, no markdown or explanation.`;

    const raw = (await generateContent(
      "You are a senior front-end architect. Generate concise, enforceable governance rules from repo scan data. Return only valid JSON.",
      prompt,
    )) || "[]";
    const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();

    let rules: ExtractedRule[];
    try {
      rules = JSON.parse(cleaned);
      if (!Array.isArray(rules)) throw new Error("Not an array");
    } catch {
      // Fallback: try to extract JSON array from the response
      const arrMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        rules = JSON.parse(arrMatch[0]);
      } else {
        rules = [];
      }
    }

    // Normalize rules
    rules = rules.map((r, i) => ({
      name: r.name || `Repo Rule ${i + 1}`,
      category: ["architecture", "styling", "security", "performance", "testing", "documentation", "custom"].includes(r.category) ? r.category : "custom",
      content: r.content || "",
      priority: typeof r.priority === "number" && r.priority >= 1 && r.priority <= 100 ? r.priority : 50,
      tags: Array.isArray(r.tags) ? r.tags : [],
      source: "repo" as const,
      pattern: typeof r.pattern === "string" ? r.pattern : undefined,
      severity: ["error", "warning", "info"].includes(r.severity || "") ? r.severity as "error" | "warning" | "info" : "warning",
    })).filter((r) => r.content.length > 0);

    return {
      content: [{ type: "text", text: JSON.stringify({ rules, rulesCount: rules.length, modelUsed: deploymentName }) }],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error generating rules from scan: ${error instanceof Error ? error.message : "Unknown error"}` }],
      isError: true,
    };
  }
}

function formatMap(map: Record<string, number>): string {
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  if (total === 0) return "none detected";
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v} (${Math.round((v / total) * 100)}%)`).join(", ");
}
