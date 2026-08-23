# Syntaxure Labs Monorepo — Vercel Deployment: Environment Variables & Keys Checklist

> Generated: May 21, 2026 | Branch: `develop` | Commit: `ba08a82`

---

## Overview: Apps to Deploy

| App                  | Subdomain             | Port | Type                | Vercel?                  |
| -------------------- | --------------------- | ---- | ------------------- | ------------------------ |
| **syntaxure-labs**   | `jeffdev.studio`      | 3000 | Next.js 16          | ✅ Yes                   |
| **prism-engine**     | `prism.syntaxure.dev` | 3001 | Next.js 16 + Sentry | ✅ Yes                   |
| **prism-docs**       | `docs.jeffdev.studio` | 3002 | Nextra 4 + Sentry   | ✅ Yes                   |
| **prism-admin**      | (TBD)                 | 3004 | Next.js 16          | ✅ Yes                   |
| **prism-manage**     | (TBD)                 | 3007 | Next.js 16          | ✅ Yes                   |
| **prism-mcp-server** | N/A                   | 3003 | Node.js MCP SDK     | ❌ Use Railway/Fly.io/VM |
| **prism-analytics**  | N/A                   | 8000 | Python FastAPI      | ❌ Use Docker host       |

---

## 1️⃣ syntaxure-labs → `jeffdev.studio`

### Vercel Settings

| Setting         | Value                                                |
| --------------- | ---------------------------------------------------- |
| Root Directory  | `apps/syntaxure-labs`                                |
| Build Command   | `cd ../.. && pnpm --filter syntaxure-labs run build` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile`         |
| Node Version    | 20.x                                                 |

### Environment Variables

#### Public (`NEXT_PUBLIC_`)

| Variable                                      | Description                                                                | Source                                     |
| --------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                        | `https://jeffdev.studio`                                                   | You set                                    |
| `NEXT_PUBLIC_BASE_URL`                        | Same as `NEXT_PUBLIC_SITE_URL` — keep in sync                              | You set                                    |
| `NEXT_PUBLIC_SUPABASE_URL`                    | Supabase project URL                                                       | Supabase Dashboard                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`               | Supabase anon/public key                                                   | Supabase Dashboard                         |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID`                | PayPal client-side ID                                                      | PayPal Developer                           |
| `NEXT_PUBLIC_GCASH_NUMBER`                    | GCash number for proof upload                                              | You set                                    |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`        | Google Search Console code                                                 | Google Search Console                      |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`         | GA4 measurement ID (optional)                                              | Firebase Console                           |
| `NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_URL`        | Public URL of the /community marketing video (Supabase `marketing` bucket) | `scripts/upload-marketing-video.ts` output |
| `NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_MOBILE_URL` | Portrait 9:16 video for mobile (<768px); falls back to desktop if unset    | Same bucket, optional                      |
| `NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_POSTER`     | Optional poster/thumbnail image URL for the video                          | Same bucket, optional                      |

#### Private

| Variable                                    | Description                            | Source                     |
| ------------------------------------------- | -------------------------------------- | -------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`                 | 🔒 Supabase service role key           | Supabase Dashboard         |
| `RESEND_API_KEY`                            | 🔒 Transactional email API key         | Resend Dashboard           |
| `PAYPAL_CLIENT_ID`                          | Server-side PayPal client ID           | PayPal Developer           |
| `PAYPAL_CLIENT_SECRET`                      | 🔒 PayPal client secret                | PayPal Developer           |
| `PAYPAL_MODE`                               | `live` or `sandbox`                    | You set                    |
| `GOOGLE_GEMINI_API_KEY` or `GEMINI_API_KEY` | 🔒 Gemini AI API key                   | Google AI Studio           |
| `EXCHANGE_RATE_API_KEY`                     | 🔒 Currency conversion API key         | Exchange rate API provider |
| `FOUNDER_UID`                               | Your Supabase user ID for admin access | Supabase Auth              |
| `CONTACT_EMAIL`                             | `contact@jeffdev.studio`               | You set                    |
| `HIRE_EMAIL`                                | `hire@jeffdev.studio`                  | You set                    |
| `NOREPLY_EMAIL`                             | `noreply@jeffdev.studio`               | You set                    |
| `SUPPORT_EMAIL`                             | `support@jeffdev.studio`               | You set                    |
| `FEATURE_PRISM_ENGINE_ENABLED`              | Feature flag: `true`/`false`           | You set                    |
| `FEATURE_PRISM_ENGINE_TEASER`               | Feature flag                           | You set                    |
| `N8N_WEBHOOK_URL`                           | Optional — n8n automation endpoint     | n8n                        |

#### Optional

| Variable                      | Description                             |
| ----------------------------- | --------------------------------------- |
| `GA_PROPERTY_ID`              | Google Analytics property ID            |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase service account email          |
| `FIREBASE_ADMIN_PRIVATE_KEY`  | 🔒 Firebase service account private key |

#### Auto-injected by Vercel

| Variable                     | Description                               |
| ---------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_GIT_COMMIT_SHA` | Current commit hash                       |
| `NEXT_PUBLIC_GIT_BRANCH`     | Current branch name                       |
| `VERCEL_ENV`                 | `production`, `preview`, or `development` |
| `NODE_ENV`                   | `production`                              |

