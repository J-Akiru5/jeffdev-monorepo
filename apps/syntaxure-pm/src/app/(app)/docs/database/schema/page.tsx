"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronRight, Database } from "lucide-react";

interface Field {
  name: string;
  type: string;
  nullable: boolean;
  description: string;
}

interface ModelSchema {
  name: string;
  table: string;
  description: string;
  fields: Field[];
  relations: string[];
  zodSchema?: string;
}

const schemas: ModelSchema[] = [
  {
    name: "UserProfile",
    table: "user_profiles",
    description: "Users with RBAC (admin/manager/employee/client)",
    zodSchema: "UserSchema",
    relations: ["projects", "quotes", "invoices", "tasks", "subscriptions", "notifications"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "email", type: "text", nullable: false, description: "User email address" },
      { name: "full_name", type: "text", nullable: true, description: "Display name" },
      { name: "avatar_url", type: "text", nullable: true, description: "Profile image URL" },
      { name: "role", type: "enum", nullable: false, description: "admin | manager | employee | client" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Account creation timestamp" },
      { name: "updated_at", type: "timestamptz", nullable: false, description: "Last update timestamp" },
    ],
  },
  {
    name: "Task",
    table: "tasks",
    description: "Kanban tasks with hierarchy, workspaces, departments",
    zodSchema: "TaskSchema",
    relations: ["tags", "calendarEvents"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "title", type: "text", nullable: false, description: "Task title" },
      { name: "description", type: "text", nullable: true, description: "Task description" },
      { name: "status", type: "enum", nullable: false, description: "backlog | todo | in_progress | in_review | approved" },
      { name: "priority", type: "enum", nullable: false, description: "low | medium | high | critical" },
      { name: "type", type: "enum", nullable: false, description: "feature | bug | nice_to_have | error" },
      { name: "workspace_id", type: "uuid", nullable: true, description: "FK to workspaces" },
      { name: "department_id", type: "uuid", nullable: true, description: "FK to departments" },
      { name: "assigned_to", type: "uuid", nullable: true, description: "FK to user_profiles" },
      { name: "created_by", type: "uuid", nullable: false, description: "FK to user_profiles" },
      { name: "due_date", type: "timestamptz", nullable: true, description: "Task deadline" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
      { name: "updated_at", type: "timestamptz", nullable: false, description: "Last update timestamp" },
    ],
  },
  {
    name: "Project",
    table: "projects",
    description: "Client projects with budget, status, publishing",
    zodSchema: "ProjectSchema",
    relations: ["milestones", "quotes", "invoices", "tasks", "calendarEvents"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "name", type: "text", nullable: false, description: "Project name" },
      { name: "description", type: "text", nullable: true, description: "Project description" },
      { name: "status", type: "enum", nullable: false, description: "planning | in_progress | review | completed | archived" },
      { name: "client_id", type: "uuid", nullable: true, description: "FK to clients" },
      { name: "budget", type: "numeric", nullable: true, description: "Project budget" },
      { name: "start_date", type: "date", nullable: true, description: "Project start date" },
      { name: "end_date", type: "date", nullable: true, description: "Project end date" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "Client",
    table: "clients",
    description: "Client identity (Phase 1A normalization)",
    zodSchema: "ClientSchema",
    relations: ["projects", "clientContracts"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "name", type: "text", nullable: false, description: "Client name" },
      { name: "email", type: "text", nullable: true, description: "Client email" },
      { name: "company", type: "text", nullable: true, description: "Company name" },
      { name: "phone", type: "text", nullable: true, description: "Phone number" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "Quote",
    table: "quotes",
    description: "Quotes with line items, template references",
    zodSchema: "QuoteSchema",
    relations: ["invoices", "quoteServices", "clientContracts"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "client_id", type: "uuid", nullable: true, description: "FK to clients" },
      { name: "project_id", type: "uuid", nullable: true, description: "FK to projects" },
      { name: "status", type: "enum", nullable: false, description: "draft | sent | accepted | rejected | expired" },
      { name: "total", type: "numeric", nullable: false, description: "Quote total" },
      { name: "valid_until", type: "date", nullable: true, description: "Quote expiry date" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "Invoice",
    table: "invoices",
    description: "Invoices with payment tracking",
    zodSchema: "InvoiceSchema",
    relations: ["user", "quote", "project"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "quote_id", type: "uuid", nullable: true, description: "FK to quotes" },
      { name: "project_id", type: "uuid", nullable: true, description: "FK to projects" },
      { name: "status", type: "enum", nullable: false, description: "draft | sent | paid | overdue | cancelled" },
      { name: "total", type: "numeric", nullable: false, description: "Invoice total" },
      { name: "paid_at", type: "timestamptz", nullable: true, description: "Payment timestamp" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "Workspace",
    table: "workspaces",
    description: "Team workspaces",
    relations: ["members", "departments"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "name", type: "text", nullable: false, description: "Workspace name" },
      { name: "slug", type: "text", nullable: false, description: "URL-safe identifier" },
      { name: "owner_id", type: "uuid", nullable: false, description: "FK to user_profiles" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "WorkspaceMember",
    table: "workspace_members",
    description: "Workspace membership with roles",
    relations: ["workspace", "user"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "workspace_id", type: "uuid", nullable: false, description: "FK to workspaces" },
      { name: "user_id", type: "uuid", nullable: false, description: "FK to user_profiles" },
      { name: "role", type: "enum", nullable: false, description: "founder | employee" },
      { name: "department_id", type: "uuid", nullable: true, description: "FK to departments" },
      { name: "title", type: "text", nullable: true, description: "C-Level title (CEO, CTO, etc.)" },
      { name: "joined_at", type: "timestamptz", nullable: false, description: "Join timestamp" },
    ],
  },
  {
    name: "CalendarEvent",
    table: "calendar_events",
    description: "Events with Google Calendar sync",
    zodSchema: "CalendarEventSchema",
    relations: ["user", "project", "linkedTask"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "title", type: "text", nullable: false, description: "Event title" },
      { name: "description", type: "text", nullable: true, description: "Event description" },
      { name: "start_time", type: "timestamptz", nullable: false, description: "Event start" },
      { name: "end_time", type: "timestamptz", nullable: false, description: "Event end" },
      { name: "user_id", type: "uuid", nullable: false, description: "FK to user_profiles" },
      { name: "project_id", type: "uuid", nullable: true, description: "FK to projects" },
      { name: "task_id", type: "uuid", nullable: true, description: "FK to tasks" },
      { name: "google_event_id", type: "text", nullable: true, description: "Google Calendar sync ID" },
    ],
  },
  {
    name: "AuditLog",
    table: "audit_logs",
    description: "Audit trail for all actions",
    relations: ["user"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "user_id", type: "uuid", nullable: false, description: "FK to user_profiles" },
      { name: "action", type: "text", nullable: false, description: "Action performed" },
      { name: "entity_type", type: "text", nullable: false, description: "Entity type (task, member, etc.)" },
      { name: "entity_id", type: "uuid", nullable: true, description: "Entity ID" },
      { name: "metadata", type: "jsonb", nullable: true, description: "Additional context" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Action timestamp" },
    ],
  },
  {
    name: "Notification",
    table: "notifications",
    description: "User notifications",
    relations: ["user"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "user_id", type: "uuid", nullable: false, description: "FK to user_profiles" },
      { name: "title", type: "text", nullable: false, description: "Notification title" },
      { name: "message", type: "text", nullable: true, description: "Notification body" },
      { name: "read", type: "boolean", nullable: false, description: "Read status" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "Subscription",
    table: "subscriptions",
    description: "SaaS subscriptions with PayPal integration",
    zodSchema: "SubscriptionSchema",
    relations: ["user"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "user_id", type: "uuid", nullable: false, description: "FK to user_profiles" },
      { name: "plan", type: "enum", nullable: false, description: "free | starter | pro | enterprise" },
      { name: "status", type: "enum", nullable: false, description: "active | cancelled | expired | past_due" },
      { name: "paypal_subscription_id", type: "text", nullable: true, description: "PayPal subscription ID" },
      { name: "current_period_end", type: "timestamptz", nullable: true, description: "Billing period end" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "Tag",
    table: "tags",
    description: "Universal tag system (junction tables)",
    relations: ["taskTags", "releaseTags"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "name", type: "text", nullable: false, description: "Tag name" },
      { name: "color", type: "text", nullable: true, description: "Tag color hex" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "SitePage",
    table: "site_pages",
    description: "CMS page registry",
    relations: ["sections"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "slug", type: "text", nullable: false, description: "URL slug" },
      { name: "title", type: "text", nullable: false, description: "Page title" },
      { name: "published", type: "boolean", nullable: false, description: "Publish status" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "PageSection",
    table: "page_sections",
    description: "Normalized CMS content sections",
    relations: ["page"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "page_id", type: "uuid", nullable: false, description: "FK to site_pages" },
      { name: "type", type: "text", nullable: false, description: "Section type (hero, features, etc.)" },
      { name: "content", type: "jsonb", nullable: false, description: "Section content" },
      { name: "sort_order", type: "integer", nullable: false, description: "Display order" },
    ],
  },
  {
    name: "ProductTemplate",
    table: "product_templates",
    description: "Product/boilerplate templates",
    relations: ["contractTerms", "quotes"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "name", type: "text", nullable: false, description: "Template name" },
      { name: "description", type: "text", nullable: true, description: "Template description" },
      { name: "price", type: "numeric", nullable: true, description: "Template price" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "ClientContract",
    table: "client_contracts",
    description: "Client contracts with Maya payment",
    relations: ["client", "quote"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "client_id", type: "uuid", nullable: false, description: "FK to clients" },
      { name: "quote_id", type: "uuid", nullable: true, description: "FK to quotes" },
      { name: "status", type: "enum", nullable: false, description: "draft | active | completed | terminated" },
      { name: "signed_at", type: "timestamptz", nullable: true, description: "Signature timestamp" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "SupportTicket",
    table: "support_tickets",
    description: "Support tickets with tags",
    relations: ["user", "assignee"],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "user_id", type: "uuid", nullable: false, description: "FK to user_profiles" },
      { name: "assignee_id", type: "uuid", nullable: true, description: "FK to user_profiles" },
      { name: "subject", type: "text", nullable: false, description: "Ticket subject" },
      { name: "status", type: "enum", nullable: false, description: "open | in_progress | resolved | closed" },
      { name: "priority", type: "enum", nullable: false, description: "low | medium | high" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Creation timestamp" },
    ],
  },
  {
    name: "WebhookEvent",
    table: "webhook_events",
    description: "Payment webhook events (PayPal/Maya/Stripe)",
    relations: [],
    fields: [
      { name: "id", type: "uuid", nullable: false, description: "Primary key" },
      { name: "provider", type: "text", nullable: false, description: "paypal | maya | stripe" },
      { name: "event_type", type: "text", nullable: false, description: "Webhook event type" },
      { name: "payload", type: "jsonb", nullable: false, description: "Raw webhook payload" },
      { name: "processed", type: "boolean", nullable: false, description: "Processing status" },
      { name: "created_at", type: "timestamptz", nullable: false, description: "Receipt timestamp" },
    ],
  },
];

const typeColors: Record<string, string> = {
  uuid: "text-violet-400",
  text: "text-blue-400",
  enum: "text-amber-400",
  boolean: "text-green-400",
  integer: "text-cyan-400",
  numeric: "text-cyan-400",
  timestamptz: "text-zinc-400",
  date: "text-zinc-400",
  jsonb: "text-pink-400",
};

function SchemaCard({ schema }: { schema: ModelSchema }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <Database className="h-4 w-4 text-violet-400" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white">{schema.name}</h3>
              <code className="text-xs text-zinc-500">{schema.table}</code>
              {schema.zodSchema && (
                <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-400">
                  {schema.zodSchema}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">{schema.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">
            {schema.fields.length} fields
          </span>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.04] px-5 py-4">
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="pb-2 text-left text-xs font-medium text-zinc-500">
                    Column
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-500">
                    Type
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-500">
                    Nullable
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-zinc-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {schema.fields.map((field) => (
                  <tr
                    key={field.name}
                    className="border-b border-white/[0.02] last:border-0"
                  >
                    <td className="py-2 pr-4">
                      <code className="text-sm text-white">{field.name}</code>
                    </td>
                    <td className="py-2 pr-4">
                      <code
                        className={`text-xs ${typeColors[field.type] || "text-zinc-400"}`}
                      >
                        {field.type}
                      </code>
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`text-xs ${field.nullable ? "text-amber-400" : "text-zinc-600"}`}
                      >
                        {field.nullable ? "YES" : "NO"}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className="text-xs text-zinc-400">
                        {field.description}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {schema.relations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-zinc-500">Relations:</span>
              {schema.relations.map((rel) => (
                <span
                  key={rel}
                  className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400"
                >
                  {rel}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SchemaExplorerPage() {
  const [search, setSearch] = useState("");

  const filtered = schemas.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.table.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Schema Explorer</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Interactive reference for all {schemas.length} Supabase models. Click
          a model to expand its fields.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search models, tables, or descriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-violet-500/40 focus:bg-white/[0.04]"
        />
      </div>

      <p className="text-xs text-zinc-500">
        Showing {filtered.length} of {schemas.length} models
      </p>

      <div className="space-y-2">
        {filtered.map((schema) => (
          <SchemaCard key={schema.name} schema={schema} />
        ))}
        {filtered.length === 0 && (
          <div className="glass p-8 text-center">
            <p className="text-sm text-zinc-500">
              No models match &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
