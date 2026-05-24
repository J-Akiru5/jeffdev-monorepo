# JeffDev Monorepo — Manual Actions Guide

> **Who this is for:** Jeff & Lou
> **Purpose:** All actions that require human interaction with dashboards, consoles, or services. These CANNOT be automated by an AI agent.
> **Companion to:** `revamp.md` — the full implementation plan.
>
> **Legend:**
>
> - [👤 Jeff] — Only Jeff can do this (account owner)
> - [👤 Lou] — Only Lou can do this (CTO, DevOps access)
> - [👥 Both] — Either can do

---

## Table of Contents

1. [Supabase — Initial Setup](#1-supabase--initial-setup)
2. [Supabase — Database Schema Migration](#2-supabase--database-schema-migration)
3. [Clerk — User Export & Account Closure](#3-clerk--user-export--account-closure)
4. [Doppler — Env Var Reorganization](#4-doppler--env-var-reorganization)
5. [Vercel — New Project Creation & Domain Setup](#5-vercel--new-project-creation--domain-setup)
6. [Google Cloud Console — Calendar API Setup](#6-google-cloud-console--calendar-api-setup)
7. [npm — Token & Publishing](#7-npm--token--publishing)
8. [Redis — Provisioning](#8-redis--provisioning)
9. [Firebase — Project Retention & Cleanup](#9-firebase--project-retention--cleanup)
10. [Cloudflare — R2 Bucket Retention](#10-cloudflare--r2-bucket-retention)
11. [Azure — Cosmos DB Gremlin API Provisioning](#11-azure--cosmos-db-gremlin-api-provisioning)
12. [GitHub — Secrets & CI Updates](#12-github--secrets--ci-updates)
13. [DNS — Domain Configuration](#13-dns--domain-configuration)
14. [Email — Password Reset Template](#14-email--password-reset-template)
15. [Pre-Deployment Checklist](#15-pre-deployment-checklist)
16. [Post-Cutover Monitoring Checklist](#16-post-cutover-monitoring-checklist)

---

## 1. Supabase — Initial Setup

**When:** Phase 1, Week 1
**Who:** [👥 Both] — then add each other as org members

### 1.1 Create Supabase Organization

1. Go to https://supabase.com/dashboard
2. Click "New organization"
3. Name: `jeffdev-studio` (or your preferred org name)
4. Choose plan: **Pro** ($25/mo) recommended for:
   - No project pausing
   - 100k monthly active users
   - 50GB database
   - 200GB storage
   - Daily backups (14-day retention)
5. Invite Lou as org admin

### 1.2 Create Supabase Project

1. Inside org, click "New project"
2. Name: `jeffdev-platform`
3. Database password: **Generate a strong one → save in Doppler immediately**
4. Region: Choose closest to your users (Southeast Asia → `ap-southeast-1` Singapore, or `ap-northeast-1` Tokyo)
5. Wait for project provisioning (~2 minutes)

### 1.3 Collect API Keys

After creation, go to Project Settings → API:

| Credential           | Where                            | Save To                                                          |
| -------------------- | -------------------------------- | ---------------------------------------------------------------- |
| **Project URL**      | Configuration → URL              | Doppler: `NEXT_PUBLIC_SUPABASE_URL` (across all Doppler configs) |
| **Anon Key**         | Configuration → anon/public key  | Doppler: `NEXT_PUBLIC_SUPABASE_ANON_KEY`                         |
| **Service Role Key** | Configuration → service_role key | Doppler: `SUPABASE_SERVICE_ROLE_KEY`                             |

⚠️ **The service_role key bypasses RLS.** Never expose it to the browser. Only use in server actions/API routes.

### 1.4 Configure Auth Settings

Go to Authentication → Settings:

**User Sign Ups:**

- [x] Allow new users to sign up
- [ ] Allow anonymous sign-ins (DISABLED for now)
- [x] Enable email confirmations

**Passwords:**

- Minimum password length: 8

**Email Auth:**

- [x] Enable email provider (default — magic link + password)
- Custom SMTP: Use Resend SMTP (you already have Resend configured):
  - **Host:** smtp.resend.com
  - **Port:** 465
  - **User:** resend
  - **Password:** Your Resend API key (from Doppler)
  - **Sender:** noreply@jeffdev.studio

**OAuth Providers:** (do NOT configure yet — Phase 1 is email-only)

- Skip Google, GitHub, etc. for now. Add post-MVP.

### 1.5 Configure Site URLs (Auth → URL Configuration)

```
Site URL: https://syntaxurelabs.com    (Primary — syntaxure-labs domain)
Redirect URLs:
  https://syntaxurelabs.com/**
  https://admin.jeffdev.studio/**
  https://prism.jeffdev.studio/**
  http://localhost:3000/**
  http://localhost:3001/**
  http://localhost:3004/**
  http://localhost:3007/**
```

⚠️ **Update these** when new domains are decided (see §13 DNS below).

### 1.6 Configure Storage

Go to Storage → Create new bucket:

- **Name:** `assets`
- **Public bucket:** NO (use signed URLs or RLS policies)
- **File size limit:** 10MB (matches current R2 setup)
- **Allowed MIME types:** `image/jpeg, image/png, image/webp, application/pdf`

**CORS Configuration** (for browser uploads):

```
Allowed Origins: https://syntaxurelabs.com, http://localhost:3000
Allowed Methods: GET, POST, PUT, DELETE
Allowed Headers: *
Max Age: 3600
```

### 1.7 Local Supabase CLI Setup

```bash
# Install Supabase CLI
pnpm add -D supabase

# Initialize in project root
npx supabase init

# Start local Supabase (Docker required)
npx supabase start
```

This creates `supabase/config.toml` and provides local database, auth, and storage for development.

---

## 2. Supabase — Database Schema Migration

**When:** Phase 2, Week 3-4 (before auth migration)
**Who:** [👥 Both]

### 2.1 Apply Initial Schema

After the AI agent creates the migration file (`supabase/migrations/00001_initial_schema.sql`) based on the schema in `revamp.md §3`:

**Local:**

```bash
# Apply migration to local Supabase
npx supabase db push

# Verify tables exist
npx supabase db dump --local --data-only > local_schema_test.sql
```

**Production:**

```bash
# Link to remote project (first time)
npx supabase link --project-ref <project-ref-id>
# Find project-ref-id in Supabase Dashboard → Settings → General → Reference ID

# Push migration to production
npx supabase db push

# If you prefer manual SQL migration (safer for production):
# Go to Supabase Dashboard → SQL Editor → Open init_schema.sql → Run
```

### 2.2 Enable RLS on All Tables

Go to Authentication → Policies:

- For each table, click "Enable RLS"
- Apply the RLS policies from `revamp.md §3`

### 2.3 Create Test User (Manual)

Go to Authentication → Users → Create user:

- Email: `test@syntaxurelabs.com`
- Password: `<temporary>`
- Check "Auto Confirm User"
- After creation, go to SQL Editor:

```sql
UPDATE user_profiles SET role = 'admin', tier = 'enterprise' WHERE id = '<user-id>';
```

---

## 3. Clerk — User Export & Account Closure

**When:** Phase 2, Week 4 (just before cutover)
**Who:** [👤 Jeff] — Clerk account owner

### 3.1 Export All Users

1. Go to Clerk Dashboard → Users
2. Click "Export" → JSON format
3. Save file as `clerk-users-export-<date>.json`
4. **Verify:** Note total user count (should match post-import count)

### 3.2 Verify Export Contains

Each user entry should include:

- `id` (clerk user ID)
- `email_addresses[0].email_address`
- `first_name`, `last_name`
- `public_metadata` (role, tier)
- `private_metadata` (stripe customer ID, subscription data)
- `created_at`

### 3.3 Run Import Script

```bash
# AI agent will create this script
pnpm tsx scripts/import-clerk-users.ts --file clerk-users-export-<date>.json
```

### 3.4 Verify Import Count

1. Supabase Dashboard → Authentication → Users → check total count
2. Compare vs Clerk export count
3. Run verification SQL:

```sql
SELECT role, COUNT(*) FROM user_profiles GROUP BY role;
```

4. Compare with Clerk user count by role (check Clerk Dashboard)

### 3.5 Send Password Reset Emails

⚠️ **This is the critical step.** All users will receive an email to set their Supabase password.

1. Go to Supabase Dashboard → Authentication → Templates
2. Edit the **"Reset Password"** template (see §14 for template text)
3. Run the reset email script (AI agent creates):

```bash
pnpm tsx scripts/send-reset-emails.ts
```

4. Monitor email delivery: Supabase Auth → Logs → Email

### 3.6 Post-Cutover: Keep Clerk Alive for 30 Days

- **Do NOT delete Clerk project** immediately
- Keep authentication active in Clerk Dashboard
- Monitor: if users report "can't log in," they can use old Clerk login while you fix Supabase
- After 30 days with zero support tickets: cancel Clerk subscription
- Before cancellation: verify Supabase user count ≥ Clerk user count

---

## 4. Doppler — Env Var Reorganization

**When:** Throughout Phases 1-3 (incremental)
**Who:** [👤 Lou] — Doppler admin access

### 4.1 Review Current Configs

Go to Doppler Dashboard → jeffdev-monorepo project:

- Check current environments: `dev`, `staging`, `production` (or similar)
- Note all existing variables

### 4.2 Add New Variables (Doppler Dashboard)

| Phase   | Variable                        | Value Source                                         | Environment |
| ------- | ------------------------------- | ---------------------------------------------------- | ----------- |
| Phase 1 | `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Dashboard → Settings → API                  | All         |
| Phase 1 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API                  | All         |
| Phase 1 | `SUPABASE_SERVICE_ROLE_KEY`     | Supabase Dashboard → Settings → API                  | All         |
| Phase 1 | `SUPABASE_STORAGE_BUCKET`       | `assets`                                             | All         |
| Phase 1 | `UPSTASH_REDIS_REST_URL`        | Upstash Dashboard → Details                          | All         |
| Phase 1 | `UPSTASH_REDIS_REST_TOKEN`      | Upstash Dashboard → Details                          | All         |
| Phase 5 | `GOOGLE_CLIENT_ID`              | Google Cloud Console → APIs & Services → Credentials | All         |
| Phase 5 | `GOOGLE_CLIENT_SECRET`          | Same as above                                        | All         |

### 4.3 Remove Obsolete Variables (After Migration Verified)

**Only remove these AFTER the migration is live and verified for 7+ days:**

| Variable                            | Reason                                              |
| ----------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk replaced by Supabase Auth                     |
| `CLERK_SECRET_KEY`                  | Same                                                |
| `R2_ACCOUNT_ID`                     | Cloudflare R2 replaced by Supabase Storage          |
| `R2_ACCESS_KEY_ID`                  | Same                                                |
| `R2_SECRET_ACCESS_KEY`              | Same                                                |
| `R2_BUCKET_NAME`                    | Same                                                |
| `R2_PUBLIC_URL`                     | Same                                                |
| `AGENCY_FIREBASE_KEY`               | Firestore replaced by Supabase                      |
| `NEXT_PUBLIC_FIREBASE_*`            | Same (all Firebase env vars for agency/mht/tracker) |
| `FIREBASE_PROJECT_ID`               | Keep temporarily if prism-admin reads legacy data   |
| `FIREBASE_CLIENT_EMAIL`             | Same                                                |
| `FIREBASE_PRIVATE_KEY`              | Same                                                |

### 4.4 Create Per-App Doppler Configs (for Vercel)

For Vercel deployments, you'll need per-app environment configs:

**Doppler CLI approach:**

```bash
# Set per-app vars in Doppler
doppler secrets set NEXT_PUBLIC_SUPABASE_URL=$VALUE --config dev --project jeffdev-monorepo
```

**Or: Set directly in Vercel** (preferred for per-app vars)

- See §5 Vercel below

---

## 5. Vercel — New Project Creation & Domain Setup

**When:** Phase 3, Week 7
**Who:** [👥 Both] — whoever has Vercel account access

### 5.1 Current Vercel Projects (Document First)

Before doing anything, go to vercel.com/dashboard and document:

- All existing projects
- Their connected git repositories
- Current domains
- Environment variables set in Vercel (compare with Doppler)

### 5.2 Create New Vercel Projects

For each renamed/new app, create a new Vercel project:

| App                | Git Root Directory    | Framework | Build Command                | Output  |
| ------------------ | --------------------- | --------- | ---------------------------- | ------- |
| **syntaxure-labs** | `apps/syntaxure-labs` | Next.js   | `doppler run -- turbo build` | `.next` |
| **prism-engine**   | `apps/prism-engine`   | Next.js   | `doppler run -- turbo build` | `.next` |
| **prism-manage**   | `apps/prism-manage`   | Next.js   | `doppler run -- turbo build` | `.next` |

1. Vercel Dashboard → Add New Project
2. Select the monorepo git repository
3. Set **Root Directory** to the app path (e.g., `apps/syntaxure-labs`)
4. Framework: Next.js (auto-detected)
5. Set environment variables (see §5.3)
6. Deploy (will fail initially without env vars — that's OK)

### 5.3 Environment Variables per Vercel Project

**All Next.js apps need these:**

```
NEXT_PUBLIC_SUPABASE_URL        = <from Doppler>
NEXT_PUBLIC_SUPABASE_ANON_KEY   = <from Doppler>
```

**prism-engine additionally:**

```
SUPABASE_SERVICE_ROLE_KEY       = <from Doppler>
MONGODB_URI, COSMOS_DATABASE_NAME, MUX_*, GEMINI_API_KEY, PAYPAL_*, SENTRY_*, etc.
```

**prism-admin additionally:**

```
SUPABASE_SERVICE_ROLE_KEY       = <from Doppler>
MONGODB_URI, COSMOS_DATABASE_NAME, RESEND_*, etc.
```

**prism-manage additionally:**

```
SUPABASE_SERVICE_ROLE_KEY       = <from Doppler>
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
```

### 5.4 Domain Configuration (Vercel)

**You need to decide on new domains first** (see §13 DNS).

For each Vercel project:

1. Go to Project Settings → Domains
2. Add custom domain
3. Follow Vercel's DNS instructions (usually: add CNAME `cname.vercel-dns.com`)
4. Wait for SSL certificate provisioning (~2-3 minutes)
5. Set primary domain

### 5.5 Delete Old Vercel Projects (After 7 Days Stable)

After new projects are live and stable for 7+ days:

- Remove old Vercel projects: `agency`, `prism-dashboard`, `tracker`, `mht`, `nexure`, `joularix`, `marketing`
- Keep DNS records for old domains as redirects (via Vercel or Cloudflare)

---

## 6. Google Cloud Console — Calendar API Setup

**When:** Phase 5, Week 9 (before prism-manage development)
**Who:** [👤 Jeff] or [👤 Lou] — whoever has Google Cloud account

### 6.1 Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create new project: `jeffdev-prism-manage`
3. Enable APIs:
   - **Google Calendar API** (googleapis.com/auth/calendar.events)
   - **Google Calendar API** (googleapis.com/auth/calendar.readonly)

### 6.2 Create OAuth 2.0 Credentials

1. APIs & Services → Credentials → Create Credentials → OAuth Client ID
2. Application type: **Web application**
3. Name: `prism-manage-calendar`
4. Authorized redirect URIs:
   ```
   https://manage.jeffdev.studio/api/calendar/callback     (production)
   http://localhost:3007/api/calendar/callback              (development)
   ```
5. Save → copy **Client ID** and **Client Secret**

### 6.3 OAuth Consent Screen

1. APIs & Services → OAuth Consent Screen
2. User type: **External**
3. App name: `Prism Manage`
4. User support email: `support@jeffdev.studio`
5. Scopes: `calendar.events`, `calendar.readonly`
6. Add test users: jeff's email, lou's email, test emails
7. **Publish app** (or keep in Testing mode for MVP)

### 6.4 Save Credentials

| Credential    | Value           | Doppler                |
| ------------- | --------------- | ---------------------- |
| Client ID     | `<from Google>` | `GOOGLE_CLIENT_ID`     |
| Client Secret | `<from Google>` | `GOOGLE_CLIENT_SECRET` |

---

## 7. npm — Token & Publishing

**When:** Phase 1, Week 1
**Who:** [👤 Jeff] — npm account owner

### 7.1 Create npm Access Token

1. Go to https://www.npmjs.com/settings/<your-username>/tokens
2. Create new token → **Automation** type (for CI/CD)
3. Name: `jeffdev-monorepo-ci`
4. Copy token immediately (shown once)

### 7.2 Add Token to GitHub Secrets

1. Go to https://github.com/J-Akiru5/jeffdev-monorepo/settings/secrets/actions
2. New repository secret:
   - Name: `NPM_TOKEN`
   - Value: `<npm access token>`

### 7.3 Manual First Publish (One-Time)

```bash
# Ensure you're logged into npm
npm login

# Build and publish
pnpm --filter @prism-engine/cli run build
cd packages/prism-cli
npm publish --access public
```

### 7.4 Verify Publication

1. Go to https://www.npmjs.com/package/@prism-engine/cli
2. Verify version matches `packages/prism-cli/package.json`
3. Test install:

```bash
npx @prism-engine/cli
```

---

## 8. Redis — Provisioning

**When:** Phase 1, Week 1
**Who:** [👤 Lou]

### Option A: Upstash (Recommended — already in deps)

1. Go to https://console.upstash.com
2. Create Redis database
3. Region: Choose closest to Vercel deployment region
4. Plan: Pay-as-you-go (or fixed for predictable billing)
5. Once created, go to Details → REST API
6. Copy:
   - `UPSTASH_REDIS_REST_URL` → Doppler
   - `UPSTASH_REDIS_REST_TOKEN` → Doppler

### Option B: Self-Hosted Redis (Docker)

Add to `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]
  volumes: [redis_data:/data]
```

Set in Doppler: `REDIS_URL=redis://localhost:6379`

### Decision: Upstash vs Self-Hosted

| Factor               | Upstash                                                         | Self-Hosted                                     |
| -------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| Vercel compatibility | Native (HTTP)                                                   | Needs TCP — doesn't work with Vercel serverless |
| Maintenance          | Zero                                                            | Docker + backups                                |
| Cost                 | Pay-per-request                                                 | Fixed (VPS cost)                                |
| **Verdict**          | **Use Upstash** — Vercel can't connect to self-hosted TCP Redis | Only if you switch to non-serverless deployment |

---

## 9. Firebase — Project Retention & Cleanup

**When:** Phase 2, Week 6 (after Firestore migration verified)
**Who:** [👤 Jeff] — Firebase project owner

### 9.1 Do NOT Delete Immediately

After migration:

- Keep Firebase project active for **30 days**
- Do not delete Firestore data
- Do not delete Firebase Auth users

### 9.2 After 30 Days Stable

You can consider these options:

**Option A: Downgrade to Spark (free) plan**

- Keep project as read-only backup
- No cost

**Option B: Delete project**

- Only if Supabase has been stable for 30+ days with zero data issues
- Export final Firestore backup first (`gcloud firestore export`)

### 9.3 Remove from Code

After 30 days:

- Remove `firebase-admin` dependency from `@jeffdev/db` package
- Remove Firebase env vars from Doppler
- Delete `packages/db/src/firebase.ts`
- Delete all Firebase client SDK configs

---

## 10. Cloudflare — R2 Bucket Retention

**When:** Phase 2, Week 2 (after Supabase Storage migration verified)
**Who:** [👤 Jeff] — Cloudflare account owner

### 10.1 Export R2 Files (Optional Backup)

```bash
# If you need a local backup of all files
# Install rclone or use aws-cli with R2 endpoint
aws s3 sync s3://jeffdev-assets ./r2-backup/ \
  --endpoint-url https://<account-id>.r2.cloudflarestorage.com
```

### 10.2 Retention Plan

1. Keep R2 bucket for 30 days after cutover
2. Verify all images load via Supabase Storage URLs
3. Set up redirect: old R2 proxy URLs → Supabase Storage URLs (via Next.js rewrite)
4. After 30 days: delete R2 bucket

---

## 11. Azure — Cosmos DB Gremlin API Provisioning

**When:** Phase 6, Week 12
**Who:** [👤 Lou] — Azure admin

### 11.1 Create Gremlin API Database

1. Azure Portal → Cosmos DB → Create
2. API: **Gremlin (graph)**
3. Account name: `prism-graph`
4. Region: Same as existing Cosmos DB (or closest)
5. Capacity mode: Serverless (for MVP — pay per RU consumed)

### 11.2 Create Graph Database + Container

1. Inside the Gremlin account → Data Explorer → New Graph
2. Database ID: `prism-graph`
3. Graph ID: `rules`
4. Partition key: `/projectId`
5. Provision throughput: 400 RU/s (minimum for serverless is auto)

### 11.3 Collect Connection Details

| Credential       | Where                                  | Doppler                                                                               |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------- |
| Gremlin Endpoint | Azure Portal → Keys → Gremlin Endpoint | `COSMOS_GREMLIN_ENDPOINT` (format: `wss://prism-graph.gremlin.cosmos.azure.com:443/`) |
| Primary Key      | Azure Portal → Keys → Primary Key      | `COSMOS_GREMLIN_KEY`                                                                  |

### 11.4 Test Connection

```bash
# AI agent will create a test script
pnpm --filter prism-mcp-server exec tsx scripts/test-gremlin.ts
```

Should output: "Connected to Gremlin. Graph vertex count: 0"

---

## 12. GitHub — Secrets & CI Updates

**When:** Phase 1-3 (incremental)
**Who:** [👤 Lou]

### 12.1 Add New Secrets

Repository: `J-Akiru5/jeffdev-monorepo` → Settings → Secrets and variables → Actions

| Secret                  | Value                                          | When    |
| ----------------------- | ---------------------------------------------- | ------- |
| `NPM_TOKEN`             | npm access token                               | Phase 1 |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token (for CLI in CI) | Phase 2 |
| `SUPABASE_DB_PASSWORD`  | Database password                              | Phase 2 |
| `SUPABASE_PROJECT_ID`   | Project reference ID                           | Phase 2 |

### 12.2 Update Branch Protection Rules

Settings → Branches → Add rule → `main`:

- [x] Require status checks to pass before merging
- Status checks: `lint`, `test (prism-cli)`, `test (prism-mcp-server)`, `build (prism-engine)`, `build (prism-docs)`, `build (prism-mcp-server)`

---

## 13. DNS — Domain Configuration

**When:** Phase 3, Week 7
**Who:** [👤 Jeff] — Domain registrar account owner

### 13.1 Decide on Domain Structure

⚠️ **You said you need new domains.** This section is a placeholder until domains are decided.

**Suggested structure:**
| App | Domain |
|-----|--------|
| syntaxure-labs | `syntaxurelabs.com` or `jeffdev.studio` |
| prism-engine | `prism.jeffdev.studio` or `prismengine.io` |
| prism-docs | `docs.jeffdev.studio` |
| prism-admin | `admin.jeffdev.studio` |
| prism-manage | `manage.jeffdev.studio` or `app.jeffdev.studio` |
| prism-analytics | `analytics.jeffdev.studio` or internal-only |
| prism-mcp-server | No domain (stdio-only, not web) |

### 13.2 DNS Setup (Assuming Vercel + Existing Domains)

For each domain:

1. Go to domain registrar (Namecheap, Cloudflare, GoDaddy, etc.)
2. Add CNAME record:
   - **Name:** `prism` (or subdomain)
   - **Value:** `cname.vercel-dns.com`
   - **TTL:** 300 (5 min) during migration, then 3600 (1 hour) after stable

### 13.3 Supabase Redirect URLs Update

After domains are decided, update Supabase (see §1.5):

```
Redirect URLs:
  https://syntaxurelabs.com/**
  https://prism.jeffdev.studio/**
  https://admin.jeffdev.studio/**
  https://docs.jeffdev.studio/**
  https://manage.jeffdev.studio/**
```

---

## 14. Email — Password Reset Template

**When:** Phase 2, Week 4 (before Clerk user import)
**Who:** [👤 Jeff] — for content / [👤 Lou] — to configure in Supabase

### 14.1 Supabase Reset Password Template

Go to Supabase Dashboard → Authentication → Email Templates → Reset Password.

Replace default template:

**Subject:**

```
Reset your Syntaxure Labs password
```

**Body (HTML):**

```html
<h2>Reset your password</h2>

<p>
  We've upgraded our platform. As part of this update, you need to set a new
  password for your account.
</p>

<p>Click the button below to set your password:</p>

<p style="margin: 30px 0;">
  <a
    href="{{ .ConfirmationURL }}"
    style="background-color: #06b6d4; padding: 14px 32px; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;"
  >
    Set New Password
  </a>
</p>

<p>Or copy this link:</p>
<p style="color: #6b7280;">{{ .ConfirmationURL }}</p>

<hr
  style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;"
/>

<p style="color: #6b7280; font-size: 13px;">
  This reset was triggered by our platform migration. Your data is safe and your
  previous information has been preserved. If you did not expect this email, you
  can safely ignore it.
</p>

<p style="color: #6b7280; font-size: 13px;">— The Syntaxure Labs Team</p>
```

### 14.2 Test the Template

1. Supabase Dashboard → Authentication → Email Templates → Preview
2. Or: create a test user and trigger reset:

```sql
SELECT auth.admin.generate_link('recovery', '<test-user-id>');
```

---

## 15. Pre-Deployment Checklist

**When:** Before each major phase deployment
**Who:** [👥 Both]

Copy this checklist per deployment:

### Phase 2 — Auth Migration Cutover

```
[ ] Clerk users exported (JSON file saved)
[ ] Clerk user count: _____
[ ] Supabase user import complete
[ ] Supabase user count: _____ (must match Clerk)
[ ] Password reset emails sent
[ ] Password reset template tested with test user
[ ] Staging deployment tested (all three apps)
[ ] Doppler env vars updated for production
[ ] Vercel env vars synced with Doppler
[ ] Rollback plan documented (old Clerk deploy ready)
[ ] Support channel ready (help@jeffdev.studio)
[ ] Team notified: "Maintenance window: [date/time]"
```

### Phase 2 — DB Migration Cutover

```
[ ] Firestore → Supabase migration script dry-run passed
[ ] Row counts verified for all 11 collections
[ ] Timestamp serialization verified (no Firestore objects)
[ ] All server actions tested on staging
[ ] Admin panel loads data from Supabase (staging)
[ ] Client portal loads from Supabase (staging)
[ ] R2 → Supabase Storage migration: all images load
[ ] Firestore project NOT deleted (30-day retention)
```

### Phase 3 — App Rename Deployment

```
[ ] Each app builds successfully locally
[ ] Each app builds on Vercel
[ ] Old Vercel projects still running (fallback)
[ ] New Vercel projects live with new domains
[ ] DNS propagated (verify with dig/nslookup)
[ ] SSL certificates provisioned (all domains show lock icon)
[ ] All internal links updated to new domains
[ ] Agency landing page renders identically on new domain
[ ] prism-engine dashboard loads on new domain
[ ] prism-admin loads on new domain
```

---

## 16. Post-Cutover Monitoring Checklist

**When:** After each major deployment
**Who:** [👥 Both]

### Day 1 (Hourly Checks)

```
[ ] Auth: sign-up flow works
[ ] Auth: sign-in flow works
[ ] Auth: password reset flow works
[ ] Auth: session persists across page navigation
[ ] DB: server actions return data correctly
[ ] DB: admin panel loads data
[ ] Storage: image upload works
[ ] Storage: uploaded image accessible via URL
[ ] Vercel: deployment succeeded
[ ] Vercel: no runtime errors in logs
```

### Day 2-7 (Daily Checks)

```
[ ] Supabase: no auth errors in logs (Dashboard → Authentication → Logs)
[ ] Supabase: no database errors (Dashboard → Database → Logs)
[ ] Supabase: RLS not blocking legitimate requests
[ ] Vercel: no 500 errors in Function Logs
[ ] Agency landing page: no visual regressions (screenshot comparison)
[ ] prism-mcp-server: 109 tests passing
[ ] prism-cli: 30 tests passing
[ ] npm: @prism-engine/cli installable, smoke test passes
```

### Day 30 (Before Cleanup)

```
[ ] Zero user reports of "can't log in" in last 14 days
[ ] Zero data inconsistency reports
[ ] Storage: all images from last 30 days accessible
[ ] Supabase usage within plan limits (Dashboard → Reports)
[ ] Upstash usage within plan limits
[ ] Authorized to: remove Clerk account
[ ] Authorized to: downgrade/delete Firebase project
[ ] Authorized to: delete R2 bucket
[ ] Authorized to: delete old Vercel projects
```

---

## Quick Reference: Account Access List

| Service              | URL                                          | Who Has Access              |
| -------------------- | -------------------------------------------- | --------------------------- |
| Supabase Dashboard   | https://supabase.com/dashboard               | Both (org members)          |
| Doppler Dashboard    | https://dashboard.doppler.com                | Lou (admin), Jeff (viewer?) |
| Vercel Dashboard     | https://vercel.com/dashboard                 | Both                        |
| Clerk Dashboard      | https://dashboard.clerk.com                  | Jeff                        |
| Firebase Console     | https://console.firebase.google.com          | Jeff                        |
| Cloudflare Dashboard | https://dash.cloudflare.com                  | Jeff                        |
| Azure Portal         | https://portal.azure.com                     | Lou                         |
| Google Cloud Console | https://console.cloud.google.com             | Both                        |
| npm                  | https://www.npmjs.com                        | Jeff                        |
| Upstash Console      | https://console.upstash.com                  | Lou                         |
| GitHub (repo)        | https://github.com/J-Akiru5/jeffdev-monorepo | Both                        |
| Domain Registrar     | (depends on provider)                        | Jeff                        |
| Resend Dashboard     | https://resend.com/dashboard                 | Both                        |

---

_End of revamp-guide.md — Return to revamp.md for the implementation plan_
