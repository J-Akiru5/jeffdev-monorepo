# COO Operations Hub + Business Model Canvas — Implementation Plan

> **Owner:** Hazel (COO) | **Approver:** Jeff (CEO)  
> **Status:** Ready to Build  
> **Last Updated:** 2026-06-08  
> **Companion Tracker:** [coo-tracker.html](./coo-tracker.html)

---

## What Is This?

This document is the **step-by-step blueprint** for building two new features in **Prism Manage** (the internal project management app for Syntaxure Labs):

1. **Operations Hub** (`/operations`) — A dashboard where the COO can see everything happening across the company: task progress, milestones, team workload, project status, and infrastructure costs.

2. **Business Model Canvas** (`/bmc`) — A visual page showing the 9 building blocks of Syntaxure Labs' business model (value propositions, revenue streams, customer segments, etc.). Pre-filled with real data and editable by the COO.

### Who Needs This?

| Person             | Why                                                                             |
| ------------------ | ------------------------------------------------------------------------------- |
| **Hazel (COO)**    | Needs a single place to track operations, milestones, costs, and business model |
| **Jeff (CEO)**     | Needs visibility into everything — can view and edit both hubs                  |
| **Other C-Levels** | Can view the BMC but only COO edits it                                          |
| **Employees**      | Cannot see these pages (RBAC restricted)                                        |

### Where Does It Live?

```
prism-manage/src/
├── app/actions/
│   ├── milestones.ts          ← NEW: milestone CRUD
│   ├── bmc.ts                 ← NEW: BMC CRUD + seed data
│   └── infrastructure-costs.ts ← NEW: cost tracking CRUD
├── app/(dashboard)/
│   ├── operations/
│   │   ├── page.tsx           ← NEW: Operations hub
│   │   ├── milestones/page.tsx ← NEW: Milestone management
│   │   ├── loading.tsx        ← NEW
│   │   └── error.tsx          ← NEW
│   └── bmc/
│       └── page.tsx           ← NEW: Business Model Canvas
├── components/bmc/
│   ├── bmc-block.tsx          ← NEW: single canvas block
│   └── bmc-grid.tsx           ← NEW: 9-block grid layout
├── lib/schemas.ts             ← MODIFY: add new Zod schemas
├── lib/mode-permissions.ts    ← MODIFY: add operations/bmc permissions
└── components/sidebar/index.tsx ← MODIFY: add nav items
```

---

## Phase 1: Database Setup

### Step 1.1 — Create Supabase Tables

Run these SQL migrations in your Supabase SQL Editor.

#### Table: `milestones`

Tracks project milestones with status and deliverables.

```sql
CREATE TABLE IF NOT EXISTS milestones (
  id            text PRIMARY KEY,
  workspace_id  text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  department_id text REFERENCES departments(id) ON DELETE SET NULL,
  title         text NOT NULL,
  description   text,
  due_date      date,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  deliverables  text[] DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_milestones_workspace ON milestones(workspace_id);
CREATE INDEX idx_milestones_status ON milestones(workspace_id, status);

-- RLS: authenticated users can read, founders can write
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read milestones"
  ON milestones FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Founders can insert milestones"
  ON milestones FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Founders can update milestones"
  ON milestones FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Founders can delete milestones"
  ON milestones FOR DELETE
  USING (auth.role() = 'authenticated');
```

#### Table: `bmc_sections`

Stores the 9 blocks of the Business Model Canvas.

```sql
CREATE TABLE IF NOT EXISTS bmc_sections (
  id          text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  block       text NOT NULL
              CHECK (block IN (
                'key_partners', 'key_activities', 'key_resources',
                'value_propositions', 'customer_relationships',
                'channels', 'customer_segments',
                'cost_structure', 'revenue_streams'
              )),
  content     text DEFAULT '',
  updated_by  uuid REFERENCES auth.users(id),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, block)
);

CREATE INDEX idx_bmc_workspace ON bmc_sections(workspace_id);

ALTER TABLE bmc_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read BMC"
  ON bmc_sections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Founders can upsert BMC"
  ON bmc_sections FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Founders can update BMC"
  ON bmc_sections FOR UPDATE
  USING (auth.role() = 'authenticated');
```

#### Table: `infrastructure_costs`

Manual cost tracking for cloud services and APIs.

