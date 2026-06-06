import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const mcpStabilityTasks = [
  {
    title: "Fix tsx path resolution in serve.ts",
    description:
      "The full MCP server launch searches for tsx at tsx@4.21.0 specifically in the .pnpm store. If the tsx version changes, this breaks silently and falls back to lite mode. Fix: resolve tsx dynamically or use npx.",
    status: "todo",
    priority: "critical",
    category: "mcp-stability",
    deadline: "2026-06-13",
    checklist: [
      { id: "1a", text: "Audit tsx resolution logic in serve.ts:157-170", completed: false },
      { id: "1b", text: "Implement dynamic tsx resolution (npx or which)", completed: false },
      { id: "1c", text: "Add fallback error logging instead of silent fail", completed: false },
      { id: "1d", text: "Test with different tsx versions", completed: false },
    ],
  },
  {
    title: "Add process health monitoring for MCP child process",
    description:
      "When prism serve spawns prism-mcp-server as a child process, there is no monitoring. If the child process dies, the parent doesn't know. Add health checks and restart logic.",
    status: "todo",
    priority: "critical",
    category: "mcp-stability",
    deadline: "2026-06-13",
    checklist: [
      { id: "2a", text: "Add exit event handler on child process", completed: false },
      { id: "2b", text: "Implement automatic restart on crash (max 3 retries)", completed: false },
      { id: "2c", text: "Log crash reasons to stderr for debugging", completed: false },
      { id: "2d", text: "Test with intentional crash scenarios", completed: false },
    ],
  },
  {
    title: "Add reconnection logic to MCP stdio relay",
    description:
      "If the stdio connection between IDE and MCP server drops, there is no reconnection. The IDE must restart. Add graceful reconnection.",
    status: "todo",
    priority: "high",
    category: "mcp-stability",
    deadline: "2026-06-14",
    checklist: [
      { id: "3a", text: "Detect stdio close/error events", completed: false },
      { id: "3b", text: "Implement reconnect with exponential backoff", completed: false },
      { id: "3c", text: "Preserve session state across reconnections", completed: false },
      { id: "3d", text: "Test with network interruption simulation", completed: false },
    ],
  },
  {
    title: "Replace silent catch blocks with structured logging",
    description:
      "Nearly every catch block in sync.ts, serve.ts, and kitchen.ts is empty or just logs a dim message. Replace with structured error logging that surfaces in diagnostics.",
    status: "todo",
    priority: "high",
    category: "mcp-stability",
    deadline: "2026-06-14",
    checklist: [
      { id: "4a", text: "Audit all silent catches in CLI commands", completed: false },
      { id: "4b", text: "Replace with chalk.red error messages + error codes", completed: false },
      { id: "4c", text: "Add --verbose flag for detailed error output", completed: false },
      { id: "4d", text: "Verify error messages are actionable", completed: false },
    ],
  },
  {
    title: "Add retry logic and timeouts to apiFetch",
    description:
      "All API calls via api.ts are single-attempt with no timeout. Network glitches cause immediate failure. Add retry with backoff and AbortSignal.timeout.",
    status: "todo",
    priority: "high",
    category: "mcp-stability",
    deadline: "2026-06-15",
    checklist: [
      { id: "5a", text: "Add AbortSignal.timeout(30000) to apiFetch", completed: false },
      { id: "5b", text: "Implement retry with exponential backoff (max 3)", completed: false },
      { id: "5c", text: "Add retry logic for 5xx errors and network failures", completed: false },
      { id: "5d", text: "Do not retry 4xx errors (client errors)", completed: false },
    ],
  },
  {
    title: "Fix fragile __dirname path traversal in serve.ts",
    description:
      "Uses __dirname + '../../../..' relative path to find apps/prism-mcp-server. This only works in monorepo context. When installed globally, full server is never found.",
    status: "todo",
    priority: "medium",
    category: "mcp-stability",
    deadline: "2026-06-15",
    checklist: [
      { id: "6a", text: "Document the expected install locations", completed: false },
      { id: "6b", text: "Add npm global install path detection", completed: false },
      { id: "6c", text: "Improve error message when full server not found", completed: false },
      { id: "6d", text: "Test with npm global install scenario", completed: false },
    ],
  },
  {
    title: "End-to-end IDE validation testing",
    description:
      "Tests pass but the MCP connection hasn't been validated in actual Cursor, Windsurf, and VS Code sessions. Test the full flow in real IDEs.",
    status: "todo",
    priority: "high",
    category: "mcp-stability",
    deadline: "2026-06-16",
    checklist: [
      { id: "7a", text: "Test prism init + prism serve in Cursor", completed: false },
      { id: "7b", text: "Test prism init + prism serve in Windsurf", completed: false },
      { id: "7c", text: "Test prism init + prism serve in VS Code", completed: false },
      { id: "7d", text: "Test offline/lite fallback in each IDE", completed: false },
      { id: "7e", text: "Document any IDE-specific issues found", completed: false },
    ],
  },
  {
    title: "Remove dead connect.ts code paths",
    description:
      "connect.ts has dead code: startMcpProxy() is defined but never called, connect without --url just prints deprecation message. Clean up or consolidate.",
    status: "todo",
    priority: "low",
    category: "mcp-stability",
    deadline: "2026-06-17",
    checklist: [
      { id: "8a", text: "Remove startMcpProxy() dead code", completed: false },
      { id: "8b", text: "Consolidate --url mode into serve.ts or extract.ts", completed: false },
      { id: "8c", text: "Update tests to reflect changes", completed: false },
    ],
  },
];

