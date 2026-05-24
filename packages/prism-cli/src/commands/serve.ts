/**
 * Serve Command — Full MCP Server for IDE Integration
 *
 * Spawns the full Prism MCP server (prism-mcp-server) as a child process
 * and transparently relays stdin/stdout for MCP JSON-RPC communication.
 *
 * The full server connects to Cosmos DB and includes:
 *   - Smart context selection (Gemini embeddings)
 *   - All 9+ tools (get_architectural_rules, prism_check, prism_fix, etc.)
 *   - LRU caching (memory + disk)
 *   - Client detection (Cursor, Windsurf, VS Code, Claude, etc.)
 *   - Platform formatting
 *   - Token counting + telemetry
 *
 * Falls back to local JSON cache if the full server can't start (offline mode).
 *
 * Usage:
 *   prism serve              # Full MCP server with DB (if MONGODB_URI is set)
 *   prism serve --offline    # Local-only mode (reads ~/.prism/rules.json)
 */

import chalk from "chalk";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawnSync, spawn, type ChildProcess } from "child_process";
import { join } from "path";
import { homedir } from "os";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { randomUUID } from "crypto";

const PRISM_DIR = join(homedir(), ".prism");
const RULES_CACHE = join(PRISM_DIR, "rules", "rules.json");
const MCP_SERVER_SCRIPT = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "apps",
  "prism-mcp-server",
  "src",
  "index.ts",
);

// Try to find the built JS version first
const MCP_SERVER_BUILT = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "apps",
  "prism-mcp-server",
  "dist",
  "index.js",
);

// --- Env loading ---
function loadEnvFile(): void {
  const envPaths = [
    join(homedir(), ".prism", ".env"), // user-local
    join(process.cwd(), ".env"), // project-local
    join(import.meta.dirname, "..", "..", "..", "..", ".env"), // monorepo root
  ];
  for (const envPath of envPaths) {
    if (!existsSync(envPath)) continue;
    try {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        )
          val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {
      /* skip inaccessible files */
    }
  }
}
loadEnvFile();

interface ServeOptions {
  port?: string;
  offline?: boolean;
}

export async function serve(options: ServeOptions): Promise<void> {
  console.error(chalk.cyan("◈ Prism MCP Server v1.0"));
  console.error(
    chalk.dim(
      `  Env: ${process.env.MONGODB_URI ? "DB configured" : "DB not configured (offline fallback)"}`,
    ),
  );

  // --- Try full MCP server first ---
  if (!options.offline) {
    const fullServer = await tryFullServer();
    if (fullServer) {
      // Keep-alive: wait for the child process to exit
      await new Promise<void>((resolve) => {
        fullServer.on("exit", (code) => {
          console.error(chalk.dim(`  MCP server exited (code ${code})`));
          resolve();
        });
      });
      return;
    }
    console.error(
      chalk.yellow(
        "  ⚠ Full MCP server unavailable, falling back to local cache.",
      ),
    );
    console.error(chalk.dim("    Run `prism sync` to populate the cache."));
  }

  // --- Fallback: local lite server ---
  await runLiteServer();
}

/**
 * Try to spawn the full prism-mcp-server as a child process.
 * Relays stdin/stdout/stderr transparently.
 */