### Dependencies (key)

`next@16.1.4`, `@supabase/supabase-js`, `@paypal/react-paypal-js`, `resend`, `framer-motion`, `gsap`, `recharts`, `@tanstack/react-query`, `@vercel/analytics`, `@react-pdf/renderer`, `sonner`, `lucide-react`, `@syntaxure/ui` (workspace), `zod`

---

## 2️⃣ prism-engine → `prism.syntaxure.dev`

### Vercel Settings

| Setting         | Value                                              |
| --------------- | -------------------------------------------------- |
| Root Directory  | `apps/prism-engine`                                |
| Build Command   | `cd ../.. && pnpm --filter prism-engine run build` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile`       |
| Node Version    | 20.x                                               |

### Environment Variables

#### Public (`NEXT_PUBLIC_`)

| Variable                        | Description                   | Source             |
| ------------------------------- | ----------------------------- | ------------------ |
| `NEXT_PUBLIC_PRISM_URL`         | `https://prism.syntaxure.dev` | You set            |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL          | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key      | Supabase Dashboard |
| `NEXT_PUBLIC_SENTRY_DSN`        | Sentry public DSN             | Sentry Dashboard   |

#### Private

| Variable                            | Description                                                                                                                                   | Source             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `SUPABASE_SERVICE_ROLE_KEY`         | 🔒 Supabase service role key (also used for `prism_*` Postgres tables)                                                                        | Supabase Dashboard |
| `UPSTASH_REDIS_REST_URL`            | 🔒 Upstash Redis REST URL — used for API rate limiting + response caching. Optional: rate limiting fails open (no burst throttling) if unset. | Upstash Dashboard  |
| `UPSTASH_REDIS_REST_TOKEN`          | 🔒 Upstash Redis REST token                                                                                                                   | Upstash Dashboard  |
| `GEMINI_API_KEY`                    | 🔒 Gemini AI API key                                                                                                                          | Google AI Studio   |
| `AZURE_OPENAI_ENDPOINT`             | 🔒 Azure OpenAI endpoint                                                                                                                      | Azure Portal       |
| `AZURE_OPENAI_API_KEY`              | 🔒 Azure OpenAI API key                                                                                                                       | Azure Portal       |
| `AZURE_OPENAI_DEPLOYMENT_NAME`      | Model deployment (default: `gpt-4o-mini`)                                                                                                     | Azure Portal       |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | Embedding model (default: `text-embedding-3-small`)                                                                                           | Azure Portal       |
| `SENTRY_DSN`                        | 🔒 Sentry secret DSN                                                                                                                          | Sentry Dashboard   |
| `SENTRY_ORG`                        | Sentry organization: `jeffdev`                                                                                                                | Sentry Dashboard   |
| `SENTRY_PROJECT`                    | Sentry project: `prism-engine`                                                                                                                | Sentry Dashboard   |
| `SENTRY_AUTH_TOKEN`                 | 🔒 Sentry auth token (required for source map uploads)                                                                                        | Sentry Dashboard   |
| `RESEND_API_KEY`                    | 🔒 Transactional email API key                                                                                                                | Resend Dashboard   |
| `PAYPAL_CLIENT_ID`                  | PayPal client ID                                                                                                                              | PayPal Developer   |
| `PAYPAL_CLIENT_SECRET`              | 🔒 PayPal client secret                                                                                                                       | PayPal Developer   |
| `PAYPAL_WEBHOOK_ID`                 | 🔒 PayPal webhook verification ID                                                                                                             | PayPal Developer   |
| `PAYPAL_PLAN_PRO_MONTHLY`           | PayPal plan ID: pro-monthly                                                                                                                   | PayPal Developer   |
| `PAYPAL_PLAN_PRO_ANNUAL`            | PayPal plan ID: pro-annual                                                                                                                    | PayPal Developer   |
| `PAYPAL_PLAN_TEAM_MONTHLY`          | PayPal plan ID: team-monthly                                                                                                                  | PayPal Developer   |
| `PAYPAL_PLAN_TEAM_ANNUAL`           | PayPal plan ID: team-annual                                                                                                                   | PayPal Developer   |
| `PAYPAL_MODE`                       | `live` or `sandbox`                                                                                                                           | You set            |
| `N8N_WEBHOOK_URL`                   | Optional — n8n automation endpoint                                                                                                            | n8n                |
| `PRISM_API_KEY`                     | 🔒 Internal API key — **must match** `prism-mcp-server`'s `PRISM_API_KEY`                                                                     | You generate       |

