#!/usr/bin/env node
/**
 * @module prism-mcp-server
 * @description Prism Context Engine MCP Server - Context Governance for LLMs
 *
 * This server implements the Model Context Protocol (MCP) to provide
 * architectural rules and context to AI coding assistants. It connects
 * to Azure Cosmos DB (MongoDB API) to fetch real rules.
 *
 * @example
 * # Build and run
 * npm run build && node dist/index.js
 */

// Stdout safety: redirect any stray console.log to stderr to prevent
// corrupting the MCP JSON-RPC protocol stream on stdout.
// Skip in test environment to preserve console.log for test output.
if (process.env.NODE_ENV !== "test") {
  console.log = (...args: unknown[]) => {
    console.error("[prism-mcp-server] console.log intercepted:", ...args);
  };
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ObjectId, type Document } from "@syntaxure-labs/db/cosmos";
import { getCollection, closeConnection } from "@syntaxure-labs/db/cosmos";
import { handlePrismScan } from "./tools/prism-scan.js";
import { handleGetSkill } from "./tools/get-skill.js";
import { handleListSkills } from "./tools/list-skills.js";
import { handlePrismCheck } from "./tools/prism-check.js";
import { handlePrismFix } from "./tools/prism-fix.js";
import { extractRulesFromRepoScan } from "./tools/repo-extract.js";
import { handleKitchenAnalyze, handleKitchenPreview } from "./tools/prism-kitchen.js";
import { handlePrismIntercept } from "./tools/prism-intercept.js";
import { handlePrismCompile } from "./tools/prism-compile.js";
import { handlePrismOrchestrate } from "./tools/prism-orchestrate.js";
import { handlePrismMemory } from "./tools/prism-memory.js";
import { handlePrismDrip } from "./tools/prism-drip.js";
import {
  detectCurrentProject,
  scanCurrentRepo,
  formatScanReport,
} from "./tools/repo-scan.js";
import {
  trackToolResponse,
  logTelemetryEvent,
} from "./middleware/token-counter.js";
import {
  rankRulesByTask,
  formatRulesResponse,
  type RuleDoc,
} from "./middleware/smart-select.js";
import { getCached, setCached, getCacheKey } from "./middleware/cache.js";
import {
  setCurrentClient,
  getCurrentClient,
} from "./middleware/client-detector.js";
import {
  resolveFormat,
  resolveMaxTokens,
} from "./middleware/platform-formatter.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SERVER_NAME = "prism-context-engine";
const SERVER_VERSION = "1.0.0";

// API Key Authentication
const PRISM_API_KEY = process.env.PRISM_API_KEY;
const PRISM_API_URL =
  process.env.PRISM_API_URL || "https://prism.jeffdev.studio";

// Cached auth state
let authenticatedUserId: string | null = null;
let authenticatedTier: string = "free";

// Current project detection (from caller's working directory)
let currentProject: ReturnType<typeof detectCurrentProject> | null = null;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
// (Video transcript search utilities removed - will be re-implemented in Phase 3 with Azure OpenAI)

// =============================================================================
// API KEY AUTHENTICATION
// =============================================================================

interface AuthResponse {
  valid: boolean;
  userId?: string;
  tier?: string;
  error?: string;
  upgradeUrl?: string;
}

