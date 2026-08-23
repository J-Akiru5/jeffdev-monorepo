# Prism Context Engine: Cosmos DB → Postgres Migration

**Date:** 2026-08-13
**Branch:** `claude/prism-cosmos-to-postgres-migration`
**Why:** The Azure subscription backing Prism's Cosmos DB account ran out of
credit and was suspended. See the companion read-only assessment,
[`prism-infra-assessment.html`](./prism-infra-assessment.html), for the full
diagnosis. This document covers the migration itself.

## What changed

Every Prism collection that lived in Azure Cosmos DB (MongoDB API) now lives
in this project's existing Supabase Postgres instance, as `prism_*` tables.
The Cosmos Gremlin graph (rule relationships) is replaced by a
`prism_rule_edges` table plus a GIN-indexed `tags` array on `prism_rules`.

**No data was migrated.** The source Cosmos account was unreachable — that
was the entire reason for this migration — so every new table starts empty.
If the Azure account can be briefly reactivated later, write an
export/import script then; it wasn't attempted here.

### New/changed files

| Area                                                                                                                                                    | What                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/db/prisma/schema.prisma`                                                                                                                      | Added `PrismProject`, `PrismRule`, `PrismSkill`, `PrismComponent`, `PrismBrand`, `PrismRuleSet`, `PrismApiKey`, `PrismSubscription`, `PrismUsage`, `PrismGeneration`, `PrismVideo`, `PrismTelemetry`, `PrismGovernanceMemory`, `PrismRuleEdge`. Added `status` + `notificationPrefs` to `UserProfile`. |
| `supabase/migrations/20260813000001_prism_context_engine.sql`                                                                                           | Creates all of the above as real tables, indexes (incl. GIN on `tags`, ivfflat on `prism_videos.embedding`), and RLS policies. Enables `pgvector`.                                                                                                                                                     |
| `packages/db/src/prism.ts` (new)                                                                                                                        | Replaces `./cosmos` and `./cosmos-gremlin`. Exports `getPrismDb()` (service-role Supabase client), `isValidId()` (UUID check, replaces `ObjectId.isValid`), and rule-graph helpers.                                                                                                                    |
| `packages/db/src/cosmos.ts`, `cosmos-gremlin.ts`, `gremlin.d.ts`                                                                                        | Deleted.                                                                                                                                                                                                                                                                                               |
| `packages/db/src/index.ts`, `package.json`                                                                                                              | Export `./prism` instead of `./cosmos`; dropped `mongodb`/`gremlin` deps, added `@syntaxure/supabase`.                                                                                                                                                                                                 |
| 64 files across `apps/prism-engine`, `apps/prism-admin`, `apps/prism-mcp-server`                                                                        | Every `getCollection(...)` call site rewritten to Supabase `.from("prism_*")` queries.                                                                                                                                                                                                                 |
| `apps/prism-engine/scripts/seed-founder.ts`, `seed-keandrew.ts`                                                                                         | Rewritten for Postgres.                                                                                                                                                                                                                                                                                |
| `scripts/migrate-rules-to-gremlin.ts`                                                                                                                   | Deleted — its entire purpose (populating the Gremlin graph) no longer applies.                                                                                                                                                                                                                         |
| `docker-compose.yml`                                                                                                                                    | Removed the local `cosmos` (`mongo:7`) service and every app's `depends_on: cosmos`.                                                                                                                                                                                                                   |
| `README.md`, `AGENTS.md`, `envkeys.md`, `PHASE1_ENV_SETUP.md`, `apps/prism-mcp-server/README.md`, `CHANGELOG.md`, `apps/syntaxure-pm` packages doc page | Updated to describe Postgres instead of Cosmos.                                                                                                                                                                                                                                                        |

### New environment variables (replace `MONGODB_URI` / `COSMOS_*`)

Every app that used to need `MONGODB_URI` + `COSMOS_DATABASE_NAME` now needs:

```bash
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

`prism-engine` and `prism-admin` already had these (Supabase Auth). Add them
to `prism-mcp-server`'s environment too — it now also needs the service role
key to reach `prism_*` tables (no user session there, it authenticates via
`PRISM_API_KEY` instead, same as before).