### Dependencies (key)

`next@16.1.4`, `@sentry/nextjs`, `@supabase/ssr`, `@supabase/supabase-js`, `@google/generative-ai`, `openai`, `@codesandbox/sandpack-react`, `sonner`, `gsap`, `prismjs`, `sharp`, `@syntaxure/ui` (workspace), `@syntaxure-labs/db` (workspace), `zod`

### ⚠️ Sentry Notes

- `withSentryConfig()` wraps next config — Sentry auto-creates releases during build
- **`SENTRY_AUTH_TOKEN`** is required if Sentry source map upload is configured
- If build fails with Sentry errors, check that `SENTRY_ORG` and `SENTRY_PROJECT` match exactly

---

## 3️⃣ prism-docs → `docs.jeffdev.studio`

### Vercel Settings

| Setting         | Value                                            |
| --------------- | ------------------------------------------------ |
| Root Directory  | `apps/prism-docs`                                |
| Build Command   | `cd ../.. && pnpm --filter prism-docs run build` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile`     |
| Node Version    | 20.x                                             |

### Environment Variables

#### Public (`NEXT_PUBLIC_`)

| Variable                               | Description                   | Source                |
| -------------------------------------- | ----------------------------- | --------------------- |
| `NEXT_PUBLIC_DOCS_URL`                 | `https://docs.jeffdev.studio` | You set               |
| `NEXT_PUBLIC_SENTRY_DSN`               | Sentry public DSN             | Sentry Dashboard      |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console code    | Google Search Console |

#### Private

| Variable         | Description          | Source           |
| ---------------- | -------------------- | ---------------- |
| `SENTRY_DSN`     | 🔒 Sentry secret DSN | Sentry Dashboard |
| `GEMINI_API_KEY` | 🔒 Gemini AI API key | Google AI Studio |

### Dependencies (key)

`next@16.1.4`, `nextra@4.6.1`, `nextra-theme-docs@4.6.1`, `@sentry/nextjs`, `@google/generative-ai`, `@syntaxure/ui` (workspace)

---

## 4️⃣ prism-admin → (subdomain TBD)

### Vercel Settings

| Setting         | Value                                             |
| --------------- | ------------------------------------------------- |
| Root Directory  | `apps/prism-admin`                                |
| Build Command   | `cd ../.. && pnpm --filter prism-admin run build` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile`      |
| Node Version    | 20.x                                              |

### Environment Variables

#### Public (`NEXT_PUBLIC_`)

| Variable                        | Description              | Source             |
| ------------------------------- | ------------------------ | ------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL     | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard |

#### Private

| Variable                    | Description                    | Source                 |
| --------------------------- | ------------------------------ | ---------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 Supabase service role key   | Supabase Dashboard     |
| `RESEND_API_KEY`            | 🔒 Transactional email API key | Resend Dashboard       |
| `ZOHO_REFRESH_TOKEN`        | 🔒 Zoho OAuth refresh token    | Zoho Developer Console |
| `ZOHO_CLIENT_ID`            | Zoho OAuth client ID           | Zoho Developer Console |
| `ZOHO_CLIENT_SECRET`        | 🔒 Zoho OAuth client secret    | Zoho Developer Console |
| `ZOHO_ACCOUNT_ID`           | Zoho Books account ID          | Zoho Books Settings    |

### Dependencies (key)

`next@16.1.4`, `@supabase/ssr`, `@supabase/supabase-js`, `resend`, `sonner`, `@syntaxure/ui` (workspace), `@syntaxure-labs/db` (workspace), `zod`

---

## 5️⃣ prism-manage → (subdomain TBD)

### Vercel Settings

| Setting         | Value                                              |
| --------------- | -------------------------------------------------- |
| Root Directory  | `apps/prism-manage`                                |
| Build Command   | `cd ../.. && pnpm --filter prism-manage run build` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile`       |
| Node Version    | 20.x                                               |

