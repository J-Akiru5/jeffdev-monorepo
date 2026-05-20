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

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { MongoClient, type Collection, type Document, ObjectId } from "mongodb";
import { generateQueryEmbedding } from "./lib/azure-openai.js";
import { findTopKSimilar, extractRelevantSnippet } from "./lib/vector-search.js";
import { handlePrismScan, handleRateRules } from "./tools/prism-scan.js";
import { handleGetSkill } from "./tools/get-skill.js";
import { handlePrismCheck } from "./tools/prism-check.js";
import { handlePrismFix } from "./tools/prism-fix.js";
import { extractRulesFromRepoScan } from "./tools/repo-extract.js";
import { trackToolResponse, logTelemetryEvent } from "./middleware/token-counter.js";
import { rankRulesByTask, formatRulesResponse, type RuleDoc } from "./middleware/smart-select.js";
import { getCached, setCached, getCacheKey, loadDiskCacheIntoMemory, getCacheStats } from "./middleware/cache.js";
import { setCurrentClient, getCurrentClient } from "./middleware/client-detector.js";
import { resolveFormat, resolveMaxTokens, getConfig as getPlatformConfig } from "./middleware/platform-formatter.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SERVER_NAME = "jeffdev-prism-engine";
const SERVER_VERSION = "1.0.0";
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.COSMOS_DATABASE_NAME || "prism";

// API Key Authentication
const PRISM_API_KEY = process.env.PRISM_API_KEY;
const PRISM_API_URL = process.env.PRISM_API_URL || "https://prism.jeffdev.studio";

