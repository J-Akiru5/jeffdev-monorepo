import Link from "next/link";
import {
  Layers,
  Database,
  Terminal,
  Zap,
  ArrowRight,
} from "lucide-react";

const apps = [
  {
    name: "prism-engine",
    port: 3001,
    description: "Prism SaaS dashboard — rules, projects, brands, API keys",
    stack: "Next.js 16 + Supabase + Cosmos DB",
    color: "from-violet-500 to-purple-600",
    href: "/docs/apps/prism-engine",
  },
  {
    name: "prism-mcp-server",
    port: null,
    description: "MCP server — AI governance brain for IDEs",
    stack: "Node.js + MCP SDK + Cosmos DB + Gemini",
    color: "from-blue-500 to-cyan-600",
    href: "/docs/apps/prism-mcp-server",
  },
  {
    name: "prism-context-engine",
    port: null,
    description: "CLI tool — prism init, serve, sync, kitchen",
    stack: "Node.js + Commander.js (npm package)",
    color: "from-emerald-500 to-teal-600",
    href: "/docs/apps/prism-context-engine",
  },
  {
    name: "prism-docs",
    port: 3002,
    description: "Documentation site with AI-powered search",
    stack: "Nextra 4 + Gemini",
    color: "from-orange-500 to-amber-600",
    href: "/docs/apps/prism-docs",
  },
  {
    name: "prism-admin",
    port: 3004,
    description: "System admin — users, data, content management",
    stack: "Next.js 16 + Supabase + MongoDB",
    color: "from-red-500 to-rose-600",
    href: "/docs/apps/prism-admin",
  },
  {
    name: "prism-manage",
    port: 3007,
    description: "Project management — tasks, calendar, GitHub sync",
    stack: "Next.js 16 + Supabase + FullCalendar",
    color: "from-pink-500 to-fuchsia-600",
    href: "/docs/apps/prism-manage",
  },
  {
    name: "syntaxure-labs",
    port: 3000,
    description: "Marketing site — agency portfolio, payments, CMS",
    stack: "Next.js 16 + Supabase + PayPal",
    color: "from-yellow-500 to-orange-600",
    href: "/docs/apps/syntaxure-labs",
  },
  {
    name: "prism-analytics",
    port: 8000,
    description: "Analytics service — data analysis, reporting",
    stack: "Python + FastAPI + pandas",
    color: "from-indigo-500 to-violet-600",
    href: "/docs/apps/prism-analytics",
  },
];

const packages = [
  {
    name: "@syntaxure-labs/db",
    description: "Unified data layer — Cosmos DB, Gremlin, Prisma, Zod schemas",
    href: "/docs/packages/db",
  },
  {
    name: "@syntaxure/ui",
    description: "Ghost Glow design system — 40+ components",
    href: "/docs/packages/ui",
  },
  {
    name: "@syntaxure/supabase",
    description: "Supabase client factory (SSR, browser, admin)",
    href: "/docs/packages/supabase",
  },
  {
    name: "@syntaxure/redis",
    description: "Upstash Redis — rate limiting + caching",
    href: "/docs/packages/redis",
  },
];

