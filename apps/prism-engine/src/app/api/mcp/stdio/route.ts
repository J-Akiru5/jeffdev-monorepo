import { createClient } from "@/lib/supabase/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { TIER_LIMITS, getUserTier } from "@/lib/subscriptions";
import {
  claimAiGeneration,
  refundAiGeneration,
} from "@/lib/usage";
import type { RuleDoc, BrandDoc } from "@/lib/types";

/**
 * MCP Stdio Proxy API
 *
 * Receives MCP JSON-RPC requests from prism-cli and processes them.
 * This is the server-side handler for the MCP protocol.
 *
 * POST /api/mcp/stdio
 * Authorization: Bearer <supabase-session-token>
 * Body: JSON-RPC request
 */

interface McpRequest {
  jsonrpc: string;
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse {
  jsonrpc: string;
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<McpResponse>> {
  // 1. Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32001, message: "Unauthorized" },
      },
      { status: 401 },
    );
  }

  const userId = user.id;

  // 2. Check tier
  const tier = await getUserTier(userId);
  if (!TIER_LIMITS[tier].ideSync) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32002, message: "Upgrade to Pro for IDE sync" },
      },
      { status: 403 },
    );
  }

  // 3. Parse MCP request
  let mcpRequest: McpRequest;
  try {
    mcpRequest = (await request.json()) as McpRequest;
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      },
      { status: 400 },
    );
  }

  // 4. Route MCP methods
  try {
    const result = await handleMcpMethod(
      mcpRequest.method,
      mcpRequest.params,
      userId,
    );

    const response = NextResponse.json({
      jsonrpc: "2.0",
      id: mcpRequest.id,
      result,
    });

    if (typeof result === "object" && result && "content" in result) {
      const text = (result as { content: Array<{ text: string }> }).content
        .map((c: { text: string }) => c.text)
        .join("\n");
      const approxTokens = Math.ceil(text.length / 4);
      response.headers.set("X-Token-Count", String(approxTokens));
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: mcpRequest.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal error",
        },
      },
      { status: 500 },
    );
  }
}

/**
 * Handle MCP method calls
 */
