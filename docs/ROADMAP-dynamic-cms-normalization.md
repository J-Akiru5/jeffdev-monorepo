# Roadmap: Dynamic CMS + Database Normalization + Prisma

> **Syntaxure Labs** — Comprehensive plan to make all pages CMS-driven, normalize the database to 3NF, add Prisma ORM, and consolidate admin controls.
>
> **Generated:** June 2026 | **Estimated effort:** 11–19 days

---

## Key Decisions

| Area              | Decision                                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Prisma**        | Prisma alongside Supabase — schema management + type safety. Supabase client kept for RLS/auth. |
| **Dynamic Pages** | ALL public pages will become CMS-driven from the admin panel.                                   |
| **Schema**        | Full 3NF normalization — extract clients, add junction tables, split site_pages JSONB.          |
| **Admin**         | Consolidate everything under `/admin/agency/`.                                                  |

---

## Phase 0 — Prisma Setup & Schema Foundation (1–2 days)

Add Prisma to the monorepo, generate initial schema from existing Supabase tables.

- [ ] Install `prisma` and `@prisma/client` to root or shared package
- [ ] Create `prisma/schema.prisma` mapping all 34 existing tables
- [ ] Configure for Supabase PostgreSQL (`postgresql` provider)
- [ ] Generate Prisma client — `npx prisma generate`
- [ ] Create `packages/db/src/prisma.ts` singleton
- [ ] Verify `prisma db pull` matches existing schema
- [ ] Set up `prisma migrate` workflow with root scripts

**Files:**

| File                        | Action                                 |
| --------------------------- | -------------------------------------- |
| `prisma/schema.prisma`      | New — full schema from Supabase tables |
| `packages/db/src/prisma.ts` | New — PrismaClient singleton           |
| `packages/db/package.json`  | Modify — add prisma deps               |
| Root `package.json`         | Modify — add prisma scripts            |

---

## Phase 1 — Database Normalization / 3NF (3–5 days)

Fix all 3NF violations, add missing junction tables, extract denormalized data.

### 1A — Extract Clients Table

> **Problem:** `client_name`/`client_email` duplicated in `projects` and `client_contracts`. No single source of truth for client identity.

- [ ] Create `clients` table (id, name, email, company, phone, created_at, updated_at)
- [ ] Migration to populate from existing `projects.client_name`/`client_email`
- [ ] Add `client_id` UUID FK to `projects` (nullable initially)
- [ ] Add `client_id` UUID FK to `client_contracts` (nullable initially)
- [ ] Backfill `client_id` from matched name+email
- [ ] Make `client_id` NOT NULL on both tables
- [ ] Drop `client_name`/`client_email` columns

### 1B — Add Junction Tables

> **Problem:** UUID arrays and TEXT arrays store references without FK enforcement. Orphaned IDs possible.

| #    | Junction Table        | Replaces                                  | Relationship                    |
| ---- | --------------------- | ----------------------------------------- | ------------------------------- |
| 1B.1 | `quote_services`      | `quotes.customization_service_ids UUID[]` | quotes ↔ customization_services |
| 1B.2 | `task_tags`           | `tasks.tags TEXT[]`                       | tasks ↔ tags                    |
| 1B.3 | `release_tags`        | `releases.tags TEXT[]`                    | releases ↔ tags                 |
| 1B.4 | `community_post_tags` | `community_posts.tags TEXT[]`             | community_posts ↔ tags          |
| 1B.5 | `support_ticket_tags` | `support_tickets.tags TEXT[]`             | support_tickets ↔ tags          |

- [ ] Create all 5 junction tables
- [ ] Migrate existing array data into junction tables
- [ ] Drop original array columns

### 1C — Fix Transitive Dependencies

- [ ] `subscriptions.user_email` — remove column (derive from `user_profiles.email` via FK)
- [ ] `invoices` — keep `tax_amount`/`total_amount` as computed columns (practical pattern, low risk)

### 1D — Normalize site_pages → Structured Tables

> **Problem:** `site_pages.content` is a monolithic JSONB blob. Individual fields cannot be queried, indexed, or validated at DB level.

