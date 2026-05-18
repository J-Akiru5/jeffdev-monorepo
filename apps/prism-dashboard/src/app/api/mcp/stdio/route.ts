import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { NextRequest, NextResponse } from "next/server";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";

/**
 * MCP Stdio Proxy API
 * 
 * Receives MCP JSON-RPC requests from prism-cli and processes them.
 * This is the server-side handler for the MCP protocol.
 * 
 * POST /api/mcp/stdio
 * Authorization: Bearer <clerk-token>
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

export async function POST(request: NextRequest): Promise<NextResponse<McpResponse>> {
  // 1. Authenticate
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32001, message: "Unauthorized" }
    }, { status: 401 });
  }

  // 2. Check tier
  const tier = await getUserTier(userId);
  if (!TIER_LIMITS[tier].ideSync) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32002, message: "Upgrade to Pro for IDE sync" }
    }, { status: 403 });
  }

  // 3. Parse MCP request
  let mcpRequest: McpRequest;
  try {
    mcpRequest = await request.json() as McpRequest;
  } catch {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" }
    }, { status: 400 });
  }

  // 4. Route MCP methods
  try {
    const result = await handleMcpMethod(mcpRequest.method, mcpRequest.params, userId);
    
    return NextResponse.json({
      jsonrpc: "2.0",
      id: mcpRequest.id,
      result
    });
  } catch (error) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: mcpRequest.id,
      error: { 
        code: -32603, 
        message: error instanceof Error ? error.message : "Internal error" 
      }
    }, { status: 500 });
  }
}

/**
 * Handle MCP method calls
 */