async function handleMcpMethod(
  method: string,
  params: Record<string, unknown> | undefined,
  userId: string,
): Promise<unknown> {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        serverInfo: {
          name: "prism-context-engine",
          version: "1.0.0",
        },
      };

    case "tools/list":
      return {
        tools: [
          {
            name: "get_architectural_rules",
            description:
              "Fetch critical coding standards and design rules. Provide a 'task' for semantic ranking.",
            inputSchema: {
              type: "object",
              properties: {
                task: {
                  type: "string",
                  description:
                    "Describe what you're coding (e.g. 'build a button'). Used for semantic rule ranking.",
                },
                maxTokens: {
                  type: "number",
                  description: "Max tokens for response (default: 4000)",
                },
                projectId: {
                  type: "string",
                  description: "Project ID to scope rules",
                },
                format: {
                  type: "string",
                  enum: ["markdown", "json"],
                  description: "Response format",
                },
                category: {
                  type: "string",
                  description:
                    "Filter: architecture, styling, security, performance",
                },
                tag: {
                  type: "string",
                  description: "Filter by tag (e.g., 'design', 'validation')",
                },
              },
            },
          },
          {
            name: "validate_code_pattern",
            description:
              "Check if code follows the project's architectural rules",
            inputSchema: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Code snippet to validate",
                },
                context: {
                  type: "string",
                  description: "File or feature context",
                },
                category: {
                  type: "string",
                  description: "Filter rules by category",
                },
              },
              required: ["code"],
            },
          },
          {
            name: "get_brand_rules",
            description: "Get brand styling rules for a project",
            inputSchema: {
              type: "object",
              properties: {
                projectId: {
                  type: "string",
                  description: "Project ID or slug",
                },
              },
              required: ["projectId"],
            },
          },
          {
            name: "list_rules",
            description: "List all rules for a project",
            inputSchema: {
              type: "object",
              properties: {
                projectId: {
                  type: "string",
                  description: "Project ID or slug",
                },
              },
              required: ["projectId"],
            },
          },
          {
            name: "get_project_profile",
            description: "Auto-detect project metadata from repo structure",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "list_projects",
            description: "List all projects for the authenticated user",
            inputSchema: {
              type: "object",
              properties: {
                stack: {
                  type: "string",
                  description: "Filter by stack (react, nextjs, react-native)",
                },
                designSystem: {
                  type: "string",
                  description: "Filter by design system",
                },
              },
            },
          },
          {
            name: "create_rule",
            description: "Create a new rule",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string", description: "Rule name" },
                category: {
                  type: "string",
                  description:
                    "Category: architecture, styling, security, performance, testing, documentation, custom",
                },
                content: {
                  type: "string",
                  description: "Rule content/markdown",
                },
                priority: { type: "number", description: "Priority 1-100" },
                projectId: {
                  type: "string",
                  description: "Project ID (optional)",
                },
              },
              required: ["name", "category", "content"],
            },
          },
          {
            name: "update_rule",
            description: "Update an existing rule",
            inputSchema: {
              type: "object",
              properties: {
                ruleId: { type: "string", description: "Rule ID" },
                content: { type: "string", description: "New content" },
                name: { type: "string", description: "New name" },
                category: { type: "string", description: "New category" },
              },
              required: ["ruleId"],
            },
          },
          {
            name: "delete_rule",
            description: "Delete a rule",
            inputSchema: {
              type: "object",
              properties: {
                ruleId: { type: "string", description: "Rule ID to delete" },
              },
              required: ["ruleId"],
            },
          },
          {
            name: "get_brand_profile",
            description:
              "Get full brand profile including colors, typography, and voice",
            inputSchema: {
              type: "object",
              properties: {
                brandId: {
                  type: "string",
                  description:
                    "Brand ID or slug (optional, returns first brand if omitted)",
                },
              },
            },
          },
          {
            name: "generate_component",
            description: "Generate UI component code with AI",
            inputSchema: {
              type: "object",
              properties: {
                prompt: {
                  type: "string",
                  description: "Component description",
                },
                designSystem: {
                  type: "string",
                  description:
                    "Design system: jdstudio, bare-minimum, glassmorphic, 8bit-nostalgia",
                },
                stack: {
                  type: "string",
                  description: "Tech stack: react, nextjs, react-native",
                },
              },
              required: ["prompt"],
            },
          },
          {
            name: "search_marketplace",
            description: "Search the public rule marketplace",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" },
              },
            },
          },
          {
            name: "get_usage_stats",
            description: "Get current usage stats and tier limits",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "get_skill",
            description:
              "Fetch full skill content by ID (procedural guide with code examples)",
            inputSchema: {
              type: "object",
              properties: {
                skillId: { type: "string", description: "Skill ID or name" },
              },
              required: ["skillId"],
            },
          },
          {
            name: "prism_check",
            description:
              "Validate code against pattern-based governance rules. Returns structured violations with line/column positions.",
            inputSchema: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "The source code to validate",
                },
                ruleIds: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional specific rule IDs",
                },
                projectId: {
                  type: "string",
                  description: "Optional project ID",
                },
                filePath: { type: "string", description: "Optional file path" },
                category: {
                  type: "string",
                  description: "Optional category filter",
                },
              },
              required: ["code"],
            },
          },
          {
            name: "validate_code",
            description:
              "Alias for prism_check. Validates code against pattern-based governance rules.",
            inputSchema: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "The source code to validate",
                },
                ruleIds: {
                  type: "array",
                  items: { type: "string" },
                  description: "Optional specific rule IDs",
                },
                projectId: {
                  type: "string",
                  description: "Optional project ID",
                },
                filePath: { type: "string", description: "Optional file path" },
                category: {
                  type: "string",
                  description: "Optional category filter",
                },
              },
              required: ["code"],
            },
          },
          {
            name: "prism_fix",
            description:
              "Apply an automatic fix for a code violation found by prism_check.",
            inputSchema: {
              type: "object",
              properties: {
                violation: {
                  type: "object",
                  description: "The violation object from prism_check",
                  properties: {
                    ruleId: { type: "string" },
                    ruleName: { type: "string" },
                    line: { type: "number" },
                    column: { type: "number" },
                    matchedText: { type: "string" },
                  },
                  required: ["ruleId", "ruleName", "matchedText"],
                },
                code: {
                  type: "string",
                  description: "The original source code",
                },
              },
              required: ["violation", "code"],
            },
          },
        ],
      };

    case "tools/call":
      return handleToolCall(
        params as { name: string; arguments: Record<string, unknown> },
        userId,
      );

    case "resources/list":
      return { resources: [] };

    case "prompts/list":
      return { prompts: [] };

    default:
      throw new Error(`Unknown method: ${method}`);
  }
}