### Environment Variables

#### Public (`NEXT_PUBLIC_`)

| Variable                                  | Description              | Source             |
| ----------------------------------------- | ------------------------ | ------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`                | Supabase project URL     | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`           | Supabase anon/public key | Supabase Dashboard |
| `NEXT_PUBLIC_SITE_URL`                    | App base URL             | You set            |
| `NEXT_PUBLIC_GITHUB_MARKETING_REPO_OWNER` | GitHub org/username      | GitHub             |
| `NEXT_PUBLIC_GITHUB_MARKETING_REPO_NAME`  | GitHub repo name         | GitHub             |

#### Private

| Variable                    | Description                     | Source               |
| --------------------------- | ------------------------------- | -------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 Supabase service role key    | Supabase Dashboard   |
| `GOOGLE_CLIENT_ID`          | 🔒 Google OAuth client ID       | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET`      | 🔒 Google OAuth client secret   | Google Cloud Console |
| `GITHUB_PAT`                | 🔒 GitHub Personal Access Token | GitHub Settings      |

### Dependencies (key)

`next@16.1.4`, `@supabase/ssr`, `@supabase/supabase-js`, `@fullcalendar/react`, `googleapis`, `@octokit/rest`, `framer-motion`, `sonner`, `@syntaxure/ui` (workspace), `zod`

---

## 6️⃣ ❌ prism-mcp-server — NOT Vercel

**Type:** Node.js MCP SDK (stdio transport) — needs persistent process.

### Hosting Options

| Provider     | Notes                               |
| ------------ | ----------------------------------- |
| Railway      | Easiest — supports Node.js natively |
| Fly.io       | Good for global edge                |
| Render       | Good free tier                      |
| Your own VPS | Full control                        |

### Environment Variables

| Variable                            | Description                                                                       | Source             |
| ----------------------------------- | --------------------------------------------------------------------------------- | ------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`          | Supabase project URL (same project as prism-engine)                               | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY`         | 🔒 Supabase service role key — reads/writes `prism_*` tables                      | Supabase Dashboard |
| `AZURE_OPENAI_ENDPOINT`             | 🔒 Azure OpenAI endpoint                                                          | Azure Portal       |
| `AZURE_OPENAI_API_KEY`              | 🔒 Azure OpenAI API key                                                           | Azure Portal       |
| `AZURE_OPENAI_DEPLOYMENT_NAME`      | Model deployment name                                                             | Azure Portal       |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | Embedding model name                                                              | Azure Portal       |
| `GEMINI_MODEL`                      | Gemini model name (fallback)                                                      | You set            |
| `PRISM_API_KEY`                     | 🔒 API key — **must match** `prism-engine`'s `PRISM_API_KEY`                      | You generate       |
| `PRISM_API_URL`                     | Prism Engine URL (e.g. `https://prism.syntaxure.dev`)                             | You set            |
| `USE_GREMLIN_RANKING`               | `true`/`false` — rule-graph ranking (Postgres-backed now, see PRISM_MIGRATION.md) | You set            |

### Dependencies (key)

`@modelcontextprotocol/sdk`, `@google/generative-ai`, `openai`, `@syntaxure-labs/db` (workspace), `@syntaxure/supabase` (workspace), `playwright`, `gpt-tokenizer`

**⚠️ Note:** Uses `playwright` in production (web scraping) — needs headless browser environment.

---

## 7️⃣ ❌ prism-analytics — NOT Vercel

**Type:** Python FastAPI — cannot run on Vercel Node.js runtime.

### Hosting Options