| #    | New Table         | Purpose                                                                         |
| ---- | ----------------- | ------------------------------------------------------------------------------- |
| 1D.1 | `page_sections`   | id, page_slug, section_key, section_type, content JSONB, sort_order, is_visible |
| 1D.2 | Migration script  | Migrate site_pages rows into page_sections (each JSONB key → row)               |
| 1D.3 | Update site_pages | Keep as lightweight registry: slug, title, metadata only (no content blob)      |

> Example: About page → 8 section rows: `hero`, `missionVision`, `kwadraTbi`, `founders`, `team`, `techStack`, `values`, `brandAssets`

- [ ] Create `page_sections` table
- [ ] Write migration script to split site_pages JSONB into section rows
- [ ] Update site_pages to registry-only (drop content column)
- [ ] Verify all pages read from page_sections correctly

### 1E — Update Prisma Schema

- [ ] Regenerate Prisma schema to reflect all new tables and relationships
- [ ] Run `prisma generate` to produce updated client types

---

## Phase 2 — Admin Consolidation (3–5 days)

Move all content management under `/admin/agency/`, complete all missing CRUD.

### 2A — Restructure Sidebar Navigation

```
AGENCY
├── Dashboard          → /admin/agency/dashboard
├── Content (CMS)
│   ├── Homepage       → /admin/agency/content/homepage
│   ├── About Page     → /admin/agency/content
│   ├── Features       → /admin/agency/content/features
│   ├── Contact        → /admin/agency/content/contact
│   ├── Quote Form     → /admin/agency/content/quote
│   ├── Prism Page     → /admin/agency/content/prism
│   └── Legal Pages    → /admin/agency/content/legal
├── Services           → /admin/agency/services
├── Works
│   ├── Projects       → /admin/agency/projects
│   └── Case Studies   → /admin/agency/case-studies
├── Products           → /admin/agency/products (moved)
├── Pricing            → /admin/agency/pricing (moved)
├── Community
│   ├── Posts          → /admin/agency/community
│   ├── Members        → /admin/agency/community
│   └── Releases       → /admin/agency/releases
├── Inquiries
│   ├── Quotes         → /admin/agency/quotes (with CRUD)
│   ├── Messages       → /admin/agency/messages (with CRUD)
│   └── Feedback       → /admin/agency/feedback (with CRUD)
├── Operations
│   ├── Invoices       → /admin/agency/invoices
│   ├── Calendar       → /admin/agency/calendar
│   └── Availability   → /admin/agency/availability (new)
├── Team
│   ├── Members        → /admin/agency/users (with role mgmt)
│   └── Access Control → /admin/agency/access (with editing)
└── System
    ├── Settings       → /admin/agency/settings (real impl)
    ├── Profile        → /admin/agency/profile
    └── Audit Log      → /admin/agency/audit
```

- [ ] Restructure sidebar component
- [ ] Add redirects from old routes to new routes
- [ ] Update command palette entries
- [ ] Update mobile nav

### 2B — Complete Missing CRUD

| Section          | Current                       | What's Missing                | Implementation                                  |
| ---------------- | ----------------------------- | ----------------------------- | ----------------------------------------------- |
| **Quotes**       | Read-only list                | Status mgmt, response, delete | Add `updateQuoteStatus`, `deleteQuote` + UI     |
| **Messages**     | Read-only list                | Mark-as-read, reply, delete   | Add `updateMessageStatus`, `deleteMessage` + UI |
| **Feedback**     | Read-only list                | Acknowledge/resolve           | Add `updateFeedbackStatus` + status workflow UI |
| **Users**        | Read-only list                | Role editing                  | Wire existing `updateAgencyUserRole` to UI      |
| **Access**       | Read-only role list           | Role editing controls         | Add role dropdowns + permission toggles         |
| **Settings**     | Stub (3/4 cards link to self) | Real implementation           | General Settings, Theme, Email Templates        |
| **Availability** | No admin page                 | Entire CRUD                   | Create `/admin/agency/availability`             |

- [ ] Quotes CRUD
- [ ] Messages CRUD
- [ ] Feedback CRUD
- [ ] Users role management
- [ ] Access control editing
- [ ] Settings implementation
- [ ] Availability CRUD

