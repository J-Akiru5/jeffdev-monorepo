# Prism Session Report - Handoff for Code Review

Date: 2026-08-23
Branch state: all work on `develop` (`3eb1236`), pushed. `main` @ `6b92635`,
`staging` @ `46e6abd`. Guard pack NOT yet promoted to main/staging - held for
this review.

---

## 1. What happened (three work streams)

### Stream A - E2E verification of the Prism chain (Aug 24 task, done Aug 22-23)

Ran the complete chain (prism init -> rules.json -> Claude Code PostToolUse
hook) on genuinely clean Next.js 16 + Tailwind 4 projects outside the
monorepo, before and after fixes. Full transcripts live in
docs/prism-e2e-verification-2026-08-24.html.

Findings that were fixed:

- F1: generated rules shipped severity "warn" while hook mode only surfaces
  "block" findings -> the Pass was a silent no-op during real agent runs.
- F2: generated required_token rule applied to .css, flagging the tokens' own
  definition lines in globals.css.

Fixes (generation policy only - engine/hook/schema untouched):

- packages/prism-context-engine/src/init/generate-rules.ts: token rule now
  ships block, scoped to TOKEN_RULE_EXTENSIONS [.tsx .jsx .ts .js .html];
  arbitrary_value stays warn.
- Regression tests added (generate-rules.test.ts, commands/init.test.ts).

### Stream B - npm publish as @prism-engine/cli@1.2.0