`COSMOS_GREMLIN_ENDPOINT` / `COSMOS_GREMLIN_KEY` are gone; `USE_GREMLIN_RANKING`
is kept as-is (still `true`/`false`, still defaults to `false`) — it now
gates a Postgres query, not a Gremlin one.

## Architecture decisions made during the port

- **Access pattern:** every Prism route used to get an unfiltered,
  privileged Mongo handle from `getCollection()` and do its own `userId`
  filtering in application code — there was no DB-level authorization.
  `getPrismDb()` preserves that: it returns a **service-role** Supabase
  client that bypasses RLS, and `prism_*` tables have RLS enabled with a
  service-role-only policy (blocks the anon/authenticated PostgREST API,
  same defensive posture as `webhook_events` already had). This was a
  deliberate choice to keep the migration mechanical — moving to real
  per-row RLS is a separate, larger change.
- **IDs:** Mongo `ObjectId` → Postgres `uuid` (`gen_random_uuid()`) for
  every table except `prism_api_keys`, `prism_components`, and
  `prism_generations`, which kept their original app-generated string IDs
  (`key_<hex>`, `comp_<hex>`, `gen_<hex>`) since those were never Mongo
  ObjectIds in the first place.
- **Column aliasing:** most `.select()` calls alias `id → _id` and
  `snake_case → camelCase` (e.g. `.select("_id:id, companyName:company_name")`)
  so the JS objects returned by Supabase keep the same shape the Mongo
  documents had. This kept the diff mechanical — most downstream
  response-shaping code didn't need to change, only the query construction.
- **Nested objects** (brand `colors`/`typography`/`voice`/`imagery`/`spacing`,
  skill `steps`) became `jsonb` columns rather than being normalized into
  their own tables — matches the existing convention elsewhere in this
  schema (`Project.metadata`, `Task.metadata`, etc.) and avoids a much
  larger schema-design exercise for data that was always treated as a
  single blob.
- **pgvector:** `prism_videos.embedding vector(1536)` + an ivfflat index is
  provisioned per the architecture assessment's recommendation, but **no
  route currently uses it** — the video-transcript embedding/semantic-search
  feature was already disabled pre-migration (see the comment in the old
  `prism-mcp-server/src/index.ts`: "Video transcript search utilities
  removed - will be re-implemented in Phase 3 with Azure OpenAI"). Wiring
  it up is future work, not part of this port.
- **Gremlin graph replacement:** `getRulesByProject`/`getRelatedRules`/
  `getConflictingRules`/`getRulesByTags` are reimplemented in
  `packages/db/src/prism.ts` against `prism_rules`/`prism_rule_edges`. Tag
  overlap no longer needs a graph hop at all — it's a GIN-indexed array
  query directly on `prism_rules.tags`.

## Pre-existing bugs fixed opportunistically during the port

The Cosmos collections were schemaless, so several inconsistencies had
accumulated across different code paths that all claimed to touch "the same"
data. Postgres's `NOT NULL`/FK/CHECK constraints don't tolerate this, so
these had to be resolved one way or another. Fixed, not silently ignored:

1. **`rules` owner field:** most of the app used a `createdBy` field to mean
   "who owns this rule," but `apps/prism-engine/src/app/api/mcp/stdio/route.ts`'s
   `create_rule`/`list_rules`/`update_rule`/`delete_rule` MCP tool handlers
   (and `apps/prism-mcp-server/src/lib/rule-generator.ts`) used a `userId`
   field instead — a different field, same collection, same document shape
   intent. This meant rules created via the MCP tools were invisible to the
   dashboard/REST API and vice versa. Standardized on `created_by`
   everywhere; `prism_rules` has one owner column now.
2. **`users` collection was effectively dead.** Nothing in the visible
   codebase ever inserted into Cosmos's `users` collection — `apps/prism-admin`'s
   `admin/users` page therefore always rendered an empty table in production,
   and the notification-preferences route (`/api/notifications`) was reading/
   writing a collection with an inconsistent key (`supabaseId` vs. `_id`
   depending on the call site). Folded into the existing `user_profiles`
   table instead of creating a parallel `prism_users` table — added
   `status` and `notification_prefs` columns. `user_profiles.id` already IS
   the Supabase auth user id used everywhere else in Prism, so this is a
   straightforward consolidation, not new architecture. **Behavior change:**
   `apps/prism-admin`'s user list now shows every `user_profiles` row across
   the whole monorepo (agency + Prism), not a Prism-only, always-empty list.
   `overrideUserTier` writes to `user_profiles.tier`, which is a **different**
   column from the one the rest of Prism actually reads tier from
   (`prism_subscriptions.tier`) — that disconnect predates this migration
   (the admin control and the tier-resolution logic were already reading from
   two different Cosmos collections) and is not fixed here; it's a product
   question for a follow-up ticket, not something safe to silently "fix" by
   guessing which one is supposed to be authoritative.
3. **Stray untyped `id` field:** `saveRulesToCosmos` (now `saveRulesToDb`,
   `apps/prism-mcp-server/src/lib/rule-generator.ts`) wrote a second,
   non-primary-key `id: "scan-<timestamp>"` string field alongside Mongo's
   own `_id` — nothing ever read it. Dropped; it wasn't a valid UUID anyway.
4. **`rules.isPublic` filter that never matched anything:**
   `apps/prism-mcp-server/src/index.ts`'s `ListResourcesRequestSchema`
   handler queried `rules.find({ isPublic: true })`, but no insert path
   anywhere ever set `isPublic` on a rule document (that's a `ruleSets`
   field, not a `rules` one) — this MCP resource list always returned
   empty in production. `prism_rules` has no `is_public` column for the
   same reason; the handler now returns an empty list directly with a
   comment explaining why, rather than inventing a column nothing needs.
5. **Demo/seed data assumed no FK constraints.** `seed-keandrew.ts` tagged
   its Cosmos documents with a literal `userId: "demo-user"` string and left
   the rules/components owner fields unset entirely. Postgres requires a
   real `uuid` FK'd to `user_profiles` for all three tables now, so the
   script creates/reuses one real demo Supabase auth user and uses its id
   consistently. It also remapped the demo rules' categories (`"design"`,
   `"component"`, `"voice"`) onto the enum `prism_rules.category` now
   enforces — Mongo never validated that enum at the database level, only
   the `/api/v1/rules` Zod schema did, and this seed script bypassed it by
   writing directly to the collection.