async function validateApiKey(): Promise<void> {
  // If no API key provided, skip authentication (for local dev)
  if (!PRISM_API_KEY) {
    console.error(
      `[${SERVER_NAME}] No PRISM_API_KEY set. Running in unauthenticated mode.`,
    );
    console.error(
      `[${SERVER_NAME}] Set PRISM_API_KEY to enable subscription-based access.`,
    );
    return;
  }

  try {
    console.error(`[${SERVER_NAME}] Validating API key...`);

    const response = await fetch(`${PRISM_API_URL}/api/api-keys/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: PRISM_API_KEY }),
    });

    const data = (await response.json()) as AuthResponse;

    if (!data.valid) {
      console.error(
        `[${SERVER_NAME}] API key validation failed: ${data.error}`,
      );
      if (data.upgradeUrl) {
        console.error(
          `[${SERVER_NAME}] Upgrade your plan at: ${PRISM_API_URL}${data.upgradeUrl}`,
        );
      }
      console.error(`[${SERVER_NAME}] Continuing in unauthenticated mode.`);
      return;
    }

    authenticatedUserId = data.userId || null;
    authenticatedTier = data.tier || "free";

    console.error(
      `[${SERVER_NAME}] ✅ Authenticated as user: ${authenticatedUserId} (${authenticatedTier} tier)`,
    );
  } catch (error) {
    console.error(
      `[${SERVER_NAME}] ⚠️ Could not validate API key:`,
      error instanceof Error ? error.message : error,
    );
    console.error(`[${SERVER_NAME}] Continuing in unauthenticated mode.`);
  }
}

// =============================================================================
// DATABASE CONNECTION (via @syntaxure-labs/db singleton)
// =============================================================================

let _rulesCollection: Awaited<ReturnType<typeof getCollection>> | null = null;

/**
 * Get the rules collection from the shared DB connection.
 * Cached after first successful fetch to avoid repeated singleton resolution.
 * @syntaxure-labs/db manages the singleton MongoClient with reconnection.
 */
async function getRulesCollection() {
  if (_rulesCollection) return _rulesCollection;
  _rulesCollection = await getCollection("rules");
  return _rulesCollection;
}

// =============================================================================
// MCP SERVER
// =============================================================================

const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

// =============================================================================
// CLIENT DETECTION: Intercept initialize to capture IDE/client info
// =============================================================================

server.setRequestHandler(InitializeRequestSchema, async (request) => {
  const clientInfo = request.params?.clientInfo as
    | { name: string; version: string }
    | undefined;
  if (clientInfo) {
    setCurrentClient(clientInfo);
    console.error(
      `[${SERVER_NAME}] Client detected: ${clientInfo.name} v${clientInfo.version} (${getCurrentClient().platform})`,
    );
  }

  const projectMeta = currentProject
    ? {
        detectedProject: {
          root: currentProject.root,
          name: currentProject.name,
          framework: currentProject.framework,
          stack: currentProject.stack,
          description: currentProject.description,
        },
      }
    : {};

  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      resources: {},
      tools: {},
    },
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      ...projectMeta,
    },
  };
});

// =============================================================================
// RESOURCES: List all Rules
// =============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  try {
    const rules = await getRulesCollection();
    const allRules = await rules
      .find({ isPublic: true })
      .project({ name: 1, tags: 1, category: 1 })
      .toArray();

    return {
      resources: allRules.map((r: Document) => ({
        uri: `prism://rules/${r._id.toString()}`,
        name: r.name,
        mimeType: "text/markdown",
        description: `[${r.category}] Tags: ${(r.tags || []).join(", ")}`,
      })),
    };
  } catch (error) {
    console.error(`[${SERVER_NAME}] ListResources error:`, error);
    return { resources: [] };
  }
});

// =============================================================================
// RESOURCES: Read a Specific Rule
// =============================================================================

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const id = uri.replace("prism://rules/", "");

  try {
    const rules = await getRulesCollection();

    let rule;
    try {
      rule = await rules.findOne({ _id: new ObjectId(id) });
    } catch {
      rule = await rules.findOne({ name: id });
    }

    if (!rule) {
      throw new Error(`Rule "${id}" not found`);
    }

    const markdown = `# ${rule.name}

**Category:** ${rule.category}  
**Priority:** ${rule.priority}  
**Tags:** ${(rule.tags || []).join(", ")}

---

${rule.content}
`;

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "text/markdown",
          text: markdown,
        },
      ],
    };
  } catch (error) {
    console.error(`[${SERVER_NAME}] ReadResource error for "${id}":`, error);
    throw error;
  }
});