// Cached auth state
let authenticatedUserId: string | null = null;
let authenticatedTier: string = "free";

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
    console.error(`[${SERVER_NAME}] No PRISM_API_KEY set. Running in unauthenticated mode.`);
    console.error(`[${SERVER_NAME}] Set PRISM_API_KEY to enable subscription-based access.`);
    return;
  }

  try {
    console.error(`[${SERVER_NAME}] Validating API key...`);

    const response = await fetch(`${PRISM_API_URL}/api/api-keys/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: PRISM_API_KEY }),
    });

    const data = await response.json() as AuthResponse;

    if (!data.valid) {
      console.error(`[${SERVER_NAME}] ❌ API key validation failed: ${data.error}`);
      if (data.upgradeUrl) {
        console.error(`[${SERVER_NAME}] Upgrade your plan at: ${PRISM_API_URL}${data.upgradeUrl}`);
      }
      process.exit(1);
    }

    authenticatedUserId = data.userId || null;
    authenticatedTier = data.tier || "free";

    console.error(`[${SERVER_NAME}] ✅ Authenticated as user: ${authenticatedUserId} (${authenticatedTier} tier)`);
  } catch (error) {
    console.error(`[${SERVER_NAME}] ⚠️ Could not validate API key:`, error instanceof Error ? error.message : error);
    console.error(`[${SERVER_NAME}] Continuing in unauthenticated mode.`);
  }
}

// =============================================================================
// DATABASE CONNECTION (Singleton)
// =============================================================================

let client: MongoClient | null = null;
let rulesCollection: Collection<Document> | null = null;

async function getDB(): Promise<Collection<Document>> {
  if (rulesCollection) {
    return rulesCollection;
  }

  if (!MONGODB_URI) {
    throw new Error(
      "[prism-mcp-server] MONGODB_URI not set. Pass it via env in MCP config."
    );
  }

  client = new MongoClient(MONGODB_URI, {
    retryWrites: false, // Cosmos DB doesn't support retryable writes
    maxPoolSize: 5,
  });

  await client.connect();
  console.error(`[${SERVER_NAME}] Connected to Azure Cosmos DB`);

  const db = client.db(DATABASE_NAME);
  rulesCollection = db.collection("rules");
  
  return rulesCollection;
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
  }
);

// =============================================================================
// CLIENT DETECTION: Intercept initialize to capture IDE/client info
// =============================================================================

server.setRequestHandler(InitializeRequestSchema, async (request) => {
  const clientInfo = request.params?.clientInfo as { name: string; version: string } | undefined;
  if (clientInfo) {
    setCurrentClient(clientInfo);
    console.error(`[${SERVER_NAME}] Client detected: ${clientInfo.name} v${clientInfo.version} (${getCurrentClient().platform})`);
  }

  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      resources: {},
      tools: {},
    },
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
  };
});

// =============================================================================
// RESOURCES: List all Rules
// =============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const rules = await getDB();
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
});

// =============================================================================
// RESOURCES: Read a Specific Rule
// =============================================================================

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  // Extract ID from prism://rules/{id}
  const id = uri.replace("prism://rules/", "");

  const rules = await getDB();
  
  let rule;
  try {
    rule = await rules.findOne({ _id: new ObjectId(id) });
  } catch {
    // If not a valid ObjectId, try matching by name
    rule = await rules.findOne({ name: id });
  }

  if (!rule) {
    throw new Error(`Rule "${id}" not found`);
  }

  // Format the rule as nice markdown
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
              description: "Optional project ID to scope rules to a specific project",
            },
            format: {
              type: "string",
              description: "Response format: 'markdown' (default, human-readable) or 'json' (compact machine-readable)",
              enum: ["markdown", "json"],
            },
            category: {
              type: "string",
              description:
                "Optional filter by category: architecture, styling, security, performance",
            },
            tag: {
              type: "string",
              description: "Optional filter by tag (e.g., 'design', 'monorepo', 'validation')",
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
              description: "Filter rules by category (architecture, styling, security, etc.)",
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
              description: "Optional Prism project ID to sync results to Cosmos DB",
            },
            model: {
              type: "string",
              description: "Optional model override (gpt-4o-mini | gemini-flash-lite)",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "search_video_transcript",
        description: "Semantic search across video transcripts using Azure OpenAI embeddings. Finds relevant architectural discussions from uploaded screen recordings.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (e.g., 'TypeScript patterns', 'component architecture')",
            },
            projectId: {
              type: "string",
              description: "Optional project ID to filter results",
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 5)",
              default: 5,
            },
          },
          required: ["query"],
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
              description: "Optional: specific rule IDs to check against (checks all pattern rules if omitted)",
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
        name: "validate_code",
        description:
          "Alias for prism_check. Validates code against pattern-based governance rules. " +
          "Returns structured violations with line/column positions.",
        inputSchema: {
          type: "object" as const,
          properties: {
            code: { type: "string", description: "The source code to validate" },
            ruleIds: { type: "array" as const, items: { type: "string" }, description: "Optional specific rule IDs" },
            projectId: { type: "string", description: "Optional project ID" },
            filePath: { type: "string", description: "Optional file path" },
            category: { type: "string", description: "Optional category filter" },
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
              description: "Optional model override (gpt-4o-mini | gemini-flash-lite)",
            },
          },
          required: ["scan"],
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
      const format = resolveFormat(args_?.format as "markdown" | "json" | undefined);
      const category = args_?.category as string | undefined;
      const tag = args_?.tag as string | undefined;

      // Check full response cache (same inputs → return instantly)
      const responseCacheKey = getCacheKey(`response_${projectId || "global"}`, [task || "", String(maxTokens), format, category || "", tag || ""]);
      const cachedResponse = getCached<{ text: string; meta: Record<string, unknown> }>(responseCacheKey);
      if (cachedResponse) {
        return {
          content: [{ type: "text" as const, text: cachedResponse.text }],
          _meta: { ...cachedResponse.meta, cacheHit: true },
        };
      }

      let foundRules: RuleDoc[];
      let fromCache = false;

      // Check rules cache: avoid DB round trip
      const rulesCacheKey = getCacheKey(projectId || "global", [category || "", tag || ""]);
      const cachedRules = getCached<RuleDoc[]>(rulesCacheKey);
      if (cachedRules && cachedRules.length > 0) {
        foundRules = cachedRules;
        fromCache = true;
      } else {
        // Fetch from database with offline fallback
        try {
          const rules = await getDB();
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
          console.error("[get_architectural_rules] DB fetch failed, trying cache fallback:", dbError);
          const fallbackRules = getCached<RuleDoc[]>(rulesCacheKey);
          if (fallbackRules && fallbackRules.length > 0) {
            foundRules = fallbackRules;
            fromCache = true;
            console.error("[get_architectural_rules] Serving from cache (stale)");
          } else {
            return {
              content: [{ type: "text" as const, text: `Error: Database unavailable and no cached rules available.` }],
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
          .map((r) => `## ${r.name}\n\n**Priority:** ${r.priority} | **Category:** ${r.category}\n\n${r.content}`)
          .join("\n\n---\n\n");
        const text = `# Prism Architectural Rules\n\nFound ${top5.length} rule(s):\n\n${formatted}`;
        setCached(responseCacheKey, { text, meta: { cacheHit: false, fromCache, returnedRules: top5.length } });
        return {
          content: [{ type: "text" as const, text }],
          _meta: { cacheHit: false, fromCache },
        };
      }

      // Smart selection: embed task, rank by similarity, apply truncation
      try {
        const ranked = await rankRulesByTask(task, foundRules, maxTokens, format);
        const text = formatRulesResponse(ranked, task, format);
        setCached(responseCacheKey, {
          text,
          meta: { cacheHit: false, fromCache, returnedRules: ranked.rules.length, totalRules: ranked.totalRules, skippedRules: ranked.skippedRules, tokenCount: ranked.tokenCount },
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
        console.error("[get_architectural_rules] Smart selection failed:", error);
        // Fall back to priority sort on embedding failure
        const top5 = foundRules.slice(0, 5);
        const formatted = top5
          .map((r) => `## ${r.name}\n\n**Priority:** ${r.priority} | **Category:** ${r.category}\n\n${r.content}`)
          .join("\n\n---\n\n");
        const text = `# Prism Architectural Rules (embedding unavailable — fallback)\n\nFound ${top5.length} rule(s):\n\n${formatted}`;
        setCached(responseCacheKey, { text, meta: { cacheHit: false, fromCache, returnedRules: top5.length, fallback: true } });
        return {
          content: [{ type: "text" as const, text }],
          _meta: { cacheHit: false, fromCache, fallback: true },
        };
      }
    }

    case "prism_scan": {
      const scanResult = await handlePrismScan(args as unknown as Parameters<typeof handlePrismScan>[0]);
      return {
        content: scanResult.content.map((c) => ({ type: c.type as "text", text: c.text })),
        isError: scanResult.isError,
      };
    }

    case "search_video_transcript": {
      const query = (args as Record<string, unknown>)?.query as string;
      const projectId = (args as Record<string, unknown>)?.projectId as string | undefined;
      const limit = ((args as Record<string, unknown>)?.limit as number) || 5;

      if (!query) {
        return {
          content: [{ type: "text" as const, text: "Error: No search query provided." }],
          isError: true,
        };
      }

      try {
        // Step 1: Generate embedding for search query
        const queryEmbedding = await generateQueryEmbedding(query);

        // Step 2: Fetch video transcripts from database
        await getDB(); // Ensure client is connected
        if (!client) {
          throw new Error("Database connection not established");
        }
        const database = client.db(DATABASE_NAME);
        const transcriptsCollection = database.collection("videoTranscripts");

        const filter: Record<string, unknown> = {};
        if (projectId) {
          filter.projectId = projectId;
        }

        const transcriptsRaw = await transcriptsCollection.find(filter).toArray();
        const transcripts = transcriptsRaw as unknown as Array<{
          embedding?: number[];
          transcriptText: string;
          videoTitle: string;
          duration: number;
          muxPlaybackId: string;
          createdAt: string;
          extractedRules?: string[];
        }>;

        if (transcripts.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No video transcripts found${projectId ? ` in project ${projectId}` : ""}.`,
              },
            ],
          };
        }

        // Step 3: Find most similar transcripts using cosine similarity
        const results = findTopKSimilar(
          queryEmbedding,
          transcripts,
          Math.min(limit, 10) // Max 10 results
        );

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No relevant transcripts found for "${query}".`,
              },
            ],
          };
        }

        // Step 4: Format results as markdown
        const formatted = results
          .map((result, index) => {
            const similarity = Math.round(result.similarity * 100);
            const snippet = extractRelevantSnippet(result.transcriptText, 200);
            const duration = result.duration ? `${Math.floor(result.duration / 60)}:${String(Math.floor(result.duration % 60)).padStart(2, '0')}` : 'N/A';

            return `### ${index + 1}. ${result.videoTitle}

**Relevance:** ${similarity}% match
**Duration:** ${duration}
**Uploaded:** ${new Date(result.createdAt).toLocaleDateString()}

**Snippet:**
> ${snippet}

**Playback:** https://stream.mux.com/${result.muxPlaybackId}
${result.extractedRules && result.extractedRules.length > 0 ? `\n**Extracted Rules:** ${result.extractedRules.length} architectural patterns` : ''}`;
          })
          .join("\n\n---\n\n");

        return {
          content: [
            {
              type: "text" as const,
              text: `# Video Transcript Search Results\n\n**Query:** "${query}"\n**Found:** ${results.length} relevant video(s)\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        console.error("[search_video_transcript] Error:", error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error searching transcripts: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }

    case "validate_code_pattern": {
      const code = (args as Record<string, unknown>)?.code as string;
      const context = (args as Record<string, unknown>)?.context as string | undefined;
      const category = (args as Record<string, unknown>)?.category as string | undefined;
      
      if (!code) {
        return {
          content: [{ type: "text" as const, text: "Error: No code provided to validate." }],
          isError: true,
        };
      }

      const violations: string[] = [];

      // Fetch pattern-based rules from database
      const rulesDb = await getDB();
      const query: Record<string, unknown> = {
        isActive: true,
        pattern: { $exists: true, $ne: null }
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
            const severity = rule.severity === "error" ? "❌" : rule.severity === "warning" ? "⚠️" : "ℹ️";
            const label = rule.severity === "error" ? "VIOLATION" : rule.severity === "warning" ? "WARNING" : "INFO";

            violations.push(
              `${severity} **${label}: ${rule.name}**\n` +
              `   Category: ${rule.category}\n\n` +
              `   ${rule.content}`
            );
          }
        } catch (regexError) {
          console.error(`[validate_code_pattern] Invalid regex in rule "${rule.name}":`, regexError);
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
            "   ```"
          );
        }

        // Inline styles
        if (code.includes("style={{") || code.includes("style:")) {
          violations.push(
            "⚠️ **WARNING: Inline Styles Detected**\n" +
            "   Use Tailwind CSS classes instead of inline styles."
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
      return await handleGetSkill(args as unknown as Parameters<typeof handleGetSkill>[0]);
    }

    case "prism_check":
    case "validate_code": {
      return await handlePrismCheck(args as unknown as Parameters<typeof handlePrismCheck>[0]);
    }

    case "prism_fix": {
      return await handlePrismFix(args as unknown as Parameters<typeof handlePrismFix>[0]);
    }

    case "repo_extract": {
      return await extractRulesFromRepoScan(args as unknown as Parameters<typeof extractRulesFromRepoScan>[0]);
    }

    default:
      return {
        content: [{ type: "text" as const, text: `Error: Unknown tool "${name}"` }],
        isError: true,
      };
  }
  })();

  const trackedResult = trackToolResponse(rawResult, name);
  const rMeta = (rawResult as Record<string, unknown>)?._meta as Record<string, unknown> | undefined;

  logTelemetryEvent({
    toolName: name,
    tokenCount: trackedResult._meta.tokenCount,
    byteSize: trackedResult._meta.byteSize,
    isError: !!(rawResult as { isError?: boolean }).isError,
    cacheHit: rMeta?.cacheHit as boolean | undefined,
    fromCache: rMeta?.fromCache as boolean | undefined,
    projectId: (args as Record<string, unknown>)?.projectId as string | undefined,
    model: (args as Record<string, unknown>)?.model as string | undefined,
    clientPlatform: getCurrentClient().platform,
  });

  return trackedResult;
});

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const isStandalone = process.argv.includes('--standalone');

  if (!isStandalone) {
    console.error(`[${SERVER_NAME}] ╔══════════════════════════════════════════════════════╗`);
    console.error(`[${SERVER_NAME}] ║  Direct MCP server startup detected.                ║`);
    console.error(`[${SERVER_NAME}] ║  Recommended: use "prism connect" for cloud sync.   ║`);
    console.error(`[${SERVER_NAME}] ║  To run standalone: add --standalone flag.           ║`);
    console.error(`[${SERVER_NAME}] ╚══════════════════════════════════════════════════════╝`);
    process.exit(0);
  }

  // Validate API key first
  await validateApiKey();

  const transport = new StdioServerTransport();

  console.error(`[${SERVER_NAME}] Starting Prism MCP Server v${SERVER_VERSION} (standalone)...`);
  
  await server.connect(transport);
  
  console.error(`[${SERVER_NAME}] Server connected and ready.`);
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.error(`[${SERVER_NAME}] Shutting down...`);
  if (client) {
    await client.close();
  }
  process.exit(0);
});

main().catch((error) => {
  console.error(`[${SERVER_NAME}] Fatal error:`, error);
  process.exit(1);
});