async function handleMcpMethod(
  method: string, 
  params: Record<string, unknown> | undefined,
  userId: string
): Promise<unknown> {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: {},
          prompts: {}
        },
        serverInfo: {
          name: "prism-context-engine",
          version: "1.0.0"
        }
      };

    case "tools/list":
      return {
        tools: [
          {
            name: "get_architectural_rules",
            description: "Fetch critical coding standards and design rules. Use BEFORE writing any code.",
            inputSchema: {
              type: "object",
              properties: {
                category: { type: "string", description: "Filter: architecture, styling, security, performance" },
                tag: { type: "string", description: "Filter by tag (e.g., 'design', 'validation')" }
              }
            }
          },
          {
            name: "validate_code_pattern",
            description: "Check if code follows the project's architectural rules",
            inputSchema: {
              type: "object",
              properties: {
                code: { type: "string", description: "Code snippet to validate" },
                context: { type: "string", description: "File or feature context" },
                category: { type: "string", description: "Filter rules by category" }
              },
              required: ["code"]
            }
          },
          {
            name: "search_video_transcript",
            description: "Semantic search across video transcripts",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "Project ID or slug" },
                query: { type: "string", description: "Search query" }
              },
              required: ["projectId", "query"]
            }
          },
          {
            name: "get_brand_rules",
            description: "Get brand styling rules for a project",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "Project ID or slug" }
              },
              required: ["projectId"]
            }
          },
          {
            name: "list_rules",
            description: "List all rules for a project",
            inputSchema: {
              type: "object",
              properties: {
                projectId: { type: "string", description: "Project ID or slug" }
              },
              required: ["projectId"]
            }
          },
          {
            name: "get_project_profile",
            description: "Auto-detect project metadata from repo structure",
            inputSchema: {
              type: "object",
              properties: {}
            }
          }
        ]
      };

    case "tools/call":
      return handleToolCall(params as { name: string; arguments: Record<string, unknown> }, userId);

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
  userId: string
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { name, arguments: args } = params;

  switch (name) {
    case "get_architectural_rules": {
      const rules = await getCollection("rules");
      const category = args?.category as string | undefined;
      const tag = args?.tag as string | undefined;

      const query: Record<string, unknown> = { userId, isActive: true };
      if (category) query.category = category;
      if (tag) query.tags = tag;

      const foundRules = await rules
        .find(query)
        .sort({ priority: 1 })
        .limit(5)
        .toArray();

      if (foundRules.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No matching rules found." }]
        };
      }

      const formatted = foundRules
        .map((r: Record<string, unknown>) => 
          `## ${r.name}\n\n**Priority:** ${r.priority} | **Category:** ${r.category}\n\n${r.content}`
        )
        .join("\n\n---\n\n");

      return {
        content: [{ type: "text" as const, text: `# Prism Architectural Rules\n\n${formatted}` }]
      };
    }

    case "validate_code_pattern": {
      const code = args?.code as string | undefined;
      const _context = args?.context as string | undefined;
      const vCategory = args?.category as string | undefined;

      if (!code) {
        return { content: [{ type: "text" as const, text: "No code provided." }], ...{ error: true } } as any;
      }

      const rulesDb = await getCollection("rules");
      const vQuery: Record<string, unknown> = {
        userId,
        isActive: true,
        pattern: { $exists: true, $ne: null }
      };
      if (vCategory) vQuery.category = vCategory;

      const patternRules = await rulesDb.find(vQuery).sort({ priority: 1 }).toArray();
      const violations: string[] = [];

      for (const rule of patternRules) {
        const pattern = rule.pattern as string | undefined;
        if (!pattern) continue;
        try {
          const regex = new RegExp(pattern, "gi");
          if (regex.test(code)) {
            const severity = rule.severity === "error" ? "❌" : rule.severity === "warning" ? "⚠️" : "ℹ️";
            violations.push(`${severity} **${rule.name}**: ${rule.content}`);
          }
        } catch { /* skip invalid regex */ }
      }

      if (violations.length === 0) {
        return { content: [{ type: "text" as const, text: "✅ No violations detected." }] };
      }

      return {
        content: [{ type: "text" as const, text: `# Code Validation Report\n\n${violations.join("\n\n")}` }]
      };
    }

    case "get_project_profile": {
      return {
        content: [{
          type: "text" as const,
          text: "Project profile detection is available via the CLI: run `prism init` to scan your repository."
        }]
      };
    }

    case "search_video_transcript": {
      const projectId = args.projectId as string;
      const query = args.query as string;
      
      const transcripts = await getCollection("videoTranscripts");
      const results = await transcripts.find({
        projectId,
        transcriptText: { $regex: query, $options: "i" }
      }).limit(5).toArray();

      return {
        content: [{
          type: "text",
          text: results.length > 0
            ? `Found ${results.length} matches:\n\n${results.map(r => 
                `- ${r.videoTitle || 'Video'}: ...${extractSnippet(r.transcriptText as string, query)}...`
              ).join('\n')}`
            : `No matches found for "${query}"`
        }]
      };
    }

    case "get_brand_rules": {
      const projectId = args.projectId as string;
      
      const brands = await getCollection("brands");
      const brand = await brands.findOne({ userId }) || await brands.findOne({ userId: "demo-user" });

      if (!brand) {
        return { content: [{ type: "text", text: "No brand configured" }] };
      }

      return {
        content: [{
          type: "text",
          text: `# ${brand.companyName} Brand Rules\n\n` +
            `## Colors\n- Primary: ${brand.colors?.primary}\n- Accent: ${brand.colors?.accent}\n\n` +
            `## Typography\n- Headings: ${brand.typography?.headingFont}\n- Body: ${brand.typography?.bodyFont}\n\n` +
            `## Voice\n- Personality: ${brand.voice?.personality}\n- Formality: ${brand.voice?.formality}`
        }]
      };
    }

    case "list_rules": {
      const rules = await getCollection("rules");
      const userRules = await rules.find({ userId }).limit(20).toArray();
      const demoRules = await rules.find({ userId: "demo-user" }).limit(5).toArray();
      const allRules = [...userRules, ...demoRules];

      return {
        content: [{
          type: "text",
          text: allRules.length > 0
            ? `# Your Prism Rules\n\n${allRules.map(r => 
                `## ${r.name}\n${r.content?.slice(0, 200)}...`
              ).join('\n\n')}`
            : "No rules found. Create rules in the Prism dashboard."
        }]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Extract snippet around search match
 */
function extractSnippet(text: string, query: string): string {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text.slice(0, 100);
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + query.length + 30);
  return text.slice(start, end);
}

/**
 * Get user tier
 */
async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const subs = await getCollection("subscriptions");
    const sub = await subs.findOne({ userId, status: { $in: ["active", "trialing"] } });
    return (sub?.tier as SubscriptionTier) || "free";
  } catch {
    return "free";
  }
}