async function tryFullServer(): Promise<ChildProcess | null> {
  const scriptPath = existsSync(MCP_SERVER_BUILT)
    ? MCP_SERVER_BUILT
    : MCP_SERVER_SCRIPT;
  if (!existsSync(scriptPath)) {
    console.error(chalk.dim(`  MCP server not found at: ${scriptPath}`));
    return null;
  }

  // Detect how to run it
  let cmd: string, args: string[];
  if (scriptPath.endsWith(".ts")) {
    // Use tsx for TypeScript source
    cmd = process.execPath;
    // Find tsx CLI
    const tsxPaths = [
      join(
        import.meta.dirname,
        "..",
        "..",
        "..",
        "..",
        "node_modules",
        ".pnpm",
        "tsx@4.21.0",
        "node_modules",
        "tsx",
        "dist",
        "cli.mjs",
      ),
      join(
        import.meta.dirname,
        "..",
        "..",
        "..",
        "..",
        "node_modules",
        "tsx",
        "dist",
        "cli.mjs",
      ),
    ];
    const tsxPath = tsxPaths.find((p) => existsSync(p));
    if (!tsxPath) {
      console.error(
        chalk.dim(
          "  tsx runtime not found — MCP server requires build. Run `pnpm build`",
        ),
      );
      return null;
    }
    args = [tsxPath, scriptPath, "--standalone"];
  } else {
    cmd = process.execPath;
    args = [scriptPath, "--standalone"];
  }

  try {
    console.error(chalk.dim(`  Starting full MCP server...`));
    const child = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
      cwd: join(
        import.meta.dirname,
        "..",
        "..",
        "..",
        "..",
        "apps",
        "prism-mcp-server",
      ),
    });

    // Relay stdout (JSON-RPC responses) directly
    child.stdout!.on("data", (data: Buffer) => {
      process.stdout.write(data);
    });

    // Relay stderr (logs) to our stderr
    child.stderr!.on("data", (data: Buffer) => {
      process.stderr.write(data);
    });

    // Relay stdin (JSON-RPC requests) to the child
    process.stdin.on("data", (data: Buffer) => {
      child.stdin!.write(data);
    });
    process.stdin.resume();

    // Handle graceful shutdown
    const cleanup = () => {
      child.kill();
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);

    // Wait briefly to see if the child starts successfully
    const started = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      child.stderr!.once("data", (data: Buffer) => {
        if (data.toString().includes("Server connected and ready")) {
          clearTimeout(timeout);
          resolve(true);
        }
      });
      child.on("exit", (code) => {
        clearTimeout(timeout);
        if (code !== 0 && code !== null) resolve(false);
      });
    });

    if (!started) {
      // Check if it's still running
      if (child.exitCode === null || child.exitCode === 0) {
        console.error(
          chalk.dim("  MCP server starting (waiting for handshake)..."),
        );
      } else {
        console.error(
          chalk.dim(`  MCP server exited with code ${child.exitCode}`),
        );
        return null;
      }
    }

    return child;
  } catch (e) {
    console.error(
      chalk.dim(
        `  Failed to start full MCP server: ${e instanceof Error ? e.message : e}`,
      ),
    );
    return null;
  }
}

/**
 * Fallback lite MCP server — reads rules from local JSON cache.
 * Exposes the full tool list but with cached data only.
 */
