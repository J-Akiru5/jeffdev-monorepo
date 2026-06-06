import Link from "next/link";
import { ArrowRight } from "lucide-react";

const apps = [
  {
    name: "prism-engine",
    port: 3001,
    description: "Prism SaaS dashboard — user-facing portal for rules, projects, brands, components, API keys, and MCP proxy endpoint.",
    stack: "Next.js 16 + Supabase + Cosmos DB + Sentry + Sandpack + OpenAI + Gemini",
    deployed: true,
    color: "from-violet-500 to-purple-600",
    href: "/docs/apps/prism-engine",
  },
  {
    name: "prism-mcp-server",
    port: null,
    description: "MCP server — the AI brain. Delivers rules to IDEs via JSON-RPC stdio. 13+ tools, Gemini embeddings, LRU cache, telemetry.",
    stack: "Node.js + MCP SDK + Cosmos DB + Gemini + OpenAI",
    deployed: false,
    color: "from-blue-500 to-cyan-600",
    href: "/docs/apps/prism-mcp-server",
  },
  {
    name: "prism-context-engine",
    port: null,
    description: "CLI tool (npm package). Commands: init, serve, sync, login, kitchen, rules, projects, brands, generate, doctor.",
    stack: "Node.js + Commander.js + Chalk + MCP SDK",
    deployed: false,
    color: "from-emerald-500 to-teal-600",
    href: "/docs/apps/prism-context-engine",
  },
  {
    name: "prism-docs",
    port: 3002,
    description: "Documentation site for Prism ecosystem. AI-powered search via Google Gemini.",
    stack: "Nextra 4 + Next.js 16 + Gemini",
    deployed: true,
    color: "from-orange-500 to-amber-600",
    href: "/docs/apps/prism-docs",
  },
  {
    name: "prism-admin",
    port: 3004,
    description: "System admin dashboard. Internal tool for managing users, data, content, and system-level operations.",
    stack: "Next.js 16 + Supabase + MongoDB + Resend",
    deployed: true,
    color: "from-red-500 to-rose-600",
    href: "/docs/apps/prism-admin",
  },
  {
    name: "prism-manage",
    port: 3007,
    description: "Project management platform. Tasks, calendar, GitHub sync, Kanban boards, guided tours.",
    stack: "Next.js 16 + Supabase + FullCalendar + GitHub API",
    deployed: true,
    color: "from-pink-500 to-fuchsia-600",
    href: "/docs/apps/prism-manage",
  },
  {
    name: "syntaxure-labs",
    port: 3000,
    description: "Flagship marketing site and client-facing SaaS. PayPal payments, calendar, analytics, PDF generation, CMS.",
    stack: "Next.js 16 + Supabase + PayPal + Resend + GSAP",
    deployed: true,
    color: "from-yellow-500 to-orange-600",
    href: "/docs/apps/syntaxure-labs",
  },
  {
    name: "prism-analytics",
    port: 8000,
    description: "Python analytics service. Data analysis, visualization, and reporting for Prism Engine.",
    stack: "Python + FastAPI + Supabase + pandas + matplotlib",
    deployed: false,
    color: "from-indigo-500 to-violet-600",
    href: "/docs/apps/prism-analytics",
  },
];

export default function AppsIndexPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">App Documentation</h1>
        <p className="mt-2 text-zinc-400">
          Detailed documentation for each application in the JeffDev monorepo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {apps.map((app) => (
          <Link
            key={app.name}
            href={app.href}
            className="glass glass-hover group p-6 transition-all"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${app.color}`} />
              <div className="flex items-center gap-2">
                {app.port && (
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-zinc-500">
                    :{app.port}
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    app.deployed
                      ? "badge-success"
                      : "badge-warning"
                  }`}
                >
                  {app.deployed ? "Deployed" : "Internal"}
                </span>
              </div>
            </div>
            <h2 className="font-mono text-lg font-semibold text-white group-hover:text-violet-400 transition-colors">
              {app.name}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">{app.description}</p>
            <p className="mt-2 text-xs text-zinc-500">{app.stack}</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
              View documentation <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