| Provider         | Notes                    |
| ---------------- | ------------------------ |
| Railway          | Supports Python natively |
| Google Cloud Run | Has Dockerfile ready     |
| Fly.io           | Good option              |
| Your own VPS     | Port 8000                |

### Docker Deploy

```bash
docker build -t prism-analytics ./apps/prism-analytics
docker run -p 8000:8000 prism-analytics
```

### Environment Variables

| Variable                    | Description                                                     | Source             |
| --------------------------- | --------------------------------------------------------------- | ------------------ |
| `SUPABASE_URL`              | 🔒 Supabase project URL (no `NEXT_PUBLIC_` prefix — Python app) | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 Supabase service role key                                    | Supabase Dashboard |

### Dependencies (key)

`fastapi`, `uvicorn`, `supabase`, `pandas`, `matplotlib`, `seaborn`, `pydantic`

---

## 🏗️ Workspace Packages (built automatically by pnpm)

| Package                   | Path                         | Purpose                                                 |
| ------------------------- | ---------------------------- | ------------------------------------------------------- |
| `@syntaxure/ui`           | `packages/ui`                | Shared UI components (Button, Card, Badge, etc.)        |
| `@syntaxure-labs/db`      | `packages/db`                | Prisma schema + Postgres/Supabase clients (incl. Prism) |
| `@repo/typescript-config` | `packages/typescript-config` | Shared TypeScript configurations                        |
| `@repo/eslint-config`     | `packages/eslint-config`     | Shared ESLint configurations                            |

---

## 🔧 Vercel Setup Steps (repeat per app)

1. **Create Vercel project** → Import from Git (`jeffdev-monorepo`)
2. **Set Root Directory** → e.g. `apps/syntaxure-labs`
3. **Override Install Command** → `cd ../.. && pnpm install --frozen-lockfile`
4. **Override Build Command** → `cd ../.. && pnpm --filter <app-name> run build`
5. **Add all env vars** (ideally via Doppler integration)
6. **Set custom domain** → Configure DNS in Vercel dashboard
7. **Deploy** 🚀

---

## ☁️ Doppler Project Setup

Create **one Doppler project per app**, each with `dev`, `staging`, `production` environments.

```bash
doppler projects create syntaxure-labs
doppler projects create prism-engine
doppler projects create prism-docs
doppler projects create prism-admin
doppler projects create prism-manage
```

Then populate each with the env vars listed above.

---

## 🧩 DNS Quick Reference

| Domain                      | Target App     | Vercel Project   |
| --------------------------- | -------------- | ---------------- |
| `jeffdev.studio`            | syntaxure-labs | `syntaxure-labs` |
| `prism.syntaxure.dev`       | prism-engine   | `prism-engine`   |
| `docs.jeffdev.studio`       | prism-docs     | `prism-docs`     |
| `admin.jeffdev.studio` (?)  | prism-admin    | `prism-admin`    |
| `manage.jeffdev.studio` (?) | prism-manage   | `prism-manage`   |

---

## ✅ Master Checklist

### Pre-Deployment

- [ ] All code pushed to `develop` branch
- [ ] Merge `develop` → `main` (or deploy from `develop`)
- [ ] Supabase project created and migrations run (`supabase/marketing_schema.sql`, incl. `supabase/migrations/20260813000001_prism_context_engine.sql` for Prism)
- [ ] All API keys and secrets obtained from providers
- [ ] Doppler project created for new environment

### Per App

- [ ] Vercel project created with correct Root Directory
- [ ] Install/build commands overridden in Vercel
- [ ] All env vars added (via Doppler or Vercel dashboard)
- [ ] Custom domain configured and DNS propagated
- [ ] Build test — deploy preview first, verify it works
- [ ] Promote to production

### Cross-App

- [ ] `PRISM_API_KEY` is **identical** in both `prism-engine` and `prism-mcp-server`
- [ ] Supabase CORS allows all deployed domains

### Post-Deployment

- [ ] Set Vercel environment to `Production` in Doppler
- [ ] Configure Supabase allowed domains / CORS
- [ ] Verify Sentry error reporting works
- [ ] Test PayPal webhooks reach the production URL
- [ ] Verify n8n webhook connectivity (if used)
- [ ] Test authentication flows end-to-end
- [ ] Verify MCP server can connect to Prism Engine API