async function runLiteServer(): Promise<void> {
  let rules: Array<{
    _id?: string;
    id?: string;
    slug?: string;
    name: string;
    content: string;
    category?: string;
    priority?: number;
    tags?: string[];
    skillsContent?: string;
    pattern?: string;
    severity?: string;
    isActive?: boolean;
  }> = [];

  if (existsSync(RULES_CACHE)) {
    try {
      rules = JSON.parse(readFileSync(RULES_CACHE, "utf-8")) as typeof rules;
      console.error(chalk.dim(`  Loaded ${rules.length} rules from cache`));
    } catch {
      console.error(
        chalk.yellow("  ⚠ Cache corrupted, starting with empty rule set."),
      );
    }
  }

  // Ensure cache directory exists
  if (!existsSync(join(PRISM_DIR, "rules"))) {
    mkdirSync(join(PRISM_DIR, "rules"), { recursive: true });
    writeFileSync(RULES_CACHE, JSON.stringify(rules, null, 2));
  }

  const server = new Server(
    { name: "prism-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } },
  );

  // client detection
  let detectedClient: string = "unknown";
  server.setRequestHandler(InitializeRequestSchema, async (request) => {
    const clientInfo = request.params?.clientInfo as
      | { name: string; version: string }
      | undefined;
    if (clientInfo) detectedClient = clientInfo.name;
    return {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {}, resources: {} },
      serverInfo: { name: "prism-context-engine", version: "1.0.0" },
    };
  });

  // Tool list — same as full server
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_architectural_rules",
        description:
          'Fetch critical coding standards and design rules. Provide a "task" for relevance ranking.',
        inputSchema: {
          type: "object" as const,
          properties: {
            task: {
              type: "string",
              description: "Describe what you're about to code",
            },
            maxTokens: {
              type: "number",
              description: "Max tokens (default 4000)",
              default: 4000,
            },
            projectId: { type: "string", description: "Optional project ID" },
            format: {
              type: "string",
              enum: ["markdown", "json"],
              description: "Response format",
            },
            category: { type: "string", description: "Filter by category" },
            tag: { type: "string", description: "Filter by tag" },
          },
          required: ["task"],
        },
      },
      {
        name: "get_skill",
        description:
          "Fetch full skill content (procedural guide with code examples) by ID or name.",
        inputSchema: {
          type: "object" as const,
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
          type: "object" as const,
          properties: {
            code: { type: "string", description: "Source code to validate" },
            ruleIds: {
              type: "array",
              items: { type: "string" },
              description: "Optional specific rule IDs",
            },
            projectId: { type: "string", description: "Optional project ID" },
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
        description: "Alias for prism_check.",
        inputSchema: {
          type: "object" as const,
          properties: {
            code: { type: "string", description: "Source code to validate" },
            ruleIds: { type: "array", items: { type: "string" } },
            projectId: { type: "string" },
            filePath: { type: "string" },
            category: { type: "string" },
          },
          required: ["code"],
        },
      },
      {
        name: "prism_fix",
        description:
          "Apply an automatic fix for a code violation found by prism_check.",
        inputSchema: {
          type: "object" as const,
          properties: {
            violation: {
              type: "object",
              description: "Violation object from prism_check",
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
            code: { type: "string", description: "Original source code" },
          },
          required: ["violation", "code"],
        },
      },
      {
        name: "repo_extract",
        description:
          "Analyze a repository scan report and generate architectural governance rules via AI.",
        inputSchema: {
          type: "object" as const,
          properties: {
            scan: {
              type: "object",
              description: "Repo scan report from `prism sync --repo`",
              properties: {
                root: { type: "string" },
                namingConventions: { type: "object" },
                imports: { type: "object" },
                structure: { type: "object" },
                configs: { type: "object" },
                summary: { type: "string" },
              },
            },
            model: { type: "string", description: "Optional model override" },
          },
          required: ["scan"],
        },
      },
      {
        name: "validate_code_pattern",
        description:
          "Check if code follows project architectural rules (legacy pattern-based check).",
        inputSchema: {
          type: "object" as const,
          properties: {
            code: { type: "string", description: "Code snippet to validate" },
            context: { type: "string", description: "File or feature context" },
            category: { type: "string", description: "Filter by category" },
          },
          required: ["code"],
        },
      },
    ],
  }));

  // Tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = (args || {}) as Record<string, unknown>;

    switch (name) {
      case "get_architectural_rules": {
        const task = a.task as string | undefined;
        const category = a.category as string | undefined;
        const tag = a.tag as string | undefined;
        const format = a.format as string | undefined;
        const maxTokens = (a.maxTokens as number) || 4000;

        let filtered = rules.filter((r) => r.isActive !== false);
        if (category)
          filtered = filtered.filter((r) => r.category === category);
        if (tag)
          filtered = filtered.filter((r) => (r.tags || []).includes(tag));

        // Sort by priority
        filtered.sort((a, b) => (a.priority || 50) - (b.priority || 50));

        if (filtered.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No rules found. Run `prism sync` to populate.",
              },
            ],
          };
        }

        // Simple keyword matching for task relevance
        const tokenBudget = maxTokens;
        let used = 0;
        const kept: typeof filtered = [];
        const keywords = task
          ? task
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 3)
          : [];

        // Score rules by keyword match
        const scored = filtered.map((r) => {
          let score = 0;
          if (keywords.length > 0) {
            const haystack = `${r.name} ${r.content}`.toLowerCase();
            for (const kw of keywords) {
              if (haystack.includes(kw)) score += 1;
            }
          }
          return { ...r, score };
        });

        if (task) scored.sort((a, b) => b.score - a.score);

        for (const r of scored) {
          const tok = Math.ceil((r.content || "").length / 4);
          if (used + tok <= tokenBudget || kept.length < 3) {
            used += tok;
            kept.push(r);
          }
        }

        const isJson = format === "json";
        const text = isJson
          ? JSON.stringify({
              rules: kept.map((r) => ({
                id: r._id || r.id || r.slug,
                name: r.name,
                priority: r.priority,
                category: r.category,
                content: r.content,
                score: (r as { score?: number }).score,
              })),
              meta: {
                task,
                returnedRules: kept.length,
                totalRules: filtered.length,
                tokenCount: used,
                provider: detectedClient,
              },
            })
          : `# Prism Architectural Rules\n\n**Task:** "${task || "general"}"\n**Rules:** ${kept.length} of ${filtered.length} (${used} tokens)\n\n${kept.map((r) => `## ${r.name}\n\n**Priority:** ${r.priority || 50} | **Category:** ${r.category || "general"}\n\n${r.content}`).join("\n\n---\n\n")}`;

        return { content: [{ type: "text" as const, text }] };
      }

      case "get_skill": {
        const skillId = a.skillId as string;
        if (!skillId)
          return {
            content: [{ type: "text", text: "Error: skillId is required." }],
            isError: true,
          };

        const doc = rules.find(
          (r) =>
            r._id === skillId ||
            r.id === skillId ||
            r.slug === skillId ||
            (r.name || "").toLowerCase().includes(skillId.toLowerCase()),
        );
        if (!doc)
          return {
            content: [{ type: "text", text: `Skill "${skillId}" not found.` }],
            isError: true,
          };

        const skillContent = doc.skillsContent || doc.content || "";
        return {
          content: [
            { type: "text" as const, text: `# ${doc.name}\n\n${skillContent}` },
          ],
        };
      }

      case "prism_check":
      case "validate_code": {
        const code = a.code as string;
        if (!code)
          return {
            content: [{ type: "text", text: "Error: code is required." }],
            isError: true,
          };

        const patternRules = rules.filter(
          (r) => r.pattern && r.isActive !== false,
        );
        if (patternRules.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "pass",
                  violations: [],
                  checkedRules: 0,
                  note: "No pattern rules in local cache. Run `prism sync` to populate.",
                }),
              },
            ],
          };
        }

        const violations: Array<Record<string, unknown>> = [];
        for (const rule of patternRules) {
          try {
            const regex = new RegExp(rule.pattern!, "g");
            let match: RegExpExecArray | null;
            while ((match = regex.exec(code)) !== null) {
              const idx = match.index;
              const before = code.slice(0, idx);
              const lines = before.split("\n");
              violations.push({
                ruleId: rule._id || rule.id || rule.slug,
                ruleName: rule.name,
                pattern: rule.pattern,
                message: rule.content,
                severity: rule.severity || "warning",
                line: lines.length,
                column: (lines[lines.length - 1] || "").length + 1,
                endLine: lines.length,
                endColumn:
                  (lines[lines.length - 1] || "").length + match[0].length + 1,
                matchedText: match[0],
                suggestion: `Fix for "${rule.name}"`,
              });
            }
          } catch {
            /* invalid regex */
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
        const violation = a.violation as Record<string, unknown> | undefined;
        const fixCode = a.code as string | undefined;
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

        const matchedText = (violation.matchedText as string) || "";
        const ruleName = (violation.ruleName as string) || "";
        const pattern = (violation.pattern as string) || "";
        let correctedCode = fixCode;
        let confidence = 0;
        const changes: Array<{ line: number; from: string; to: string }> = [];

        if (
          pattern.includes("../../apps/") ||
          pattern.includes("../apps/") ||
          matchedText.includes("../../apps/")
        ) {
          const fixed = matchedText.replace(/\.\.\/\.\.\/apps\/\w+/g, "@repo");
          correctedCode = fixCode.replace(matchedText, fixed);
          confidence = 0.95;
          changes.push({
            line: (violation.line as number) || 0,
            from: matchedText,
            to: fixed,
          });
        } else if (
          pattern.includes("style={") ||
          matchedText.includes("style={{")
        ) {
          correctedCode = fixCode.replace(
            /style=\{\{[^}]*\}\}/g,
            "{/* TODO: Replace with Tailwind classes */}",
          );
          confidence = 0.6;
          changes.push({
            line: (violation.line as number) || 0,
            from: matchedText,
            to: "{/* TODO: Tailwind */}",
          });
        } else if (
          pattern.includes("console.") ||
          matchedText.includes("console.")
        ) {
          correctedCode = fixCode.replace(
            /console\.(log|warn|error|debug|info)\([^)]*\);?/g,
            (m) => `// ${m.trim()}`,
          );
          confidence = 0.9;
          changes.push({
            line: (violation.line as number) || 0,
            from: matchedText,
            to: `// ${matchedText}`,
          });
        } else {
          const codeLines = fixCode.split("\n");
          const targetLine = ((violation.line as number) || 1) - 1;
          if (targetLine >= 0 && targetLine < codeLines.length) {
            const original = codeLines[targetLine];
            if (original !== undefined) {
              codeLines[targetLine] = `${original} // FIXME: ${ruleName}`;
              correctedCode = codeLines.join("\n");
              confidence = 0.3;
              changes.push({
                line: (violation.line as number) || 0,
                from: original,
                to: codeLines[targetLine] as string,
              });
            }
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

      case "repo_extract": {
        return {
          content: [
            {
              type: "text",
              text: "repo_extract requires the full MCP server with AI provider access. Run without --offline.",
            },
          ],
          isError: true,
        };
      }

      case "validate_code_pattern": {
        const code = a.code as string;
        if (!code)
          return {
            content: [{ type: "text", text: "No code provided." }],
            isError: true,
          };

        const patternRules = rules.filter(
          (r) => r.pattern && r.isActive !== false,
        );
        const v: string[] = [];
        for (const rule of patternRules) {
          try {
            if (new RegExp(rule.pattern!, "gi").test(code)) {
              v.push(
                `${rule.severity === "error" ? "❌" : "⚠️"} **${rule.name}**: ${rule.content}`,
              );
            }
          } catch {
            /* skip */
          }
        }
        const text =
          v.length === 0
            ? "✅ No violations detected."
            : `# Code Validation Report\n\n${v.join("\n\n")}`;
        return { content: [{ type: "text", text }] };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    chalk.green("✓ Prism MCP Server running (lite mode — local cache)"),
  );
  console.error(chalk.dim(`  Rules loaded: ${rules.length} | Tools: 8`));
}
