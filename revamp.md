# JeffDev Monorepo — Comprehensive Revamp Plan

> **Status:** Draft for review
> **Target:** 12-14 weeks, 2 developers (Jeff + Lou)
> **Decision log:** All architecture decisions recorded inline with rationale.

---

## Table of Contents

1. [Target Architecture](#1-target-architecture)
2. [Phase-by-Phase Execution Plan](#2-phase-by-phase-execution-plan)
3. [Supabase Schema & RBAC Design](#3-supabase-schema--rbac-design)
4. [Auth Migration (Clerk → Supabase) — Detailed](#4-auth-migration-clerk--supabase--detailed)
5. [Firestore → Supabase Data Migration](#5-firestore--supabase-data-migration)
6. [Package Rename: @jdstudio/ui → @syntaxure/ui](#6-package-rename-jdstudio-ui--syntaxure-ui)
7. [prism-admin Expansion — Three-Zone Architecture](#7-prism-admin-expansion--three-zone-architecture)
8. [prism-manage — Calendar + Tasks MVP](#8-prism-manage--calendar--tasks-mvp)
9. [prism-analytics — Python Flask API](#9-prism-analytics--python-flask-api)
10. [Cosmos DB + Gremlin Graph (Neuro-Symbolic AI)](#10-cosmos-db--gremlin-graph-neuro-symbolic-ai)
11. [Design System Consolidation](#11-design-system-consolidation)
12. [Doppler Env Var Reorganization](#12-doppler-env-var-reorganization)
13. [CI/CD & Docker Updates](#13-cicd--docker-updates)
14. [Rollback Strategy (per Phase)](#14-rollback-strategy-per-phase)
15. [Testing Gates (per Phase)](#15-testing-gates-per-phase)
16. [Timeline & Developer Allocation](#16-timeline--developer-allocation)
17. [Risk Register](#17-risk-register)

---

## 1. Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Supabase (1 project)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Auth (all    │  │ PostgreSQL   │  │ Storage       │  │
│  │ apps share)  │  │ + RLS        │  │ (replaces R2) │  │
│  └──────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Cosmos DB (2 APIs)                      │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │ MongoDB API (kept)   │  │ Gremlin API (NEW)        │ │
│  │ projects, brands,    │  │ rules graph, skills      │ │
│  │ subscriptions, etc.  │  │ relationships, ranking   │ │
│  └──────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                        Redis                            │
│  ┌─────────────────────────────────────────────────────┐│
│  │ Rate limiting (middleware), session cache, queues    ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘

APPS (7):
  syntaxure-labs     Next.js 16  port 3000  Supabase + Supabase Storage
  prism-engine       Next.js 16  port 3001  Cosmos DB + Mux + Supabase Auth
  prism-docs         Nextra 4    port 3002  Static (no DB)
  prism-admin        Next.js 16  port 3004  Supabase + Cosmos DB
  prism-mcp-server   Node.js     stdio     Cosmos DB
  prism-manage       Next.js 16  port 3007  Supabase + Google Calendar API
  prism-analytics    Python      port 8000  Supabase (read) + pandas/matplotlib

PACKAGES (5):
  @syntaxure/ui      (renamed from @jdstudio/ui) — shared components + design tokens
  @jeffdev/db        Cosmos DB client (MongoDB API + Gremlin client)
  @prism-engine/cli  Published to npm — MCP server for IDE integration
  @repo/eslint-config
  @repo/typescript-config

REMOVED: mht, joularix, nexure, marketing, prism-exercise, tracker (repurposed → prism-manage)
```

**Key decisions:**

| Decision                                  | Rationale                                                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Single Supabase project for all apps      | Shared auth, simpler cookie domain setup (single `__Host-` prefix), one RLS policy surface                                          |
| Gremlin only for Prism rules/skills graph | App data (projects, brands) stays on MongoDB document model. Graph model is experimental — isolate blast radius                     |
| Hard cutover for Clerk migration          | Staged auth (two providers simultaneously) doubles middleware complexity. Password reset is acceptable UX tradeoff for simpler code |
| `@jdstudio/ui` → `@syntaxure/ui`          | Aligns with syntaxure-labs brand. Single source of truth for all designs                                                            |
| prism-admin as universal admin            | Consolidates agency admin + Prism admin + team management into one app. Reduces maintenance surface from 2 admin panels to 1        |
| Python app inside monorepo                | Minimizes deployment orchestration. Docker-based, REST API boundary to other apps                                                   |
| prism-manage = Calendar + Tasks MVP       | Full Notion clone is 6+ months. Calendar sync + task management delivers immediate business value                                   |

---

## 2. Phase-by-Phase Execution Plan

### Phase 1: Foundation & Cleanup (Week 1)

**Goal:** Clean slate. Monorepo only has the apps we're keeping. Infrastructure ready.

#### Task 1.1 — Remove Unnecessary Apps

- Remove directories: `apps/mht/`, `apps/joularix/`, `apps/nexure/`, `apps/marketing/`, `apps/prism-exercise/`
- Remove from `pnpm-workspace.yaml` (if listed individually; currently `apps/*` covers all)
- Remove from `docker-compose.yml` (mht, marketing not in compose, but nexure/joularix/prism-exercise aren't either — just remove references if any)
- Remove from `turbo.json` pipeline if any app-specific config exists
- Run `pnpm install` to update lockfile
- **Result:** 7 apps remain (agency, prism-dashboard, prism-docs, prism-admin, prism-mcp-server, tracker, + empty prism-analytics)

#### Task 1.2 — Publish @prism-engine/cli to npm

- Verify `packages/prism-cli/package.json` build pipeline (`prepublishOnly: pnpm run build`)
- Run `pnpm --filter @prism-engine/cli run build` → verify dist/ output
- Run `pnpm --filter @prism-engine/cli publish` (or `npm publish` from package dir with `--access public`)
- Configure changeset release workflow to auto-publish (add publish step to `.github/workflows/release.yml`)
- **Result:** `@prism-engine/cli` available on npm

#### Task 1.3 — Supabase Project Setup

- Create Supabase organization + project on supabase.com
- Generate: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Install Supabase CLI: `pnpm add -D supabase` (root)
- Run `supabase init` → creates `supabase/` dir with `config.toml`
- Start local: `supabase start` (Docker-based local dev)
- Add all Supabase env vars to Doppler
- **Result:** Supabase running locally and in cloud

#### Task 1.4 — Redis Setup

- Option A: Upstash (serverless, already in deps)
- Option B: Self-hosted Redis (add to docker-compose.yml)
- Add `REDIS_URL` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) to Doppler
- **Result:** Redis available for rate limiting

#### Task 1.5 — Python Toolchain Setup

- Add `uv` (or `poetry`) for Python package management
- Create `apps/prism-analytics/pyproject.toml` (template)
- Create `apps/prism-analytics/Dockerfile` (template)
- **Result:** Python scaffolding ready for Task 9.x

---

### Phase 2: Core Migrations — Auth & DB (Weeks 2-5)

**Goal:** Supabase Auth replaces Clerk + Firebase Auth. Supabase replaces Firestore. Cloudflare R2 replaced.

#### Task 2.1 — Cloudflare R2 → Supabase Storage

**Files to change (6 files):**
| File | Change |
|------|--------|
| `apps/agency/src/lib/r2.ts` | Delete. Replace with `lib/supabase-storage.ts` |
| `apps/agency/src/app/actions/upload.ts` | Rewrite `getSignedUploadUrl()` → `supabase.storage.from(bucket).createSignedUrl()`; `uploadFile()` → `supabase.storage.from(bucket).upload()` |
| `apps/agency/src/app/api/file/[...path]/route.ts` | Delete. Supabase provides public URLs directly |
| `apps/agency/src/components/payments/gcash-proof-upload.tsx` | Update upload call |
| `apps/agency/src/components/admin/profile-form.tsx` | Update upload call |
| `apps/agency/src/components/admin/case-study-image-upload.tsx` | Update upload call |
| `apps/agency/package.json` | Remove `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`. Add `@supabase/supabase-js` |
| `turbo.json` | Remove `R2_*` vars, add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

**Bucket policy:** Create `assets` bucket (private, access via signed URLs for upload, public read for images via Supabase Storage policies).

**Verification:** Upload a test image through the profile form. Verify it appears via Supabase public URL.

#### Task 2.2 — Clerk → Supabase Auth (prism-engine)

**⚠️ Critical: Preserve API key dual-auth.** prism-engine has TWO auth mechanisms:

1. Clerk (session-based, for dashboard UI) → **REPLACED** with Supabase Auth
2. API keys (SHA-256 hashed, for MCP/API access) → **PRESERVED AS-IS**

**Files to change (40+ files):**

**Supabase client setup (NEW):**

```
apps/prism-engine/src/lib/supabase/
├── server.ts          # Server client (reads cookies, uses service role)
├── middleware.ts       # Middleware client (for session refresh in middleware)
├── browser.ts         # Browser client (for client components)
└── admin.ts           # Admin client (service role, bypasses RLS)
```

**Auth middleware replacement:**
| File | Change |
|------|--------|
| `src/middleware.ts` | Replace `clerkMiddleware` → Supabase SSR `updateSession`. Protect same routes (`/dashboard`, `/projects`, `/settings`, etc.) |
| `src/app/layout.tsx` | Replace `<ClerkProvider>` → `SupabaseProvider` (custom wrapper). Remove `@clerk/themes` dark theme — apply via CSS only |
| `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Replace `SignIn` → Custom Supabase sign-in page |
| `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Replace `SignUp` → Custom Supabase sign-up page |
| `src/app/(dashboard)/layout.tsx` | Replace `UserButton` → Custom `SupabaseUserButton` |

**Server actions/pages using Clerk `auth()` (30+ files):**

```typescript
// BEFORE (Clerk)
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth();

// AFTER (Supabase)
import { createClient } from "~/lib/supabase/server";
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
const userId = user?.id;
```

**Affected files (all in prism-engine):**

```
src/lib/api-auth.ts                        # DUAL AUTH: Clerk check → Supabase check, API key check preserved
src/app/api/mcp/stdio/route.ts             # auth() → supabase.auth.getUser()
src/app/api/subscriptions/route.ts
src/app/api/notifications/route.ts
src/app/api/admin/subscription/route.ts
src/app/api/auth/verify/route.ts           # Clerk verify → Supabase verify (JWT validation instead)
src/app/api/upload/mux/route.ts
src/app/api/generate/route.ts
src/app/api/usage/route.ts
src/app/api/subscriptions/checkout/route.ts
src/app/api/mcp/search/route.ts
src/app/api/components/[id]/route.ts
src/app/api/components/route.ts
src/app/api/brand/export/route.ts
src/app/api/api-keys/[id]/route.ts
src/app/api/api-keys/route.ts
src/app/(dashboard)/*/page.tsx             (17 page components with auth() calls)
src/lib/subscription-actions.ts
```

**Metadata migration:**

```typescript
// BEFORE: Clerk publicMetadata/privateMetadata
const { publicMetadata } = await currentUser();
const tier = publicMetadata.tier;
const role = publicMetadata.role;

// AFTER: Supabase raw_user_meta_data
const { user } = await supabase.auth.getUser();
const tier = user.user_metadata.tier;
const role = user.user_metadata.role;

// OR: Custom user_profiles table (recommended for complex metadata)
const { data: profile } = await supabase
  .from("user_profiles")
  .select("tier, role")
  .eq("id", userId)
  .single();
```

**Auth UI components to build:**

- `SignInForm` — email + password, magic link option, "Forgot password" link
- `SignUpForm` — email + password + name
- `SupabaseUserButton` — avatar, name, dropdown (Settings, Sign Out)
- `AuthCallback` — OAuth callback handler (if adding social providers later)

**Verification:**

1. Sign up new user via Supabase UI → user appears in Supabase dashboard
2. Sign in → redirected to dashboard
3. API key authentication still works (dual auth preserved)
4. Protected routes redirect to sign-in when unauthenticated
5. Tier/role checks in server actions return correct user metadata

#### Task 2.3 — Clerk → Supabase Auth (prism-admin)

**Similar changes to prism-engine but smaller scope (12 files):**

| File                                      | Change                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `src/middleware.ts`                       | Clerk → Supabase SSR middleware                                        |
| `src/app/layout.tsx`                      | ClerkProvider → SupabaseProvider                                       |
| `src/app/admin/layout.tsx`                | UserButton → SupabaseUserButton; currentUser → supabase.auth.getUser() |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Custom sign-in page                                                    |
| `src/app/admin/users/page.tsx`            | auth() + currentUser → supabase                                        |
| `src/app/admin/settings/page.tsx`         | auth() + currentUser → supabase                                        |
| `src/app/admin/projects/page.tsx`         | auth() → supabase                                                      |
| `src/app/admin/inquiries/page.tsx`        | auth() → supabase                                                      |
| `src/app/admin/subscriptions/page.tsx`    | auth() → supabase                                                      |
| `src/app/admin/dashboard/page.tsx`        | auth() → supabase                                                      |
| `src/app/admin/clients/page.tsx`          | auth() → supabase                                                      |
| `src/app/api/bootstrap/route.ts`          | clerkClient.users.updateUser() → supabase.auth.admin.updateUserById()  |
| `src/app/api/admin/subscription/route.ts` | auth() → supabase                                                      |

**Role migration (critical path):**

```
Clerk: publicMetadata.role = "admin" | "employee" | "client"
  ↓
Supabase: user_profiles.role field + RLS policies
```

#### Task 2.4 — Clerk → Supabase Auth (syntaxure-labs)

**Simplest auth migration — only 3 files:**
| File | Change |
|------|--------|
| `src/contexts/user-context.tsx` | Firebase Auth `onAuthStateChanged` → Supabase `onAuthStateChange`. Replace custom `useUser()` hook |
| `src/components/admin/header.tsx` | Update `useUser()` usage |
| `src/components/admin/bootstrap-button.tsx` | Update `useUser()` usage |

#### Task 2.5 — Clerk User Export + Supabase Import

**Hard cutover procedure (manual):**

1. Export all Clerk users via Clerk Dashboard → CSV/JSON export
2. Write import script: `scripts/import-clerk-users.ts` — creates users in Supabase via Admin API with `email_confirm: true`, sets `user_metadata` from Clerk `publicMetadata`
3. Run import → all users have accounts but no password set
4. Send "Reset your password" email to all users via Supabase's `generateLink` API (type: `recovery`)
5. Cut over: deploy new code → Clerk sign-in routes → Supabase sign-in routes
6. Keep Clerk project active for 30 days as emergency fallback

#### Task 2.6 — Firestore → Supabase (syntaxure-labs)

**⚠️ Largest single migration. ~50+ files changed.**

**Step 1: Design Supabase schema → apply migration (see §3 below)**

**Step 2: Create Supabase client helpers:**

```
apps/agency/src/lib/supabase/
├── server.ts          # Server client (cookies + service role)
├── browser.ts         # Browser client (anon key)
└── admin.ts           # Admin client (service role, bypasses RLS for server actions)
```

**Step 3: Rewrite data types:**
| File | Change |
|------|--------|
| `src/types/firestore.ts` | **Delete.** Replace with `src/types/database.ts` (generated via `supabase gen types typescript`) |
| `src/types/subscription.ts` | Remove `Timestamp` import |
| `src/types/notification.ts` | Remove `Timestamp` import |

**Step 4: Rewrite server actions (8 files):**

```typescript
// BEFORE (Firestore)
import { db } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

const docRef = await db.collection("projects").add({
  title,
  createdAt: Timestamp.now(),
});
const snapshot = await db
  .collection("projects")
  .where("userId", "==", userId)
  .orderBy("createdAt", "desc")
  .get();
const projects = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

// AFTER (Supabase)
import { createClient } from "@/lib/supabase/admin";

const { data: project, error } = await supabase
  .from("projects")
  .insert({ title, user_id: userId })
  .select()
  .single();
const { data: projects } = await supabase
  .from("projects")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });
```

| File                                    | Action                                       |
| --------------------------------------- | -------------------------------------------- |
| `src/app/actions/subscriptions.ts`      | Firestore → Supabase (subscriptions table)   |
| `src/app/actions/notifications.ts`      | Firestore → Supabase (notifications table)   |
| `src/app/actions/projects.ts`           | Firestore → Supabase (projects table)        |
| `src/app/actions/calendar.ts`           | Firestore → Supabase (calendar_events table) |
| `src/app/actions/feedback.ts`           | Firestore → Supabase (feedback table)        |
| `src/app/actions/case-studies.ts`       | Firestore → Supabase (case_studies table)    |
| `src/app/actions/seed.ts`               | Firestore → Supabase seed                    |
| `src/app/actions/accept-invite.ts`      | Firestore → Supabase (invites table)         |
| `src/app/actions/users.ts`              | Firestore → Supabase (user_profiles table)   |
| `src/app/actions/project-management.ts` | Firestore → Supabase                         |

**Step 5: Rewrite components (15+ files):**
All components importing from `@/types/firestore` need imports updated to `@/types/database`.

**Step 6: Remove Firebase entirely from syntaxure-labs:**

- Delete `src/lib/firebase/` directory
- Delete `src/contexts/user-context.tsx` (replaced by Supabase Auth context)
- Remove `firebase`, `firebase-admin` from `package.json`
- Remove `FIREBASE_*`, `AGENCY_FIREBASE_KEY` from Doppler (for this app only)
- Remove `Timestamp` utility from `src/lib/utils.ts`

**Step 7: Write Firestore → Supabase data migration script:**

```
scripts/migrate-firestore-to-supabase.ts
```

- Iterates all Firestore collections
- Maps Timestamps → ISO strings
- Inserts into Supabase tables
- Verifies row counts match
- Handles errors with retry

**Verification:**

1. All server actions work with new Supabase backend
2. Admin dashboard fetches data from Supabase
3. Client-facing pages (projects, case studies) display data
4. Firestore seed script equivalent works on Supabase

#### Task 2.7 — prism-admin Firestore References Update

`apps/prism-admin/src/lib/firebase.ts` is used to READ agency Firestore data. After Task 2.6, agency data lives in Supabase.

| File                  | Change                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/lib/firebase.ts` | Replace Firestore reads with Supabase reads. Query same `projects`, `users`, `clients`, `invoices` tables in Supabase. |
| `package.json`        | Remove `firebase-admin`. Add `@supabase/supabase-js` if not already added by Task 2.3                                  |

#### Task 2.8 — Firebase Auth Removal (tracker/mht)

**Both apps being removed in Phase 3 (rename).** No migration needed. Just part of app removal verification in Phase 1.

---

### Phase 3: Restructure & Admin Integration (Weeks 6-7)

**Goal:** Apps renamed. Admin consolidated. Deployments stable.

#### Task 3.1 — Rename Agency → syntaxure-labs

**⚠️ Triggers new Vercel deployment + domain change.**

| Step | Action                                                                                                   |
| ---- | -------------------------------------------------------------------------------------------------------- |
| 1    | Rename `apps/agency/` → `apps/syntaxure-labs/`                                                           |
| 2    | Update `apps/syntaxure-labs/package.json`: `"name": "syntaxure-labs"`                                    |
| 3    | Update all internal imports that reference `apps/agency/`                                                |
| 4    | Update `docker-compose.yml`: `agency` → `syntaxure-labs` service name                                    |
| 5    | Update `docker-compose.yml`: Dockerfile path `apps/agency/Dockerfile` → `apps/syntaxure-labs/Dockerfile` |
| 6    | Update `.github/workflows/ci.yml`: build matrix names                                                    |
| 7    | Create new Vercel project linked to `apps/syntaxure-labs/`                                               |
| 8    | Set env vars in Vercel from Doppler                                                                      |
| 9    | Configure custom domain (TBD — see manual guide)                                                         |
| 10   | Update Doppler configs: app-specific vars for agency → syntaxure-labs                                    |

#### Task 3.2 — Rename prism-dashboard → prism-engine

| Step | Action                                                            |
| ---- | ----------------------------------------------------------------- |
| 1    | Rename `apps/prism-dashboard/` → `apps/prism-engine/`             |
| 2    | Update `apps/prism-engine/package.json`: `"name": "prism-engine"` |
| 3    | Update all internal imports                                       |
| 4    | Update `docker-compose.yml` service name + Dockerfile path        |
| 5    | Update CI workflow build matrix                                   |
| 6    | Create new Vercel project                                         |
| 7    | Move env vars                                                     |
| 8    | Configure custom domain                                           |

#### Task 3.3 — Repurpose tracker → prism-manage

| Step | Action                                                     |
| ---- | ---------------------------------------------------------- |
| 1    | Rename `apps/tracker/` → `apps/prism-manage/`              |
| 2    | Update `package.json`: `"name": "prism-manage"`, port 3007 |
| 3    | Strip all Firebase code (client SDK, admin SDK)            |
| 4    | Add Supabase client helpers                                |
| 5    | Keep FullCalendar setup, CalendarEventSchema, TaskSchema   |
| 6    | Keep glass UI/dark theme (inherits from agency design)     |
| 7    | Add Google Calendar OAuth2 integration (detailed in §8)    |
| 8    | New Vercel deployment                                      |

#### Task 3.4 — Integrate Agency Admin into prism-admin

**This is the key structural change.** Agency admin pages (~35 components) move from `apps/agency/src/components/admin/` to `apps/prism-admin/src/components/agency/`.

**What moves:**

```
FROM: apps/syntaxure-labs/src/
├── components/admin/
│   ├── dashboard/          # Admin dashboard widgets
│   ├── users/              # User management
│   ├── projects/           # Project CRUD
│   ├── quotes/             # Quote management
│   ├── invoices/           # Invoice management
│   ├── calendar/           # Admin calendar (FullCalendar)
│   ├── case-studies/       # Case study management
│   ├── feedback/           # Feedback/ratings
│   ├── settings/           # Agency settings
│   └── notifications/      # Notification center
├── app/actions/
│   ├── subscriptions.ts    # → prism-admin Supabase queries
│   ├── notifications.ts
│   ├── projects.ts
│   ├── calendar.ts
│   ├── feedback.ts
│   ├── case-studies.ts
│   ├── seed.ts
│   ├── users.ts
│   └── project-management.ts
└── lib/
    ├── data.ts             # Data layer → prism-admin Supabase queries
    └── firebase.ts         # REMOVED (replaced by Supabase)
```

**TO: apps/prism-admin/src/**

```
prism-admin/src/
├── components/
│   ├── agency/             # Agency admin components (moved here)
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── quotes/
│   │   ├── invoices/
│   │   ├── calendar/
│   │   ├── case-studies/
│   │   ├── feedback/
│   │   └── settings/
│   ├── prism/              # Prism engine admin components (existing)
│   │   └── ...
│   └── shared/             # Shared admin UI (tables, filters, modals)
│       └── ...
├── app/
│   └── (admin)/
│       ├── prism/          # Prism admin routes (existing)
│       └── agency/         # Agency admin routes (NEW)
│           ├── dashboard/
│           ├── projects/
│           ├── quotes/
│           ├── invoices/
│           ├── calendar/
│           ├── case-studies/
│           └── settings/
```

**Navigation restructure:**

```
prism-admin sidebar:
├── Overview
│   └── Super Dashboard (aggregated metrics across all apps)
├── Prism Engine
│   ├── Dashboard
│   ├── Brands
│   ├── Projects
│   ├── Marketplace
│   └── Users
├── Syntaxure Labs
│   ├── Dashboard
│   ├── Projects
│   ├── Quotes
│   ├── Invoices
│   ├── Calendar
│   ├── Case Studies
│   ├── Feedback
│   └── Clients
├── Team Hub (Phase 3 — see §7)
│   ├── Employees
│   ├── Tasks
│   └── Time Tracking
└── Settings
    ├── App Settings
    ├── Integrations
    └── Billing
```

**User roles for prism-admin:**

```
admin:     Full access (Jeff)
manager:   Can manage one or both app sections
employee:  View tasks, calendar, assigned projects
client:    View own projects, invoices, quotes (client portal)
```

**syntaxure-labs after admin extraction:**
Keep ONLY client-facing pages:

```
syntaxure-labs/src/app/
├── page.tsx              # Landing page (hero, services, features, etc.)
├── work/
│   └── [slug]/page.tsx   # Case study public pages
├── admin/                # LIGHTWEIGHT CLIENT PORTAL
│   ├── profile/          # Client profile management
│   ├── projects/         # Client's own projects (read-only)
│   └── invoices/         # Client's invoices (read-only, download PDF)
└── api/
    ├── contact/          # Contact form submission
    └── quote/            # Quote request submission
```

#### Task 3.5 — CI/CD & Docker Updates

Update all references to renamed/removed apps:

- **`.github/workflows/ci.yml`**: Update build/test matrix app names
- **`docker-compose.yml`**: Update service names and Dockerfile paths
- **`turbo.json`**: Verify no app-specific pipeline entries reference removed apps

---

### Phase 4: Design System Consolidation (Week 8)

#### Task 4.1 — Rename @jdstudio/ui → @syntaxure/ui

| Step | Action                                                                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------- |
| 1    | Update `packages/ui/package.json`: `"name": "@syntaxure/ui"`                                                      |
| 2    | Update all apps' `package.json`: `"@jdstudio/ui": "workspace:*"` → `"@syntaxure/ui": "workspace:*"`               |
| 3    | Update all import statements across 4 apps (prism-engine, syntaxure-labs, prism-admin, prism-manage) — ~50+ files |
| 4    | Update `next.config.ts` in apps that `transpilePackages: ["@jdstudio/ui"]` → `["@syntaxure/ui"]`                  |

#### Task 4.2 — Consolidate Design Tokens

**Current problem:** prism-engine, tracker/prism-manage duplicate agency's CSS custom properties instead of importing `@jdstudio/ui/styles.css`.

**Fix:**

```
packages/ui/src/
├── styles.css                     # Base "Endgame" tokens (from agency)
├── tokens/
│   ├── colors.css                 # --color-void, --color-cyan, etc.
│   ├── typography.css             # --font-sans, --font-mono
│   ├── glass.css                  # .glass, .glass-heavy, .glass-neon
│   ├── animations.css             # fade-in, pulse-glow, etc.
│   └── neon.css                   # .shadow-glow-cyan, .border-neon-cyan
├── themes/
│   ├── endgame.css                # Default dark void theme (imports all tokens)
│   ├── endgame-light.css          # Light mode overrides (from agency's theme-light)
│   ├── mission-control.css        # Amber admin theme (from prism-admin)
│   └── enterprise-white.css       # Blue-green corporate (from mht — reference only)
└── app-overrides/
    ├── prism-engine.css           # Engine-specific overrides (dark only, no light mode)
    ├── prism-admin.css            # Admin overrides (extends mission-control)
    └── prism-manage.css           # Manage overrides (extends endgame)
```

**Each app's globals.css becomes:**

```css
@import "tailwindcss";
@import "@syntaxure/ui/styles.css"; /* Single source of truth */
```

**Prism-admin's amber theme is preserved:** It becomes a theme extension in the shared package, not a duplicate.

**Agency landing page components are NEVER refactored.** The design's constitution IS the agency app. All other apps derive from it.

---

### Phase 5: New Builds (Weeks 9-11)

#### Task 5.1 — prism-manage Implementation (Calendar + Tasks MVP)

**Core features:**

1. Google Calendar OAuth2 integration
2. Calendar view (day, week, month) using FullCalendar (already installed)
3. Task management with drag-and-drop
4. Two-way sync: Supabase ↔ Google Calendar
5. Basic markdown notes for tasks (NOT full Notion blocks)

**Google Calendar integration:**

```typescript
// npm: googleapis, @supabase/supabase-js

// OAuth2 flow
GET  /api/calendar/auth          → Redirect to Google OAuth consent screen
GET  /api/calendar/callback      → Exchange code for tokens, store in user_tokens table

// Sync
POST /api/calendar/sync          → Pull Google Calendar events → upsert into calendar_events
                                  → Push Supabase events → Google Calendar

// Webhook
POST /api/calendar/webhook       → Receive push notifications from Google for real-time sync
```

**Database tables (Supabase):**

```sql
-- Extended from tracker's existing schemas
calendar_events (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  google_event_id text,           -- For sync dedup
  linked_task_id uuid REFERENCES tasks(id),
  synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

tasks (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  title text NOT NULL,
  description text,
  status task_status DEFAULT 'todo',
  priority int DEFAULT 0,
  due_date timestamptz,
  google_event_id text,
  notes text,                     -- Markdown notes (MVP: plain text area)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

#### Task 5.2 — prism-analytics Implementation (Python Flask API)

**Structure:**

```
apps/prism-analytics/
├── pyproject.toml
├── Dockerfile
├── src/
│   ├── main.py              # FastAPI app entry
│   ├── routes/
│   │   ├── leads.py         # Lead conversion analytics
│   │   ├── kpi.py           # KPI dashboards
│   │   ├── gtm.py           # Go-to-market metrics
│   │   └── funnel.py        # Conversion funnel analysis
│   ├── services/
│   │   ├── supabase.py      # Supabase client (read-only)
│   │   └── analytics.py     # pandas/matplotlib/seaborn logic
│   └── models/
│       └── schemas.py       # Pydantic models
├── notebooks/               # Jupyter notebooks for exploration
└── tests/
```

**Dependencies:** fastapi, uvicorn, supabase-py, pandas, matplotlib, seaborn, pydantic

**API endpoints:**

```
GET  /api/v1/health
GET  /api/v1/leads/conversion-rate?start=2026-01-01&end=2026-05-31
GET  /api/v1/kpi/summary?period=monthly
GET  /api/v1/gtm/metrics?channel=all
GET  /api/v1/funnel/stages
GET  /api/v1/reports/export?format=csv
```

**Data sources:** Reads from Supabase (agency data — quotes, invoices, clients). Optionally ingests Google Analytics data via `@google-analytics/data` (already in agency deps).

---

### Phase 6: Advanced — Gremlin Graph (Weeks 12-14)

#### Task 6.1 — Cosmos DB Gremlin API Setup

- Create separate Cosmos DB account or database with Gremlin API
- Add `COSMOS_GREMLIN_ENDPOINT`, `COSMOS_GREMLIN_KEY` to Doppler
- Install Apache TinkerPop Gremlin JS client: `gremlin` npm package

#### Task 6.2 — Graph Data Model

```
Vertex types:
  Rule { id, title, content, category, priority, source }
  Skill { id, name, summary, content, category }
  Tag { id, name }
  Project { id, name }

Edge types:
  relates_to(weight)     Rule ↔ Rule (semantic relationship, weight 0-1)
  conflicts_with(weight) Rule ↔ Rule (conflict severity)
  requires               Rule → Rule (dependency)
  tagged_with            Rule → Tag
  belongs_to             Rule → Project
  related_skill          Rule → Skill
```

#### Task 6.3 — Migration Script

```
scripts/migrate-rules-to-gremlin.ts
```

1. Read all rules from MongoDB `rules` collection
2. For each rule, create Gremlin vertex
3. Use Gemini to analyze rule content → suggest relationships (relates_to, conflicts_with)
4. Create edges with weights
5. Verify: count vertices matches MongoDB document count

#### Task 6.4 — Replace Smart Select with Graph Ranking

```typescript
// BEFORE: MongoDB query + Gemini embedding cosine similarity
const rules = await getCollection("rules").find({ projectId }).toArray();
const ranked = await smartSelect(task, rules); // embedding-based

// AFTER: Gremlin traversal with graph centrality
const result = await g
  .V()
  .has("projectId", projectId)
  .has("category", within(relevantCategories))
  .order()
  .by("priority", decr) // Priority first pass
  .order()
  .by("centrality", decr) // Graph centrality second pass
  .limit(10)
  .valueMap()
  .toList();
```

**Graph centrality options:**

- PageRank — rules referenced by many other rules score higher
- Betweenness — rules that bridge different categories score higher
- Degree centrality — rules with many relationships score higher

#### Task 6.5 — Dual Read (Safety Net)

During transition, BOTH MongoDB and Gremlin queries run. Results compared for correctness. After 30 days with no discrepancies, MongoDB queries removed.

---

## 3. Supabase Schema & RBAC Design

### Table Definitions

```sql
-- Core user profile (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'manager', 'employee', 'client')),
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'team', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'review', 'completed', 'archived')),
  category TEXT,
  technologies TEXT[],
  thumbnail_url TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  service_type TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  quote_id UUID REFERENCES quotes(id),
  invoice_number TEXT UNIQUE NOT NULL,
  items JSONB DEFAULT '[]',       -- Line items array
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Calendar Events
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('meeting', 'deadline', 'milestone', 'personal', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  google_event_id TEXT,
  linked_project_id UUID REFERENCES projects(id),
  linked_task_id UUID REFERENCES tasks(id),
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Case Studies
CREATE TABLE case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  content TEXT,
  cover_image_url TEXT,
  technologies TEXT[],
  results JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'responded', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'business', 'custom', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  paypal_subscription_id TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  type TEXT CHECK (type IN ('project_update', 'invoice', 'quote', 'system')),
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Invites
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES user_profiles(id),
  role TEXT DEFAULT 'client',
  token TEXT UNIQUE NOT NULL,
  accepted BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Syntaxure Labs: Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES user_profiles(id),
  recipient_id UUID REFERENCES user_profiles(id),
  subject TEXT,
  body TEXT,
  read BOOLEAN DEFAULT false,
  thread_id UUID,                  -- Self-referencing for threading
  created_at TIMESTAMPTZ DEFAULT now()
);

-- prism-manage: Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority INT DEFAULT 0,
  due_date TIMESTAMPTZ,
  google_event_id TEXT,
  notes TEXT,
  parent_task_id UUID REFERENCES tasks(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- prism-manage: Google Calendar Tokens
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id),
  provider TEXT NOT NULL CHECK (provider IN ('google')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- user_profiles: Users can read any profile, only admins can update
CREATE POLICY "Anyone can read profiles"
  ON user_profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'admin')
  );

-- projects: Owner can CRUD, managers can CRUD, employees can read own, clients can read own
CREATE POLICY "Owner can manage projects"
  ON projects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Managers can manage all projects"
  ON projects FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
  );

CREATE POLICY "Clients can view own projects"
  ON projects FOR SELECT USING (auth.uid() = user_id);

-- calendar_events: Owner + manager access
CREATE POLICY "Owner can manage calendar"
  ON calendar_events FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all calendar"
  ON calendar_events FOR SELECT USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
  );

-- tasks (prism-manage): Owner + assigned user
CREATE POLICY "Owner can manage tasks"
  ON tasks FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Assignee can update task status"
  ON tasks FOR UPDATE USING (auth.uid() = assigned_to);

-- user_tokens: Only owner can access
CREATE POLICY "Users can manage own tokens"
  ON user_tokens FOR ALL USING (auth.uid() = user_id);
```

---

## 4. Auth Migration (Clerk → Supabase) — Detailed

### Cutover Procedure

**Pre-cutover (Week 4):**

1. Build Supabase auth UI components (SignInForm, SignUpForm, SupabaseUserButton)
2. Build Supabase SSR middleware (session management, cookie rotation)
3. Deploy to staging — verify all protected routes work
4. Export Clerk users: Dashboard → Users → Export (CSV/JSON)
5. Write + run `scripts/import-clerk-users.ts`:
   ```typescript
   // For each Clerk user:
   await supabaseAdmin.auth.admin.createUser({
     email: clerkUser.email,
     email_confirm: true,          // Skip verification
     user_metadata: {
       tier: clerkUser.publicMetadata.tier,
       role: clerkUser.publicMetadata.role,
       clerk_id: clerkUser.id      // Store for traceability
     }
   });
   // Insert into user_profiles table
   await supabaseAdmin.from("user_profiles").insert({...});
   ```
6. Verify all users imported: count match between Clerk and Supabase
7. Send password reset emails:
   ```typescript
   for (const user of importedUsers) {
     await supabaseAdmin.auth.admin.generateLink({
       type: "recovery",
       email: user.email,
     });
   }
   ```

**Cutover day:**

1. Deploy prism-engine + prism-admin with Supabase Auth (not Clerk)
2. Deploy syntaxure-labs with Supabase Auth (not Firebase Auth)
3. Monitor error rates for 24 hours
4. Keep Clerk + Firebase Auth projects active for 30 days (emergency rollback)

**Post-cutover (Week 5):**

1. Remove `@clerk/nextjs`, `@clerk/themes` from all apps
2. Remove Firebase Auth from syntaxure-labs
3. Remove Clerk env vars from Doppler
4. Clean up Clerk webhooks
5. Cancel Clerk subscription

### Auth UI Flow

```
User visits app
  → Middleware checks for Supabase session cookie
  → No session → Redirect to /sign-in
  → User enters email + password
  → supabase.auth.signInWithPassword()
  → Session created, cookie set
  → Redirect to original destination
  → UserButton in header shows avatar (from user_metadata.avatar_url)
  → Dropdown: Profile, Settings, Sign Out
```

### Role-Based Access in prism-admin

```typescript
// Server-side: check role before rendering admin sections
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["admin", "manager"].includes(profile.role)) {
    redirect("/unauthorized");
  }
  // ...
}
```

**Middleware protection:**

```typescript
// apps/prism-admin/src/middleware.ts
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

---

## 5. Firestore → Supabase Data Migration

### Migration Script Design

```typescript
// scripts/migrate-firestore-to-supabase.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createClient } from "@supabase/supabase-js";

const COLLECTION_MAP = {
  users: { table: "user_profiles", transform: transformUser },
  projects: { table: "projects", transform: transformProject },
  calendar_events: {
    table: "calendar_events",
    transform: transformCalendarEvent,
  },
  quotes: { table: "quotes", transform: transformQuote },
  invoices: { table: "invoices", transform: transformInvoice },
  case_studies: { table: "case_studies", transform: transformCaseStudy },
  feedback: { table: "feedback", transform: transformFeedback },
  subscriptions: { table: "subscriptions", transform: transformSubscription },
  notifications: { table: "notifications", transform: transformNotification },
  invites: { table: "invites", transform: transformInvite },
  messages: { table: "messages", transform: transformMessage },
};

async function migrate() {
  for (const [collection, { table, transform }] of Object.entries(
    COLLECTION_MAP,
  )) {
    const snapshot = await firestore.collection(collection).get();
    const rows = snapshot.docs.map((doc) => transform(doc.id, doc.data()));

    // Batch insert in chunks of 100
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase
        .from(table)
        .upsert(chunk, { onConflict: "id" });
      if (error) {
        console.error(`Failed to migrate ${collection} chunk ${i}:`, error);
        // Write failed records to migration_errors.json for manual review
      }
    }

    // Verify
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    console.log(
      `${collection}: Firestore ${snapshot.size} → Supabase ${count} ✓`,
    );
  }
}

// Transform functions handle:
// - snake_case field names (userId → user_id)
// - Timestamp → ISO string
// - DocumentReference → UUID
// - Firestore GeoPoint → lat/lon fields
function transformProject(firestoreId: string, data: any) {
  return {
    id: data.id || firestoreId,
    user_id: data.userId,
    title: data.title,
    description: data.description,
    status: data.status,
    created_at: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updated_at: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  };
}
```

**Run order:** Non-relational tables first (users), then dependent tables (projects → milestones, projects → calendar_events).

**Dry run:** Run with `--dry-run` flag first → validates transforms, counts rows, reports errors without writing.

---

## 6. Package Rename: @jdstudio/ui → @syntaxure/ui

### Files to update (30+ import statements)

**Package itself:**
| File | Change |
|------|--------|
| `packages/ui/package.json` | `"name": "@syntaxure/ui"` |

**Apps importing @jdstudio/ui:**

```
apps/syntaxure-labs/     # ~8 files (header, footer, landing sections)
apps/prism-engine/       # ~15 files (GlassPanel, Button, Badge, Card, MetricTile, etc.)
apps/prism-admin/        # ~3 files
apps/prism-manage/       # ~3 files (from tracker)
```

| App Package                   | Change                                                             |
| ----------------------------- | ------------------------------------------------------------------ |
| `syntaxure-labs/package.json` | `"@jdstudio/ui": "workspace:*"` → `"@syntaxure/ui": "workspace:*"` |
| `prism-engine/package.json`   | Same                                                               |
| `prism-admin/package.json`    | Same                                                               |
| `prism-manage/package.json`   | Same                                                               |

**Next.js transpilePackages:**
| App | Change |
|-----|--------|
| `prism-engine/next.config.ts` | `transpilePackages: ["@syntaxure/ui", ...]` |
| `prism-admin/next.config.ts` | Same |
| `prism-manage/next.config.ts` | Same |

**CSS imports:**

```css
/* BEFORE */
@import "@jdstudio/ui/styles.css";

/* AFTER */
@import "@syntaxure/ui/styles.css";
```

---

## 7. prism-admin Expansion — Three-Zone Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    prism-admin (port 3004)                  │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────┐│
│  │   App Management     │  │   Client Portal               ││
│  │                      │  │                               ││
│  │  • Prism Engine mgmt │  │  • View own projects          ││
│  │    (brands, rules,   │  │  • View invoices + download   ││
│  │     skills, projects,│  │  • Accept/reject quotes       ││
│  │     subscriptions)   │  │  • View case studies          ││
│  │                      │  │  • Provide feedback           ││
│  │  • Syntaxure Labs    │  │  • Project timeline view      ││
│  │    mgmt (projects,   │  │  • Calendar (client events)   ││
│  │    quotes, invoices, │  │                               ││
│  │    case studies,     │  │                               ││
│  │    calendar,         │  │                               ││
│  │    feedback)         │  │                               ││
│  └──────────────────────┘  └──────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │   Team Hub                                              ││
│  │                                                          ││
│  │  • Employee directory + profiles                        ││
│  │  • Task assignment + tracking (prism-manage integration) ││
│  │  • Time tracking (future)                               ││
│  │  • Internal announcements                               ││
│  │  • Onboarding checklist                                 ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

**Route structure:**

```
prism-admin/src/app/
├── (auth)/
│   └── sign-in/             # Supabase Auth sign-in
├── (admin)/
│   ├── dashboard/           # Super dashboard (aggregated)
│   ├── prism/               # Prism Engine management
│   │   ├── dashboard/
│   │   ├── brands/
│   │   ├── projects/
│   │   ├── rules/
│   │   ├── marketplace/
│   │   ├── subscriptions/
│   │   └── users/
│   ├── agency/              # Syntaxure Labs management
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── quotes/
│   │   ├── invoices/
│   │   ├── calendar/
│   │   ├── case-studies/
│   │   ├── feedback/
│   │   └── clients/
│   ├── team/                # Team Hub (Phase 2 of this task)
│   │   ├── employees/
│   │   └── tasks/
│   └── settings/
│       ├── general/
│       ├── integrations/
│       └── billing/
└── portal/                  # Client portal (lightweight)
    ├── projects/
    ├── invoices/
    └── profile/
```

**RBAC for three zones:**

| Role     | App Management  | Client Portal | Team Hub                |
| -------- | --------------- | ------------- | ----------------------- |
| admin    | Full access     | —             | Full access             |
| manager  | Full access     | —             | Full access             |
| employee | Prism view only | —             | Full access (own tasks) |
| client   | —               | Own data only | —                       |

---

## 8. prism-manage — Calendar + Tasks MVP

### Tech Stack

- **Frontend:** Next.js 16, `@fullcalendar/react` (already in tracker), `@syntaxure/ui`
- **Backend:** Server actions with Supabase
- **Google Calendar:** `googleapis` npm, OAuth2 web flow
- **Auth:** Supabase Auth (shared session)

### Feature Roadmap

**MVP (Week 9-10):**

- [ ] User authentication via Supabase (shared session)
- [ ] Calendar view (day/week/month) using FullCalendar
- [ ] Create/edit/delete events
- [ ] Google Calendar OAuth2 connection
- [ ] One-way sync: Google → Supabase (pull events)
- [ ] Task management (list view with status columns)
- [ ] Task → Calendar event linking

**Phase 2 (Post-MVP, Week 11+):**

- [ ] Two-way sync: Supabase ↔ Google Calendar
- [ ] Google Calendar push webhook for real-time updates
- [ ] Task drag-and-drop reordering
- [ ] Markdown notes on tasks
- [ ] Task assignment to team members

### Google Calendar OAuth2 Flow

```typescript
// 1. User clicks "Connect Google Calendar"
// → Redirect to Google OAuth consent screen
// GET /api/calendar/auth

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // Get refresh token
  scope: [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar.readonly",
  ],
  prompt: "consent", // Always get refresh token
});

// 2. Google redirects back with code
// GET /api/calendar/callback?code=xxx

const { tokens } = await oauth2Client.getToken(code);
// Store tokens in user_tokens table (encrypted at rest)
await supabase.from("user_tokens").upsert({
  user_id: user.id,
  provider: "google",
  access_token: tokens.access_token,
  refresh_token: tokens.refresh_token,
  expires_at: new Date(Date.now() + tokens.expiry_date).toISOString(),
});

// 3. Sync events
// POST /api/calendar/sync

const calendar = google.calendar({ version: "v3", auth: oauth2Client });
const { data } = await calendar.events.list({
  calendarId: "primary",
  timeMin: startOfMonth.toISOString(),
  timeMax: endOfMonth.toISOString(),
  maxResults: 2500,
});

// Upsert into calendar_events table
for (const event of data.items) {
  await supabase.from("calendar_events").upsert(
    {
      user_id: user.id,
      title: event.summary,
      description: event.description,
      start_time: event.start.dateTime || event.start.date,
      end_time: event.end.dateTime || event.end.date,
      all_day: !!event.start.date,
      google_event_id: event.id,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "google_event_id" },
  );
}
```

**Doppler vars to add:**

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_SITE_URL=http://localhost:3007   # prism-manage URL
```

---

## 9. prism-analytics — Python Flask API

### Tech Decisions

- **Framework:** FastAPI (async, auto-docs, Pydantic integration)
- **Package manager:** uv (fast, Rust-based, pip compatible)
- **Deployment:** Docker container, potentially Vercel Python or Fly.io

### pyproject.toml

```toml
[project]
name = "prism-analytics"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn>=0.34",
    "supabase>=2.13",
    "pandas>=2.2",
    "matplotlib>=3.10",
    "seaborn>=0.13",
    "pydantic>=2.10",
    "httpx>=0.28",
    "python-dotenv>=1.1",
]

[project.optional-dependencies]
dev = ["pytest>=8", "ruff>=0.11", "jupyter>=1.1"]

[tool.uv]
```

### Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen --no-dev
COPY src/ ./src/
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Key API Endpoint Design

```python
# src/routes/leads.py
@router.get("/conversion-rate")
async def get_conversion_rate(
    start: date,
    end: date,
    supabase: SupabaseClient = Depends(get_supabase)
) -> LeadConversionResponse:
    """Lead conversion rate: quotes → accepted → paid invoices."""
    quotes = await supabase.from_("quotes") \
        .select("*") \
        .gte("created_at", start.isoformat()) \
        .lte("created_at", end.isoformat()) \
        .execute()

    df = pd.DataFrame(quotes.data)
    # pandas analytics pipeline
    total_leads = len(df)
    accepted = len(df[df["status"] == "accepted"])
    paid = len(df[df["status"] == "paid"])

    return LeadConversionResponse(
        total_leads=total_leads,
        accepted=accepted,
        conversion_rate=round(accepted / total_leads * 100, 2) if total_leads else 0,
        chart_url=generate_chart(df)  # matplotlib → base64 PNG
    )
```

---

## 10. Cosmos DB + Gremlin Graph (Neuro-Symbolic AI)

### Why Gremlin for Prism Rules?

Current embedding-based rule selection works but has blind spots:

- Doesn't understand rule relationships (rule A contradicts rule B)
- Can't traverse dependency chains (rule C requires rules A and D)
- No graph-aware ranking (a rule that bridges CSS and accessibility is more valuable than isolated rules)

Gremlin graph enables:

- **Relationship-aware retrieval** — traverse `requires` → `conflicts_with` → `relates_to`
- **Graph centrality ranking** — PageRank identifies foundational rules
- **Conflict detection** — warn AI before it generates rule-violating code
- **Neuro-symbolic loop** — LLM proposes rules → graph validates consistency → LLM iterates

### Database Design

**Separate Cosmos DB account/database: `prism-graph` (Gremlin API)**

- Cosmos DB supports multiple APIs per account, but Gremlin and MongoDB can't share the same database within an account. Use separate database or separate account.

**Connection:**

```
COSMOS_GREMLIN_ENDPOINT=wss://prism-graph.gremlin.cosmos.azure.com:443/
COSMOS_GREMLIN_KEY=...
```

### Gremlin Client Setup

```typescript
// packages/db/src/cosmos-gremlin.ts
import gremlin from "gremlin";

const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;

let g: gremlin.process.GraphTraversalSource;

export async function getGremlinClient() {
  if (!g) {
    const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(
      `/dbs/prism-graph/colls/rules`,
      process.env.COSMOS_GREMLIN_KEY!,
    );
    const client = gremlin.driver.Client.create(
      process.env.COSMOS_GREMLIN_ENDPOINT!,
      { authenticator },
    );
    g = traversal().withRemote(new DriverRemoteConnection(client));
  }
  return g;
}
```

### Graph Queries for Rule Selection

```typescript
// Basic: Get rules by project with priority ordering
const rules = await g
  .V()
  .hasLabel("rule")
  .has("projectId", projectId)
  .order()
  .by("priority", gremlin.process.order.decr)
  .limit(10)
  .valueMap()
  .toList();

// Advanced: Get foundational rules (high PageRank)
const foundationalRules = await g
  .V()
  .hasLabel("rule")
  .has("projectId", projectId)
  .order()
  .by("pagerank", gremlin.process.order.decr)
  .limit(5)
  .valueMap()
  .toList();

// Advanced: Get rules related to task keywords (tag traversal)
const relevantRules = await g
  .V()
  .hasLabel("tag")
  .has("name", gremlin.process.P.within(taskTags))
  .inE("tagged_with")
  .outV()
  .hasLabel("rule")
  .dedup()
  .valueMap()
  .toList();

// Advanced: Find conflicting rules (for AI warning)
const conflicts = await g
  .V(ruleId)
  .outE("conflicts_with")
  .inV()
  .valueMap()
  .toList();
```

### Migration: MongoDB Rules → Gremlin Graph

```typescript
// scripts/migrate-rules-to-gremlin.ts

// 1. Fetch all rules from MongoDB
const rules = await getCollection("rules").find({}).toArray();

// 2. Create vertices for each rule
for (const rule of rules) {
  await g
    .addV("rule")
    .property("id", rule._id.toString())
    .property("title", rule.title)
    .property("content", rule.content)
    .property("category", rule.category)
    .property("priority", rule.priority || 5)
    .property("projectId", rule.projectId)
    .property("source", rule.source || "manual")
    .iterate();
}

// 3. Create tag vertices and edges
for (const rule of rules) {
  for (const tag of rule.tags || []) {
    // Find or create tag vertex
    const tagVertex = await g
      .V()
      .has("tag", "name", tag)
      .fold()
      .coalesce(
        gremlin.process.__.unfold(),
        gremlin.process.__.addV("tag").property("name", tag),
      )
      .next();

    // Create edge
    await g
      .V(rule._id.toString())
      .addE("tagged_with")
      .to(g.V(tagVertex.value.id))
      .iterate();
  }
}

// 4. Generate relationships using Gemini
for (let i = 0; i < rules.length; i++) {
  for (let j = i + 1; j < rules.length; j++) {
    const relationship = await gemini.detectRelationship(rules[i], rules[j]);
    if (relationship.type === "relates_to") {
      await g
        .V(rules[i]._id.toString())
        .addE("relates_to")
        .property("weight", relationship.weight)
        .to(g.V(rules[j]._id.toString()))
        .iterate();
    } else if (relationship.type === "conflicts_with") {
      await g
        .V(rules[i]._id.toString())
        .addE("conflicts_with")
        .property("weight", relationship.weight)
        .to(g.V(rules[j]._id.toString()))
        .iterate();
    } else if (relationship.type === "requires") {
      await g
        .V(rules[i]._id.toString())
        .addE("requires")
        .to(g.V(rules[j]._id.toString()))
        .iterate();
    }
  }
}
```

**Fallback strategy:** During migration, keep MongoDB queries active. Run Gremlin queries in parallel, compare results. After 30 days with consistent results, switch to Gremlin-only.

---

## 11. Design System Consolidation

### Principle: Agency is the Constitution

The agency app's "Endgame" design system is the source of truth. All other app designs derive from it.

### Architecture

```
@语法/core/ui (packages/ui/)
├── styles.css                 # Main entrypoint — imports all tokens + utilities
├── tokens/
│   ├── colors.css             # CSS custom properties (--color-void, --color-glass, etc.)
│   ├── dark.css               # :root dark theme tokens
│   ├── light.css              # .theme-light overrides
│   ├── typography.css         # --font-sans, --font-mono, text gradients
│   ├── spacing.css            # Spacing scale
│   └── shadows.css            # --shadow-glow-cyan, --shadow-glow-purple
├── utilities/
│   ├── glass.css              # .glass, .glass-heavy, .glass-neon, .glass-shimmer
│   ├── animations.css         # @keyframes fade-in, pulse-glow, neon-breathe, float-subtle
│   ├── text.css               # .text-gradient-cyan, .text-gradient-holographic
│   └── layout.css             # .grid-overlay, .bg-noise, .hero-section-bg, .clip-diagonal
├── themes/
│   ├── endgame.css            # Default (imports tokens/dark.css)
│   ├── mission-control.css    # Amber accents (prism-admin theme)
│   └── enterprise.css         # Reference only (mht's white glass design, not actively used)
└── components/
    ├── button.css             # CVA variant styles (from button.tsx)
    ├── card.css
    ├── badge.css
    ├── glass-panel.css
    └── scrollbar.css          # Webkit scrollbar styling
```

### App Consumption

**syntaxure-labs (globals.css):**

```css
@import "tailwindcss";
@import "@syntaxure/ui/styles.css"; /* Full Endgame system (dark + light) */
```

**prism-engine (globals.css):**

```css
@import "tailwindcss";
@import "@syntaxure/ui/styles.css"; /* Endgame tokens */
/* prism-engine only uses dark mode — no .theme-light toggle */
```

**prism-admin (globals.css):**

```css
@import "tailwindcss";
@import "@syntaxure/ui/styles.css"; /* Endgame base tokens */
/* Applies theme: mission-control via admin/globals.css or theme class on body */
```

**prism-manage (globals.css):**

```css
@import "tailwindcss";
@import "@syntaxure/ui/styles.css"; /* Endgame tokens */
```

### What MUST NOT Change

- Agency landing page components (`hero.tsx`, `services.tsx`, `features.tsx`, `works-showcase.tsx`, `agentic-protocol.tsx`, `cta.tsx`)
- Agency layout (`header.tsx`, `footer.tsx`)
- Theme toggle mechanism (`.theme-light` class, localStorage, inline bootstrap script)
- All CSS class names used in agency components (`.glass-neon`, `.hero-neon-overlay`, `.text-gradient-holographic`, `.clip-diagonal`, etc.)

These are the constitution. The shared package MUST support them verbatim.

---

## 12. Doppler Env Var Reorganization

### Current Global Env (turbo.json globalEnv — 50 vars)

| Category      | Vars to KEEP                                                                                | Vars to REMOVE                                                                                 | Vars to ADD                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Clerk**     | —                                                                                           | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`                                        | —                                                                                                                   |
| **Supabase**  | —                                                                                           | —                                                                                              | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` |
| **Firebase**  | `FIREBASE_*` (if prism-admin reads legacy agency data during migration)                     | `AGENCY_FIREBASE_KEY`, `NEXT_PUBLIC_FIREBASE_*`                                                | —                                                                                                                   |
| **Cosmos DB** | `MONGODB_URI`, `COSMOS_DATABASE_NAME`                                                       | —                                                                                              | `COSMOS_GREMLIN_ENDPOINT`, `COSMOS_GREMLIN_KEY`                                                                     |
| **R2**        | —                                                                                           | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | —                                                                                                                   |
| **Redis**     | —                                                                                           | —                                                                                              | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (or `REDIS_URL`)                                               |
| **Google**    | —                                                                                           | —                                                                                              | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                                                          |
| **AI**        | `GEMINI_API_KEY`, `AZURE_OPENAI_*`, `AI_PROVIDER`, `GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL` | —                                                                                              | —                                                                                                                   |
| **Mux**       | `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET`                                    | —                                                                                              | —                                                                                                                   |
| **PayPal**    | All `PAYPAL_*` vars                                                                         | —                                                                                              | —                                                                                                                   |
| **Sentry**    | All `SENTRY_*` vars                                                                         | —                                                                                              | —                                                                                                                   |
| **Email**     | All `ZOHO_*`, `RESEND_*`, `ADMIN_EMAIL`, etc.                                               | —                                                                                              | —                                                                                                                   |
| **Prism**     | `PRISM_API_KEY`, `PRISM_API_URL`                                                            | —                                                                                              | —                                                                                                                   |
| **Misc**      | `EXCHANGE_RATE_API_KEY`, `GA_PROPERTY_ID`, `SESSION_SECRET`                                 | —                                                                                              | `NEXT_PUBLIC_SITE_URL` (per-app)                                                                                    |

### Per-App Env Vars (Vercel projects)

These should be set in each Vercel project's environment, NOT in global Doppler:

| App             | Vars                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------- |
| syntaxure-labs  | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| prism-engine    | Same                                                                                     |
| prism-admin     | Same                                                                                     |
| prism-manage    | Same + `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                        |
| prism-docs      | Keep existing                                                                            |
| prism-analytics | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Python doesn't use `NEXT_PUBLIC_` prefix)   |

---

## 13. CI/CD & Docker Updates

### .github/workflows/ci.yml Changes

```yaml
# BEFORE
matrix:
  app: [prism-cli, prism-mcp-server]

# AFTER
matrix:
  app: [prism-cli, prism-mcp-server, prism-analytics]
```

```yaml
# Remove prism-dashboard from build matrix, add prism-engine
# Build matrix:
matrix:
  app: [prism-engine, prism-docs, prism-mcp-server]
```

### docker-compose.yml Changes

```yaml
services:
  # RENAMED: agency → syntaxure-labs
  syntaxure-labs:
    build:
      context: .
      dockerfile: apps/syntaxure-labs/Dockerfile
    ports: ["3000:3000"]
    depends_on: [cosmos]

  # RENAMED: prism-dashboard → prism-engine
  prism-engine:
    build:
      context: .
      dockerfile: apps/prism-engine/Dockerfile
    ports: ["3001:3001"]
    depends_on: [cosmos]

  prism-docs:
    ports: ["3002:3002"]

  prism-mcp-server:
    ports: ["3003:3003"]
    depends_on: [cosmos]

  # NEW
  prism-manage:
    build:
      context: .
      dockerfile: apps/prism-manage/Dockerfile
    ports: ["3007:3007"]

  prism-analytics:
    build:
      context: apps/prism-analytics
      dockerfile: Dockerfile
    ports: ["8000:8000"]

  cosmos:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [cosmos_data:/data/db]

  # NEW
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### .releaserc.json / Changesets

If converting to changeset-based releases (already partially configured), update `.changeset/config.json` to ensure `@prism-engine/cli` auto-publishes to npm.

---

## 14. Rollback Strategy (per Phase)

### Phase 1 (Foundation)

**Risk: LOW.** Rollback is trivial:

- Restore deleted app directories from git
- `pnpm install` to restore lockfile

### Phase 2 (Auth + DB)

**Risk: HIGH.** Multi-layered rollback:

**Auth rollback (if Supabase Auth fails):**

1. Revert middleware in prism-engine + prism-admin to Clerk
2. Deploy Clerk-only version
3. Clerk account still active (keep for 30 days)

**DB rollback (if Supabase fails):**

1. Revert server actions to Firestore
2. Firestore still has data (never deleted — migrated, not truncated)
3. Deploy Firestore-only version

**Storage rollback:**

1. Revert upload actions to R2
2. R2 bucket not deleted during migration

### Phase 3 (Restructure)

**Risk: MEDIUM.** Namespace conflicts:

- Vercel: keep old project alive, deploy new project with alias
- DNS: keep old domain as redirect to new domain
- Git: directory renames can be reverted via `git revert`

### Phase 4 (Design)

**Risk: LOW.** CSS-only changes:

- Revert CSS imports if visual regressions occur
- Agency landing page components NEVER touched — design regressions impossible

### Phase 5 (New Builds)

**Risk: LOW.** New apps are additive:

- prism-manage: if not ready, deploy tracker temporarily (keep old code)
- prism-analytics: separate service, no impact on Next.js apps

### Phase 6 (Gremlin)

**Risk: MEDIUM-HIGH.** Dual-read safety net:

- Keep MongoDB queries active alongside Gremlin
- Feature flag: `USE_GREMLIN_OF_RULES=false` for instant rollback
- 30-day dual-read period for validation

---

## 15. Testing Gates (per Phase)

### Phase 2 — Auth Migration Gate

- [ ] Sign up new user via Supabase → appears in Supabase dashboard
- [ ] Sign in → redirects to dashboard
- [ ] Protected routes redirect to sign-in when unauthenticated
- [ ] API key auth still works (prism-engine dual auth preserved)
- [ ] User metadata (tier, role) accessible in server actions
- [ ] Clerk user import count matches Clerk dashboard
- [ ] Password reset email received and works
- [ ] `pnpm --filter prism-engine run check-types` passes
- [ ] `pnpm --filter prism-engine run lint` passes
- [ ] `pnpm --filter prism-engine run build` succeeds
- [ ] `pnpm --filter prism-mcp-server run test` — all 109 tests pass
- [ ] `pnpm --filter @prism-engine/cli run test` — all 30 tests pass

### Phase 2 — DB Migration Gate

- [ ] All server actions (subscriptions, notifications, projects, calendar, feedback, case studies, seeding) work
- [ ] Admin panel loads data from Supabase
- [ ] Firestore → Supabase migration script: row counts match
- [ ] Timestamps display correctly (no Firestore Timestamp objects reaching client)
- [ ] `pnpm --filter syntaxure-labs run check-types` passes
- [ ] `pnpm --filter syntaxure-labs run lint` passes
- [ ] `pnpm --filter syntaxure-labs run build` succeeds

### Phase 3 — Restructure Gate

- [ ] `syntaxure-labs` builds and deploys on Vercel
- [ ] `prism-engine` builds and deploys on Vercel
- [ ] `prism-manage` builds and deploys on Vercel
- [ ] Agency admin accessible via prism-admin routes, not syntaxure-labs
- [ ] All Docker services start: `docker compose up`
- [ ] `turbo run build` succeeds for all apps

### Phase 4 — Design Gate

- [ ] Agency landing page visually identical to pre-refactor
- [ ] All apps import `@syntaxure/ui/styles.css` without duplicate tokens
- [ ] prism-admin amber theme renders correctly
- [ ] No visual regressions in prism-engine dark theme
- [ ] `turbo run check-types lint` passes for all workspaces

---

## 16. Timeline & Developer Allocation

| Week   | Phase                | Jeff                                                                     | Lou                                                              |
| ------ | -------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **1**  | Foundation           | Task 1.1 (remove apps), 1.2 (npm publish)                                | Task 1.3 (Supabase setup), 1.4 (Redis), 1.5 (Python scaffolding) |
| **2**  | Storage + Auth Start | Task 2.1 (R2 → Storage)                                                  | Task 2.2 (prism-engine auth)                                     |
| **3**  | Auth Continue        | Task 2.3 (prism-admin auth)                                              | Task 2.4 (syntaxure-labs auth)                                   |
| **4**  | Auth Cutover         | Task 2.5 (Clerk user export/import + reset emails)                       | Task 2.6 (Firestore → Supabase DB — schema + types)              |
| **5**  | DB Migration         | Task 2.6 (server actions rewrite)                                        | Task 2.6 (component rewrites + migration script)                 |
| **6**  | DB Finish + Admin    | Task 2.7 (prism-admin Firestore ref update)                              | Task 2.6 continued + verification                                |
| **7**  | Restructure          | Task 3.1 (rename agency), 3.2 (rename dashboard), 3.3 (tracker → manage) | Task 3.4 (integrate agency admin into prism-admin)               |
| **8**  | Design + CI          | Task 3.5 (CI/CD updates) + Task 4.1 (package rename)                     | Task 4.2 (consolidate design tokens, protect landing page)       |
| **9**  | New Builds           | Task 5.1 (prism-manage — calendar + sync)                                | Task 5.2 (prism-analytics — FastAPI setup)                       |
| **10** | New Builds           | Task 5.1 (prism-manage — tasks)                                          | Task 5.2 (prism-analytics — analytics pipelines)                 |
| **11** | New Builds + Polish  | Task 5.1 (prism-manage — polish + deploy)                                | Task 5.2 (prism-analytics — charts + deploy)                     |
| **12** | Gremlin              | Task 6.1 (Gremlin API setup), 6.2 (graph model), 6.3 (migration)         | Task 6.1-6.3 (pair programming on graph migration)               |
| **13** | Gremlin              | Task 6.4 (smart select replacement)                                      | Task 6.5 (dual read validation + testing)                        |
| **14** | Gremlin + Buffer     | Task 6.4-6.5 continued                                                   | Buffer week for slip + final verification                        |

---

## 17. Risk Register

| ID  | Risk                                                     | Probability | Impact   | Mitigation                                                                                        | Owner |
| --- | -------------------------------------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------- | ----- |
| R1  | **Firestore data loss during migration**                 | Low         | Critical | Dry-run first, verify row counts, keep Firestore as backup for 30 days, feature flag for rollback | Jeff  |
| R2  | **Clerk user password migration UX friction**            | High        | Medium   | Clear reset email template, 7-day grace period notice, support channel ready                      | Lou   |
| R3  | **Vercel deployment break on rename**                    | Medium      | High     | One app at a time, alias old project → new project, DNS with low TTL during transition            | Both  |
| R4  | **Supabase RLS policy prevents legitimate access**       | Medium      | High     | Write integration tests for RLS policies, use service role for server actions until RLS verified  | Jeff  |
| R5  | **prism-manage Google Calendar OAuth rejected**          | Medium      | Medium   | Submit for verification early, limited scope (read-only sync first)                               | Lou   |
| R6  | **Gremlin graph performance worse than MongoDB**         | Medium      | Medium   | Dual-read comparison for 30 days, feature flag, a/b metrics                                       | Jeff  |
| R7  | **Agency landing page visual regression**                | Low         | Critical | CSS-only refactor, NEVER touch agency component markup, screenshot comparison tests               | Lou   |
| R8  | **Python/Node CI tooling conflict**                      | Low         | Low      | Independent Dockerfile + CI job, no cross-language build deps                                     | Lou   |
| R9  | **Doppler env var mismatch between environments**        | Medium      | Medium   | Doppler branch strategy, per-environment config review, pre-deploy env check script               | Both  |
| R10 | **pnpm lockfile corruption during mass package updates** | Low         | Medium   | Commit lockfile after every phase, use `pnpm install --frozen-lockfile` in CI                     | Jeff  |

---

## Appendix A: Complete File Manifest

### Files to DELETE

```
# Removed apps
apps/mht/
apps/joularix/
apps/nexure/
apps/marketing/
apps/prism-exercise/
apps/tracker/                        # Repurposed → prism-manage

# Removed packages (Firebase client from shared DB)
packages/db/src/firebase.ts
packages/db/src/index.ts             # Updated to remove Firebase re-exports

# Removed lib files
apps/syntaxure-labs/src/lib/firebase/
apps/syntaxure-labs/src/lib/r2.ts
apps/syntaxure-labs/src/types/firestore.ts → becomes database.ts (Supabase generated)
apps/prism-admin/src/lib/firebase.ts   # Replaced with Supabase reads

# Removed auth pages (replaced with Supabase equivalents)
apps/prism-engine/src/app/(auth)/sign-in/
apps/prism-engine/src/app/(auth)/sign-up/
apps/prism-admin/src/app/sign-in/

# Removed npm packages from apps
firebase, firebase-admin (from syntaxure-labs, prism-manage)
@clerk/nextjs, @clerk/themes (from prism-engine, prism-admin)
@aws-sdk/client-s3, @aws-sdk/s3-request-presigner (from syntaxure-labs)
```

### Files to CREATE

```
# Supabase
supabase/
├── config.toml
├── migrations/
│   └── 00001_initial_schema.sql
└── seed.sql

# Supabase clients (per app)
apps/syntaxure-labs/src/lib/supabase/{server,browser,admin}.ts
apps/prism-engine/src/lib/supabase/{server,middleware,browser,admin}.ts
apps/prism-admin/src/lib/supabase/{server,browser,admin}.ts
apps/prism-manage/src/lib/supabase/{server,browser,admin}.ts

# Supabase Auth UI
apps/prism-engine/src/components/auth/{sign-in-form,sign-up-form,user-button}.tsx
apps/prism-admin/src/components/auth/{sign-in-form,user-button}.tsx

# New apps
apps/prism-analytics/pyproject.toml
apps/prism-analytics/Dockerfile
apps/prism-analytics/src/{main.py,routes/,services/,models/}

# Migration scripts
scripts/migrate-firestore-to-supabase.ts
scripts/import-clerk-users.ts
scripts/migrate-rules-to-gremlin.ts
```

### Files to RENAME

```
apps/agency/                              → apps/syntaxure-labs/
apps/prism-dashboard/                     → apps/prism-engine/
apps/tracker/                             → apps/prism-manage/
packages/ui/package.json: name            → @syntaxure/ui

# Package references updated in ALL apps' package.json:
"@jdstudio/ui": "workspace:*"             → "@syntaxure/ui": "workspace:*"
```

---

## Appendix B: Bot/Automation Systems (Keep As-Is)

These were installed by Lou and are beneficial — they survive the revamp:

| System         | File                             | Purpose                                      | Action                                               |
| -------------- | -------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| **Renovate**   | `renovate.json`                  | Automated dependency updates (PRs on Monday) | Keep, update config if needed for new apps           |
| **PR Agent**   | `.github/workflows/pr-agent.yml` | AI code review on PRs                        | Keep                                                 |
| **Gitleaks**   | `.pre-commit-config.yaml`        | Secrets detection pre-commit                 | Keep                                                 |
| **Changesets** | `.changeset/config.json`         | Semantic versioning + changelog              | Keep, ensure auto-publish step for @prism-engine/cli |
| **syncpack**   | `.syncpackrc`                    | Consistent dependency versions               | Keep                                                 |

---

_End of revamp.md — Next: revamp-guide.md (manual-only actions)_