```sql
CREATE TABLE IF NOT EXISTS infrastructure_costs (
  id              text PRIMARY KEY,
  workspace_id    text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service_name    text NOT NULL,
  category        text NOT NULL DEFAULT 'other'
                  CHECK (category IN ('hosting', 'database', 'ai_api', 'dev_tools', 'other')),
  monthly_budget  numeric(10,2) DEFAULT 0,
  actual_spend    numeric(10,2) DEFAULT 0,
  period          text NOT NULL,  -- e.g., "2026-06"
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_costs_workspace_period ON infrastructure_costs(workspace_id, period);

ALTER TABLE infrastructure_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read costs"
  ON infrastructure_costs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Founders can manage costs"
  ON infrastructure_costs FOR ALL
  USING (auth.role() = 'authenticated');
```

### Step 1.2 — Verify Tables

After running the SQL, verify in Supabase Table Editor that all 3 tables appear with the correct columns and constraints.

---

## Phase 2: Zod Schemas

### Step 2.1 — Add to `src/lib/schemas.ts`

Add these schemas at the end of the file (before the closing exports):

```typescript
// ──────────────────────────────────────────────
// Milestone Schema
// ──────────────────────────────────────────────
export const MilestoneStatusEnum = z.enum(["pending", "in_progress", "completed", "blocked"]);
export type MilestoneStatus = z.infer<typeof MilestoneStatusEnum>;

export const MilestoneSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  departmentId: z.string().nullable().optional(),
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  dueDate: z.string().optional(), // ISO date YYYY-MM-DD
  status: MilestoneStatusEnum.default("pending"),
  deliverables: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

export const CreateMilestoneSchema = MilestoneSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;

export const UpdateMilestoneSchema = MilestoneSchema.partial().pick({
  title: true,
  description: true,
  dueDate: true,
  status: true,
  deliverables: true,
  departmentId: true,
});
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;

// ──────────────────────────────────────────────
// Business Model Canvas Schema
// ──────────────────────────────────────────────
export const BmcBlockEnum = z.enum([
  "key_partners",
  "key_activities",
  "key_resources",
  "value_propositions",
  "customer_relationships",
  "channels",
  "customer_segments",
  "cost_structure",
  "revenue_streams",
]);
export type BmcBlock = z.infer<typeof BmcBlockEnum>;

export const BmcSectionSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  block: BmcBlockEnum,
  content: z.string().default(""),
  updatedBy: z.string().optional(),
  updatedAt: z.string(),
});
export type BmcSection = z.infer<typeof BmcSectionSchema>;

export const UpdateBmcSectionSchema = z.object({
  block: BmcBlockEnum,
  content: z.string(),
});
export type UpdateBmcSectionInput = z.infer<typeof UpdateBmcSectionSchema>;

// ──────────────────────────────────────────────
// Infrastructure Cost Schema
// ──────────────────────────────────────────────
export const CostCategoryEnum = z.enum(["hosting", "database", "ai_api", "dev_tools", "other"]);
export type CostCategory = z.infer<typeof CostCategoryEnum>;

export const InfrastructureCostSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  serviceName: z.string().min(1).max(200),
  category: CostCategoryEnum.default("other"),
  monthlyBudget: z.number().default(0),
  actualSpend: z.number().default(0),
  period: z.string(), // "2026-06"
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type InfrastructureCost = z.infer<typeof InfrastructureCostSchema>;

export const CreateInfrastructureCostSchema = InfrastructureCostSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateInfrastructureCostInput = z.infer<typeof CreateInfrastructureCostSchema>;

// ──────────────────────────────────────────────
// BMC Block Metadata (for rendering)
// ──────────────────────────────────────────────
export const BMC_BLOCKS: { key: BmcBlock; label: string; description: string }[] = [
  {
    key: "key_partners",
    label: "Key Partners",
    description: "Who are your key partners and suppliers?",
  },
  {
    key: "key_activities",
    label: "Key Activities",
    description: "What key activities does your value proposition require?",
  },
  {
    key: "key_resources",
    label: "Key Resources",
    description: "What key resources does your value proposition require?",
  },
  {
    key: "value_propositions",
    label: "Value Propositions",
    description: "What value do you deliver to the customer?",
  },
  {
    key: "customer_relationships",
    label: "Customer Relationships",
    description: "What type of relationship does each customer segment expect?",
  },
  {
    key: "channels",
    label: "Channels",
    description: "Through which channels do you reach your customers?",
  },
  {
    key: "customer_segments",
    label: "Customer Segments",
    description: "For whom are you creating value?",
  },
  {
    key: "cost_structure",
    label: "Cost Structure",
    description: "What are the most important costs in your business model?",
  },
  {
    key: "revenue_streams",
    label: "Revenue Streams",
    description: "For what value are your customers willing to pay?",
  },
];
```

