# Syntaxure PM — Documentation Hub

Centralized documentation, task tracking, and project management for the JeffDev monorepo.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run the PM app
pnpm --filter syntaxure-pm run dev

# Or with Doppler
doppler run -- pnpm --filter syntaxure-pm run dev
```

App runs at **http://localhost:3008**

## Database Setup

Run the migration to create the `pm_tasks` table:

```bash
# Apply migration via Supabase CLI or dashboard
supabase db push
```

Or run the SQL directly from `supabase/migrations/20260606000001_create_pm_tasks.sql`.

## Seed Tasks

To populate the task board with the MCP connection stability fix plan:

```bash
pnpm --filter syntaxure-pm exec tsx scripts/seed-tasks.ts
```

## Documentation Structure

All documentation is rendered in the app at `/docs/*`:

- `/docs/architecture` — System architecture, data flows, key decisions
- `/docs/apps` — Per-app documentation (8 apps)
- `/docs/packages` — Shared packages (db, ui, supabase, redis)
- `/docs/database` — Schema reference (Supabase tables, Cosmos DB collections)
- `/docs/workflows` — User journeys and development workflows

## Task Management

Tasks are stored in Supabase `pm_tasks` table with:

- Status tracking (backlog → todo → in_progress → in_review → completed)
- Priority levels (low, medium, high, critical)
- Categories (mcp-stability, documentation, architecture, testing, deployment)
- Checklists with progress bars
- Deadline tracking with overdue detection

## Archive

The `docs/archive/` folder contains historical documentation from previous development phases. These are kept for reference but are not actively maintained.