const documentationTasks = [
  {
    title: "Create architecture documentation",
    description: "Document system architecture, data flows, and key decisions in syntaxure-pm.",
    status: "completed",
    priority: "high",
    category: "documentation",
    deadline: "2026-06-06",
    checklist: [
      { id: "d1", text: "Architecture overview page", completed: true },
      { id: "d2", text: "System diagram", completed: true },
      { id: "d3", text: "Data flow documentation", completed: true },
    ],
  },
  {
    title: "Create app documentation pages",
    description: "Per-app documentation for all 8 apps in the monorepo.",
    status: "completed",
    priority: "high",
    category: "documentation",
    deadline: "2026-06-06",
    checklist: [
      { id: "d4", text: "prism-engine docs", completed: true },
      { id: "d5", text: "prism-mcp-server docs", completed: true },
      { id: "d6", text: "prism-context-engine docs", completed: true },
      { id: "d7", text: "All other app docs", completed: true },
    ],
  },
  {
    title: "Create database schema documentation",
    description: "Document all Supabase tables, Cosmos DB collections, and Zod schemas.",
    status: "completed",
    priority: "high",
    category: "documentation",
    deadline: "2026-06-06",
    checklist: [
      { id: "d8", text: "Supabase tables reference", completed: true },
      { id: "d9", text: "Cosmos DB collections reference", completed: true },
      { id: "d10", text: "Zod schemas reference", completed: true },
    ],
  },
  {
    title: "Create package documentation",
    description: "Document shared packages (db, ui, supabase, redis).",
    status: "completed",
    priority: "medium",
    category: "documentation",
    deadline: "2026-06-06",
    checklist: [
      { id: "d11", text: "@syntaxure-labs/db docs", completed: true },
      { id: "d12", text: "@syntaxure/ui docs", completed: true },
      { id: "d13", text: "@syntaxure/supabase docs", completed: true },
      { id: "d14", text: "@syntaxure/redis docs", completed: true },
    ],
  },
];

async function seed() {
  console.log("Seeding PM tasks...");

  const allTasks = [...mcpStabilityTasks, ...documentationTasks];

  for (const task of allTasks) {
    const { error } = await supabase.from("pm_tasks").insert({
      ...task,
      created_by: "00000000-0000-0000-0000-000000000000", // System user
    });

    if (error) {
      console.error(`Failed to insert task "${task.title}":`, error.message);
    } else {
      console.log(`  + ${task.title}`);
    }
  }

  console.log("Done!");
}

seed().catch(console.error);