export default function ArchitecturePage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-white">Architecture Overview</h1>
        <p className="mt-2 text-zinc-400">
          System architecture, data flows, and technical decisions for the JeffDev monorepo.
        </p>
      </div>

      {/* System Diagram */}
      <section className="glass p-8">
        <h2 className="mb-6 text-xl font-semibold text-white">System Architecture</h2>
        <div className="relative">
          {/* Layer 1: Clients */}
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Clients
            </h3>
            <div className="flex flex-wrap gap-3">
              {["Cursor", "Windsurf", "VS Code", "Claude Desktop", "GitHub Copilot", "Web Browser"].map(
                (client) => (
                  <div
                    key={client}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-zinc-300"
                  >
                    {client}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="mb-8 flex justify-center">
            <div className="text-zinc-600">| MCP stdio / HTTPS |</div>
          </div>

          {/* Layer 2: Apps */}
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Applications
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {apps.map((app) => (
                <Link
                  key={app.name}
                  href={app.href}
                  className="glass glass-hover group p-4 transition-all"
                >
                  <div className={`mb-2 h-1 w-12 rounded-full bg-gradient-to-r ${app.color}`} />
                  <h4 className="font-mono text-sm font-medium text-white">
                    {app.name}
                  </h4>
                  {app.port && (
                    <span className="text-xs text-zinc-500">:{app.port}</span>
                  )}
                  <p className="mt-1 text-xs text-zinc-400">{app.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-8 flex justify-center">
            <div className="text-zinc-600">| Shared Packages |</div>
          </div>

          {/* Layer 3: Packages */}
          <div className="mb-8">
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Packages
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg) => (
                <Link
                  key={pkg.name}
                  href={pkg.href}
                  className="glass glass-hover p-4 transition-all"
                >
                  <h4 className="font-mono text-sm font-medium text-violet-400">
                    {pkg.name}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-400">{pkg.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mb-8 flex justify-center">
            <div className="text-zinc-600">| Data Layer |</div>
          </div>

          {/* Layer 4: Data */}
          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-zinc-500">
              Data Stores
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="glass p-4">
                <Database className="mb-2 h-6 w-6 text-green-400" />
                <h4 className="font-medium text-white">Supabase (PostgreSQL)</h4>
                <p className="mt-1 text-xs text-zinc-400">
                  Agency data, users, projects, quotes, invoices, tasks
                </p>
              </div>
              <div className="glass p-4">
                <Database className="mb-2 h-6 w-6 text-blue-400" />
                <h4 className="font-medium text-white">Cosmos DB (MongoDB)</h4>
                <p className="mt-1 text-xs text-zinc-400">
                  Prism rules, skills, projects, brands, components, telemetry
                </p>
              </div>
              <div className="glass p-4">
                <Zap className="mb-2 h-6 w-6 text-yellow-400" />
                <h4 className="font-medium text-white">Upstash Redis</h4>
                <p className="mt-1 text-xs text-zinc-400">
                  Rate limiting, response caching
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Flow */}
      <section className="glass p-8">
        <h2 className="mb-6 text-xl font-semibold text-white">
          Prism Data Flow (Every AI Prompt)
        </h2>
        <div className="space-y-4 text-sm text-zinc-300">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-400">
              1
            </span>
            <p>Developer types in IDE (Cursor, Windsurf, VS Code, Claude)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-400">
              2
            </span>
            <p>IDE launches <code>prism serve</code> (configured via <code>prism init</code>)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-400">
              3
            </span>
            <p><code>prism serve</code> spawns <code>prism-mcp-server --standalone</code></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-400">
              4
            </span>
            <p>MCP server connects to Cosmos DB directly, Gemini embeds task for smart rule selection</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-400">
              5
            </span>
            <p>Only relevant rules returned, ranked by cosine similarity, compressed + cached (LRU)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-400">
              6
            </span>
            <p>AI generates code with governance context. <code>prism_check</code> validates on save.</p>
          </div>
        </div>
      </section>

      {/* Key Decisions */}
      <section className="glass p-8">
        <h2 className="mb-6 text-xl font-semibold text-white">
          Key Architecture Decisions
        </h2>
        <div className="space-y-4">
          {[
            {
              decision: "Dual-database strategy",
              rationale:
                "PostgreSQL (Supabase) for relational agency data with strict integrity. Cosmos DB (MongoDB) for flexible Prism schema (rules, skills, brands). Intentional separation.",
            },
            {
              decision: "prism serve as canonical MCP entry point",
              rationale:
                "Spawns full MCP server as child process with stdio relay. Replaces broken connect.ts proxy. Zero code duplication between CLI and server.",
            },
            {
              decision: "Gemini primary, Azure fallback",
              rationale:
                "Gemini 3.5 Flash for chat, Gemini Embedding 2 (3072 dims) for smart selection. Azure OpenAI as fallback via AI_PROVIDER env var.",
            },
            {
              decision: "On-the-fly embeddings",
              rationale:
                "Rules don't store vectors in DB. Smart-select batch-embeds on first fetch, caches in memory. Reduces DB storage costs.",
            },
            {
              decision: "No cross-app imports",
              rationale:
                "Shared code lives in packages/. Enforced by monorepo boundaries. Apps only import from packages, never from each other.",
            },
          ].map((item) => (
            <div key={item.decision} className="rounded-lg bg-white/[0.02] p-4">
              <h3 className="font-medium text-white">{item.decision}</h3>
              <p className="mt-1 text-sm text-zinc-400">{item.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Explore</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/docs/apps"
            className="glass glass-hover flex items-center justify-between p-4"
          >
            <div>
              <Layers className="mb-2 h-5 w-5 text-violet-400" />
              <h3 className="font-medium text-white">App Documentation</h3>
              <p className="text-xs text-zinc-400">Per-app docs and APIs</p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-600" />
          </Link>
          <Link
            href="/docs/database"
            className="glass glass-hover flex items-center justify-between p-4"
          >
            <div>
              <Database className="mb-2 h-5 w-5 text-blue-400" />
              <h3 className="font-medium text-white">Database Schema</h3>
              <p className="text-xs text-zinc-400">Tables, collections, relations</p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-600" />
          </Link>
          <Link
            href="/docs/workflows"
            className="glass glass-hover flex items-center justify-between p-4"
          >
            <div>
              <Terminal className="mb-2 h-5 w-5 text-green-400" />
              <h3 className="font-medium text-white">Workflows</h3>
              <p className="text-xs text-zinc-400">User journeys and dev flows</p>
            </div>
            <ArrowRight className="h-4 w-4 text-zinc-600" />
          </Link>
        </div>
      </section>
    </div>
  );
}
