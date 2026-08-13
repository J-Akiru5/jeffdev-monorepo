import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";
import { generateChatCompletion } from "@/lib/ai-router";

interface RepoScanData {
  root?: string;
  namingConventions?: Record<string, Record<string, number>>;
  imports?: Record<string, unknown>;
  structure?: {
    directories?: string[];
    fileCount?: number;
    dirCount?: number;
    languages?: Record<string, number>;
  };
  configs?: Record<string, unknown>;
  summary?: string;
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  let body: { scan: RepoScanData };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  if (!body.scan || !body.scan.structure) {
    return errorResponse("Valid scan report with structure is required", 400);
  }

  try {
    const scan = body.scan;

    const naming = scan.namingConventions || {};
    const imports = scan.imports || {};
    const structure = scan.structure || {};
    const dirsSample = (structure.directories || []).slice(0, 30).join("\n");
    const topExt = Object.entries(
      (imports.external || {}) as Record<string, number>,
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);
    const configSummary = Object.entries(scan.configs || {})
      .map(([k, v]) => {
        if (k === "package.json" && typeof v === "object" && v !== null) {
          const pkg = (v || {}) as Record<string, unknown>;
          const deps = (pkg.dependencies || {}) as Record<string, string>;
          const devDeps = (pkg.devDependencies || {}) as Record<string, string>;
          return `${k}: name=${pkg.name || "?"}, deps=${Object.keys(deps).length + Object.keys(devDeps).length}`;
        }
        return k;
      })
      .join("\n");

    const formatMap = (m: Record<string, number> | undefined): string => {
      if (!m) return "none detected";
      const total = Object.values(m).reduce((a, b) => a + b, 0);
      if (total === 0) return "none detected";
      return Object.entries(m)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k} ${v} (${Math.round((v / total) * 100)}%)`)
        .join(", ");
    };

    const prompt = `You are a senior front-end architect. Analyze this repository scan report and generate 5-15 architectural governance rules as a JSON array.

## Naming Conventions
- Files: ${formatMap(naming.files as unknown as Record<string, number>)}
- Functions: ${formatMap(naming.functions as unknown as Record<string, number>)}
- Components: ${formatMap(naming.components as unknown as Record<string, number>)}
- Variables: ${formatMap(naming.variables as unknown as Record<string, number>)}

## Import Patterns
- Relative imports: ${(imports.relative as number) || 0}
- Absolute imports: ${(imports.absolute as number) || 0}
- Top external: ${topExt.map(([p, c]) => `${p} (${c})`).join(", ")}
- Internal packages: ${Object.entries(
      (imports.internal || {}) as Record<string, number>,
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([p, c]) => `${p} (${c})`)
      .join(", ")}

## Structure (${structure.fileCount || 0} files, ${structure.dirCount || 0} dirs)
${dirsSample || "(flat)"}

## Config Files
${configSummary || "None"}

Each rule object: { "name": "Title", "category": "architecture|styling|security|performance|testing|documentation|custom", "content": "Detailed rule...", "priority": 1-100, "tags": ["tag"], "pattern": "optional regex", "severity": "error|warning|info" }
Return ONLY the JSON array.`;

    const raw = await generateChatCompletion({
      systemPrompt: "Generate concise governance rules from repo scan data. Return only valid JSON.",
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 4000,
    });
    const cleaned = raw
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    let rules: Array<{
      name: string;
      category: string;
      content: string;
      priority: number;
      tags: string[];
      pattern?: string;
      severity?: string;
    }>;

    try {
      rules = JSON.parse(cleaned);
      if (!Array.isArray(rules)) throw new Error("Not an array");
    } catch {
      const arrMatch = cleaned.match(/\[[\s\S]*\]/);
      rules = arrMatch ? JSON.parse(arrMatch[0]) : [];
    }

    // Persist to database
    const db = getPrismDb();
    const now = new Date().toISOString();
    let created = 0;

    for (const r of rules) {
      if (!r.content) continue;
      const doc = {
        name: r.name || `Repo Rule ${created + 1}`,
        category: [
          "architecture",
          "styling",
          "security",
          "performance",
          "testing",
          "documentation",
          "custom",
        ].includes(r.category)
          ? r.category
          : "custom",
        content: r.content,
        priority:
          typeof r.priority === "number" && r.priority >= 1 && r.priority <= 100
            ? r.priority
            : 50,
        tags: Array.isArray(r.tags) ? r.tags : [],
        pattern: typeof r.pattern === "string" ? r.pattern : null,
        severity: ["error", "warning", "info"].includes(r.severity || "")
          ? r.severity
          : "warning",
        source: "repo",
        created_by: auth.userId,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      const { error } = await db.from("prism_rules").insert(doc);
      if (!error) created++;
    }

    return successResponse({
      rulesCreated: created,
      modelUsed: (process.env.AI_PROVIDER || "deepseek"),
    });
  } catch (error) {
    return errorResponse(
      `Rule extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      500,
    );
  }
}