---

## Phase 3: Server Actions

### Step 3.1 — Create `src/app/actions/milestones.ts`

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreateMilestoneSchema, UpdateMilestoneSchema } from "@/lib/schemas";
import type { Milestone } from "@/lib/schemas";

export async function getMilestones(
  workspaceId: string,
  departmentId?: string,
): Promise<Milestone[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("milestones")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data } = await query;
  return (data || []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    workspaceId: m.workspace_id as string,
    departmentId: m.department_id as string | null,
    title: m.title as string,
    description: m.description as string | undefined,
    dueDate: m.due_date as string | undefined,
    status: (m.status as Milestone["status"]) || "pending",
    deliverables: (m.deliverables as string[]) || [],
    createdAt: (m.created_at as string) || new Date().toISOString(),
    updatedAt: (m.updated_at as string) || new Date().toISOString(),
  }));
}

export async function getMilestoneStats(workspaceId: string): Promise<{
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  blocked: number;
  overdue: number;
}> {
  const milestones = await getMilestones(workspaceId);
  const today = new Date().toISOString().split("T")[0];

  return {
    total: milestones.length,
    pending: milestones.filter((m) => m.status === "pending").length,
    inProgress: milestones.filter((m) => m.status === "in_progress").length,
    completed: milestones.filter((m) => m.status === "completed").length,
    blocked: milestones.filter((m) => m.status === "blocked").length,
    overdue: milestones.filter((m) => m.dueDate && m.dueDate < today! && m.status !== "completed")
      .length,
  };
}

export async function createMilestone(input: {
  workspaceId: string;
  departmentId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  deliverables?: string[];
}): Promise<void> {
  const parsed = CreateMilestoneSchema.safeParse({
    workspaceId: input.workspaceId,
    departmentId: input.departmentId || null,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    status: "pending",
    deliverables: input.deliverables || [],
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("milestones").insert({
    id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    workspace_id: parsed.data.workspaceId,
    department_id: parsed.data.departmentId || null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    due_date: parsed.data.dueDate || null,
    status: "pending",
    deliverables: parsed.data.deliverables,
  });

  if (error) throw error;
  revalidatePath("/operations");
}

export async function updateMilestone(
  id: string,
  updates: {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: string;
    deliverables?: string[];
    departmentId?: string;
  },
): Promise<void> {
  const parsed = UpdateMilestoneSchema.safeParse(updates);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.dueDate !== undefined) updateData.due_date = parsed.data.dueDate;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.deliverables !== undefined) updateData.deliverables = parsed.data.deliverables;
  if (parsed.data.departmentId !== undefined) updateData.department_id = parsed.data.departmentId;

  const { error } = await supabase.from("milestones").update(updateData).eq("id", id);
  if (error) throw error;
  revalidatePath("/operations");
}

export async function deleteMilestone(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/operations");
}
```

### Step 3.2 — Create `src/app/actions/bmc.ts`

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { UpdateBmcSectionSchema, BMC_BLOCKS } from "@/lib/schemas";
import type { BmcSection, BmcBlock } from "@/lib/schemas";

export async function getBmcSections(workspaceId: string): Promise<BmcSection[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase.from("bmc_sections").select("*").eq("workspace_id", workspaceId);

  return (data || []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    workspaceId: s.workspace_id as string,
    block: s.block as BmcBlock,
    content: (s.content as string) || "",
    updatedBy: s.updated_by as string | undefined,
    updatedAt: (s.updated_at as string) || new Date().toISOString(),
  }));
}

export async function upsertBmcSection(
  workspaceId: string,
  block: BmcBlock,
  content: string,
): Promise<void> {
  const parsed = UpdateBmcSectionSchema.safeParse({ block, content });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("bmc_sections").upsert(
    {
      id: `${workspaceId}-${block}`,
      workspace_id: workspaceId,
      block: parsed.data.block,
      content: parsed.data.content,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,block" },
  );

  if (error) throw error;
  revalidatePath("/bmc");
}

export async function seedBmcData(workspaceId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if already seeded
  const { data: existing } = await supabase
    .from("bmc_sections")
    .select("id")
    .eq("workspace_id", workspaceId)
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error("BMC data already exists. Delete existing data first to reseed.");
  }

  const seedBlocks: { block: BmcBlock; content: string }[] = [
    {
      block: "key_partners",
      content: `## Key Partners