// =============================================================================
// TOOLS: List Available Tools
// =============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_architectural_rules",
        description:
          "Fetch the critical coding standards and design rules from the Prism Context Engine. " +
          "Use this BEFORE writing any code to understand the project's constraints. " +
          "Provide a 'task' description to get relevance-ranked rules via semantic search.",
        inputSchema: {
          type: "object" as const,
          properties: {
            task: {
              type: "string",
              description:
                "Describe what you're about to code (e.g., 'build a button component'). " +
                "Used for semantic ranking — only relevant rules are returned.",
            },
            maxTokens: {
              type: "number",
              description: "Maximum tokens for the response (default: 4000)",
              default: 4000,
            },
            projectId: {
              type: "string",
              description:
                "Optional project ID to scope rules to a specific project",
            },
            format: {
              type: "string",
              description:
                "Response format: 'markdown' (default, human-readable) or 'json' (compact machine-readable)",
              enum: ["markdown", "json"],
            },
            category: {
              type: "string",
              description:
                "Optional filter by category: architecture, styling, security, performance",
            },
            tag: {
              type: "string",
              description:
                "Optional filter by tag (e.g., 'design', 'monorepo', 'validation')",
            },
          },
          required: ["task"],
        },
      },
      {
        name: "validate_code_pattern",
        description:
          "Check if a code pattern follows the project's architectural rules. " +
          "Matches code against regex patterns stored in the rules database.",
        inputSchema: {
          type: "object" as const,
          properties: {
            code: {
              type: "string",
              description: "The code snippet to validate",
            },
            context: {
              type: "string",
              description: "What file or feature this code is for",
            },
            category: {
              type: "string",
              description:
                "Filter rules by category (architecture, styling, security, etc.)",
            },
          },
          required: ["code"],
        },
      },
      {
        name: "prism_scan",
        description:
          "Scan a live website URL using Playwright to extract design tokens (CSS variables, colors, typography, spacing, component patterns) " +
          "and auto-generate governance rules and skill guides. Use this to bootstrap a project's rule set from an existing site.",
        inputSchema: {
          type: "object" as const,
          properties: {
            url: {
              type: "string",
              description: "The URL to scan (localhost or public)",
            },
            maxPages: {
              type: "number",
              description: "Maximum pages to scan (default: 5)",
              default: 5,
            },
            depth: {
              type: "number",
              description: "Link traversal depth (default: 2)",
              default: 2,
            },
            projectId: {
              type: "string",
              description:
                "Optional Prism project ID to sync results to Cosmos DB",
            },
            model: {
              type: "string",
              description:
                "Optional model override (gpt-4o-mini | gemini-flash-lite)",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "get_skill",
        description:
          "Fetch the full content of a skill (procedural guide with code examples) by its ID. " +
          "Skills are referenced in get_architectural_rules responses as metadata only — call this to load the full content on demand.",
        inputSchema: {
          type: "object" as const,
          properties: {
            skillId: {
              type: "string",
              description: "The skill ID or name to fetch",
            },
            projectId: {
              type: "string",
              description: "Optional project ID to scope the skill lookup",
            },
          },
          required: ["skillId"],
        },
      },
      {
        name: "list_skills",
        description:
          "List all available procedural skills for a project. Returns skill IDs, names, categories, and descriptions. " +
          "Use this to discover what workflows the AI has been taught, then use get_skill to read the full steps.",
        inputSchema: {
          type: "object" as const,
          properties: {
            projectId: {
              type: "string",
              description: "The project ID to list skills for",
            },
          },
          required: ["projectId"],
        },
      },
      {
        name: "prism_check",
        description:
          "Validate code against pattern-based governance rules. Returns structured violations with line/column positions. " +
          "Use this to check if code follows project rules before committing.",
        inputSchema: {
          type: "object" as const,
          properties: {
            code: {
              type: "string",
              description: "The source code to validate",
            },
            ruleIds: {
              type: "array" as const,
              items: { type: "string" },
              description:
                "Optional: specific rule IDs to check against (checks all pattern rules if omitted)",
            },
            projectId: {
              type: "string",
              description: "Optional project ID to scope rules",
            },
            filePath: {
              type: "string",
              description: "Optional file path for context in diagnostics",
            },
            category: {
              type: "string",
              description: "Optional filter by rule category",
            },
          },
          required: ["code"],
        },
      },
      {
        name: "prism_fix",
        description:
          "Apply an automatic fix for a code violation found by prism_check. " +
          "Takes a violation object and the original code, returns corrected code. " +
          "Supports: cross-app imports → @repo alias, inline styles → Tailwind placeholder, console.log → comment. " +
          "For other patterns, adds a FIXME comment at the violation line.",
        inputSchema: {
          type: "object" as const,
          properties: {
            violation: {
              type: "object" as const,
              description: "The violation object from prism_check response",
              properties: {
                ruleId: { type: "string" },
                ruleName: { type: "string" },
                pattern: { type: "string" },
                message: { type: "string" },
                severity: { type: "string" },
                line: { type: "number" },
                column: { type: "number" },
                endLine: { type: "number" },
                endColumn: { type: "number" },
                matchedText: { type: "string" },
                suggestion: { type: "string" },
              },
              required: ["ruleId", "ruleName", "line", "column", "matchedText"],
            },
            code: {
              type: "string",
              description: "The original source code containing the violation",
            },
          },
          required: ["violation", "code"],
        },
      },
      {
        name: "repo_extract",
        description:
          "Analyze a repository scan report and generate architectural governance rules using AI. " +
          "Takes the output of a repo scan (naming conventions, import patterns, config files, structure) " +
          "and produces 5-15 rules with category, priority, tags, and optional regex patterns.",
        inputSchema: {
          type: "object" as const,
          properties: {
            scan: {
              type: "object" as const,
              description: "The repo scan report from prism sync --repo",
              properties: {
                root: { type: "string" },
                namingConventions: { type: "object" },
                imports: { type: "object" },
                structure: { type: "object" },
                configs: { type: "object" },
                summary: { type: "string" },
              },
            },
            model: {
              type: "string",
              description:
                "Optional model override (gpt-4o-mini | gemini-flash-lite)",
            },
          },
          required: ["scan"],
        },
      },
      {
        name: "repo_scan",
        description:
          "Scan the current working directory (the caller's project) to detect project metadata, " +
          "naming conventions, import patterns, config files, and directory structure. " +
          "Returns a structured report that can be fed into repo_extract for AI rule generation. " +
          "Use this when the AI needs context about the current project's codebase.",
        inputSchema: {
          type: "object" as const,
          properties: {
            path: {
              type: "string",
              description:
                "Optional path to scan. Defaults to the current working directory (process.cwd()).",
            },
          },
        },
      },
      {
        name: "prism_kitchen",
        description:
          "Context budget optimization tool. Analyzes what the AI will receive and optimizes it " +
          "to achieve 60-70% token reduction. Use BEFORE generating code to see exactly what " +
          "context will be sent. Returns token savings analysis and optimized rules.",
        inputSchema: {
          type: "object" as const,
          properties: {
            action: {
              type: "string",
              description: "'analyze' for full analysis with savings report, 'preview' for just the context",
              enum: ["analyze", "preview"],
            },
            task: {
              type: "string",
              description: "What you're about to code (e.g., 'build a login form'). Used for relevance filtering.",
            },
            budget: {
              type: "number",
              description: "Maximum tokens for the response (default: 4000)",
              default: 4000,
            },
            projectId: {
              type: "string",
              description: "Optional project ID to scope rules",
            },
            format: {
              type: "string",
              description: "Response format: 'markdown' or 'json'",
              enum: ["markdown", "json"],
            },
          },
          required: ["action", "task"],
        },
      },
      {
        name: "prism_intercept",
        description:
          "Active interception agent. Prevents the generate→violate→fix cycle that wastes tokens. " +
          "Call BEFORE generating code with a task description to get a pre-flight guide of " +
          "forbidden and required patterns. Call AFTER generating code to validate and get " +
          "specific fix instructions. Eliminates reiteration and reduces token consumption by 40-60%.",
        inputSchema: {
          type: "object" as const,
          properties: {
            task: {
              type: "string",
              description: "What you're about to code (pre-generation mode). Returns forbidden/required patterns.",
            },
            code: {
              type: "string",
              description: "Generated code to validate (post-generation mode). Returns violations with fixes.",
            },
            filePath: {
              type: "string",
              description: "Optional file path for context",
            },
            projectId: {
              type: "string",
              description: "Optional project ID to scope rules",
            },
          },
        },
      },
      {
        name: "prism_health",
        description:
          "Server health check. Returns connection status, cache stats, rule count, and diagnostics. " +
          "Use when troubleshooting MCP connection issues.",
        inputSchema: {
          type: "object" as const,
          properties: {
            verbose: {
              type: "boolean",
              description: "Include detailed diagnostics (default: false)",
              default: false,
            },
          },
        },
      },
      {
        name: "prism_compile",
        description:
          "Rule Compiler — transforms governance rules into executable validators. " +
          "Instead of giving the AI markdown rules to read (and potentially ignore), " +
          "this compiles rules into TypeScript type guards, import validators, and fix templates. " +
          "The AI receives injection context that constrains what it can generate. " +
          "This enforces governance at the code level, not just as suggestions.",
        inputSchema: {
          type: "object" as const,
          properties: {
            projectId: {
              type: "string",
              description: "Optional project ID to scope rules",
            },
            category: {
              type: "string",
              description: "Optional filter by rule category",
            },
            task: {
              type: "string",
              description: "Optional task description for context-aware compilation",
            },
            format: {
              type: "string",
              description: "Response format: 'markdown' (default) or 'json'",
              enum: ["markdown", "json"],
            },
          },
        },
      },
      {
        name: "prism_orchestrate",
        description:
          "ONE-CALL governance engine. Instead of calling 5 separate tools (prism_compile → " +
          "prism_kitchen → get_architectural_rules → prism_intercept → prism_check), call this " +
          "ONCE and get everything: compiled validators, optimized rules, guard rails, and injection " +
          "context. Reduces tool calls from 5→1 and tokens by 60-70%. " +
          "Mode: 'full' (everything), 'compact' (rules + guard rails), 'minimal' (injection context only).",
        inputSchema: {
          type: "object" as const,
          properties: {
            task: {
              type: "string",
              description: "What you're about to code (e.g., 'build a login form'). Required.",
            },
            code: {
              type: "string",
              description: "Optional: code to validate. If provided, runs validation and returns violations.",
            },
            filePath: {
              type: "string",
              description: "Optional file path for context",
            },
            projectId: {
              type: "string",
              description: "Optional project ID to scope rules",
            },
            budget: {
              type: "number",
              description: "Maximum tokens for the response (default: 4000)",
              default: 4000,
            },
            mode: {
              type: "string",
              description: "'full' (default), 'compact' (rules + guard rails), 'minimal' (injection context only)",
              enum: ["full", "compact", "minimal"],
            },
          },
          required: ["task"],
        },
      },
      {
        name: "prism_memory",
        description:
          "Governance memory — persistent AI agent memory across sessions and team members. " +
          "Stores decisions, patterns, violations, and team consensus. " +
          "Read memories before generating code to learn from past sessions. " +
          "Write memories after making decisions or encountering violations. " +
          "This ensures AI agents don't repeat mistakes and maintain consistency across the team.",
        inputSchema: {
          type: "object" as const,
          properties: {
            action: {
              type: "string",
              description: "'read' (query memories), 'write' (store memory), 'stats' (statistics), 'cleanup' (remove expired)",
              enum: ["read", "write", "stats", "cleanup"],
            },
            type: {
              type: "string",
              description: "Memory type: decision, pattern, violation, consensus, incident, progress, context",
            },
            scope: {
              type: "string",
              description: "Memory scope: project, team, global",
            },
            content: {
              type: "string",
              description: "Memory content (required for 'write' action)",
            },
            tags: {
              type: "array" as const,
              items: { type: "string" },
              description: "Tags for categorization and search",
            },
            importance: {
              type: "string",
              description: "Importance level: critical, high, medium, low",
              enum: ["critical", "high", "medium", "low"],
            },
            projectId: {
              type: "string",
              description: "Project ID to scope memories",
            },
            teamId: {
              type: "string",
              description: "Team ID for team-scoped memories",
            },
            source: {
              type: "string",
              description: "Who/what created this memory (e.g., 'cursor-agent', 'jeff')",
            },
            sessionId: {
              type: "string",
              description: "Current session ID for tracking",
            },
            limit: {
              type: "number",
              description: "Max memories to return (default: 50)",
            },
          },
          required: ["action"],
        },
      },
      {
        name: "prism_drip",
        description:
          "Context Drip — progressive rule disclosure. Instead of sending all rules at once, " +
          "drip-feed only what's needed at each moment. Call with your current code snippet and " +
          "get only the rules that apply RIGHT NOW. Three tiers: red lines (always first), " +
          "context rules (when in a domain), edge cases (when approaching violation). " +
          "Achieves 80-90% token savings vs sending all rules. " +
          "Call repeatedly as you write code — each call gives the next relevant rules.",
        inputSchema: {
          type: "object" as const,
          properties: {
            code: {
              type: "string",
              description: "Your current code snippet. Required for 'drip' action.",
            },
            filePath: {
              type: "string",
              description: "Optional file path for context detection",
            },
            projectId: {
              type: "string",
              description: "Optional project ID to scope rules",
            },
            sessionId: {
              type: "string",
              description: "Session ID for tracking given rules (default: 'default')",
            },
            budget: {
              type: "number",
              description: "Maximum tokens for the session (default: 4000)",
              default: 4000,
            },
            action: {
              type: "string",
              description: "'drip' (get next rules), 'reset' (clear session), 'status' (check progress)",
              enum: ["drip", "reset", "status"],
            },
          },
          required: ["code"],
        },
      },
    ],
  };
});