/**
 * Handle tool calls
 */
async function handleToolCall(
  params: { name: string; arguments: Record<string, unknown> },
  userId: string,
): Promise<{
  content: Array<{ type: "text"; text: string }>;
  error?: boolean;
}> {
  const { name, arguments: args } = params;

  switch (name) {
    case "get_architectural_rules": {
      const db = getPrismDb();
      const category = typeof args?.category === 'string' ? args.category : undefined;
      const tag = typeof args?.tag === 'string' ? args.tag : undefined;
      const task = typeof args?.task === 'string' ? args.task : undefined;
      const projectId = typeof args?.projectId === 'string' ? args.projectId : undefined;
      const maxTokens = Number(args?.maxTokens) || 4000;
      const format = args?.format === "markdown" || args?.format === "json" ? args.format : "markdown";

      let ruleQuery = db
        .from("prism_rules")
        .select(
          "_id:id, name, content, priority, category, tags, skillsContent:skills_content, updatedAt:updated_at",
        )
        .eq("created_by", userId)
        .eq("is_active", true);
      if (category) ruleQuery = ruleQuery.eq("category", category);
      if (tag) ruleQuery = ruleQuery.contains("tags", [tag]);
      if (projectId) ruleQuery = ruleQuery.eq("project_id", projectId);

      const { data: foundRulesData } = await ruleQuery.order("priority", {
        ascending: true,
      });
      const foundRules = (foundRulesData ?? []) as unknown as RuleDoc[];

      if (foundRules.length === 0) {
        return {
          content: [
            { type: "text" as const, text: "No matching rules found." },
          ],
        };
      }

      // If no task, fall back to priority sort
      if (!task) {
        const top5 = foundRules.slice(0, 5);
        const formatted = top5
          .map(
            (r) =>
              `## ${r.name}\n\n**Priority:** ${r.priority} | **Category:** ${r.category}\n\n${r.content}`,
          )
          .join("\n\n---\n\n");
        return {
          content: [
            {
              type: "text" as const,
              text: `# Prism Architectural Rules\n\n${formatted}`,
            },
          ],
        };
      }

      // Simple priority-aware truncation for task requests
      const high = foundRules.filter((r) => r.priority <= 3);
      const medium = foundRules.filter((r) => {
        const p = r.priority;
        return p > 3 && p <= 7;
      });
      const low = foundRules.filter(
        (r) => r.priority > 7 || r.priority === undefined,
      );
      const mid = high.slice();
      let budget = maxTokens;

      function countTokens(text: string): number {
        return Math.ceil(text.length / 4);
      }

      for (const r of [...high, ...medium, ...low]) {
        const tok = countTokens(r.content || "");
        if (mid.length < 5 && budget - tok > 0) {
          budget -= tok;
          mid.push(r);
        }
      }

      const formatted = mid
        .map(
          (r) =>
            `## ${r.name}\n\n**Priority:** ${r.priority} | **Category:** ${r.category}\n\n${r.content}`,
        )
        .join("\n\n---\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text:
              format === "json"
                ? JSON.stringify({
                    rules: mid.map((r) => ({
                      id: r._id,
                      name: r.name,
                      priority: r.priority,
                      category: r.category,
                      content: r.content,
                    })),
                    meta: {
                      task,
                      tokenCount: mid.reduce(
                        (s, r) => s + countTokens(r.content || ""),
                        0,
                      ),
                    },
                  })
                : `# Prism Architectural Rules\n\n**Task:** "${task}"\n\n${formatted}`,
          },
        ],
      };
    }

    case "validate_code_pattern": {
      const code = typeof args?.code === 'string' ? args.code : undefined;
      const vCategory = typeof args?.category === 'string' ? args.category : undefined;

      if (!code) {
        return {
          content: [{ type: "text" as const, text: "No code provided." }],
          error: true,
        };
      }

      const db = getPrismDb();
      let vQuery = db
        .from("prism_rules")
        .select("name, content, priority, category, pattern, severity")
        .eq("created_by", userId)
        .eq("is_active", true)
        .not("pattern", "is", null);
      if (vCategory) vQuery = vQuery.eq("category", vCategory);

      const { data: patternRulesData } = await vQuery.order("priority", {
        ascending: true,
      });
      const patternRules = (patternRulesData ?? []) as unknown as RuleDoc[];

      const violations: string[] = [];

      for (const rule of patternRules) {
        const pattern = rule.pattern;
        if (!pattern) continue;
        try {
          const regex = new RegExp(pattern, "gi");
          if (regex.test(code)) {
            const severity =
              rule.severity === "error"
                ? "❌"
                : rule.severity === "warning"
                  ? "⚠️"
                  : "ℹ️";
            violations.push(`${severity} **${rule.name}**: ${rule.content}`);
          }
        } catch {
          /* skip invalid regex */
        }
      }

      if (violations.length === 0) {
        return {
          content: [
            { type: "text" as const, text: "✅ No violations detected." },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `# Code Validation Report\n\n${violations.join("\n\n")}`,
          },
        ],
      };
    }

    case "prism_check":
    case "validate_code": {
      const checkCode = typeof args?.code === 'string' ? args.code : undefined;
      if (!checkCode) {
        return {
          content: [{ type: "text", text: "Error: code is required." }],
        };
      }

      const db = getPrismDb();
      let vQuery = db
        .from("prism_rules")
        .select("_id:id, name, content, priority, category, pattern, severity")
        .eq("created_by", userId)
        .eq("is_active", true)
        .not("pattern", "is", null);
      const ruleIds = Array.isArray(args?.ruleIds) ? args.ruleIds as unknown as string[] : undefined;
      if (ruleIds && ruleIds.length > 0) {
        vQuery = vQuery.in(
          "id",
          ruleIds.filter((id) => isValidId(id)),
        );
      }
      if (args?.projectId) vQuery = vQuery.eq("project_id", args.projectId as string);
      if (args?.category) vQuery = vQuery.eq("category", args.category as string);

      const { data: patternRulesData } = await vQuery.order("priority", {
        ascending: true,
      });
      const patternRules = (patternRulesData ?? []) as unknown as RuleDoc[];

      function findLineColumn(
        text: string,
        idx: number,
      ): { line: number; column: number } {
        const before = text.slice(0, idx);
        const lines = before.split("\n");
        return {
          line: lines.length,
          column: (lines[lines.length - 1] ?? "").length + 1,
        };
      }

      const violations: Array<{
        ruleId: string;
        ruleName: string;
        pattern: string;
        message: string;
        severity: string;
        line: number;
        column: number;
        endLine: number;
        endColumn: number;
        matchedText: string;
        suggestion: string;
      }> = [];

      for (const rule of patternRules) {
        const pattern = rule.pattern;
        if (!pattern) continue;
        try {
          const regex = new RegExp(pattern, "g");
          let match: RegExpExecArray | null;
          while ((match = regex.exec(checkCode)) !== null) {
            const matchedText = match[0];
            const startPos = match.index;
            const endPos = startPos + matchedText.length;
            const start = findLineColumn(checkCode, startPos);
            const end = findLineColumn(checkCode, endPos);
            violations.push({
              ruleId: rule._id.toString(),
              ruleName: rule.name,
              pattern,
              message: rule.content,
              severity: rule.severity || "warning",
              line: start.line,
              column: start.column,
              endLine: end.line,
              endColumn: end.column,
              matchedText,
              suggestion: `Fix for "${rule.name}": ${(rule.content || "").replace(/\*\*/g, "").trim()}`,
            });
          }
        } catch {
          /* skip invalid regex */
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: violations.length === 0 ? "pass" : "fail",
              violations,
              checkedRules: patternRules.length,
            }),
          },
        ],
      };
    }

    case "prism_fix": {
      const violation =
        typeof args?.violation === "object" && args?.violation !== null
          ? (args.violation as Record<string, unknown>)
          : undefined;
      const fixCode = typeof args?.code === "string" ? args.code : undefined;
      if (!violation || !fixCode) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                correctedCode: fixCode || "",
                appliedRule: "",
                confidence: 0,
                changes: [],
              }),
            },
          ],
        };
      }

      const matchedText = typeof violation.matchedText === "string" ? violation.matchedText : "";
      const ruleName = typeof violation.ruleName === "string" ? violation.ruleName : "";
      const pattern = typeof violation.pattern === "string" ? violation.pattern : "";
      const violationLine = typeof violation.line === "number" ? violation.line : 0;
      const violationMessage = typeof violation.message === "string" ? violation.message : "";

      let correctedCode = fixCode;
      let confidence = 0;
      const changes: Array<{ line: number; from: string; to: string }> = [];

      if (pattern.includes("../../apps/") || pattern.includes("../apps/")) {
        const parts = matchedText.split("../../apps/");
        if (parts.length >= 2) {
          const appName = parts[1]!.split("/")[0]!;
          const fixed = matchedText.replace(
            `../../apps/${appName}`,
            `@repo/${appName}`,
          );
          correctedCode = fixCode.replace(matchedText, fixed);
          confidence = 0.95;
          changes.push({
            line: violationLine,
            from: matchedText,
            to: fixed,
          });
        }
      } else if (
        pattern.includes("style={") ||
        violationMessage.toLowerCase().includes("inline style")
      ) {
        const replacement = ` {/* TODO: Replace with Tailwind classes */}`;
        const fixed = matchedText.replace(/style=\{[\s\S]*?\}/, replacement);
        if (fixed !== matchedText) {
          correctedCode = fixCode.replace(matchedText, fixed);
          confidence = 0.6;
          changes.push({
            line: violationLine,
            from: matchedText,
            to: fixed,
          });
        }
      } else if (
        pattern.includes("console.log") ||
        violationMessage.toLowerCase().includes("console.log")
      ) {
        const logRegex = /console\.(log|debug|info)\([^)]*\);?\s*/g;
        let count = 0;
        correctedCode = fixCode.replace(logRegex, (m) => {
          count++;
          return `// ${m.trim()}`;
        });
        confidence = count > 0 ? 0.9 : 0;
        if (count > 0)
          changes.push({
            line: violationLine,
            from: matchedText,
            to: `// ${matchedText}`,
          });
      } else {
        // Generic: comment the line
        const codeLines = fixCode.split("\n");
        const targetLine = violationLine - 1;
        if (targetLine >= 0 && targetLine < codeLines.length) {
          const original = codeLines[targetLine]!;
          codeLines[targetLine] = `${original} // FIXME: ${ruleName}`;
          correctedCode = codeLines.join("\n");
          confidence = 0.3;
          changes.push({
            line: violationLine,
            from: original,
            to: codeLines[targetLine] ?? original,
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              correctedCode,
              appliedRule: ruleName,
              confidence,
              changes,
            }),
          },
        ],
      };
    }

    case "get_project_profile": {
      return {
        content: [
          {
            type: "text" as const,
            text: "Project profile detection is available via the CLI: run `prism init` to scan your repository.",
          },
        ],
      };
    }

    case "get_brand_rules": {
      const db = getPrismDb();
      const { data: brand } = await db
        .from("prism_brands")
        .select(
          "companyName:company_name, colors, typography, voice",
        )
        .eq("user_id", userId)
        .maybeSingle<BrandDoc>();

      if (!brand) {
        return { content: [{ type: "text", text: "No brand configured" }] };
      }

      return {
        content: [
          {
            type: "text",
            text:
              `# ${brand.companyName} Brand Rules\n\n` +
              `## Colors\n- Primary: ${brand.colors.primary}\n- Accent: ${brand.colors.accent}\n\n` +
              `## Typography\n- Headings: ${brand.typography.headingFont}\n- Body: ${brand.typography.bodyFont}\n\n` +
              `## Voice\n- Personality: ${brand.voice.personality}\n- Formality: ${brand.voice.formality}`,
          },
        ],
      };
    }

    case "list_rules": {
      const db = getPrismDb();
      const { data: userRules } = await db
        .from("prism_rules")
        .select("name, content")
        .eq("created_by", userId)
        .limit(20);
      // "demo-user" is a legacy Cosmos-era sentinel, not a real UUID — it never
      // matches a real created_by value in Postgres, so this degrades to [].
      const demoRules: { name: string; content: string }[] = [];
      const allRules = [...(userRules ?? []), ...demoRules];

      return {
        content: [
          {
            type: "text",
            text:
              allRules.length > 0
                ? `# Your Prism Rules\n\n${allRules
                    .map((r) => `## ${r.name}\n${r.content?.slice(0, 200)}...`)
                    .join("\n\n")}`
                : "No rules found. Create rules in the Prism dashboard.",
          },
        ],
      };
    }

    case "list_projects": {
      const db = getPrismDb();
      let projectQuery = db
        .from("prism_projects")
        .select("name, slug, stack, designSystem:design_system")
        .eq("user_id", userId);
      if (args?.stack) projectQuery = projectQuery.eq("stack", args.stack as string);
      if (args?.designSystem)
        projectQuery = projectQuery.eq("design_system", args.designSystem as string);

      const { data: itemsData } = await projectQuery
        .order("created_at", { ascending: false })
        .limit(20);
      const items = itemsData ?? [];

      return {
        content: [
          {
            type: "text",
            text:
              items.length > 0
                ? `# Your Projects\n\n${items
                    .map(
                      (p) =>
                        `- **${p.name}** (${p.slug}) — Stack: ${p.stack}, Design: ${p.designSystem}`,
                    )
                    .join("\n")}`
                : "No projects found.",
          },
        ],
      };
    }

    case "create_rule": {
      const name = typeof args?.name === 'string' ? args.name : '';
      const category = typeof args?.category === 'string' ? args.category : 'custom';
      const content = typeof args?.content === 'string' ? args.content : '';
      const priority = typeof args?.priority === 'number' ? args.priority : 50;
      const projectId = typeof args?.projectId === 'string' ? args.projectId : undefined;

      if (!name || !content) {
        return {
          content: [
            { type: "text", text: "Error: name and content are required" },
          ],
        };
      }

      const db = getPrismDb();

      // Ownership guard: only attach to a project the caller owns.
      if (projectId) {
        const { data: project } = await db
          .from("prism_projects")
          .select("id")
          .eq("id", projectId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!project) {
          return {
            content: [
              { type: "text", text: "Error: project not found or not owned by you" },
            ],
            error: true,
          };
        }
      }

      const { data: inserted, error: insertError } = await db
        .from("prism_rules")
        .insert({
          name,
          category,
          content,
          priority,
          project_id: projectId || null,
          created_by: userId,
          is_active: true,
        })
        .select("id")
        .single();
      if (insertError || !inserted) {
        return {
          content: [{ type: "text", text: `Error creating rule: ${insertError?.message ?? "unknown error"}` }],
          error: true,
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Rule "${name}" created successfully (ID: ${inserted.id})`,
          },
        ],
      };
    }

    case "update_rule": {
      const ruleId = typeof args?.ruleId === 'string' ? args.ruleId : '';
      if (!ruleId)
        return {
          content: [{ type: "text", text: "Error: ruleId is required" }],
        };

      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (typeof args?.name === 'string') updates.name = args.name;
      if (typeof args?.category === 'string') updates.category = args.category;
      if (typeof args?.content === 'string') updates.content = args.content;

      if (!isValidId(ruleId)) {
        return {
          content: [{ type: "text", text: "Rule not found or unauthorized." }],
        };
      }

      const db = getPrismDb();
      const { data: updated } = await db
        .from("prism_rules")
        .update(updates)
        .eq("id", ruleId)
        .eq("created_by", userId)
        .select("id");

      if (!updated || updated.length === 0) {
        return {
          content: [{ type: "text", text: "Rule not found or unauthorized." }],
        };
      }
      return {
        content: [{ type: "text", text: "Rule updated successfully." }],
      };
    }

    case "delete_rule": {
      const ruleId = typeof args?.ruleId === 'string' ? args.ruleId : '';
      if (!ruleId)
        return {
          content: [{ type: "text", text: "Error: ruleId is required" }],
        };

      if (!isValidId(ruleId)) {
        return {
          content: [{ type: "text", text: "Rule not found or unauthorized." }],
        };
      }

      const db = getPrismDb();
      const { data: deleted } = await db
        .from("prism_rules")
        .delete()
        .eq("id", ruleId)
        .eq("created_by", userId)
        .select("id");

      if (!deleted || deleted.length === 0) {
        return {
          content: [{ type: "text", text: "Rule not found or unauthorized." }],
        };
      }
      return {
        content: [{ type: "text", text: "Rule deleted successfully." }],
      };
    }

    case "get_brand_profile": {
      const db = getPrismDb();
      const brandSelect =
        "companyName:company_name, tagline, industry, colors, typography, voice";
      const brandId = typeof args?.brandId === 'string' ? args.brandId : undefined;
      let brand: BrandDoc | null = null;
      if (brandId) {
        const { data: bySlug } = await db
          .from("prism_brands")
          .select(brandSelect)
          .eq("user_id", userId)
          .eq("slug", brandId)
          .maybeSingle<BrandDoc>();
        brand = bySlug;
        if (!brand && isValidId(brandId)) {
          const { data: byId } = await db
            .from("prism_brands")
            .select(brandSelect)
            .eq("user_id", userId)
            .eq("id", brandId)
            .maybeSingle<BrandDoc>();
          brand = byId;
        }
      } else {
        const { data } = await db
          .from("prism_brands")
          .select(brandSelect)
          .eq("user_id", userId)
          .maybeSingle<BrandDoc>();
        brand = data;
      }

      if (!brand) {
        return { content: [{ type: "text", text: "No brand profile found." }] };
      }

      return {
        content: [
          {
            type: "text",
            text:
              `# ${brand.companyName} Brand Profile\n\n` +
              `## Identity\n- Industry: ${brand.industry}\n${brand.tagline ? `- Tagline: ${brand.tagline}\n` : ""}` +
              `## Colors\n${Object.entries(brand.colors || {})
                .map(([k, v]) => `- ${k}: ${v}`)
                .join("\n")}\n\n` +
              `## Typography\n- Headings: ${brand.typography?.headingFont}\n- Body: ${brand.typography?.bodyFont}\n- Scale: ${brand.typography?.scale}\n\n` +
              `## Voice\n- Personality: ${brand.voice?.personality}\n- Formality: ${brand.voice?.formality}\n- Keywords: ${(brand.voice?.keywords || []).join(", ")}`,
          },
        ],
      };
    }

    case "generate_component": {
      const prompt = typeof args?.prompt === 'string' ? args.prompt : '';
      if (!prompt)
        return {
          content: [{ type: "text", text: "Error: prompt is required" }],
        };

      // AI spend guard: this tool bypasses /api/generate's monthly quota, so
      // hold it to a strict per-minute burst ceiling (solidity scan §1.3).
      const aiRl = await checkRateLimit(`ai:mcp-generate:${userId}`, "strict");
      if (!aiRl.allowed) {
        return {
          content: [
            { type: "text", text: "Rate limit exceeded: max 10 component generations per minute." },
          ],
          error: true,
        };
      }

      // Monthly quota — claim before work, refund on failure, same contract
      // as /api/generate so MCP generations count against the same plan cap.
      const userTier = await getUserTier(userId);
      const claimed = await claimAiGeneration(userId);
      if (
        TIER_LIMITS[userTier].aiGenerations !== -1 &&
        claimed !== null &&
        claimed > TIER_LIMITS[userTier].aiGenerations
      ) {
        await refundAiGeneration(userId);
        return {
          content: [
            { type: "text", text: "Monthly AI generation limit reached. Upgrade your plan for more." },
          ],
          error: true,
        };
      }

      try {
        const { generateComponent } = await import("@/lib/gemini");
        const component = await generateComponent({
          prompt,
          designSystem:
            (args?.designSystem as
              | "jdstudio"
              | "bare-minimum"
              | "glassmorphic"
              | "8bit-nostalgia") || "jdstudio",
          stack: (args?.stack as "react" | "nextjs" | "react-native") || "nextjs",
        });

        return {
          content: [
            {
              type: "text",
              text: `# Generated Component\n\n\`\`\`tsx\n${component.code}\n\`\`\`${component.explanation ? `\n\n## Explanation\n${component.explanation}` : ""}`,
            },
          ],
        };
      } catch (genError) {
        // Refund: failed generations must not consume quota.
        await refundAiGeneration(userId);
        throw genError;
      }
    }

    case "search_marketplace": {
      const query = typeof args?.query === 'string' ? args.query : '';
      const db = getPrismDb();
      let mQuery = db
        .from("prism_rule_sets")
        .select("name, description, ruleIds:rule_ids")
        .eq("is_public", true);
      if (query) mQuery = mQuery.ilike("name", `%${query}%`);

      const { data: itemsData } = await mQuery
        .order("created_at", { ascending: false })
        .limit(10);
      const items = itemsData ?? [];

      return {
        content: [
          {
            type: "text",
            text:
              items.length > 0
                ? `# Marketplace Results\n\n${items
                    .map(
                      (rs) =>
                        `- **${rs.name}** (${rs.ruleIds?.length || 0} rules)\n  ${rs.description || ""}`,
                    )
                    .join("\n\n")}`
                : `No marketplace results for "${query || "all"}"`,
          },
        ],
      };
    }

    case "get_usage_stats": {
      try {
        const db = getPrismDb();
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const countOpts = { count: "exact" as const, head: true };

        const [
          { count: projects },
          { count: rules },
          { count: components },
          { count: gens },
        ] = await Promise.all([
          db.from("prism_projects").select("id", countOpts).eq("user_id", userId),
          db.from("prism_rules").select("id", countOpts).eq("created_by", userId),
          db.from("prism_components").select("id", countOpts).eq("user_id", userId),
          db
            .from("prism_generations")
            .select("id", countOpts)
            .eq("user_id", userId)
            .gte("created_at", monthStart.toISOString()),
        ]);

        const userTier = await getUserTier(userId);

        return {
          content: [
            {
              type: "text",
              text:
                `# Prism Usage Stats\n\n` +
                `- Projects: ${projects}\n` +
                `- Rules: ${rules}\n` +
                `- Components: ${components}\n` +
                `- AI Generations (this month): ${gens}\n` +
                `- Plan: ${userTier.toUpperCase()}`,
            },
          ],
        };
      } catch {
        void 0;
      }
      return {
        content: [{ type: "text", text: "Unable to fetch usage stats." }],
      };
    }

    case "get_skill": {
      const skillId = typeof args?.skillId === 'string' ? args.skillId : '';
      if (!skillId) {
        return {
          content: [{ type: "text", text: "Error: skillId is required." }],
          error: true,
        };
      }

      try {
        const db = getPrismDb();
        const ruleSelect = "name, content, skillsContent:skills_content";
        let doc: { name: string; content: string; skillsContent: string | null } | null = null;

        if (isValidId(skillId)) {
          const { data } = await db
            .from("prism_rules")
            .select(ruleSelect)
            .eq("id", skillId)
            .maybeSingle();
          doc = data;
        }
        if (!doc) {
          const { data } = await db
            .from("prism_rules")
            .select(ruleSelect)
            .eq("name", skillId)
            .maybeSingle();
          doc = data;
        }
        if (!doc) {
          const { data } = await db
            .from("prism_rules")
            .select(ruleSelect)
            .not("skills_content", "is", null)
            .ilike("name", `%${skillId}%`)
            .limit(1)
            .maybeSingle();
          doc = data;
        }

        if (!doc) {
          return {
            content: [{ type: "text", text: `Skill "${skillId}" not found.` }],
          };
        }

        const skillContent =
          typeof doc.skillsContent === 'string' ? doc.skillsContent : (typeof doc.content === 'string' ? doc.content : '');
        return {
          content: [
            { type: "text" as const, text: `# ${doc.name}\n\n${skillContent}` },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${e instanceof Error ? e.message : "Unknown"}`,
            },
          ],
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
