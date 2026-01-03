#!/usr/bin/env node
/**
 * @module prism-mcp-server
 * @description Prism Engine MCP Server - Context Governance for LLMs
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
} from "@modelcontextprotocol/sdk/types.js";
import { MongoClient, type Collection, type Document, ObjectId } from "mongodb";
import { generateQueryEmbedding } from "./lib/azure-openai.js";
import { findTopKSimilar, extractRelevantSnippet } from "./lib/vector-search.js";

// =============================================================================
// CONFIGURATION
// =============================================================================

const SERVER_NAME = "jeffdev-prism-engine";
const SERVER_VERSION = "1.0.0";
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.COSMOS_DATABASE_NAME || "prism";

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
// (Video transcript search utilities removed - will be re-implemented in Phase 3 with Azure OpenAI)

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
          "Fetch the critical coding standards and design rules from the Prism Engine. " +
          "Use this BEFORE writing any code to understand the project's constraints.",
        inputSchema: {
          type: "object" as const,
          properties: {
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
        },
      },
      {
        name: "validate_code_pattern",
        description:
          "Check if a code pattern follows the project's architectural rules. " +
          "Use this to verify imports, component patterns, and security practices.",
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
          },
          required: ["code"],
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
    ],
  };
});

// =============================================================================
// TOOLS: Execute Tool Calls
// =============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_architectural_rules": {
      const rules = await getDB();
      const category = (args as Record<string, unknown>)?.category as string | undefined;
      const tag = (args as Record<string, unknown>)?.tag as string | undefined;

      // Build query
      const query: Record<string, unknown> = { isActive: true };
      if (category) query.category = category;
      if (tag) query.tags = tag;

      const foundRules = await rules
        .find(query)
        .sort({ priority: 1 }) // Lower priority number = higher importance
        .limit(5)
        .toArray();

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

      // Format rules as markdown
      const formatted = foundRules
        .map((r: Document) => `## ${r.name}\n\n**Priority:** ${r.priority} | **Category:** ${r.category}\n\n${r.content}`)
        .join("\n\n---\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `# Prism Architectural Rules\n\nFound ${foundRules.length} rule(s):\n\n${formatted}`,
          },
        ],
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
      
      if (!code) {
        return {
          content: [{ type: "text" as const, text: "Error: No code provided to validate." }],
          isError: true,
        };
      }

      const violations: string[] = [];

      // Check for cross-app imports
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

      // Check for inline styles
      if (code.includes("style={{") || code.includes("style:")) {
        violations.push(
          "⚠️ **WARNING: Inline Styles Detected**\n" +
          "   Use Tailwind CSS classes instead of inline styles:\n" +
          "   ```tsx\n" +
          '   // ✅ Correct\n' +
          '   <div className="bg-void text-white p-4">\n' +
          "   ```"
        );
      }

      // Check for missing Zod validation in server code
      if (
        (code.includes("async function") || code.includes("export async")) &&
        code.includes("formData") &&
        !code.includes("z.") &&
        !code.includes("zod")
      ) {
        violations.push(
          "❌ **VIOLATION: Missing Zod Validation**\n" +
          "   All Server Actions must validate input with Zod:\n" +
          "   ```typescript\n" +
          '   import { z } from "zod";\n' +
          "   const schema = z.object({ ... });\n" +
          "   const parsed = schema.safeParse(data);\n" +
          "   ```"
        );
      }

      // Check for env file usage
      if (code.includes(".env") && !code.includes("process.env")) {
        violations.push(
          "⚠️ **WARNING: .env File Reference**\n" +
          "   Use Doppler for secrets management, not .env files."
        );
      }

      if (violations.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `✅ **Code Validation Passed**\n\n${context ? `Context: ${context}\n\n` : ""}No architectural violations detected in the provided code.`,
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

    default:
      return {
        content: [{ type: "text" as const, text: `Error: Unknown tool "${name}"` }],
        isError: true,
      };
  }
});

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();

  console.error(`[${SERVER_NAME}] Starting Prism MCP Server v${SERVER_VERSION}...`);
  
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