// =============================================================================
// TOOLS: Execute Tool Calls
// =============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const rawResult = await (async () => {
    switch (name) {
      case "get_architectural_rules": {
        const args_ = args as Record<string, unknown>;
        const task = args_?.task as string | undefined;
        const requestedMaxTokens = (args_?.maxTokens as number) || 4000;
        const maxTokens = resolveMaxTokens(requestedMaxTokens);
        const projectId = args_?.projectId as string | undefined;
        const format = resolveFormat(
          args_?.format as "markdown" | "json" | undefined,
        );
        const category = args_?.category as string | undefined;
        const tag = args_?.tag as string | undefined;

        // Check full response cache (same inputs → return instantly)
        const responseCacheKey = getCacheKey(
          `response_${projectId || "global"}`,
          [task || "", String(maxTokens), format, category || "", tag || ""],
        );
        const cachedResponse = getCached<{
          text: string;
          meta: Record<string, unknown>;
        }>(responseCacheKey);
        if (cachedResponse) {
          return {
            content: [{ type: "text" as const, text: cachedResponse.text }],
            _meta: { ...cachedResponse.meta, cacheHit: true },
          };
        }

        let foundRules: RuleDoc[];
        let fromCache = false;

        // Check rules cache: avoid DB round trip
        const rulesCacheKey = getCacheKey(projectId || "global", [
          category || "",
          tag || "",
        ]);
        const cachedRules = getCached<RuleDoc[]>(rulesCacheKey);
        if (cachedRules && cachedRules.length > 0) {
          foundRules = cachedRules;
          fromCache = true;
        } else {
          // Fetch from database with offline fallback
          try {
            const rules = await getRulesCollection();
            const query: Record<string, unknown> = { isActive: true };
            if (category) query.category = category;
            if (tag) query.tags = tag;
            if (projectId) query.projectId = projectId;

            foundRules = (await rules
              .find(query)
              .sort({ priority: 1 })
              .toArray()) as unknown as RuleDoc[];

            // Cache rules for next call
            setCached(rulesCacheKey, foundRules);
          } catch (dbError) {
            console.error(
              "[get_architectural_rules] DB fetch failed, trying cache fallback:",
              dbError,
            );
            const fallbackRules = getCached<RuleDoc[]>(rulesCacheKey);
            if (fallbackRules && fallbackRules.length > 0) {
              foundRules = fallbackRules;
              fromCache = true;
              console.error(
                "[get_architectural_rules] Serving from cache (stale)",
              );
            } else {
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Error: Database unavailable and no cached rules available.`,
                  },
                ],
                isError: true,
              };
            }
          }
        }

        if (foundRules.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No active rules found${category ? ` for category "${category}"` : ""}${tag ? ` with tag "${tag}"` : ""}.`,
              },
            ],
          };
        }

        // If no task provided, fall back to legacy priority-based sort
        if (!task) {
          const top5 = foundRules.slice(0, 5);
          const formatted = top5
            .map(
              (r) =>
                `## ${r.name}\n\n**Priority:** ${r.priority} | **Category:** ${r.category}\n\n${r.content}`,
            )
            .join("\n\n---\n\n");
          const text = `# Prism Architectural Rules\n\nFound ${top5.length} rule(s):\n\n${formatted}`;
          setCached(responseCacheKey, {
            text,
            meta: { cacheHit: false, fromCache, returnedRules: top5.length },
          });
          return {
            content: [{ type: "text" as const, text }],
            _meta: { cacheHit: false, fromCache },
          };
        }

        // Smart selection: embed task, rank by similarity, apply truncation
        try {
          const ranked = await rankRulesByTask(task, foundRules, maxTokens);
          const text = formatRulesResponse(ranked, task, format);
          setCached(responseCacheKey, {
            text,
            meta: {
              cacheHit: false,
              fromCache,
              returnedRules: ranked.rules.length,
              totalRules: ranked.totalRules,
              skippedRules: ranked.skippedRules,
              tokenCount: ranked.tokenCount,
            },
          });
          return {
            content: [{ type: "text" as const, text }],
            _meta: {
              cacheHit: false,
              fromCache,
              taskResult: {
                returnedRules: ranked.rules.length,
                totalRules: ranked.totalRules,
                skippedRules: ranked.skippedRules,
                tokenCount: ranked.tokenCount,
              },
            },
          };
        } catch (error) {
          console.error(
            "[get_architectural_rules] Smart selection failed:",
            error,
          );
          // Fall back to priority sort on embedding failure
          const top5 = foundRules.slice(0, 5);
          const formatted = top5
            .map(
              (r) =>
                `## ${r.name}\n\n**Priority:** ${r.priority} | **Category:** ${r.category}\n\n${r.content}`,
            )
            .join("\n\n---\n\n");
          const text = `# Prism Architectural Rules (embedding unavailable — fallback)\n\nFound ${top5.length} rule(s):\n\n${formatted}`;
          setCached(responseCacheKey, {
            text,
            meta: {
              cacheHit: false,
              fromCache,
              returnedRules: top5.length,
              fallback: true,
            },
          });
          return {
            content: [{ type: "text" as const, text }],
            _meta: { cacheHit: false, fromCache, fallback: true },
          };
        }
      }

      case "prism_scan": {
        const scanResult = await handlePrismScan(
          args as unknown as Parameters<typeof handlePrismScan>[0],
        );
        return {
          content: scanResult.content.map((c) => ({
            type: c.type as "text",
            text: c.text,
          })),
          isError: scanResult.isError,
        };
      }

      case "validate_code_pattern": {
        const code = (args as Record<string, unknown>)?.code as string;
        const context = (args as Record<string, unknown>)?.context as
          | string
          | undefined;
        const category = (args as Record<string, unknown>)?.category as
          | string
          | undefined;

        if (!code) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: No code provided to validate.",
              },
            ],
            isError: true,
          };
        }

        const violations: string[] = [];

        // Fetch pattern-based rules from database
        const rulesDb = await getRulesCollection();
        const query: Record<string, unknown> = {
          isActive: true,
          pattern: { $exists: true, $ne: null },
        };
        if (category) query.category = category;

        const patternRules = await rulesDb
          .find(query)
          .sort({ priority: 1 })
          .toArray();

        // Check code against each pattern rule
        for (const rule of patternRules) {
          if (!rule.pattern) continue;

          try {
            const regex = new RegExp(rule.pattern as string, "gi");
            if (regex.test(code)) {
              const severity =
                rule.severity === "error"
                  ? "❌"
                  : rule.severity === "warning"
                    ? "⚠️"
                    : "ℹ️";
              const label =
                rule.severity === "error"
                  ? "VIOLATION"
                  : rule.severity === "warning"
                    ? "WARNING"
                    : "INFO";

              violations.push(
                `${severity} **${label}: ${rule.name}**\n` +
                  `   Category: ${rule.category}\n\n` +
                  `   ${rule.content}`,
              );
            }
          } catch (regexError) {
            console.error(
              `[validate_code_pattern] Invalid regex in rule "${rule.name}":`,
              regexError,
            );
          }
        }

        // Fallback built-in checks (keep for backward compatibility)
        if (patternRules.length === 0) {
          // Cross-app imports
          if (code.includes("../../apps/") || code.includes("../apps/")) {
            violations.push(
              "❌ **VIOLATION: Cross-App Import Detected**\n" +
                "   Never import from `../../apps/*`. Use shared packages instead:\n" +
                "   ```typescript\n" +
                "   // ✅ Correct\n" +
                '   import { Button } from "@repo/ui/button";\n' +
                "   ```",
            );
          }

          // Inline styles
          if (code.includes("style={{") || code.includes("style:")) {
            violations.push(
              "⚠️ **WARNING: Inline Styles Detected**\n" +
                "   Use Tailwind CSS classes instead of inline styles.",
            );
          }
        }

        if (violations.length === 0) {
          const ruleCount = patternRules.length;
          return {
            content: [
              {
                type: "text" as const,
                text: `✅ **Code Validation Passed**\n\n${context ? `Context: ${context}\n\n` : ""}Checked against ${ruleCount} pattern rule(s). No violations detected.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `# Code Validation Report\n\n${context ? `**Context:** ${context}\n\n` : ""}Found ${violations.length} issue(s):\n\n${violations.join("\n\n")}`,
            },
          ],
        };
      }

      case "get_skill": {
        return await handleGetSkill(
          args as unknown as Parameters<typeof handleGetSkill>[0],
        );
      }

      case "list_skills": {
        return await handleListSkills(
          args as unknown as Parameters<typeof handleListSkills>[0],
        );
      }

      case "prism_check": {
        return await handlePrismCheck(
          args as unknown as Parameters<typeof handlePrismCheck>[0],
        );
      }

      case "prism_fix": {
        return await handlePrismFix(
          args as unknown as Parameters<typeof handlePrismFix>[0],
        );
      }

      case "repo_extract": {
        return await extractRulesFromRepoScan(
          args as unknown as Parameters<typeof extractRulesFromRepoScan>[0],
        );
      }

      case "repo_scan": {
        const scanPath = (args as Record<string, unknown>)?.path as
          | string
          | undefined;

        try {
          const report = await scanCurrentRepo(scanPath);
          const formatted = formatScanReport(report);

          return {
            content: [
              {
                type: "text" as const,
                text: formatted,
              },
            ],
            _meta: {
              root: report.root,
              fileCount: report.structure.fileCount,
              dirCount: report.structure.dirCount,
              dominantConvention: Object.entries(report.namingConventions.files)
                .sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown",
            },
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Error scanning repo: ${error instanceof Error ? error.message : "Unknown error"}`,
              },
            ],
            isError: true,
          };
        }
      }

      case "prism_kitchen": {
        const kitchenArgs = args as Record<string, unknown>;
        const action = kitchenArgs?.action as string;
        if (action === "preview") {
          return await handleKitchenPreview({
            task: kitchenArgs?.task as string,
            projectId: kitchenArgs?.projectId as string | undefined,
            budget: kitchenArgs?.budget as number | undefined,
          });
        }
        return await handleKitchenAnalyze({
          task: kitchenArgs?.task as string,
          budget: kitchenArgs?.budget as number | undefined,
          projectId: kitchenArgs?.projectId as string | undefined,
          format: kitchenArgs?.format as "markdown" | "json" | undefined,
        });
      }

      case "prism_intercept": {
        return await handlePrismIntercept(
          args as unknown as Parameters<typeof handlePrismIntercept>[0],
        );
      }

      case "prism_health": {
        const verbose = (args as Record<string, unknown>)?.verbose as boolean | undefined;
        return {
          content: [{
            type: "text" as const,
            text: [
              `# Prism MCP Server Health`,
              ``,
              `**Status:** ✅ Connected`,
              `**Server:** ${SERVER_NAME} v${SERVER_VERSION}`,
              `**Project:** ${currentProject ? `${currentProject.name} (${currentProject.framework})` : "Not detected"}`,
              `**Authenticated:** ${authenticatedUserId ? `Yes (${authenticatedTier})` : "No"}`,
              verbose ? `**Database:** ${process.env.MONGODB_URI ? "Configured" : "Not configured"}` : "",
              verbose ? `**AI Provider:** ${process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY ? "Gemini" : process.env.AZURE_OPENAI_ENDPOINT ? "Azure OpenAI" : "Not configured"}` : "",
              verbose ? `**Gremlin Ranking:** ${process.env.USE_GREMLIN_RANKING === "true" ? "Enabled" : "Disabled"}` : "",
            ].filter(Boolean).join("\n"),
          }],
        };
      }

      case "prism_compile": {
        return await handlePrismCompile(
          args as unknown as Parameters<typeof handlePrismCompile>[0],
        );
      }

      case "prism_orchestrate": {
        return await handlePrismOrchestrate(
          args as unknown as Parameters<typeof handlePrismOrchestrate>[0],
        );
      }

      case "prism_memory": {
        return await handlePrismMemory(
          args as unknown as Parameters<typeof handlePrismMemory>[0],
        );
      }

      case "prism_drip": {
        return await handlePrismDrip(
          args as unknown as Parameters<typeof handlePrismDrip>[0],
        );
      }

      default:
        return {
          content: [
            { type: "text" as const, text: `Error: Unknown tool "${name}"` },
          ],
          isError: true,
        };
    }
  })();

  const trackedResult = trackToolResponse(rawResult);
  const rMeta = (rawResult as unknown as Record<string, unknown>)?._meta as
    | Record<string, unknown>
    | undefined;

  logTelemetryEvent({
    toolName: name,
    tokenCount: trackedResult._meta.tokenCount,
    byteSize: trackedResult._meta.byteSize,
    isError: !!(rawResult as { isError?: boolean }).isError,
    cacheHit: rMeta?.cacheHit as boolean | undefined,
    fromCache: rMeta?.fromCache as boolean | undefined,
    projectId: (args as Record<string, unknown>)?.projectId as
      | string
      | undefined,
    model: (args as Record<string, unknown>)?.model as string | undefined,
    clientPlatform: getCurrentClient().platform,
  });

  return trackedResult;
});

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.error(
    `[${SERVER_NAME}] Starting Prism MCP Server v${SERVER_VERSION}...`,
  );

  // Startup env checks — warn early about missing config
  if (!process.env.MONGODB_URI) {
    console.error(
      `[${SERVER_NAME}] ⚠️  MONGODB_URI not set. Database tools will fail until it is configured.`,
    );
  }
  const hasGemini = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const hasAzure = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY;
  if (!hasGemini && !hasAzure) {
    console.error(
      `[${SERVER_NAME}] ⚠️  No AI provider configured. Smart selection and rule generation will be unavailable.`,
    );
  }

  await validateApiKey();

  // Detect the caller's project from the current working directory
  try {
    currentProject = detectCurrentProject();
    console.error(
      `[${SERVER_NAME}] Detected project: ${currentProject.name} (${currentProject.framework}) at ${currentProject.root}`,
    );
    if (currentProject.stack.length > 0) {
      console.error(
        `[${SERVER_NAME}] Stack: ${currentProject.stack.join(", ")}`,
      );
    }
  } catch {
    console.error(
      `[${SERVER_NAME}] Could not detect project from working directory.`,
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[${SERVER_NAME}] Server connected and ready.`);
}

// Graceful shutdown
async function shutdown(signal: string) {
  console.error(`[${SERVER_NAME}] Received ${signal}, shutting down...`);
  await closeConnection().catch(() => {});
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch(async (error) => {
  console.error(`[${SERVER_NAME}] Fatal error:`, error);
  await closeConnection().catch(() => {});
  process.exit(1);
});
