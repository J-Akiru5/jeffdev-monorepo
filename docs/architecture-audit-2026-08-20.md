# Architecture & Complexity Audit — jeffdev-monorepo

**Date:** 2026-08-20 · **Scope:** full monorepo (all apps, packages, CI/CD, env/secrets, root tooling) · **Type:** read-only investigation, no code changed

**Method:** git history (`git log` per path, `gh run`/`gh pr` for live CI state), every `package.json`/`vercel.json`/workflow file in the repo, targeted greps for imports and duplication, and the local Vercel CLI link cache (`.vercel/repo.json`). I did **not** have access to the Vercel dashboard, Doppler dashboard, or Supabase dashboard — anywhere below that depends on those, I've said so explicitly instead of guessing.

There's already a `docs/audit-report.html` in this repo, titled "Syntaxure Labs — Full Audit Report." That one appears scoped to the Syntaxure Labs app specifically; this one covers the whole monorepo and doesn't assume you've read it.

---

## 1. TL;DR

1. **You said 6 apps. There are 8**, plus a package and a VS Code extension that are really part of the same product family. `apps/` also contains `prism-analytics` (Python, barely started) and `prism-mcp-server` (an MCP server), and `packages/prism-context-engine` + `extensions/prism-vscode` are Prism-product components, not generic shared tooling. This isn't "one product, 6 apps" — it's **two products** (the Prism suite, and Syntaxure Labs) sharing a workspace, a Supabase database, and a Vercel team.
2. **Six of those eight apps went dormant on almost the same day.** `prism-admin`, `prism-engine`, `prism-manage`, `prism-docs`, `prism-mcp-server`, and the `prism-context-engine`/`prism-vscode` packages all stopped getting commits around **June 3–8, 2026** — roughly **10 weeks ago**. `prism-analytics` had one 3-day burst in May and never came back. The only things actively worked on since then are `syntaxure-labs` (17 days ago) and `packages/ui` (26 days ago) — and most of that recent work is from a collaborator (`dev-lou`), not you.
3. **GitHub Actions CI and Deploy are currently broken on every push to `main`.** Deploy fails outright — a pinned third-party action ships a Vercel CLI that Vercel's API now rejects. CI's merge-gate job fails too, even on runs where typecheck/lint/test all passed cleanly (looks like a bug in the gate's own aggregation logic, not real code problems). Your sites are clearly still updating in production, so **Vercel's native Git integration is what's actually deploying you** — the GitHub Actions `deploy.yml` workflow looks like dead weight duplicating it, and it's been failing silently for at least a week.
4. **The June 3 "consolidate Sentry/Redis/Supabase into shared packages" refactor was a good call, but it's half-finished.** Supabase server/browser clients are cleanly centralized now. The auth-middleware logic wasn't — 2 of 4 apps that need it (`syntaxure-labs`, `syntaxure-pm`) still carry a full local copy instead of the shared one, because the shared version can't express per-app route rules. Sentry is only wired into 2 of 6 web apps despite the shared config package existing for all of them.
5. **`prism-manage` and `syntaxure-pm` overlap directly** — both are internal task/dashboard tools with auth, tasks, and settings. `prism-manage` is far more built out (kanban, calendar sync, GitHub sync, marketing ops); `syntaxure-pm` had one 2-week burst of work, and its own last PR (#75, June 7) was titled _"prism-manage consolidation + syntaxure-pm gaps"_ — you already flagged this yourself and it's still open.

---

## 2. Repo map

### The two product families

| Family                                | Components                                                                                                                                                     | Status                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Prism** (AI context/rules SaaS)     | `prism-admin`, `prism-engine`, `prism-manage`, `prism-docs`, `prism-mcp-server`, `prism-analytics`, `packages/prism-context-engine`, `extensions/prism-vscode` | 7 of 8 dormant since ~early June (`prism-manage` counted once, see below) |
| **Syntaxure Labs** (agency/portfolio) | `syntaxure-labs`, `syntaxure-pm`                                                                                                                               | `syntaxure-labs` active; `syntaxure-pm` dormant since June 8              |

### Apps

| App                | Purpose (one-liner)                                                                                | Stack                                                             | Domain                                                                                                                                        | Packages used                                                      | Activity                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `prism-admin`      | Agency ops admin: clients, quotes, invoices, projects, subscriptions, Zoho billing                 | Next.js 16, Supabase, Zoho, Resend, Mongo                         | `admin.syntaxure.dev` (confirmed in source)                                                                                                   | `ui`, `supabase`, `redis`, `@syntaxure-labs/db`                    | 111 commits · last **2026-06-08** (~73d dormant)                                   |
| `prism-engine`     | Core Prism SaaS: AI rule/context engine, brand kits, marketplace, PayPal subscriptions             | Next.js 16, Supabase, Cosmos/Mongo, Sentry, Gemini + Azure OpenAI | `prism.syntaxure.dev` (confirmed)                                                                                                             | `ui`, `supabase`, `redis`, `sentry-config`, `@syntaxure-labs/db`   | 82 commits · last **2026-06-08** (~73d dormant)                                    |
| `prism-manage`     | Internal ops hub: tasks, kanban, calendar (Google Cal sync), GitHub sync, marketing-ops sub-module | Next.js 16, Supabase, Google APIs, Octokit                        | `manage.syntaxure.dev` (confirmed)                                                                                                            | `ui`, `supabase`, `redis`                                          | 77 commits · last **2026-06-08** (~73d dormant)                                    |
| `prism-docs`       | Public multilingual docs site for Prism (Nextra)                                                   | Next.js 16 (Nextra 4), Sentry                                     | `docs.jeffdev.studio` per 3-month-old doc — **not independently confirmed**, verify                                                           | `ui`, `sentry-config`, `redis`                                     | 69 commits · last **2026-06-08** (~73d dormant)                                    |
| `prism-mcp-server` | MCP server + HTTP gateway backing Prism's AI features; also does headless-browser scraping         | Node.js, `@modelcontextprotocol/sdk`, MongoDB, Playwright         | Deploy target genuinely unclear — see [§3.5](#35-cicd)                                                                                        | `@syntaxure-labs/db`                                               | 37 commits · last **2026-06-03** (~78d dormant)                                    |
| `prism-analytics`  | Python analytics/reporting service for Prism                                                       | FastAPI, Supabase, pandas/matplotlib                              | N/A — Docker only, not on Vercel                                                                                                              | none (own ecosystem, not in pnpm workspace)                        | **4 commits ever**, all in one 3-day window · last **2026-05-24** (~88d dormant)   |
| `syntaxure-labs`   | Public agency/portfolio site: products, community, blog, PayPal checkout                           | Next.js 16, Supabase, PayPal, GSAP                                | `www.syntaxure.dev` (confirmed via `metadataBase`) — repo/branding still say `jeffdev.studio` in places, see [§3.6](#36-complexity-diagnosis) | `ui`, `supabase`, `redis`                                          | 131 commits · last **2026-08-03** (~17d ago — **active**)                          |
| `syntaxure-pm`     | Internal task tracker + a built-in docs viewer for the monorepo itself                             | Next.js 16, Supabase                                              | Not found anywhere in source (no `vercel.json`, no domain metadata, no env files)                                                             | `ui`, `supabase`, `redis` (declared; usage of `redis` unconfirmed) | **5 commits ever**, all in one ~2-week window · last **2026-06-08** (~73d dormant) |

_Activity = commits touching that path (`git log -- <path>`), "dormant" = days since last commit relative to 2026-08-20. LOC/file counts are in [§3.1](#31-inventory)._

Not counted in the "6 apps" but real, live parts of the repo:

| Component                       | What it is                                                                                                                                                                                      | Activity                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `packages/prism-context-engine` | Publicly published npm package / MCP server ("Prism Context Engine") for Cursor/Claude/Windsurf/VS Code — the only package here meant for external distribution, not internal-only              | 3 commits · last 2026-06-03 |
| `extensions/prism-vscode`       | VS Code extension client that talks to `prism.syntaxure.dev` — a _different_ thing from `prism-context-engine` (this one drives the hosted Prism SaaS: projects, brands, marketplace, API keys) | 8 commits · last 2026-06-03 |

---

## 3. Findings by area

### 3.1 Inventory

Approximate size (git-tracked files, code LOC = `.ts/.tsx/.js/.jsx/.py` only, excludes lockfiles/images):

| App                | Tracked files | Approx code LOC |
| ------------------ | ------------: | --------------: |
| `prism-admin`      |           189 |         ~28,000 |
| `prism-engine`     |           192 |         ~25,900 |
| `syntaxure-labs`   |           193 |         ~21,500 |
| `prism-manage`     |           126 |         ~14,000 |
| `prism-mcp-server` |            61 |         ~10,600 |
| `prism-docs`       |           468 |          ~4,400 |
| `syntaxure-pm`     |            48 |          ~4,000 |
| `prism-analytics`  |            14 |            ~500 |

`prism-docs`'s file count is inflated by per-locale MDX content pages (8+ locales × many pages), not app code — its actual LOC is the smallest of the six web apps.

**Contributors, not just dates.** Recent history isn't just "you, sometimes." Of the last 30 merged PRs, more than half were authored by `dev-lou` (Lou Vincent Baroro), concentrated on `syntaxure-labs` and `packages/ui` — which lines up exactly with those being the two things still actively moving. The Prism line's commits are almost entirely `Jeff`/`J-Akiru5`. Worth knowing for capacity planning: the active third of this repo is being kept alive partly by someone else's time, not just yours.

**One thing that _is_ well-centralized:** there's a single `supabase/` folder at repo root with 41 migrations (May 2025 → June 2026) shared across every app that needs Postgres — not per-app schemas. That's the right call for a shared-database architecture and isn't contributing to your complexity problem.

### 3.2 Shared packages

| Package                                          | What it does                                                      | Real consumers (verified by import, not just `package.json`)                                                                                                             | Note                                                                                                                                                                                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@syntaxure/ui`                                  | Shared components (Button, Card, DataTable, ChatAssistant, etc.)  | All 6 web apps                                                                                                                                                           | Most actively maintained package (58 commits, last touched 26 days ago). Healthy.                                                                                                                                                                                 |
| `@syntaxure/supabase`                            | `server`/`browser`/`admin`/`middleware` Supabase client factories | `server`/`browser` used correctly (thin re-export wrappers) by prism-admin, prism-manage, prism-engine, syntaxure-labs, syntaxure-pm. `middleware` — see below.          | Adoption is incomplete, not absent.                                                                                                                                                                                                                               |
| `@syntaxure/redis`                               | Upstash-backed rate limiting + cache                              | Confirmed real usage in prism-admin, prism-manage, prism-engine, prism-docs, syntaxure-labs — all via the same pattern (rate-limiting each app's `/api/assistant` route) | `syntaxure-pm` declares it in `package.json` but I found no actual import of it in its source — **can't confirm if that's unused-but-declared or something I missed; worth a quick check on your end.**                                                           |
| `@syntaxure/sentry-config`                       | Shared Sentry setup for Next.js                                   | Only `prism-engine` and `prism-docs`                                                                                                                                     | 4 of 6 web apps (prism-admin, prism-manage, syntaxure-labs, syntaxure-pm) have **no error monitoring at all**, despite this package existing and being a drop-in for any of them.                                                                                 |
| `@syntaxure-labs/db`                             | Prisma + Cosmos/Mongo + Gremlin DB clients                        | prism-admin, prism-engine, prism-mcp-server                                                                                                                              | **Not consumed by `syntaxure-labs` itself** — the app the package is named after doesn't use it. Naming is actively misleading here.                                                                                                                              |
| `@repo/eslint-config`, `@repo/typescript-config` | Shared lint/TS config                                             | All apps and packages (devDependency)                                                                                                                                    | Standard Turborepo pattern, low churn because it doesn't need to change often. Not a problem.                                                                                                                                                                     |
| `prism-context-engine`                           | The public npm CLI/MCP server described above                     | **Zero workspace-internal consumers** — no app or package imports it                                                                                                     | Not necessarily dead — it's meant to be used externally via `npx`/npm, which I have no visibility into from this repo (no download stats, no external-usage signal available to me). **I can't tell you how alive this is; that requires checking npm directly.** |

**Failure mode (a) — duplicated logic that should be shared, with exact evidence:**

- **Supabase auth middleware.** `packages/supabase/src/middleware.ts` exports one `updateSession()` that only refreshes the session — no route-protection logic. `prism-admin/src/lib/supabase/middleware.ts` and `prism-manage/src/lib/supabase/middleware.ts` are both correctly a one-line re-export of it. `syntaxure-labs/src/lib/supabase/middleware.ts` (72 lines) and `syntaxure-pm/src/lib/supabase/middleware.ts` (59 lines) each carry a **full local copy** of the same session-refresh code, because they _also_ need pathname-based redirect rules (protect `/admin`, or protect everything except `/login`) that the shared version has no way to express. `prism-engine` has no Supabase middleware file at all — I can't tell if route protection happens another way there (e.g. per-page server checks) or if it's simply not covered.
  - **The actual fix isn't "copy the 1-liner"** — it's giving `updateSession()` an optional config for redirect rules so all four apps (five, if `prism-engine` needs it too) can share one implementation instead of forking it. That's a real, scoped package change, not just a reminder to use the package.
- **Per-app AI assistant routes.** `prism-admin`, `prism-engine`, `prism-manage`, `syntaxure-labs` each have their own `api/assistant/route.ts`; `prism-docs` has `api/docs-assistant/route.ts`; `prism-mcp-server` has its own separate `lib/gemini.ts`. Five to six independent implementations of "call Gemini, stream a response, rate-limit it" with no shared package wrapping the model call itself (only the rate-limiting half is shared, via `@syntaxure/redis`).

**Failure mode (b) — packages nothing depends on:** none of the 8 packages are fully unused. `prism-context-engine` is the closest, but it's a deliberately external-facing product, not orphaned code — see the caveat above.

**Failure mode (c) — third-party dependency where a native/built-in API already covers it:** I did not find a dramatic case of this (no lodash-when-native-Array-methods-suffice, no competing date libraries, no hand-rolled HTTP client when `fetch` is already used natively throughout). The closest real candidates:

- `mini-svg-data-uri` (syntaxure-labs) — a whole dependency for what's a few lines of `encodeURIComponent` templating. Low value, trivially inlineable.
- `nanoid` (prism-admin, prism-manage, syntaxure-labs) — partially covered by native `crypto.randomUUID()`, though nanoid's shorter IDs aren't quite the same output shape, so this is a soft flag, not a clean swap.
- Not a "use native instead" issue but the same _bloat_ spirit: the MongoDB driver is split across **two major versions** in the workspace (`mongodb@^6.15.0` in prism-admin/prism-mcp-server/`@syntaxure-labs/db`, `mongodb@^7.2.0` in prism-engine) — same dependency, double the install weight, and a real behavior-drift risk between apps that talk to the same Cosmos DB.

### 3.3 Coupling & boundaries

- **No direct cross-app imports found.** `AGENTS.md` states this as a hard rule ("No cross-app imports. Shared code goes in `packages/`") and a repo-wide search for app-to-app import paths turned up nothing but doc mentions. This is a real positive — the rule is written down _and_ followed.
- **No circular dependencies between packages.** Each of the 8 packages' own dependency lists were checked; none depend on a sibling workspace package. They're all leaves.
- **One backwards dependency direction:** `ci.yml` explicitly builds `prism-mcp-server` before testing `prism-context-engine`, because the _package_ depends on the _app_. Conventionally it should be the other way around (apps depend on packages). Not urgent, but it means `prism-context-engine` — the one package meant to be published and consumed standalone — can't be built or tested in isolation from an internal app.
- **`prism-manage` vs. `syntaxure-pm` — the clearest "these look like one app" case.** Route-level comparison:
  - `syntaxure-pm`: dashboard, tasks (+ `api/tasks`), settings, login, and a built-in docs viewer (`docs/apps`, `docs/architecture`, `docs/database`, `docs/packages`, `docs/workflows` — it renders documentation about the monorepo itself).
  - `prism-manage`: dashboard, tasks, kanban, calendar (Google Calendar OAuth), GitHub sync, a marketing-ops sub-area (team/settings/tasks), profile, settings, an AI assistant, and workspace/C-level role management.
  - Both are internal ops tools with the same core shape (auth → dashboard → tasks → settings). `prism-manage` is the mature one; `syntaxure-pm` is smaller, newer (all 5 commits landed within one ~2-week window), and stopped the same day `prism-manage` got its "consolidation" commit. Its own last PR title — **"fix: prism-manage consolidation + syntaxure-pm gaps"** (#75, merged 2026-06-07 by you) — already named this tension. It hasn't been resolved since.

### 3.4 Env & secrets

You're running **three separate secret stores**, not one pipeline:

1. **Doppler** → synced into Vercel (per-app projects, presumably via the Doppler-Vercel integration).
2. **Vercel dashboard directly** — vars added by hand bypass Doppler entirely. This is exactly the drift class that caused the prism-admin/prism-manage Supabase issue you mentioned, and **I cannot see into the Vercel dashboard from here** to tell you which vars are Doppler-synced vs. hand-added. That check has to happen in the dashboard itself (Vercel flags Doppler-synced vars differently in the UI) or via `doppler secrets` vs. `vercel env ls` diffed per project.
3. **GitHub Actions Secrets** — a completely separate store, used only by the workflow files (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_<APP>_PROJECT_ID`, `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `MONGODB_URI`, `OPENAI_KEY`, `ANTHROPIC_KEY`, `N8N_WEBHOOK_URL`). These are never synced from Doppler — they're their own drift surface, and the `deploy.yml` build step passes a much narrower env var set than what Doppler documents for each app (no Redis, no Sentry, no AI provider keys), so a GitHub-Actions-built artifact and a Vercel-native-built artifact of the same app are not guaranteed to behave identically.

**Concrete evidence of drift already:**

- `envkeys.md` (the only "map" doc that exists, dated **2026-05-21** — 3 months stale) doesn't mention `syntaxure-pm` at all, marks `prism-admin`/`prism-manage` domains as "(TBD)" (both are now resolved in source: `admin.syntaxure.dev`, `manage.syntaxure.dev`), and says `prism-mcp-server` is explicitly "❌ NOT Vercel — use Railway/Fly.io/VM." But `deploy.yml` deploys `prism-mcp-server` **to Vercel** with its own project-ID secret, and no such project shows up in the local Vercel link cache (`.vercel/repo.json`) — see [§3.5](#35-cicd). The doc and the deploy pipeline disagree with each other about where this thing even runs.
- `packages/prism-context-engine/package.json` has `"author": {"url": "https://jeffdev.studio"}` alongside `"homepage": "https://prism.syntaxure.dev"` — one file, two brand domains. Confirms the `jeffdev.studio` → `syntaxure.dev` migration (see [§3.6](#36-complexity-diagnosis)) is mid-flight, not finished.
- Committed `.env.example` templates exist for only 4 of 8 apps (prism-admin, prism-docs, prism-manage, prism-mcp-server). `prism-engine` and `syntaxure-labs` have a local `.env.local` (gitignored, personal-machine only) but **no committed template** — a fresh clone has nothing to go on for those two. `syntaxure-pm` has neither.
- On this machine's local `.env.local` files (signal from one dev machine only, not proof of Vercel/Doppler state): `GEMINI_API_KEY` and `GOOGLE_GEMINI_API_KEY` both appear for the same purpose (envkeys.md itself flags this ambiguity). `syntaxure-labs/.env.local` has three keys with a trailing underscore — `EXCHANGE_RATE_API_KEY_`, `RESEND_API_KEY_`, `SUPABASE_SERVICE_ROLE_KEY_` — sitting next to the real ones. Look like accidental duplicates or a bad find-and-replace; worth a manual look, I can't tell if they're live-used or dead.
- The root `doppler.json` is a large encrypted/opaque blob (not human-readable JSON) — I did not attempt to decode it, and didn't need to for this audit. Worth your own judgment on whether an encrypted secrets export belongs committed to the repo at all, even encrypted.

### 3.5 CI/CD

**There are two full deploy paths for the same 5–6 apps, and one of them is currently broken:**

1. **Vercel-native Git integration** — each of `prism-admin`, `prism-docs`, `prism-engine`, `prism-manage`, `syntaxure-labs` has a `vercel.json` (`buildCommand: pnpm turbo build --filter=<app>`) and a `vercel-ignore.sh` (path-based skip logic via `turbo ... --dry=json`). These five scripts are **~95% byte-identical**, differing only in the app name — a single parameterized script would do the same job as five near-duplicates.
2. **`deploy.yml`** — a GitHub Actions workflow that independently detects changed apps and deploys all 7 (the 5 above, plus `syntaxure-pm` and `prism-mcp-server`) via `amondnet/vercel-action@v25`.

**I checked live GitHub Actions history (`gh run list`), and Deploy is failing on every recent push:**

```
Error! Your Vercel CLI version is outdated. This endpoint requires version 47.2.2 or later.
```

`amondnet/vercel-action@v25` pulls a pinned, now-incompatible Vercel CLI via `npx`. Every Deploy run I inspected from the last week (8+ consecutive pushes, Aug 14–15) failed at this exact step, for every app in the matrix. Since your sites are visibly still updating in production, **Vercel's native integration is doing the actual deploying** — this workflow has been contributing nothing but a red X for at least a week, unnoticed.

**CI is also failing, but not for a code reason.** In the run I inspected in detail, `Install`, `Lint`, `Type Check`, and both `Test` jobs (`prism-context-engine`, `prism-mcp-server`) all passed. No `Build (<app>)` job even ran (the change-detection step apparently didn't flag any app that run). Yet the aggregate `CI Status (typecheck, lint, test, build)` job — the one named in the branch-protection rule per the workflow's own header comment — still reported failure, specifically at its `Check: build` step. That smells like a bug in the aggregation script's handling of a skipped/empty build matrix, not a real problem with your code. **I did not fully trace GitHub's exact semantics here — flagging this as "needs a closer look," not as a solved diagnosis.** Practically: your branch-protection gate has been red for reasons unrelated to code quality, on a repo where commits are landing straight on `main` regardless.

**Tests exist but aren't gated in CI.** `ci.yml`'s test matrix only runs `prism-context-engine` and `prism-mcp-server`. But `prism-manage`, `syntaxure-labs`, `prism-engine`, and `syntaxure-pm` all have Vitest unit tests configured, and `prism-admin`, `prism-manage`, `syntaxure-labs` all have Playwright e2e directories — **none of it runs in CI.** `prism-admin` even has `playwright.config.ts` and an `e2e/` folder with no `test:e2e` script in `package.json` to invoke it. This is the less-common failure mode: not "no tests exist," but "tests exist, cost real maintenance time, and provide none of their CI-gating value."

**`syntaxure-pm` is the outlier on nearly every CI/CD axis:** no `vercel.json`, no `vercel-ignore.sh`, absent from `docker-compose.yml` — yet it _is_ wired into `ci.yml`/`deploy.yml`'s change-detection and deploy matrix. It's simultaneously the least-configured app and one that CI/CD assumes is fully set up.

**Smaller things worth knowing:**

- `n8n-release.yml` has a step literally labeled **"Legacy n8n Webhook (backward compat)"** next to the current one — self-documented cruft, safe to retire once you confirm nothing still points at the old webhook URL.
- `pr-agent.yml` (Codium PR-Agent, using `OPENAI_KEY` + `ANTHROPIC_KEY`) runs auto-review/describe/improve on every PR. `gh workflow list` also shows **"Copilot," "Copilot code review,"** and **"Copilot cloud agent"** as active — these are GitHub repo-setting features, not files in this repo, so I can't tell you from the codebase whether they're actually enabled and double-commenting alongside PR-Agent, or vestigial. Worth a two-minute check in repo Settings.
- Positives: Gitleaks scans every push/PR and is passing. The Changesets release flow is correctly scoped (only builds `prism-context-engine`'s deps, matching that it's the one published package). Renovate is configured — weekly, OSV vulnerability alerts, lockfile maintenance — real automated dependency hygiene exists. I didn't see a Renovate-authored PR in the last 30 merged PRs I sampled, which is worth a quick check that the GitHub App is actually still installed and active, not just configured.

### 3.6 Complexity diagnosis

You asked me to be blunt. Here's what's actually making this hard to hold in your head right now, in order of how much it matters:

1. **It's two products, not one repo with 6 apps.** The Prism SaaS suite (7 components) and Syntaxure Labs (2 components) don't share a purpose — they share a workspace, a database, and a Vercel team because it was convenient to set them up that way. Every "how do I structure this repo" instinct you have gets pulled in two directions because you're really running two different things.
2. **Most of that repo isn't actually live cognitive load — until it is.** 8 of your 10 components have had zero commits in ~2.5 months. Day to day, the thing you actually need to hold in your head is `syntaxure-labs` + `packages/ui`, plus whatever you touch in `prism-manage` occasionally. The other 8 are dormant, not gone — they're a standing liability (dependency CVEs, expiring OAuth tokens, Vercel/Doppler project sprawl) that becomes real work the moment something breaks, with no advance warning built in.
3. **The safety net is currently broken, silently.** CI and Deploy have been red on every push for at least a week and nobody's had to notice, because Vercel-native deploys are covering for it. The one thing whose entire job is "tell me when I broke something" isn't doing that job right now.
4. **Consolidation already happened once, and stalled halfway.** The June 3 Sentry/Redis/Supabase-into-packages refactor was the right instinct. Supabase's server/browser clients are properly centralized. The middleware wasn't, and Sentry only made it into 2 of 6 apps. Half-finished consolidation is its own kind of complexity — now there's a "shared way" _and_ several "old way" copies to remember, per app.
5. **Naming actively misleads in a few places**: `@syntaxure-labs/db` isn't used by `syntaxure-labs`. Vercel projects are named `jeffdev-monorepo-prism-manage` and `jd-prism-context-engine-docs` instead of matching their app names. The repo is `jeffdev-monorepo`, the org's own code says `jeffdev.studio` in one place and `syntaxure.dev` in another for the same product. None of these are big on their own; each one costs you a "wait, why is it called that" moment every time you touch it.
6. **Nobody has resolved prism-manage vs. syntaxure-pm**, and you already flagged it yourself in PR #75's title two and a half months ago.
7. **Meta-documentation has outgrown what it's describing.** `AGENTS.md`, `.github/copilot-instructions.md` (222 lines), 18 files under `.agent/{rules,skills,workflows}/`, and three `PRISM_*.md` files at root (one is 34KB) are all instructions for working in this repo. They're already drifting from reality — `AGENTS.md` documents `prism-admin` as using Clerk auth, but Clerk isn't in its dependencies (only a stray local `.clerk/` dev-mode artifact remains). More docs-about-the-repo than the repo strictly needs is its own tax.
8. **Root-level clutter.** `hydration-error.txt`, `hydration-error-252.txt`, `keys-checklist.html`, `ide-connection-commands.html`, `prism-system-guide.html`, and ~9.5MB across 11 PNGs are all committed at the repo root (confirmed via `git ls-files`, not just present on disk) rather than filed under an app's assets or `docs/`. Small individually; it's the first thing you or anyone else sees on opening the repo, and it's permanent git-history weight.

---

## 4. Simplification roadmap

| #   | Issue                                                                                         | Impact if fixed                                                                     | Effort                                                                   | Recommended action                                                                                                                        |
| --- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GitHub Actions `deploy.yml` broken + redundant with Vercel-native                             | High — removes a permanently-red signal and a whole duplicate pipeline              | Afternoon                                                                | Delete `deploy.yml` (or fix the pinned CLI, only if you actually need GH-Actions-driven deploys for a reason Vercel-native doesn't cover) |
| 2   | CI `ci-status` gate failing for non-code reasons                                              | High — restores a trustworthy merge gate                                            | Afternoon                                                                | Debug the `Check: build` step against an empty matrix; fix or simplify the aggregation logic                                              |
| 3   | Prism line dormant, fate undecided                                                            | High — this is the single biggest unknown driving the rest of the roadmap           | Decision, not effort                                                     | See [§5](#5-open-questions) — needs your call, not mine                                                                                   |
| 4   | `prism-manage` / `syntaxure-pm` overlap                                                       | High — removes a whole app's worth of surface area                                  | Focused week (to actually merge) / Afternoon (to just decide + document) | Decide canonical tool; either fold `syntaxure-pm`'s docs-viewer idea into `prism-manage` or formally retire one                           |
| 5   | Supabase middleware duplicated in 2 apps                                                      | Medium — small in LOC, but it's the cleanest "should be shared" example in the repo | Afternoon                                                                | Add optional route-protection config to `@syntaxure/supabase/middleware`, point syntaxure-labs/syntaxure-pm at it                         |
| 6   | Sentry only in 2 of 6 apps                                                                    | Medium — you're currently flying blind on errors in 4 apps                          | Afternoon                                                                | Wire `@syntaxure/sentry-config` into prism-admin, prism-manage, syntaxure-labs, syntaxure-pm (mechanical, package already exists)         |
| 7   | Per-app AI assistant route duplicated 5–6x                                                    | Medium — real duplicated logic, not just config                                     | Focused week                                                             | Extract a shared `callAssistant()`-style helper into a package; keep per-app system prompts                                               |
| 8   | Tests exist, not gated in CI                                                                  | Medium — you're paying maintenance cost for zero CI benefit                         | Afternoon                                                                | Add the 4 apps' vitest suites to `ci.yml`'s test matrix; decide if Playwright e2e belongs in CI or stays manual                           |
| 9   | `envkeys.md` stale (3 months), `syntaxure-pm` undocumented                                    | Medium — onboarding/recovery risk if you forget the details                         | Afternoon                                                                | Regenerate the doc from current Vercel/Doppler state; add `syntaxure-pm` and `.env.example` for it                                        |
| 10  | Doppler/Vercel-direct/GitHub-Secrets drift                                                    | Medium — this is the exact class of bug that already hit you once                   | Afternoon per app, ongoing habit                                         | Diff each Vercel project's env vars against Doppler; standardize on Doppler-synced-only going forward                                     |
| 11  | `vercel-ignore.sh` duplicated 5x                                                              | Low — cosmetic, but a real DRY violation                                            | Afternoon                                                                | One parameterized script (`vercel-ignore.sh $APP_NAME`) shared via `scripts/`                                                             |
| 12  | Root-level clutter (debug logs, PNGs, checklist HTML)                                         | Low — but it's what everyone sees first                                             | Afternoon                                                                | Move images to an app's `public/`, delete the `.txt` debug logs, relocate HTML docs into `docs/`                                          |
| 13  | `jeffdev.studio` vs `syntaxure.dev` branding split                                            | Low-Medium — mostly cosmetic, but it's inside a _public_ npm package's metadata     | Afternoon                                                                | Pick one, update `prism-context-engine/package.json` author URL, repo name if you want to go all the way                                  |
| 14  | Meta-doc sprawl (AGENTS.md, copilot-instructions.md, `.agent/*`, PRISM\_\*.md)                | Low-Medium — cost is diffuse, but real                                              | Focused week                                                             | Consolidate into one canonical source; delete or archive the rest                                                                         |
| 15  | Package naming inconsistency (`@syntaxure/*` vs `@syntaxure-labs/*` vs `@repo/*` vs unscoped) | Low                                                                                 | Focused week (only if you're touching these packages anyway)             | Not worth doing alone — bundle into whatever refactor next touches `@syntaxure-labs/db`                                                   |

### Detail on the highest-value items

**1–2. CI/CD is broken and redundant (do this first — it's cheap and it's the thing that should be catching everything else)**

- _Do nothing yet:_ Fine short-term — Vercel-native is covering deploys. But every day this stays red is a day a real failure could hide inside the noise.
- _One afternoon:_ Delete `deploy.yml` entirely (confirm first that no app genuinely needs it — `prism-mcp-server` might, since it has no `vercel.json`; see open question 4). Separately, fix or gut the `ci-status` job's build-check logic so it reflects reality.
- _One focused week:_ Beyond the fix, add real branch-protection enforcement (currently commits land on `main` directly regardless of CI state) and decide if you want PR-only merges going forward.

**3–4. Prism dormancy and the prism-manage/syntaxure-pm overlap**

- _Do nothing yet:_ Reasonable if Prism is intentionally paused — dormant code isn't urgent by itself.
- _One afternoon:_ Write down, even just for yourself, which of the 8 dormant components are "paused, will resume," "done, in maintenance mode," or "abandon, will formally sunset." That single decision reclassifies most of your remaining complexity.
- _One focused week:_ Once you know the answer, either archive/sunset the abandoned pieces (delete the app, drop its Vercel project, remove it from CI configs) or actually merge `syntaxure-pm`'s useful ideas (the docs-viewer) into `prism-manage` and delete the rest.

**5–7. Shared-package adoption gaps (middleware, Sentry, AI assistant routes)**

- _Do nothing yet:_ Not risky today, but every new app you add will either duplicate these again or need to remember the exception.
- _One afternoon:_ Sentry wiring (#6) is genuinely mechanical — the package exists, it's copy-paste-and-configure four times.
- _One focused week:_ Extend `@syntaxure/supabase/middleware` with route-config support and migrate the two forked copies; extract the AI-assistant call pattern into a package.

**9–10. Env/secrets documentation and drift**

- _Do nothing yet:_ Risky specifically because this is the exact failure mode that already bit you (prism-admin/prism-manage Supabase issue). I wouldn't defer this one.
- _One afternoon:_ Regenerate `envkeys.md` from what's actually in Vercel today (all 7 projects, not the 5 it currently covers), and add a `.env.example` for `prism-engine`, `syntaxure-labs`, and `syntaxure-pm`.
- _One focused week:_ Full Doppler-vs-Vercel diff per project, standardize so every var is Doppler-sourced with nothing hand-added in the Vercel dashboard, and delete the encrypted `doppler.json` blob from the repo if it's not actually needed there.

**12+14. Repo hygiene and doc sprawl**

- _Do nothing yet:_ Purely cosmetic, zero functional risk either way.
- _One afternoon:_ Clear the root-level clutter (§3.6 item 8) — quick, safe, and it's the first impression of the repo.
- _One focused week:_ Consolidate the AI-agent instruction files into one source of truth, if you find yourself still maintaining more than one of them going forward.

---

## 5. Open questions for you

Things I found evidence of a conflict or gap on, but can't resolve on your behalf:

1. **Is the Prism line paused deliberately, feature-complete-and-stable, or stalled/at-risk?** This is the single biggest thing driving the rest of the roadmap, and I have no way to tell "intentionally parked" from "ran out of time" from git history alone.
2. **Is `syntaxure-pm` meant to replace `prism-manage`, complement it for a different audience, or was it an experiment you'd now abandon?** Your own PR #75 called out the overlap and nothing's resolved it since.
3. **What's the canonical current domain for Syntaxure Labs** — `jeffdev.studio` or `www.syntaxure.dev`? Source code (`metadataBase`) says the latter; the repo name, npm author fields, and 3-month-old docs still say the former.
4. **Where does `prism-mcp-server` actually run?** `envkeys.md` explicitly says "NOT Vercel — use Railway/Fly.io/VM"; `deploy.yml` deploys it to Vercel with its own project-ID secret; no such project appears in the local Vercel link cache. These three sources disagree with each other and I can't tell which one is current truth.
5. **Is `prism-analytics` an active/planned component or safe to consider parked?** 4 commits ever, all in a single 3-day window, the last one literally titled "restore... remove agency/tracker." I genuinely can't tell if this is early-and-intended or an abandoned experiment.
6. **What's the root-level Vercel project for** (`jeffdev-monorepo` → directory `.`, visible in your local Vercel link cache)? It's not one of your 8 apps. I can't tell if it's active, unused, or a leftover from before the workspace was split into per-app projects.
7. **Is GitHub's built-in Copilot code review / coding agent actually turned on for this repo**, and if so, is it meant to run alongside the Codium PR-Agent bot, or is one of them a leftover from evaluating the other?
8. **Is a single package-naming convention worth standardizing on now** (`@syntaxure/*` vs. `@syntaxure-labs/*` vs. `@repo/*` vs. unscoped `prism-context-engine`), or is the package count still small enough that it's not worth the churn?