### 2C — New Content Editor Pages

| Page         | Admin Route                      | Editor Fields                                                                                                                         |
| ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Homepage** | `/admin/agency/content/homepage` | Hero headline, subtext, badge, CTA labels, social proof logos, features (6), Prism highlight (3), Agentic Protocol (4+4), CTA section |
| **Features** | `/admin/agency/content/features` | Heading, description, 6 feature cards, 6 comparison rows                                                                              |
| **Contact**  | `/admin/agency/content/contact`  | Heading, description, email, location, form labels, success message                                                                   |
| **Quote**    | `/admin/agency/content/quote`    | 5 project types, 4 budget ranges, 4 timeline options, form labels, success message                                                    |
| **Prism**    | `/admin/agency/content/prism`    | Heading, subtitle, waitlist text, success message                                                                                     |
| **Legal**    | `/admin/agency/content/legal`    | Privacy policy, terms of service, cookie policy (markdown/rich text)                                                                  |

- [ ] Homepage content editor
- [ ] Features content editor
- [ ] Contact content editor
- [ ] Quote content editor
- [ ] Prism content editor
- [ ] Legal content editor
- [ ] Server actions for each (CRUD on page_sections)

---

## Phase 3 — Dynamic Pages / Syntaxure Labs (3–5 days)

All public pages fetch content from DB via Prisma/Supabase.

### 3A — Homepage Dynamic Sections

| Section          | Current                               | Target                                                   |
| ---------------- | ------------------------------------- | -------------------------------------------------------- |
| Hero             | Hardcoded in `hero.tsx`               | Fetch from `page_sections` (slug="homepage", key="hero") |
| Social Proof     | Hardcoded logos in `social-proof.tsx` | Fetch from `page_sections` (key="socialProof")           |
| Features         | Hardcoded 6 items in `features.tsx`   | Fetch from `page_sections` (key="features")              |
| Prism Highlight  | Hardcoded in `prism-highlight.tsx`    | Fetch from `page_sections` (key="prismHighlight")        |
| Agentic Protocol | Hardcoded in `agentic-protocol.tsx`   | Fetch from `page_sections` (key="agenticProtocol")       |
| CTA              | Hardcoded in `cta.tsx`                | Fetch from `page_sections` (key="cta")                   |

- [ ] Hero section dynamic
- [ ] Social proof section dynamic
- [ ] Features section dynamic
- [ ] Prism highlight dynamic
- [ ] Agentic protocol dynamic
- [ ] CTA section dynamic

### 3B–3E — Other Pages

| Page                     | Current                             | Target                                                |
| ------------------------ | ----------------------------------- | ----------------------------------------------------- |
| **Features** `/features` | 100% hardcoded                      | Fetch from `page_sections` (slug="features")          |
| **Contact** `/contact`   | Hardcoded labels, email, location   | Fetch page copy from `page_sections` (slug="contact") |
| **Quote** `/quote`       | Hardcoded types, budgets, timelines | Fetch options from `page_sections` (slug="quote")     |
| **Prism** `/prism`       | Hardcoded heading, subtitle         | Fetch from `page_sections` (slug="prism")             |

- [ ] Features page dynamic
- [ ] Contact page dynamic
- [ ] Quote page dynamic
- [ ] Prism page dynamic

### 3F — Static Data Cleanup

| File                   | Action                            |
| ---------------------- | --------------------------------- |
| `src/data/services.ts` | Keep as seed data / fallback only |
| `src/data/projects.ts` | Keep as seed data / fallback only |
| `src/data/pricing.ts`  | Keep as seed data / fallback only |

- [ ] Verify all static files are fallback-only (not primary source)
- [ ] Add comments marking files as seed/fallback data

---

## Phase 4 — Type Safety & Sync (1–2 days)

Eliminate all type drift between DB, Prisma, and app code.

- [ ] Generate Prisma types as single source of truth
- [ ] Delete or regenerate `prism-admin/src/lib/database.types.ts` from Prisma
- [ ] Update `packages/db/src/schema.ts` Zod schemas to match Prisma
- [ ] Update all server actions to use Prisma types
- [ ] Update syntaxure-labs types to import from Prisma
- [ ] Add `prisma generate` to build pipeline