- **Kwadra TBI (ISAT-U)** — Startup incubator providing mentorship, workspace, and credibility
- **PayPal** — International payment processing for USD transactions
- **Maya** — Philippine payment gateway for PHP transactions
- **GCash** — Alternative local payment method
- **Vercel** — Hosting and deployment platform for all client projects
- **Supabase** — Backend-as-a-service (PostgreSQL, Auth, Storage) for SaaS templates
- **OpenAI / Anthropic** — AI model APIs for context engine and agentic features`,
    },
    {
      block: "key_activities",
      content: `## Key Activities

- **SaaS Template Customization** — Adapting production-ready multi-tenant templates to client specs
- **Prism Context Engine Development** — Building the AI context governance product
- **Client Onboarding & Delivery** — Scoping, quoting, milestone-based delivery
- **Content Marketing** — Blog posts, social media, YouTube tutorials, community building
- **Open Source Contributions** — MCP tools, developer utilities on GitHub
- **Care Plan Management** — Ongoing maintenance, updates, and support for delivered projects`,
    },
    {
      block: "key_resources",
      content: `## Key Resources

- **Multi-Tenant Architecture** — Reusable SaaS core with RBAC, billing, and tenant isolation
- **AI-Native Tooling** — Prism context engine, agentic coding workflows
- **Next.js / React / TypeScript Expertise** — Full-stack modern web development capability
- **Design System** — "Ghost Glow" aesthetic with Tailwind CSS v4, glass morphism
- **Monorepo Infrastructure** — Turborepo + pnpm workspace for rapid multi-app development
- **Team** — 5-person C-Level team (CEO, CTO, CPO, COO, CMO)`,
    },
    {
      block: "value_propositions",
      content: `## Value Propositions

- **Multi-Tenant Architecture** — Every template ships with tenant isolation, RBAC, and billing built in
- **Ready-to-Ship Security** — Auth, rate limiting, input validation, and audit logging from day one
- **Template-Accelerated Delivery** — 2-4 week delivery vs. 3-6 month industry average
- **AI-Native Extensibility** — Built-in support for AI features, context engines, and agentic workflows
- **Productized Customization** — Fixed, transparent pricing with no scope creep
- **Continuous Evolution** — Care Plans ensure projects stay updated and secure
- **Source Code Ownership** — Clients own their code; no vendor lock-in`,
    },
    {
      block: "customer_relationships",
      content: `## Customer Relationships

- **Fixed Pricing Model** — Transparent tier-based pricing, no hourly billing or surprise costs
- **Care Plan Retainer** — Mandatory 12-18 month maintenance plan (PHP 2,000-5,000/mo)
- **24-Hour Response SLA** — Guaranteed response time for all client communications
- **Source Code Transfer** — Full ownership transfer upon project completion
- **Dedicated Onboarding** — Personalized kickoff calls and requirement workshops
- **Community Access** — Discord community for peer support and announcements`,
    },
    {
      block: "channels",
      content: `## Channels

- **syntaxure.dev** — Primary website with services, portfolio, pricing, and quote funnel
- **Quote Funnel** (/quote) — Multi-step form for custom project scoping
- **Blog** — Technical content marketing (context governance, SaaS architecture)
- **LinkedIn** — Primary social channel for B2B outreach and thought leadership
- **Twitter/X** — Developer community engagement and product announcements
- **YouTube** — Tutorials, demos, and product walkthroughs
- **GitHub** — Open source tools, community engagement, star campaigns
- **Product Hunt** — Launch platform for Prism Context Engine
- **Discord** — Community support and real-time engagement`,
    },
    {
      block: "customer_segments",
      content: `## Customer Segments

