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
          },
          {
            name: "list_projects",
            description: "List all projects for the authenticated user",
            inputSchema: {
              type: "object",
              properties: {
                stack: { type: "string", description: "Filter by stack (react, nextjs, react-native)" },
                designSystem: { type: "string", description: "Filter by design system" }
              }
            }
          },
          {
            name: "create_rule",
            description: "Create a new rule",
            inputSchema: {
              type: "object",
              properties: {
                name: { type: "string", description: "Rule name" },
                category: { type: "string", description: "Category: architecture, styling, security, performance, testing, documentation, custom" },
                content: { type: "string", description: "Rule content/markdown" },
                priority: { type: "number", description: "Priority 1-100" },
                projectId: { type: "string", description: "Project ID (optional)" }
              },
              required: ["name", "category", "content"]
            }
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
                category: { type: "string", description: "New category" }
              },
              required: ["ruleId"]
            }
          },
          {
            name: "delete_rule",
            description: "Delete a rule",
            inputSchema: {
              type: "object",
              properties: {
                ruleId: { type: "string", description: "Rule ID to delete" }
              },
              required: ["ruleId"]
            }
          },
          {
            name: "get_brand_profile",
            description: "Get full brand profile including colors, typography, and voice",
            inputSchema: {
              type: "object",
              properties: {
                brandId: { type: "string", description: "Brand ID or slug (optional, returns first brand if omitted)" }
              }
            }
          },
          {
            name: "generate_component",
            description: "Generate UI component code with AI",
            inputSchema: {
              type: "object",
              properties: {
                prompt: { type: "string", description: "Component description" },
                designSystem: { type: "string", description: "Design system: jdstudio, bare-minimum, glassmorphic, 8bit-nostalgia" },
                stack: { type: "string", description: "Tech stack: react, nextjs, react-native" }
              },
              required: ["prompt"]
            }
          },
          {
            name: "search_marketplace",
            description: "Search the public rule marketplace",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search query" }
              }
            }
          },
          {
            name: "get_usage_stats",
            description: "Get current usage stats and tier limits",
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

    case "list_projects": {
      const projects = await getCollection("projects");
      const query: Record<string, unknown> = { userId };
      if (args?.stack) query.stack = args.stack;
      if (args?.designSystem) query.designSystem = args.designSystem;

      const items = await projects.find(query).sort({ createdAt: -1 }).limit(20).toArray();

      return {
        content: [{
          type: "text",
          text: items.length > 0
            ? `# Your Projects\n\n${items.map(p => 
                `- **${p.name}** (${p.slug}) — Stack: ${p.stack}, Design: ${p.designSystem}`
              ).join('\n')}`
            : "No projects found."
        }]
      };
    }

    case "create_rule": {
      const name = args?.name as string;
      const category = args?.category as string || 'custom';
      const content = args?.content as string;
      const priority = (args?.priority as number) || 50;
      const projectId = args?.projectId as string | undefined;

      if (!name || !content) {
        return { content: [{ type: "text", text: "Error: name and content are required" }] };
      }

      const rules = await getCollection("rules");
      const now = new Date().toISOString();
      const doc = {
        name,
        category,
        content,
        priority,
        projectId: projectId || null,
        userId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      const result = await rules.insertOne(doc);
      return {
        content: [{ type: "text", text: `Rule "${name}" created successfully (ID: ${result.insertedId})` }]
      };
    }

    case "update_rule": {
      const ruleId = args?.ruleId as string;
      if (!ruleId) return { content: [{ type: "text", text: "Error: ruleId is required" }] };

      const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (args?.name) updates.name = args.name;
      if (args?.category) updates.category = args.category;
      if (args?.content) updates.content = args.content;

      const rules = await getCollection("rules");
      const { ObjectId } = await import("mongodb");
      const result = await rules.updateOne(
        { _id: new ObjectId(ruleId), userId },
        { $set: updates }
      );

      if (result.matchedCount === 0) {
        return { content: [{ type: "text", text: "Rule not found or unauthorized." }] };
      }
      return { content: [{ type: "text", text: "Rule updated successfully." }] };
    }

    case "delete_rule": {
      const ruleId = args?.ruleId as string;
      if (!ruleId) return { content: [{ type: "text", text: "Error: ruleId is required" }] };

      const rules = await getCollection("rules");
      const { ObjectId } = await import("mongodb");
      const result = await rules.deleteOne({ _id: new ObjectId(ruleId), userId });

      if (result.deletedCount === 0) {
        return { content: [{ type: "text", text: "Rule not found or unauthorized." }] };
      }
      return { content: [{ type: "text", text: "Rule deleted successfully." }] };
    }

    case "get_brand_profile": {
      const brands = await getCollection("brands");
      const brandId = args?.brandId as string | undefined;
      const query: Record<string, unknown> = { userId };
      let brand: Record<string, unknown> | null = null;
      if (brandId) {
        brand = await brands.findOne({ ...query, slug: brandId }) as Record<string, unknown> | null;
        if (!brand) {
          try { const { ObjectId } = await import("mongodb"); if (ObjectId.isValid(brandId)) brand = await brands.findOne({ ...query, _id: new ObjectId(brandId) }) as Record<string, unknown> | null; } catch { /* skip */ }
        }
      } else {
        brand = await brands.findOne(query) as Record<string, unknown> | null;
      }

      if (!brand) {
        return { content: [{ type: "text", text: "No brand profile found." }] };
      }

      return {
        content: [{
          type: "text",
          text: `# ${brand.companyName} Brand Profile\n\n` +
            `## Identity\n- Industry: ${brand.industry}\n${brand.tagline ? `- Tagline: ${brand.tagline}\n` : ''}` +
            `## Colors\n${Object.entries(brand.colors || {}).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n` +
            `## Typography\n- Headings: ${brand.typography?.headingFont}\n- Body: ${brand.typography?.bodyFont}\n- Scale: ${brand.typography?.scale}\n\n` +
            `## Voice\n- Personality: ${brand.voice?.personality}\n- Formality: ${brand.voice?.formality}\n- Keywords: ${(brand.voice?.keywords || []).join(', ')}`
        }]
      };
    }

    case "generate_component": {
      const prompt = args?.prompt as string;
      if (!prompt) return { content: [{ type: "text", text: "Error: prompt is required" }] };

      const { generateComponent } = await import("@/lib/gemini");
      const component = await generateComponent({
        prompt,
        designSystem: (args?.designSystem as string) || "jdstudio",
        stack: (args?.stack as string) || "nextjs",
      });

      return {
        content: [{
          type: "text",
          text: `# Generated Component\n\n\`\`\`tsx\n${component.code}\n\`\`\`${component.explanation ? `\n\n## Explanation\n${component.explanation}` : ''}`
        }]
      };
    }

    case "search_marketplace": {
      const query = args?.query as string;
      const ruleSets = await getCollection("ruleSets");
      const mQuery: Record<string, unknown> = { isPublic: true };
      if (query) mQuery.name = { $regex: query, $options: "i" } as any;

      const items = await ruleSets.find(mQuery).sort({ createdAt: -1 }).limit(10).toArray();

      return {
        content: [{
          type: "text",
          text: items.length > 0
            ? `# Marketplace Results\n\n${items.map(rs => 
                `- **${rs.name}** (${rs.rules?.length || 0} rules)\n  ${rs.description || ''}`
              ).join('\n\n')}`
            : `No marketplace results for "${query || 'all'}"`
        }]
      };
    }

    case "get_usage_stats": {
      try {
        const expiration = await getCollection("generations");
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [projects, rules, components, gens] = await Promise.all([
          getCollection("projects").then(c => c.countDocuments({ userId })),
          getCollection("rules").then(c => c.countDocuments({ userId })),
          getCollection("components").then(c => c.countDocuments({ userId })),
          expiration.countDocuments({ userId, createdAt: { $gte: monthStart.toISOString() } }),
        ]);

        const userTier = await getUserTier(userId);

        return {
          content: [{
            type: "text",
            text: `# Prism Usage Stats\n\n` +
              `- Projects: ${projects}\n` +
              `- Rules: ${rules}\n` +
              `- Components: ${components}\n` +
              `- AI Generations (this month): ${gens}\n` +
              `- Plan: ${userTier.toUpperCase()}`
          }]
        };
      } catch { void 0; }
      return { content: [{ type: "text", text: "Unable to fetch usage stats." }] };
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