## What's still on the old naming / needs a follow-up look

- `USE_GREMLIN_RANKING` env var and the `gremlin-ranking.ts` filename/exports
  (`DEFAULT_GREMLIN_CONFIG`, etc.) were kept as-is rather than renamed, to
  avoid an unrelated churn on top of an already-large diff. The
  implementation underneath is 100% Postgres now — see the file's header
  comment.
- `.agent/rules/*.md`, `.agent/skills/*.md`, `.github/copilot-instructions.md`,
  and `apps/syntaxure-pm`'s `/docs/architecture` and `/docs/database` pages
  still describe Cosmos DB (and in several cases an even older, already-stale
  architecture generation — `@azure/cosmos` SDK usage, Clerk auth, Firestore
  — that predates even the Mongo-API version this migration replaced). These
  weren't rewritten here: doing it properly means auditing what's actually
  current beyond just the Cosmos references, which is its own task.
- The usage counter in `/api/generate`'s `trackGeneration()` went from an
  atomic Mongo `$inc` upsert to a read-then-write against Postgres (Supabase
  JS has no atomic increment without a raw RPC function). Low-stakes — it's
  a soft usage counter behind a tier-limit check that already ran before
  this — but technically no longer race-free under concurrent requests from
  the same user.

## Verification status

**Not run against a live database** — there is no reachable Postgres
instance in this environment to run `prisma generate`, apply the migration,
or exercise the routes against. Before merging:

1. `pnpm --filter @syntaxure-labs/db run prisma:generate` against a real
   `DATABASE_URL` to confirm `schema.prisma` is valid and matches the SQL
   migration.
2. Apply `supabase/migrations/20260813000001_prism_context_engine.sql` to a
   dev Supabase project (or `supabase db reset` locally if the CLI is
   available) and confirm it runs clean.
3. `pnpm --filter prism-engine run check-types`, `pnpm --filter prism-admin run check-types`,
   `pnpm --filter prism-mcp-server run check-types` — these were **not**
   run in this session either (no working Node/pnpm install verified against
   this exact change set); do this before merging.
4. Smoke-test at minimum: sign in → create a project → create a rule →
   MCP `get_architectural_rules` → PayPal webhook idempotency path.