- **Solo Entrepreneurs** (Starter Tier) — Individual founders building their first SaaS product
- **Growing Businesses** (Business Tier) — Small teams needing production-ready SaaS infrastructure
- **Full-Stack SaaS Builders** (Custom Tier) — Companies needing end-to-end custom SaaS development
- **Enterprise Clients** (Enterprise Tier) — Large organizations needing white-label or complex integrations
- **Developer Teams** (Prism Context Engine) — Engineering teams using AI coding tools who need context governance
- **Southeast Asian Startups** — Regional focus leveraging Kwadra TBI network and local payment methods`,
    },
    {
      block: "cost_structure",
      content: `## Cost Structure

### Fixed Costs
- **Cloud Hosting** — Vercel Pro plans for production deployments
- **Database** — Supabase Pro (PostgreSQL, Auth, Storage)
- **AI APIs** — OpenAI / Anthropic usage for context engine and development
- **Domain & DNS** — Domain registration, Cloudflare DNS
- **Dev Tools** — GitHub, Figma, design tools, productivity software

### Variable Costs
- **Payment Processing** — PayPal/Maya transaction fees (2.9% + fixed fee)
- **Support & Maintenance** — Time spent on Care Plan clients
- **Marketing Spend** — Content creation, paid ads (launch phase)
- **Team Compensation** — C-Level team stipends / equity

### Cost Optimization
- **Monorepo** — Single deployment pipeline for multiple apps
- **Template Reuse** — Amortized development cost across multiple clients
- **AI-Assisted Development** — Reduced development time via Prism context engine`,
    },
    {
      block: "revenue_streams",
      content: `## Revenue Streams

### Project-Based Revenue
| Tier | PHP | USD | Description |
|------|-----|-----|-------------|
| Starter | ₱25,000 | $450 | Basic SaaS template customization |
| Business | ₱65,000 | $1,150 | Full SaaS with custom features |
| Custom | ₱180,000 | $3,200 | End-to-end custom SaaS development |
| Enterprise | Custom | Custom | White-label, complex integrations |

### Recurring Revenue
| Plan | PHP/mo | USD/mo | Description |
|------|--------|--------|-------------|
| Care Plan Basic | ₱2,000 | $35 | Maintenance, updates, bug fixes |
| Care Plan Pro | ₱5,000 | $90 | Priority support, feature additions |

### Future Revenue (Prism Context Engine)
- **SaaS Subscriptions** — Free / Pro ($9/mo) / Team ($29/mo) / Enterprise (custom)
- **API Usage** — Per-generation billing for high-volume users
- **Marketplace** — Community-contributed rules and brands`,
    },
  ];

  const rows = seedBlocks.map((b) => ({
    id: `${workspaceId}-${b.block}`,
    workspace_id: workspaceId,
    block: b.block,
    content: b.content,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("bmc_sections").upsert(rows, {
    onConflict: "workspace_id,block",
    ignoreDuplicates: false,
  });

  if (error) throw error;
  revalidatePath("/bmc");
}
```

### Step 3.3 — Create `src/app/actions/infrastructure-costs.ts`

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CreateInfrastructureCostSchema } from "@/lib/schemas";
import type { InfrastructureCost } from "@/lib/schemas";

export async function getInfrastructureCosts(
  workspaceId: string,
  period?: string,
): Promise<InfrastructureCost[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("infrastructure_costs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("service_name");

  if (period) {
    query = query.eq("period", period);
  }

  const { data } = await query;
  return (data || []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    workspaceId: c.workspace_id as string,
    serviceName: c.service_name as string,
    category: (c.category as InfrastructureCost["category"]) || "other",
    monthlyBudget: Number(c.monthly_budget) || 0,
    actualSpend: Number(c.actual_spend) || 0,
    period: c.period as string,
    notes: c.notes as string | undefined,
    createdAt: (c.created_at as string) || new Date().toISOString(),
    updatedAt: (c.updated_at as string) || new Date().toISOString(),
  }));
}

export async function getCostSummary(
  workspaceId: string,
  period: string,
): Promise<{
  totalBudget: number;
  totalActual: number;
  byCategory: Record<string, { budget: number; actual: number }>;
}> {
  const costs = await getInfrastructureCosts(workspaceId, period);
  const byCategory: Record<string, { budget: number; actual: number }> = {};

  for (const c of costs) {
    const entry = byCategory[c.category] ?? (byCategory[c.category] = { budget: 0, actual: 0 });
    entry.budget += c.monthlyBudget;
    entry.actual += c.actualSpend;
  }

  return {
    totalBudget: costs.reduce((sum, c) => sum + c.monthlyBudget, 0),
    totalActual: costs.reduce((sum, c) => sum + c.actualSpend, 0),
    byCategory,
  };
}