---

## Reference: Page Inventory

| Page                       | Data Source                     | Admin Control                   | Status        |
| -------------------------- | ------------------------------- | ------------------------------- | ------------- |
| **Homepage** `/`           | Partial DB (services, projects) | Missing for hero, features, CTA | ⚠️ Partial    |
| **Services** `/services`   | DB with static fallback         | Full CRUD                       | ✅ Good       |
| **Work** `/work`           | DB                              | Full CRUD                       | ✅ Good       |
| **Products** `/products`   | DB                              | CRUD (outside agency)           | ✅ Good       |
| **Community** `/community` | DB                              | Full CRUD                       | ✅ Good       |
| **About** `/about`         | DB (site_pages)                 | Full editor                     | ✅ Good       |
| **Pricing** `/pricing`     | DB with fallback                | CRUD (outside agency)           | ✅ Good       |
| **Features** `/features`   | 100% hardcoded                  | None                            | ❌ Broken     |
| **Contact** `/contact`     | Form → DB, page hardcoded       | Read-only inbox                 | ⚠️ Partial    |
| **Quote** `/quote`         | Form → DB, page hardcoded       | Read-only list                  | ⚠️ Partial    |
| **Prism** `/prism`         | Waitlist form → DB              | None                            | ❌ Broken     |
| **Legal**                  | 100% hardcoded                  | None                            | — Static (OK) |

---

## Reference: Admin Gaps

| Section          | Status    | Issue                                             |
| ---------------- | --------- | ------------------------------------------------- |
| **Quotes**       | Read-only | No status management, response, or delete         |
| **Messages**     | Read-only | No mark-as-read, reply, or delete                 |
| **Feedback**     | Read-only | No acknowledge/resolve workflow                   |
| **Users**        | Read-only | Role management actions exist but not wired to UI |
| **Access**       | Read-only | No role editing controls                          |
| **Settings**     | Stub      | 3 of 4 cards link to themselves                   |
| **Homepage**     | Missing   | No editor for hero, features, CTA, social proof   |
| **Availability** | Missing   | No admin page                                     |

---

## Reference: Database Issues

| Issue                                   | Tables                                   | Severity    |
| --------------------------------------- | ---------------------------------------- | ----------- |
| Client data denormalized                | `projects`, `client_contracts`           | 🔴 High     |
| Missing junction tables                 | tasks, releases, community_posts, quotes | 🔴 High     |
| Type definitions out of sync            | prism-admin database.types.ts            | 🔴 Critical |
| 3 separate "project" schemas            | DB, prism-admin types, Zod schemas       | 🔴 Critical |
| Zod schemas reference Firebase Auth     | packages/db/src/schema.ts                | 🔴 High     |
| JSONB blob in site_pages                | `site_pages`                             | 🟡 Medium   |
| subscriptions.user_email transitive dep | `subscriptions`                          | 🟡 Medium   |
| Invoice amounts derived but stored      | `invoices`                               | 🟢 Low      |

---

## Reference: Risks & Mitigations

| Risk                                  | Mitigation                                                                                           |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Prisma + Supabase RLS conflict        | Use Prisma for reads, Supabase client for writes that need RLS. Or use Prisma with service role key. |
| Data loss during normalization        | Create backups before each migration. Use nullable FKs initially, backfill, then make NOT NULL.      |
| Breaking public pages during refactor | Keep static fallback data. Deploy behind feature flags if needed.                                    |
| Admin consolidation breaks routes     | Use Next.js redirects from old routes to new ones.                                                   |
| site_pages → page_sections migration  | Write a one-time migration script. Test on staging first.                                            |

---

## Execution Order

```
Phase 0 (Prisma Setup)         ← 1–2 days
    ↓
Phase 1 (DB Normalization)     ← 3–5 days
    ↓
Phase 2 (Admin Consolidation)  ← 3–5 days
    ↓
Phase 3 (Dynamic Pages)        ← 3–5 days
    ↓
Phase 4 (Type Safety)          ← 1–2 days
```

**Total estimated: 11–19 days of focused work**
