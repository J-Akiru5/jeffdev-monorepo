import { notFound } from "next/navigation";

const appDocs: Record<
  string,
  {
    title: string;
    port: number | null;
    stack: string;
    description: string;
    features: string[];
    keyFiles: { path: string; purpose: string }[];
    endpoints?: { path: string; method: string; description: string }[];
    envVars?: { name: string; description: string }[];
    testing: string;
    knownIssues?: string[];
  }
> = {
  "prism-engine": {
    title: "prism-engine",
    port: 3001,
    stack: "Next.js 16 + Supabase + Azure Cosmos DB + Sentry + Sandpack + OpenAI + Gemini",
    description:
      "The Prism SaaS dashboard — user-facing portal for the Prism Context Engine product. Manages rules, projects, brands, components, API keys, and serves as the MCP proxy endpoint for IDE connections.",
    features: [
      "Rule management (CRUD, categories, tags, priorities)",
      "Project management with brand profiles",
      "API key management with SHA-256 hashing",
      "Subscription management (PayPal integration)",
      "AI-powered rule generation (Gemini + OpenAI)",
      "Skill Studio for procedural workflow guides",
      "MCP proxy endpoint for IDE connections",
      "Usage analytics and telemetry dashboard",
      "Component library with Sandpack playgrounds",
      "Notification system",
    ],
    keyFiles: [
      { path: "src/app/(dashboard)/", purpose: "Dashboard pages (projects, rules, brands, skills)" },
      { path: "src/app/api/v1/", purpose: "RESTful API routes with API key auth" },
      { path: "src/app/api/webhooks/paypal/", purpose: "PayPal webhook handler" },
      { path: "src/lib/subscription-actions.ts", purpose: "Subscription and usage tracking" },
      { path: "src/lib/pricing-db.ts", purpose: "Pricing plans from Supabase" },
    ],
    endpoints: [
      { path: "/api/v1/rules", method: "GET/POST", description: "List/create rules with pagination" },
      { path: "/api/v1/rules/[id]", method: "GET/PATCH/DELETE", description: "Single rule CRUD" },
      { path: "/api/v1/projects", method: "GET/POST", description: "List/create projects" },
      { path: "/api/v1/brands", method: "GET/POST", description: "List/create brand profiles" },
      { path: "/api/v1/skills", method: "GET/POST", description: "List/create skills" },
      { path: "/api/v1/components", method: "GET", description: "List components" },
      { path: "/api/v1/api-keys", method: "GET/POST", description: "Manage API keys" },
      { path: "/api/v1/analytics", method: "GET", description: "Usage analytics" },
      { path: "/api/usage", method: "GET", description: "Current usage stats" },
      { path: "/api/webhooks/paypal", method: "POST", description: "PayPal webhook receiver" },
    ],
    envVars: [
      { name: "MONGODB_URI", description: "Cosmos DB connection string" },
      { name: "COSMOS_DATABASE_NAME", description: "Database name (default: prism)" },
      { name: "GEMINI_API_KEY", description: "Google Gemini API key" },
      { name: "NEXT_PUBLIC_SUPABASE_URL", description: "Supabase project URL" },
      { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Supabase anonymous key" },
      { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key" },
    ],
    testing: "Vitest (unit tests)",
  },
  "prism-mcp-server": {
    title: "prism-mcp-server",
    port: null,
    stack: "Node.js (ESM) + MCP SDK + Azure Cosmos DB + Google Gemini + OpenAI + gpt-tokenizer",
    description:
      "The AI brain — a Model Context Protocol server that delivers architectural rules, coding standards, and context governance to AI coding assistants. Implements 13+ MCP tools with smart selection via Gemini embeddings.",
    features: [
      "Smart rule selection via Gemini embeddings (cosine similarity)",
      "Progressive disclosure (rules + skills metadata)",
      "LRU caching (memory + disk, 50MB max)",
      "Token counting and telemetry",
      "Platform-specific response formatting (6 IDEs)",
      "Code validation (prism_check) and auto-fix (prism_fix)",
      "Playwright-based URL scanning for rule extraction",
      "Repo analysis and rule generation",
      "Client detection (Cursor, Windsurf, VS Code, Claude Desktop, Cline, Copilot)",
      "Governance memory for persistent AI agent context",
    ],
    keyFiles: [
      { path: "src/index.ts", purpose: "Entry point — DB connection, MCP handler dispatch, all tools" },
      { path: "src/middleware/smart-select.ts", purpose: "Gemini embedding ranking + skills" },
      { path: "src/middleware/cache.ts", purpose: "LRU cache (memory + disk)" },
      { path: "src/middleware/client-detector.ts", purpose: "6 IDE platform detection" },
      { path: "src/middleware/platform-formatter.ts", purpose: "Per-platform format/maxTokens" },
      { path: "src/tools/prism-check.ts", purpose: "Regex-based code validation" },
      { path: "src/tools/prism-fix.ts", purpose: "Auto-fix code violations" },
      { path: "src/lib/gemini.ts", purpose: "Gemini embeddings/chat (primary)" },
      { path: "src/lib/ai-router.ts", purpose: "AI provider routing (Gemini/Azure)" },
    ],
    envVars: [
      { name: "MONGODB_URI", description: "Cosmos DB connection string" },
      { name: "COSMOS_DATABASE_NAME", description: "Database name (default: prism)" },
      { name: "GEMINI_API_KEY", description: "Google Gemini API key" },
      { name: "GEMINI_MODEL", description: "Chat model (gemini-3.5-flash)" },
      { name: "GEMINI_EMBEDDING_MODEL", description: "Embedding model (gemini-embedding-2)" },
      { name: "AI_PROVIDER", description: "AI provider (gemini or azure)" },
    ],
    testing: "Vitest (109 unit tests) + E2E smoke test (18 tests)",
  },
  "prism-context-engine": {
    title: "prism-context-engine",
    port: null,
    stack: "Node.js (ESM) + Commander.js + Chalk + Ora + MCP SDK",
    description:
      "The Prism CLI tool — an npm-publishable package that provides the 'prism' command-line interface. This is the developer-facing entry point for the Prism ecosystem.",
    features: [
      "prism login — browser-based OAuth authentication",
      "prism init — auto-detect IDEs, write MCP config",
      "prism serve — start MCP server (full or lite fallback)",
      "prism sync — download rules/projects/brands from cloud",
      "prism kitchen — context budget management (analyze/preview/trim/optimize)",
      "prism rules/projects/brands — CRUD management",
      "prism generate — AI component generation",
      "prism doctor — 10-point health check",
      "prism status — quick state snapshot",
      "prism marketplace — rule set marketplace",
    ],
    keyFiles: [
      { path: "src/index.ts", purpose: "Commander.js CLI router (350 lines)" },
      { path: "src/commands/serve.ts", purpose: "MCP server launcher (full + lite fallback)" },
      { path: "src/commands/sync.ts", purpose: "Cloud sync with delta support" },
      { path: "src/commands/init.ts", purpose: "IDE auto-configuration" },
      { path: "src/commands/kitchen.ts", purpose: "Context budget management" },
      { path: "src/commands/doctor.ts", purpose: "Health check system" },
      { path: "src/api.ts", purpose: "REST API fetch helper" },
      { path: "src/config.ts", purpose: "~/.prism config management" },
    ],
    testing: "Vitest (46 tests, 44 passing, 2 skipped)",
  },
  "prism-docs": {
    title: "prism-docs",
    port: 3002,
    stack: "Nextra 4 + Next.js 16 + React 19 + Sentry + Tailwind CSS v4",
    description:
      "Documentation site for the Prism ecosystem. Features AI-powered search via Google Gemini and comprehensive guides for using Prism.",
    features: [
      "Nextra 4 documentation framework",
      "AI-powered search via Google Gemini",
      "Sentry error tracking",
      "Responsive design with Tailwind CSS v4",
    ],
    keyFiles: [
      { path: "src/app/", purpose: "Next.js app directory with MDX pages" },
      { path: "nextra.config.ts", purpose: "Nextra configuration" },
    ],
    testing: "None",
  },
  "prism-admin": {
    title: "prism-admin",
    port: 3004,
    stack: "Next.js 16 + Supabase + MongoDB + Resend + Framer Motion",
    description:
      "System administration dashboard. Internal tool for managing users, data, content, and system-level operations across the Prism and Syntaxure Labs platforms.",
    features: [
      "User management with RBAC",
      "Content management (CMS pages, sections)",
      "Quote and invoice management",
      "Feedback and message management",
      "Availability slot management",
      "Agency settings and configuration",
      "Audit logging",
      "Transactional email via Resend",
    ],
    keyFiles: [
      { path: "src/app/admin/", purpose: "Admin dashboard pages" },
      { path: "src/app/actions/", purpose: "Server actions for CRUD" },
      { path: "src/lib/database.types.ts", purpose: "Supabase type definitions" },
    ],
    testing: "Vitest + Playwright",
  },
  "prism-manage": {
    title: "prism-manage",
    port: 3007,
    stack: "Next.js 16 + Supabase + FullCalendar + GitHub API + Google APIs + Zustand",
    description:
      "Project and task management platform. Features calendar views, GitHub integration, Google Calendar sync, Kanban-style task boards, and guided tours.",
    features: [
      "Task management with Kanban boards",
      "Calendar views with FullCalendar",
      "GitHub integration via Octokit",
      "Google Calendar sync (stubbed — not yet functional)",
      "Workspace and department management with RBAC",
      "Dual-mode operation (Focus / Workspace)",
      "Marketing dashboard with KPI tracking",
      "Audit logging",
      "Guided tours via driver.js",
      "Virtual scrolling for large datasets",
      "Command palette (Cmd+K)",
      "AI assistant (Gemini 2.5 Flash)",
    ],
    keyFiles: [
      { path: "src/app/actions/", purpose: "Server actions (tasks, workspace, calendar, marketing)" },
      { path: "src/app/api/", purpose: "API routes (tasks, assistant)" },
      { path: "src/components/", purpose: "UI components (Kanban, calendar, forms, sidebar)" },
      { path: "src/stores/", purpose: "Zustand stores (workspace, project, manage-mode)" },
      { path: "src/lib/schemas.ts", purpose: "Zod schemas for all data types" },
      { path: "src/proxy.ts", purpose: "Middleware proxy (ORPHANED — see known issues)" },
    ],
    endpoints: [
      { path: "/api/tasks", method: "GET", description: "List tasks" },
      { path: "/api/assistant", method: "POST", description: "Gemini AI assistant (edge runtime)" },
      { path: "/api/workspace/update-c-level-title", method: "POST", description: "Update C-Level title" },
    ],
    envVars: [
      { name: "NEXT_PUBLIC_SUPABASE_URL", description: "Supabase project URL" },
      { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", description: "Supabase anonymous key" },
      { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key" },
      { name: "GEMINI_API_KEY", description: "Google Gemini API key (AI assistant)" },
      { name: "GITHUB_PAT", description: "GitHub personal access token (marketing sync)" },
      { name: "UPSTASH_REDIS_REST_URL", description: "Upstash Redis URL (rate limiting)" },
      { name: "UPSTASH_REDIS_REST_TOKEN", description: "Upstash Redis token" },
    ],
    testing: "Vitest (1 dummy test) + Playwright (2 specs, broken route prefixes)",
    knownIssues: [
      "No middleware.ts — proxy.ts is orphaned, Supabase session refresh never runs",
      "Missing API routes: /api/calendar/auth, /api/github/sync, /api/marketing/team, /api/auth/bridge/*",
      "Google Calendar OAuth is stubbed (buttons exist, endpoints don't)",
      "GitHub sync button calls nonexistent /api/github/sync route",
      "E2E tests use wrong route prefixes (/dashboard/tasks vs /tasks) and npm instead of pnpm",
      "33 lint warnings (unused imports, any types, hooks deps, <img> vs <Image />)",
      "Local command-palette.tsx (371 lines) is dead code — only @syntaxure/ui CommandPalette is used",
      "turbo.json missing GITHUB_PAT, GITHUB_MARKETING_REPO_OWNER, GITHUB_MARKETING_REPO_NAME env vars",
    ],
  },
  "syntaxure-labs": {
    title: "syntaxure-labs",
    port: 3000,
    stack: "Next.js 16 + React 19 + Supabase + Tailwind CSS v4 + Zustand + Recharts + PayPal + GSAP",
    description:
      "Flagship marketing site and client-facing SaaS platform. Agency portfolio, product catalog, payments, calendar, analytics, PDF generation, community features, and CMS.",
    features: [
      "Marketing site with GSAP/Lenis smooth scroll",
      "Product catalog with templates and pricing",
      "PayPal payment integration",
      "Quote and invoice generation (PDF)",
      "Calendar with event management",
      "Community features (posts, members)",
      "CMS with dynamic page sections",
      "Google Analytics integration",
      "Contact form with Resend email",
      "Waitlist management",
    ],
    keyFiles: [
      { path: "src/app/", purpose: "Next.js app directory (pages, layouts)" },
      { path: "src/components/", purpose: "React components" },
      { path: "src/lib/cms.ts", purpose: "CMS bridge layer" },
      { path: "src/data/cms-defaults.ts", purpose: "Fallback CMS content" },
    ],
    testing: "Vitest + Playwright",
  },
  "prism-analytics": {
    title: "prism-analytics",
    port: 8000,
    stack: "Python 3.11+ + FastAPI + uvicorn + Supabase + pandas + matplotlib + seaborn",
    description:
      "Python-based analytics service for Prism Engine. Provides data analysis, visualization, and reporting using pandas and matplotlib.",
    features: [
      "Lead conversion analysis",
      "KPI summary reporting",
      "Funnel analysis",
      "GTM (Go-to-Market) metrics",
      "Report export (PDF/CSV)",
      "Data visualization with matplotlib/seaborn",
    ],
    keyFiles: [
      { path: "src/main.py", purpose: "FastAPI application entry" },
      { path: "src/services/supabase.py", purpose: "Supabase client (read-only)" },
      { path: "src/models/schemas.py", purpose: "Pydantic response models" },
    ],
    envVars: [
      { name: "SUPABASE_URL", description: "Supabase project URL" },
      { name: "SUPABASE_SERVICE_ROLE_KEY", description: "Supabase service role key" },
    ],
    testing: "pytest",
  },
};

export default async function AppDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = appDocs[slug];

  if (!doc) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <h1 className="font-mono text-3xl font-bold text-white">
            {doc.title}
          </h1>
          {doc.port && (
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-sm text-zinc-400">
              :{doc.port}
            </span>
          )}
        </div>
        <p className="text-zinc-400">{doc.description}</p>
      </div>

      <section className="glass p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Tech Stack</h2>
        <p className="font-mono text-sm text-zinc-300">{doc.stack}</p>
      </section>

      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Features</h2>
        <ul className="space-y-2">
          {doc.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm text-zinc-300"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
              {feature}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Key Files</h2>
        <div className="space-y-2">
          {doc.keyFiles.map((file) => (
            <div
              key={file.path}
              className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-4 py-3"
            >
              <code className="shrink-0 text-sm text-violet-400">
                {file.path}
              </code>
              <span className="text-sm text-zinc-400">{file.purpose}</span>
            </div>
          ))}
        </div>
      </section>

      {doc.endpoints && doc.endpoints.length > 0 && (
        <section className="glass p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            API Endpoints
          </h2>
          <div className="space-y-2">
            {doc.endpoints.map((ep) => (
              <div
                key={ep.path}
                className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-4 py-3"
              >
                <span className="shrink-0 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                  {ep.method}
                </span>
                <code className="shrink-0 text-sm text-zinc-300">
                  {ep.path}
                </code>
                <span className="text-sm text-zinc-500">
                  {ep.description}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {doc.envVars && doc.envVars.length > 0 && (
        <section className="glass p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Environment Variables
          </h2>
          <div className="space-y-2">
            {doc.envVars.map((v) => (
              <div
                key={v.name}
                className="flex items-start gap-3 rounded-lg bg-white/[0.02] px-4 py-3"
              >
                <code className="shrink-0 text-sm text-yellow-400">
                  {v.name}
                </code>
                <span className="text-sm text-zinc-400">{v.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="glass p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Testing</h2>
        <p className="text-sm text-zinc-300">{doc.testing}</p>
      </section>

      {doc.knownIssues && doc.knownIssues.length > 0 && (
        <section className="glass border-red-500/20 p-6">
          <h2 className="mb-4 text-lg font-semibold text-red-400">
            Known Issues
          </h2>
          <ul className="space-y-2">
            {doc.knownIssues.map((issue) => (
              <li
                key={issue}
                className="flex items-start gap-2 text-sm text-zinc-300"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {issue}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
