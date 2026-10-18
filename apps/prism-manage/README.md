# prism-manage

Internal ops hub for Syntaxure Labs — tasks, kanban, calendar sync, pages, marketing ops, and the COO operations layer.

**Live:** manage.syntaxure.dev · **Port:** 3007 · **Stack:** Next.js 16 · Supabase (Auth + Postgres + Realtime) · Tailwind v4 · Zustand

## Features

- **Tasks** — workspace-scoped lists (`pm_projects`), list / table views, search, filters, saved views, comments with @mentions, per-task activity feed, realtime updates, GitHub issue write-back
- **Kanban** — drag & drop across backlog → todo → in progress → in review → approved (approval is founder/CPO only)
- **Calendar** — two-way Google Calendar sync: tasks with due dates mirror to Google, app events push, "Sync Now" + a daily Vercel cron reconcile (prism-manage wins for work items)
- **Notifications** — in-app bell with realtime updates; optional Slack webhook for assignments/comments/mentions
- **Marketing** — GTM task board + GitHub issue sync (label codec: `Phase-`, `Priority-`, `Owner-`, `Type-`, `status-`)
- **Operations** — `/operations` COO hub (milestones, task throughput, department allocation, infrastructure costs) and `/bmc` Business Model Canvas (CEO/COO edit, all founders view)
- **Pages** — Notion-like workspace pages with a sidebar tree
- **Assistant** — Gemini-powered in-app helper (rate-limited via Upstash Redis)

## Roles & RBAC

Workspace membership with `founder | employee` roles; C-level titles (`ceo/cto/cpo/coo/cmo`) scope the hubs:

| Area                                | Who                                  |
| ----------------------------------- | ------------------------------------ |
| Marketing                           | Founder / CEO / CMO / Marketing dept |
| Operations hub + milestones + costs | CEO / COO                            |
| Business Model Canvas               | Edit: CEO/COO · View: all founders   |
| Task approval (`approved`)          | Founder / CPO                        |
| Member management                   | Founders                             |

Enforced in three layers: RLS policies → server-action gates (`lib/authorization*.ts`) → client guards (`RoleGuard`, `MarketingGuard`, `OperationsGuard`).

## Environment

See `.env.example`. Supabase (URL/anon/service-role), `NEXT_PUBLIC_SITE_URL`, Google OAuth (`GOOGLE_CLIENT_ID/SECRET`), GitHub (`GITHUB_PAT`, `GITHUB_MARKETING_REPO_OWNER/NAME`), optional `SLACK_WEBHOOK_URL`, `CRON_SECRET` (Vercel cron auth), Upstash Redis.

## Database

Migrations live in the monorepo at `supabase/migrations/` (shared Supabase project with the other apps). Apply with `supabase db push`.

## Commands

```bash
pnpm --filter prism-manage run dev         # port 3007
pnpm --filter prism-manage run build
pnpm --filter prism-manage run test        # vitest
pnpm --filter prism-manage run lint
pnpm --filter prism-manage run check-types
```

## Docs

- `docs/coo-operations-bmc-plan.md` — the June COO blueprint this app's operations layer implements
- `docs/role-plan.md` — the C-level role system spec
- Monorepo-wide reports live in `/docs` at the repo root (`prism-manage-phase*-2026-10-18.html`)