- Renamed package prism-context-engine -> @prism-engine/cli (v1.2.0), commit 0820032. CRITICAL REVIEW POINT: two hardcoded strings referenced the old
  name, which has NEVER existed on npm (would 404 on every cold install):
  - src/init/hook.ts HOOK_COMMAND (written into users' .claude/settings.json)
  - src/commands/ide-setup.ts MCP config args (+ 3 test expectations updated)
    Both now say "@prism-engine/cli". Reviewer: confirm no other stale
    self-references (grep found serve.ts serverInfo name "prism-context-engine"
  - left intentionally, cosmetic MCP protocol identifier).
- Merges: feat/prism-pass -> develop (fb8b288), develop -> main (6b92635),
  main -> staging (46e6abd). Zero conflicts, no force-push anywhere.
- Published to npm manually (no CI publisher exists - see known gaps).
  Cold-install verified from an empty npx cache: npx fetches 1.2.0, init
  works against a scratch project, hook blocks a violating write with exit 2.
  Transcript in docs/prism-publish-1.2.0-2026-08-24.html section 06.

### Stream C - Solidity deep scan + demo-week guard pack

Deep scan persisted at docs/prism-solidity-deep-scan-2026-08-23.md (dcc2fe1).
Guard pack implemented from its critical list: commit 3eb1236, 8 files,
+101/-0 lines. THIS IS THE PRIMARY REVIEW TARGET - see section 3.

Also: repo hygiene - stray root .md files categorized into docs/
(232dc2a + b22f781); staging synced to mirror main; live probe confirmed
https://prism.syntaxure.dev serves the Pass API (401 unauthenticated).

---

## 2. Commit index (oldest first)

| Commit           | Branch          | Content                                  |
| ---------------- | --------------- | ---------------------------------------- |
| 0820032          | feat/prism-pass | package rename + dead-command fixes      |
| fb8b288          | develop         | merge feat/prism-pass                    |
| 6b92635          | main            | merge develop                            |
| 46e6abd          | staging         | merge main into staging (mirror restore) |
| 232dc2a, b22f781 | develop         | docs categorization + reference fixes    |
| dcc2fe1          | develop         | deep scan document (markdown only)       |
| 3eb1236          | develop         | GUARD PACK - review focus                |

---

## 3. PRIMARY REVIEW: guard pack 3eb1236

Every change is additive (no deletions). Per file, what changed and what to
scrutinize:

### apps/prism-engine/src/lib/api-auth.ts

- Both tier lookups (API-key path and Supabase-session path) now filter
  `.in("status", ["active", "trialing"])`.
- WHY: previously a cancelled/past_due subscription still granted its paid
  tier on every v1/API-key path, contradicting getUserTier() in
  subscriptions.ts which always filtered correctly.
- REVIEW QUESTIONS: (a) any legitimate flow relying on cancelled->paid?
  (expected answer: no - dashboard already used the filtered semantics);
  (b) prism_subscriptions.user_id is UNIQUE so at most one row - confirm.

### apps/prism-engine/src/app/api/v1/rules/route.ts (POST)

- When body.projectId is present: SELECT id FROM prism_projects WHERE id=? AND
  user_id=auth.userId BEFORE insert; 404 if no row.
- WHY: cross-tenant injection - the CLI pass endpoint serves rules purely by
  project_id, so an unverified projectId lets a caller plant rules inside
  another user's project payload.
- REVIEW QUESTION: rules.created_by is set to auth.userId independently -
  confirm no flow intends "create rule into someone else's project".

### apps/prism-engine/src/app/api/v1/skills/route.ts (POST)

- Same ownership guard, same rationale (skills have identical exposure).

### apps/prism-engine/src/app/api/mcp/stdio/route.ts

- create_rule case: same ownership guard when args.projectId present
  (userId here comes from the session established earlier in this handler).
- generate_component case: NEW strict burst cap
  checkRateLimit(`ai:mcp-generate:${userId}`, "strict") = 10/min per user.
  This tool previously bypassed the monthly aiGenerations quota entirely.
- Import added: @/lib/rate-limit.

### apps/prism-mcp-server/src/lib/rule-generator.ts (saveRulesToDb)

- Ownership SELECT before INSERT; throws "Project not found or not owned by
  this user". Caller (tools/prism-scan.ts:115-119) already wraps in try/catch
  and degrades to a warning step - verify that UX is acceptable.

### apps/prism-engine/src/app/api/v1/projects/[id]/rules/pass/route.ts

- NEW rate limit: checkRateLimit(`pass:${auth.userId}`, auth.tier).
  Free=20/min, pro=120/min (packages/redis TIER_LIMITS, sliding window).
- WHY: this is the only v1 route without any limit; ~4 DB ops/hit including a
  last_used_at write per hit.
- REVIEW QUESTION: CLI pull makes 1-2 calls/run - safe. But any client that
  polls aggressively will now get 429s; acceptable tradeoff (fail-open if
  Upstash is unreachable - pre-existing behavior).

### apps/prism-engine/src/app/api/v1/rules/extract/route.ts

- NEW strict cap (10/min flat, all tiers) immediately after authenticate().
  This endpoint calls the LLM per request and had NO quota/burst/tier gate.

### apps/prism-engine/src/app/api/generate/route.ts

- NEW burst ceiling checkRateLimit(`generate:${userId}`, tier) placed AFTER
  getUserTier and BEFORE the monthly-quota check. Monthly quota itself is
  unchanged (known race documented in scan, not fixed this week).

---

## 4. Verification already performed

- pnpm --filter prism-engine run check-types -> clean
- pnpm --filter prism-engine run test -> 53 passed
- pnpm --filter prism-mcp-server run build + test -> clean, 132 passed
- eslint on all 8 touched files -> 0 errors (1 pre-existing turbo env warning)
- Full prism-context-engine suite -> 126 passed (rename + generation policy)
- Cold-install E2E from registry -> pass (see publish report section 06)

## 5. What the reviewer should verify manually

1. `git diff dcc2fe1..3eb1236 -- apps/prism-engine apps/prism-mcp-server`
   - the entire guard pack is contained there
2. Grep for leftover old-name references:
   `git grep -n "npx prism-context-engine"` -> expect zero hits in src/dist
3. Confirm dist/ shipped to npm matches src (tarball sha512 in publish report)
4. After promotion: watch the Vercel deploy, then re-run the cold-init smoke
   against prod and confirm a violating write still blocks with exit 2
5. PayPal: determine which webhook URL is registered (engine's verified+
   idempotent handler vs admin's skip-if-unset copy) - cannot be answered
   from the repo

## 6. Known issues deliberately NOT fixed (accepted risk until post-demo)

Full ranked list: docs/prism-solidity-deep-scan-2026-08-23.md. Headlines:

- TIER_LIMITS projects/rules/teamMembers enforced nowhere; pricing copy
  contradicts enforcement constants ($18 vs $12, 5 vs 10 rules)
- Admin tier overrides write user_profiles.tier while engine enforces
  prism_subscriptions.tier - admin grants are currently inert
- Two PayPal webhooks exist; admin's skips signature verification when
  PAYPAL_WEBHOOK_ID is unset and has no event dedupe
- /api/generate monthly quota is non-atomic read-modify-write and pre-charges
  failures
- FK-less created_by columns (orphaned rows on user deletion); missing
  composite index (project_id, is_active, priority); paypal_subscription_id
  not UNIQUE; no teams/seats infra despite being sold
- No CI npm publishing exists; release.yml only opens a Changesets Version PR
- Monitoring: admin "System Operational" dot is hardcoded; Sentry misses
  handled 500s (~53 console.error sites); phased remediation plan in scan doc

## 7. Pending decision (owner: Jeff)

Promote guard pack: merge develop -> main (triggers Vercel prod deploy), then
main -> staging to restore the mirror. Held until this review passes.