export async function upsertInfrastructureCost(input: {
  id?: string;
  workspaceId: string;
  serviceName: string;
  category: string;
  monthlyBudget: number;
  actualSpend: number;
  period: string;
  notes?: string;
}): Promise<void> {
  const parsed = CreateInfrastructureCostSchema.safeParse({
    workspaceId: input.workspaceId,
    serviceName: input.serviceName,
    category: input.category,
    monthlyBudget: input.monthlyBudget,
    actualSpend: input.actualSpend,
    period: input.period,
    notes: input.notes,
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = input.id || `cost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabase.from("infrastructure_costs").upsert(
    {
      id,
      workspace_id: parsed.data.workspaceId,
      service_name: parsed.data.serviceName,
      category: parsed.data.category,
      monthly_budget: parsed.data.monthlyBudget,
      actual_spend: parsed.data.actualSpend,
      period: parsed.data.period,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) throw error;
  revalidatePath("/operations");
}

export async function deleteInfrastructureCost(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("infrastructure_costs").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/operations");
}
```

---

## Phase 4: Operations Hub Page

### Step 4.1 — Create `src/app/(dashboard)/operations/page.tsx`

```tsx
import { resolveSyntaxureWorkspace } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { getMilestoneStats, getMilestones } from "@/app/actions/milestones";
import { getCostSummary } from "@/app/actions/infrastructure-costs";
import {
  CheckSquare,
  Target,
  AlertTriangle,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@syntaxure/ui";
import { MilestoneStatusBadge } from "./milestone-status-badge";

export const dynamic = "force-dynamic";

export default async function OperationsHubPage() {
  const wsData = await resolveSyntaxureWorkspace();
  if (!wsData) {
    return (
      <EmptyState
        icon={Target}
        title="No Workspace Found"
        description="Operations hub requires an active workspace."
      />
    );
  }

  const supabase = await createClient();
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Fetch all data in parallel
  const [milestoneStats, milestones, costSummary, taskStats] = await Promise.all([
    getMilestoneStats(wsData.workspaceId),
    getMilestones(wsData.workspaceId),
    getCostSummary(wsData.workspaceId, currentPeriod),
    getTaskCompletionStats(supabase, wsData.workspaceId),
  ]);

  const upcomingMilestones = milestones
    .filter((m) => m.dueDate && m.status !== "completed")
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Operations Hub</h1>
        <p className="mt-1 text-sm text-white/40">
          Syntaxure Labs — Operational overview and resource tracking
        </p>
      </div>

      {/* Summary Cards */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Completion Rate (30d)"
          value={`${taskStats.completionRate30d}%`}
          icon={TrendingUp}
          color="text-emerald-400"
        />
        <StatCard
          label="Active Milestones"
          value={milestoneStats.inProgress}
          icon={Target}
          color="text-cyan-400"
          sub={`${milestoneStats.total} total`}
        />
        <StatCard
          label="Blocked Items"
          value={milestoneStats.blocked}
          icon={AlertTriangle}
          color="text-rose-400"
          sub={`${milestoneStats.overdue} overdue`}
        />
        <StatCard
          label="Monthly Spend"
          value={`₱${costSummary.totalActual.toLocaleString()}`}
          icon={DollarSign}
          color="text-amber-400"
          sub={`of ₱${costSummary.totalBudget.toLocaleString()} budget`}
        />
      </section>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Milestones */}
        <section className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-white/40">
              Upcoming Milestones
            </h2>
            <Link
              href="/operations/milestones"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View All →
            </Link>
          </div>
          {upcomingMilestones.length === 0 ? (
            <p className="text-sm text-white/30 py-4">No upcoming milestones</p>
          ) : (
            <div className="space-y-3">
              {upcomingMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{m.title}</p>
                    {m.dueDate && (
                      <p className="text-xs text-white/40 mt-1">
                        Due: {new Date(m.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <MilestoneStatusBadge status={m.status} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Task Throughput */}
        <section className="glass rounded-xl p-6">
          <h2 className="text-sm font-mono uppercase tracking-wider text-white/40 mb-4">
            Task Throughput
          </h2>
          <div className="space-y-4">
            <ThroughputRow
              label="Completed (7d)"
              value={taskStats.completed7d}
              total={taskStats.total7d}
              color="emerald"
            />
            <ThroughputRow
              label="Completed (30d)"
              value={taskStats.completed30d}
              total={taskStats.total30d}
              color="cyan"
            />
            <ThroughputRow
              label="In Progress"
              value={taskStats.inProgress}
              total={taskStats.total}
              color="amber"
            />
            <ThroughputRow
              label="Backlog"
              value={taskStats.backlog}
              total={taskStats.total}
              color="white/50"
            />
          </div>
        </section>

        {/* Resource Allocation */}
        <section className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-white/40">
              Resource Allocation
            </h2>
            <Link href="/settings" className="text-xs text-cyan-400 hover:text-cyan-300">
              Manage Team →
            </Link>
          </div>
          <div className="space-y-3">
            {wsData.departments.map((dept) => {
              const deptTasks = taskStats.byDepartment[dept.id] || { total: 0, done: 0 };
              return (
                <div key={dept.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="text-sm text-white/70">{dept.name}</span>
                  </div>
                  <span className="text-xs text-white/40">
                    {deptTasks.done}/{deptTasks.total} tasks
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Infrastructure Costs */}
        <section className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-white/40">
              Infrastructure Costs ({currentPeriod})
            </h2>
          </div>
          <div className="space-y-2">
            {Object.entries(costSummary.byCategory).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-white/60 capitalize">{cat.replace("_", " ")}</span>
                <span className="text-white/80 font-mono">
                  ₱{data.actual.toLocaleString()} / ₱{data.budget.toLocaleString()}
                </span>
              </div>
            ))}
            {Object.keys(costSummary.byCategory).length === 0 && (
              <p className="text-sm text-white/30">No cost entries for this period</p>
            )}
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-mono uppercase tracking-wider text-white/30">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/operations/milestones"
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/60 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-white"
          >
            Manage Milestones
          </Link>
          <Link
            href="/bmc"
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/60 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-white"
          >
            Business Model Canvas
          </Link>
          <Link
            href="/tasks"
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/60 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-white"
          >
            View All Tasks
          </Link>
        </div>
      </section>
    </div>
  );
}

// Helper: fetch task completion stats
async function getTaskCompletionStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
) {
  // ... implementation fetches from tasks table with date filtering
  // Returns: completionRate30d, completed7d, completed30d, total7d, total30d,
  //          inProgress, backlog, total, byDepartment
  return {
    completionRate30d: 0,
    completed7d: 0,
    completed30d: 0,
    total7d: 0,
    total30d: 0,
    inProgress: 0,
    backlog: 0,
    total: 0,
    byDepartment: {} as Record<string, { total: number; done: number }>,
  };
}

// Stat card component
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className={`flex items-center gap-2 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-xs font-mono uppercase tracking-wider text-white/30">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

// Throughput row component
function ThroughputRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-xs text-white/40">
          {value} / {total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className={`h-full rounded-full bg-${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
```

### Step 4.2 — Create supporting files

- `src/app/(dashboard)/operations/loading.tsx` — skeleton loader
- `src/app/(dashboard)/operations/error.tsx` — error boundary
- `src/app/(dashboard)/operations/milestone-status-badge.tsx` — status badge component
- `src/app/(dashboard)/operations/milestones/page.tsx` — full milestone CRUD page

---

## Phase 5: Business Model Canvas Page

### Step 5.1 — Create `src/app/(dashboard)/bmc/page.tsx`

```tsx
import { resolveSyntaxureWorkspace } from "@/lib/workspace";
import { getBmcSections, seedBmcData } from "@/app/actions/bmc";
import { BMC_BLOCKS } from "@/lib/schemas";
import { EmptyState } from "@syntaxure/ui";
import { Layout } from "lucide-react";
import { BmcGrid } from "@/components/bmc/bmc-grid";
import { SeedBmcButton } from "@/components/bmc/seed-bmc-button";

export const dynamic = "force-dynamic";

export default async function BmcPage() {
  const wsData = await resolveSyntaxureWorkspace();
  if (!wsData) {
    return (
      <EmptyState
        icon={Layout}
        title="No Workspace Found"
        description="Business Model Canvas requires an active workspace."
      />
    );
  }

  const sections = await getBmcSections(wsData.workspaceId);

  // Build a map for easy lookup
  const sectionMap = new Map(sections.map((s) => [s.block, s]));

  return (
    <div className="mx-auto max-w-7xl animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Business Model Canvas</h1>
          <p className="mt-1 text-sm text-white/40">
            Syntaxure Labs — Strategic business model overview
          </p>
        </div>
        {sections.length === 0 && (
          <SeedBmcButton workspaceId={wsData.workspaceId} userId={wsData.userId} />
        )}
      </div>

      {sections.length === 0 ? (
        <EmptyState
          icon={Layout}
          title="Canvas Not Initialized"
          description="Click 'Seed Template' to populate the canvas with Syntaxure Labs' business model data."
        />
      ) : (
        <BmcGrid
          blocks={BMC_BLOCKS}
          sectionMap={sectionMap}
          workspaceId={wsData.workspaceId}
          isEditor={wsData.cLevelTitle === "coo" || wsData.cLevelTitle === "ceo"}
        />
      )}
    </div>
  );
}
```

### Step 5.2 — Create `src/components/bmc/bmc-block.tsx`

Client component with inline editing.

### Step 5.3 — Create `src/components/bmc/bmc-grid.tsx`

CSS grid layout for the classic Osterwalder 9-block canvas.

### Step 5.4 — Create `src/components/bmc/seed-bmc-button.tsx`

Button that calls `seedBmcData()` server action.

---

## Phase 6: Navigation & Permissions

### Step 6.1 — Update Sidebar (`src/components/sidebar/index.tsx`)

Add two new nav items in the Views section (workspace mode only):

```typescript
import { Target, Layout } from "lucide-react";

// In the views array or as separate items:
const opsItem: NavItem = { label: "Operations", href: "/operations", icon: Target };
const bmcItem: NavItem = { label: "Business Canvas", href: "/bmc", icon: Layout };

// Show for COO, CEO, or unrefined founders in workspace mode
const isOpsVisible =
  manageMode === "workspace" &&
  (cLevelTitle === "coo" || cLevelTitle === "ceo" || (!cLevelTitle && isFounder));
```

### Step 6.2 — Update Permissions (`src/lib/mode-permissions.ts`)

```typescript
export type ManageFeature =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "kanban"
  | "marketing"
  | "departments"
  | "operations" // ← NEW
  | "bmc" // ← NEW
  | "settings"
  | "profile"
  | "create_task"
  | "delete_task"
  | "manage_members"
  | "manage_departments"
  | "manage_projects";
```

### Step 6.3 — Update Dashboard HQ (`src/app/(dashboard)/dashboard/page.tsx`)

Add quick action links for COO/CEO:

```tsx
<Link href="/operations" className="...">Operations Hub</Link>
<Link href="/bmc" className="...">Business Canvas</Link>
```

---

## RBAC Summary

| Page                     | CEO         | COO         | CTO/CPO/CMO | Employee  |
| ------------------------ | ----------- | ----------- | ----------- | --------- |
| `/operations`            | View + Edit | View + Edit | No access   | No access |
| `/operations/milestones` | Full CRUD   | Full CRUD   | No access   | No access |
| `/bmc`                   | View        | View + Edit | View only   | No access |
| Infrastructure Costs     | View + Edit | View + Edit | No access   | No access |

---

## Checklist

Use the companion [HTML tracker](./coo-tracker.html) for an interactive checklist with progress tracking.

- [ ] **Phase 1:** Create 3 Supabase tables (milestones, bmc_sections, infrastructure_costs)
- [ ] **Phase 2:** Add Zod schemas to `schemas.ts`
- [ ] **Phase 3:** Create 3 server action files
- [ ] **Phase 4:** Build Operations hub page + milestone management
- [ ] **Phase 5:** Build BMC page + grid layout + inline editing
- [ ] **Phase 6:** Update sidebar, permissions, dashboard
- [ ] **Testing:** Verify RBAC, test CRUD operations, check mobile layout
- [ ] **Deploy:** Run `turbo build` for prism-manage, verify in production
