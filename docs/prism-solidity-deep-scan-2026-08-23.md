# Prism System Solidity - Deep Scan (2026-08-23)

Scope: apps/prism-engine (+ Supabase schema), packages/redis rate limiting,
prism-admin observability reflection. Three parallel research tracks,
consolidated and ranked. Read-only scan - no code changed.

## 0. Verified healthy

- https://prism.syntaxure.dev is live and serving the Pass API
  (GET /api/v1/projects/[id]/rules/pass returns 401 Unauthorized when anonymous).
- Prod deploy picked up the Aug 23 main merge (route exists server-side).
- Core relational skeleton is sound: projects/rules/edges, brands, api_keys
  (hashed + indexed), subscriptions UNIQUE(user_id); all 14 prism tables have
  RLS enabled service-role-only; migrations are idempotent, correctly ordered.

## 1. CRITICAL - fix before Wednesday if possible

### 1.1 Cross-tenant rule/skill injection

POST /api/v1/rules takes projectId from the body and inserts WITHOUT checking
the project belongs to the caller (api/v1/rules/route.ts:134-147). Same hole:
/api/v1/skills (:126-137), MCP create_rule (mcp/stdio/route.ts:988,1006),
prism-mcp-server saveRulesToDb (rule-generator.ts:146). Since the pass
endpoint pulls purely by project_id, a crafted rule can land inside another
user's project payload. POST /v1/projects/[id]/rules already verifies
ownership (:105-111) - copy that pattern into all four paths. Small diff.

### 1.2 Cancelled subscribers keep paid tier

authenticate() resolves tier with only eq(user_id) - no status filter
(api-auth.ts:36-44, 61-66). getUserTier() filters active+trialing correctly
(subscriptions.ts:194-199). All v1/API-key paths trust the leaking one.

### 1.3 Unmetered AI spend

- POST /api/v1/rules/extract: authenticated only, no quota/burst/tier gate.
- MCP generate_component (mcp/stdio/route.ts:1150-1177): ideSync gate then unlimited.
- POST /api/generate: quota is non-atomic read-modify-write (race bypasses cap)
  and PRE-charges failures (trackGeneration before the AI call, :152).

### 1.4 CLI hot path unprotected

GET /v1/projects/[id]/rules/pass is the only v1 route without checkRateLimit;
unpaginated, no-store, ~4 DB ops/hit incl. a last_used_at write per hit
(api-auth.ts:32-35). One subscriber polling 1/sec = ~350k Supabase ops/day.

## 2. HIGH - this week if possible

### 2.1 Marketing copy contradicts enforcement

Seed pricing says Free=5 rules / Pro $18 / 10 projects; code enforces
Free=10 rules / Pro $12 / 5 projects (subscriptions.ts:39-68 vs
pricing_plans.sql:163-178). TIER_LIMITS projects/rules/teamMembers are
enforced NOWHERE (only apiKeys count and aiGenerations are).

### 2.2 Two billing truths (engine vs admin)

Engine enforces prism_subscriptions.tier; prism-admin overrideUserTier writes
user_profiles.tier (actions/users.ts:22-25), and admin has its OWN PayPal
webhook updating the same wrong column - signature verification SKIPPED when
PAYPAL_WEBHOOK_ID unset (:23-28), NO idempotency. Admin tier grants silently
do not change what the product enforces. Which webhook URL PayPal actually
calls must be checked in the PayPal dashboard.

### 2.3 Orphaned rows on user deletion

created_by columns on prism_rules / prism_skills / prism_rule_sets have NO FK
(migration :65-95 etc.; sentinel rationale obsolete). Deleting a user leaves
their rules forever, invisible to every list query. Project DELETE cleans
rules but skills merely get project_id SET NULL and accumulate orphaned.

### 2.4 Missing composite index for the hottest query

pass endpoint filters project_id AND is_active ORDER BY priority; schema has
only single-column indexes. Add (project_id, is_active, priority, created_at).

## 3. MEDIUM

- TOCTOU mutations: ownership checked on SELECT but UPDATE not re-scoped by
  user_id (v1/projects/[id]/route.ts:87-102, rules/:127-141, skills/, brands/).
- Non-atomic usage counter (trackGeneration) - needs an RPC increment.
- Check-then-insert races: slug uniqueness pre-check (raw 500 on race);
  marketplace install dedupe has no DB unique constraint backstop.
- paypal_subscription_id not UNIQUE; webhook upsert errors swallowed.
- prism_usage written as zeros by engine's PayPal handler - quotas drift.
- No teams/seats infra despite teamMembers:10 being sold.
- Mixed TEXT vs UUID PKs; no updated_at triggers on prism tables; month
  bucketing uses server-local time vs TIMESTAMPTZ elsewhere.
- Cache-Control public max-age=1800 on private rule listings.
- Unbounded growth: prism_telemetry (no retention), governance_memory
  expires_at never purged, videos.embedding provisioned but unused.
- Untyped access everywhere: SupabaseClient<any,any,any>; no generated DB types.

## 4. Migration hygiene

- DDL header claims routes use Prisma; runtime uses Supabase JS service-role.
- schema.prisma cites files that do not exist; enum naming mismatch vs CHECK.
- PRISM_MIGRATION.md admits migrations were never verified against a live DB
  when authored. Idempotency itself is good.

## 5. Monitoring -> prism-admin (phased)

Phase 1 (demo-safe, ~1 day, read-only):

- Engine Health page in admin: ping /api/health server-side, replace the
  HARDCODED "System Operational" dot (admin/dashboard/page.tsx:114-117).
- Prism subscribers view over prism_subscriptions joined user_profiles.
- Failed webhook_events feed = ready-made billing incident list.
- Add DB roundtrip probe to /api/health; stop swallowing errors in
  api/subscriptions GET (an outage currently looks like "everyone is Free").
  Phase 2: repoint admin tier override at prism_subscriptions; consolidate to
  ONE canonical PayPal webhook (engine's, which verifies + dedupes); Sentry into
  prism-admin; webhook ops view; subscriber drill-down.
  Phase 3: uptime history (Vercel cron pinging health), structured logging +
  log drain, alert routing via existing n8n relay.

## 6. Rate limiting per subscriber (options)

Option 1 (half day, demo-safe): add checkRateLimit to pass route, [id] routes,
rules/extract ("strict"), MCP generate_component, /api/generate burst.
Option 2 (2-4 days): route-class contexts read/write/ai keyed strictly by
userId (3 fair aggregate buckets); fix authenticate() status leak; atomic
Postgres RPC for monthly quota; enforce resource caps on create routes.
Option 3 (post-revenue): persist throttle events for admin visibility,
middleware.ts IP floor, Retry-After headers, degraded-flag alerting.
Note: Upstash Analytics already charts allowed/throttled per prefix today -
zero-code visibility for the 4 protected routes.

## 7. Suggested sequencing

Wed demo guard: 1.1, 1.2, 1.3(strict caps), 1.4, Phase-1 monitoring.
Fast-follow week: 2.x + Option 2 rate limits + typed DB client + migration
for FKs/index/constraints. Post-revenue: Phase 3 + Option 3 + retention jobs.
