import { Database } from "lucide-react";

const packages = [
  {
    name: "@syntaxure-labs/db",
    exportName: "db",
    description: "The Data Nexus — unified database access layer for Cosmos DB, Gremlin graph, and Prisma (PostgreSQL).",
    features: [
      "Cosmos DB singleton client with connection pooling (maxPoolSize: 10)",
      "Gremlin graph client for rule relationships",
      "Prisma client for Supabase PostgreSQL",
      "Zod schemas as single source of truth for data structures",
      "Webhook publisher for n8n automation",
    ],
    exports: [
      { name: "@syntaxure-labs/db", description: "Main export (Zod schemas, types)" },
      { name: "@syntaxure-labs/db/cosmos", description: "MongoDB/Cosmos DB client" },
      { name: "@syntaxure-labs/db/schema", description: "Zod validation schemas" },
      { name: "@syntaxure-labs/db/prisma", description: "Prisma client singleton" },
      { name: "@syntaxure-labs/db/prisma-types", description: "Prisma-generated types" },
    ],
    href: "/docs/packages/db",
  },
  {
    name: "@syntaxure/ui",
    exportName: "ui",
    description: "Ghost Glow design system — dark-mode-only, glassmorphic aesthetic. 40+ components.",
    features: [
      "Core components: Button, Card, Input, Badge, Select, ProgressBar",
      "Layout: PageContainer, GlassPanel, GridBackground, SectionHeader",
      "Data: DataTable (TanStack Table), MetricTile, EmptyState, Skeleton",
      "Complex: ChatAssistant, CommandPalette, ImageUpload, ProfileEditor",
      "Navigation: AccountDropdown, AppTopNavbar, StatusBarFooter",
      "Hooks: useDebouncedValue, useActionFeedback, KeyboardShortcuts",
      "Providers: AuthProvider, FeatureFlagProvider, ThemeDefaultSync",
    ],
    exports: [
      { name: "@syntaxure/ui", description: "Component library" },
    ],
    href: "/docs/packages/ui",
  },
  {
    name: "@syntaxure/supabase",
    exportName: "supabase",
    description: "Supabase client factory for Next.js. SSR-compatible server, browser, and admin clients.",
    features: [
      "createServer() — SSR-compatible with Next.js cookies",
      "createBrowser() — client-side browser client",
      "createAdmin() — service-role client (bypasses RLS)",
      "updateSession() — middleware session refresh",
    ],
    exports: [
      { name: "@syntaxure/supabase", description: "Main export" },
      { name: "@syntaxure/supabase/server", description: "Server client" },
      { name: "@syntaxure/supabase/browser", description: "Browser client" },
      { name: "@syntaxure/supabase/admin", description: "Admin client" },
      { name: "@syntaxure/supabase/middleware", description: "Middleware helper" },
    ],
    href: "/docs/packages/supabase",
  },
  {
    name: "@syntaxure/redis",
    exportName: "redis",
    description: "Upstash Redis integration for rate limiting and response caching.",
    features: [
      "checkRateLimit() / getRateLimitHeaders() — tier-based rate limiting",
      "getCachedResponse() / cacheResponse() — server-side caching",
      "Tier limits: strict (10 req/10s), free, pro, team, enterprise",
    ],
    exports: [
      { name: "@syntaxure/redis", description: "Rate limiting + caching" },
    ],
    href: "/docs/packages/redis",
  },
];

export default function PackagesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Packages</h1>
        <p className="mt-2 text-zinc-400">
          Shared packages that power the JeffDev monorepo.
        </p>
      </div>

      <div className="space-y-6">
        {packages.map((pkg) => (
          <section key={pkg.name} className="glass p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-mono text-xl font-semibold text-white">
                  {pkg.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">{pkg.description}</p>
              </div>
              <Database className="h-6 w-6 text-violet-400" />
            </div>

            <div className="mb-4">
              <h3 className="mb-2 text-sm font-medium text-zinc-300">
                Features
              </h3>
              <ul className="space-y-1.5">
                {pkg.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-zinc-400"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-zinc-300">
                Exports
              </h3>
              <div className="space-y-1.5">
                {pkg.exports.map((exp) => (
                  <div
                    key={exp.name}
                    className="flex items-start gap-3 rounded bg-white/[0.02] px-3 py-2"
                  >
                    <code className="shrink-0 text-sm text-violet-400">
                      {exp.name}
                    </code>
                    <span className="text-sm text-zinc-500">
                      {exp.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
