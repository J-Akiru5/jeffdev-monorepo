import { Database } from "lucide-react";

const supabaseModels = [
  { name: "UserProfile", table: "user_profiles", description: "Users with RBAC (admin/manager/employee/client)", relations: ["projects", "quotes", "invoices", "tasks", "subscriptions", "notifications"] },
  { name: "Client", table: "clients", description: "Client identity (Phase 1A normalization)", relations: ["projects", "clientContracts"] },
  { name: "Project", table: "projects", description: "Client projects with budget, status, publishing", relations: ["milestones", "quotes", "invoices", "tasks", "calendarEvents"] },
  { name: "Task", table: "tasks", description: "Kanban tasks with hierarchy, workspaces, departments", relations: ["tags", "calendarEvents"] },
  { name: "Quote", table: "quotes", description: "Quotes with line items, template references", relations: ["invoices", "quoteServices", "clientContracts"] },
  { name: "Invoice", table: "invoices", description: "Invoices with payment tracking", relations: ["user", "quote", "project"] },
  { name: "Subscription", table: "subscriptions", description: "SaaS subscriptions with PayPal integration", relations: ["user"] },
  { name: "CalendarEvent", table: "calendar_events", description: "Events with Google Calendar sync", relations: ["user", "project", "linkedTask"] },
  { name: "Workspace", table: "workspaces", description: "Team workspaces", relations: ["members", "departments"] },
  { name: "WorkspaceMember", table: "workspace_members", description: "Workspace membership with roles", relations: ["workspace", "user"] },
  { name: "ProductTemplate", table: "product_templates", description: "Product/boilerplate templates", relations: ["contractTerms", "quotes"] },
  { name: "ClientContract", table: "client_contracts", description: "Client contracts with Maya payment", relations: ["client", "quote"] },
  { name: "Tag", table: "tags", description: "Universal tag system (junction tables)", relations: ["taskTags", "releaseTags"] },
  { name: "SitePage", table: "site_pages", description: "CMS page registry", relations: ["sections"] },
  { name: "PageSection", table: "page_sections", description: "Normalized CMS content sections", relations: ["page"] },
  { name: "SupportTicket", table: "support_tickets", description: "Support tickets with tags", relations: ["user", "assignee"] },
  { name: "WebhookEvent", table: "webhook_events", description: "Payment webhook events (PayPal/Maya/Stripe)", relations: [] },
  { name: "AuditLog", table: "audit_logs", description: "Audit trail", relations: ["user"] },
  { name: "Notification", table: "notifications", description: "User notifications", relations: ["user"] },
];

const cosmosCollections = [
  { name: "rules", description: "Architectural rules with categories, tags, priorities, embeddings", zodSchema: "RuleSchema" },
  { name: "skills", description: "Procedural workflow guides (step-by-step)", zodSchema: "SkillSchema" },
  { name: "projects", description: "Prism projects (linked to rules, brands)", zodSchema: "PrismProjectSchema" },
  { name: "brands", description: "Enterprise brand profiles (colors, typography, voice)", zodSchema: "PrismBrandSchema" },
  { name: "components", description: "UI component library entries", zodSchema: "ComponentSchema" },
  { name: "videoTranscripts", description: "Video transcript entries for semantic search", zodSchema: "VideoTranscriptSchema" },
  { name: "apiKeys", description: "API keys with SHA-256 hashing", zodSchema: "ApiKeySchema" },
  { name: "prism_telemetry", description: "Token usage and cache hit events", zodSchema: "UsageSchema" },
  { name: "governance_memory", description: "Persistent AI agent memory across sessions", zodSchema: "N/A" },
  { name: "webhook_events", description: "Idempotent webhook processing", zodSchema: "N/A" },
];

export default function DatabasePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Database Schema</h1>
        <p className="mt-2 text-zinc-400">
          Complete schema reference for Supabase (PostgreSQL) and Cosmos DB (MongoDB).
        </p>
      </div>

      {/* Architecture */}
      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Dual-Database Architecture
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <Database className="mb-2 h-6 w-6 text-green-400" />
            <h3 className="font-medium text-white">Supabase (PostgreSQL)</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Agency data, users, projects, quotes, invoices, tasks, subscriptions, CMS.
              Relational integrity, RLS policies, 40+ models via Prisma.
            </p>
          </div>
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <Database className="mb-2 h-6 w-6 text-blue-400" />
            <h3 className="font-medium text-white">Cosmos DB (MongoDB)</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Prism SaaS data, rules, skills, brands, components, telemetry.
              Schema flexibility, vector embeddings, Gremlin graph for relationships.
            </p>
          </div>
        </div>
      </section>

      {/* Supabase Tables */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">
          Supabase Tables (Prisma Models)
        </h2>
        <div className="space-y-3">
          {supabaseModels.map((model) => (
            <div key={model.name} className="glass p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-white">{model.name}</h3>
                  <code className="text-xs text-zinc-500">{model.table}</code>
                </div>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{model.description}</p>
              {model.relations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {model.relations.map((rel) => (
                    <span
                      key={rel}
                      className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400"
                    >
                      {rel}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Cosmos DB Collections */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">
          Cosmos DB Collections
        </h2>
        <div className="space-y-3">
          {cosmosCollections.map((col) => (
            <div key={col.name} className="glass p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-mono font-medium text-white">{col.name}</h3>
                  {col.zodSchema !== "N/A" && (
                    <code className="text-xs text-zinc-500">{col.zodSchema}</code>
                  )}
                </div>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{col.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Zod Schemas */}
      <section className="glass p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Zod Schemas (Runtime Validation)
        </h2>
        <p className="mb-3 text-sm text-zinc-400">
          Located in <code>@syntaxure-labs/db/schema</code> — the single source of truth for data structures across all apps.
        </p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {[
            "UserSchema",
            "RuleSchema",
            "RuleSetSchema",
            "ProjectSchema",
            "InvoiceSchema",
            "PrismProjectSchema",
            "ComponentSchema",
            "SubscriptionSchema",
            "UsageSchema",
            "VideoTranscriptSchema",
            "ApiKeySchema",
            "AvailabilitySlotSchema",
            "PrismBrandSchema",
          ].map((schema) => (
            <div
              key={schema}
              className="rounded bg-white/[0.02] px-3 py-2 text-sm text-zinc-300"
            >
              {schema}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
