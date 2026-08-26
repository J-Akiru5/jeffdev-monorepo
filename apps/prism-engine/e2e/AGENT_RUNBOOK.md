# Runbook: Running the Prism Migration E2E Suite

**Audience:** an AI coding agent (OpenCode, DeepSeek, or any other) running
this on the user's behalf, in an environment that has real network access
and real Supabase credentials. Follow this top to bottom, in order. Don't
skip the verification step after each command — several steps are useless
to run if the previous one silently failed.

**What this proves:** that `apps/prism-engine` reads and writes real data
in Postgres (Supabase) correctly, after the Cosmos DB → Postgres migration
described in [`PRISM_MIGRATION.md`](../../../../docs/prism/PRISM_MIGRATION.md) in docs/prism/
root. It signs in, creates a project, creates a rule, reads that rule back
three different ways (dashboard reload, REST API, MCP tool call), and
checks the PayPal webhook's signature/idempotency handling.

---

## 0. Preconditions — confirm these before doing anything else

Run this checklist. If any answer is "no," stop and fix that first; every
later step assumes these are true.

- [ ] You're in the repo root, on the branch/commit that has this
      migration (`git log --oneline -1` should show a Prism/Postgres
      migration commit, or something after it).
- [ ] `pnpm install` has been run in docs/prism/ root (or run it now:
      `pnpm install`).
- [ ] You have a **real, working** `NEXT_PUBLIC_SUPABASE_URL` and
      `SUPABASE_SERVICE_ROLE_KEY` for the Supabase project this
      environment actually points at. These are secrets — read them from
      wherever the user's secret store is (`.env.local`, Doppler, CI
      secrets), never ask the user to paste them into chat, never print
      `SUPABASE_SERVICE_ROLE_KEY`'s value in any output you produce.
- [ ] You know the base URL you're testing: a real deployed URL (e.g.
      `https://prism.syntaxure.dev`) or `http://localhost:3001` if you're
      going to run the dev server yourself.
- [ ] The target Supabase project already has the migration applied:
      `supabase/migrations/20260813000001_prism_context_engine.sql`. If
      you're not sure, run this and confirm it returns rows, not an error:
      `bash
  # from repo root, needs the Supabase CLI logged in and linked, OR
  # run the equivalent query in the Supabase SQL Editor
  supabase db execute --sql "select table*name from information_schema.tables where table_name like 'prism*%' order by 1;"
  `    Expect to see:`prism_api_keys`, `prism_brands`, `prism_components`,
    `prism_generations`, `prism_governance_memory`, `prism_projects`,
    `prism_rule_edges`, `prism_rule_sets`, `prism_rules`,
    `prism_skills`, `prism_subscriptions`, `prism_telemetry`,
    `prism_usage`, `prism_videos` (14 tables). If this list is empty or
  errors, **stop** — the migration SQL hasn't been applied to this
  database yet, and nothing below will work. That's a prerequisite the
  user needs to handle (running the migration file), not something
  this test suite fixes.

---

## 1. Install the Playwright browser binary

```bash
pnpm --filter prism-engine exec playwright install chromium
```

This downloads ~300MB once. Expect output ending in something like
`Chromium ... downloaded to ...`. If this fails with a network/permission
error, that's an environment issue to resolve before continuing — the
tests cannot run without it.

## 2. Provision the disposable test account

**Do not use the user's personal or founder account for this.** Use the
provisioning script — it creates one dedicated, clearly-labeled test
account (`e2e-test@prism.syntaxure.dev` by default) with a `pro`-tier
subscription (required — a free-tier account gets a 403 from the MCP step
regardless of whether the migration works, so this isn't optional).

```bash
cd apps/prism-engine
pnpm run e2e:create-test-user
```

Load the real Supabase env vars first however this environment expects
(e.g. `dotenv -e .env.local -- pnpm run e2e:create-test-user`, or export
them into the shell — match whatever convention the rest of this repo's
scripts already use, don't invent a new one).

**Expected output** ends with:

```
🎉 E2E test account ready.
   Email:    e2e-test@prism.syntaxure.dev
   Password: (written to .env.e2e.local, not printed here)

Run the suite with:
   dotenv -e .env.e2e.local -e .env.local -- pnpm --filter prism-engine run test:e2e
```

This also writes `apps/prism-engine/.env.e2e.local` — gitignored, contains
the generated password. **Never** `cat` this file into your output/report
to the user; its existence and that provisioning succeeded is all that
needs reporting. **Never** `git add` it — check `git status` stays clean
of it before finishing.

## 3. Set the base URL and run the suite

```bash
cd apps/prism-engine
E2E_BASE_URL="<the real URL you're testing>" \
  dotenv -e .env.e2e.local -e .env.local -- pnpm run test:e2e
```

Replace `<the real URL you're testing>` with the actual deployed URL, or
omit `E2E_BASE_URL` entirely to default to `http://localhost:3001` (in
which case Playwright will start the dev server for you — give it up to
2 minutes to boot on first run).

### Reading the result

Playwright prints a pass/fail summary. What to look for, in priority order:

1. **`sign in redirects to the dashboard`** — if this fails, nothing else
   in the suite is meaningful; the credentials or the app's auth path is
   broken, not the migration. Check the screenshot Playwright saves on
   failure (`test-results/.../test-failed-1.png`) before assuming
   anything about the database layer.
2. **`create a project` / `create a rule`** — failures here are writes to
   `prism_projects`/`prism_rules` not working. Check the error text in the
   Playwright report for an actual Postgres/PostgREST error message (often
   surfaced in the page's toast notification, which the trace/screenshot
   will show).
3. **`rule is readable via the dashboard project page after a fresh load`**
   — failing _only_ this one (while creation passed) points at a read-path
   bug specifically, since the write clearly worked.
4. **`rule is readable via the REST API`** and **`MCP get_architectural_rules...`**
   — these hit `/api/v1/rules` and `/api/mcp/stdio` directly. If the UI
   steps pass but these fail, the bug is specifically in those two route
   handlers, not the dashboard.
5. **PayPal `rejects a request with no/invalid signature headers`** —
   this one has no external dependency and should always pass. If it
   fails, something changed in the webhook route's auth-check ordering —
   treat it seriously, it's a security regression test, not a feature test.
6. **PayPal signed-event idempotency test** — skips itself automatically
   unless `PAYPAL_TEST_EVENT_JSON`/`PAYPAL_TEST_SIGNATURE_HEADERS_JSON` are
   set. A "skipped" result here is expected and fine; don't try to force
   it to run without a real captured PayPal fixture (see the main
   [`e2e/README.md`](./README.md) if the user specifically wants this
   covered too).

View the full HTML report for failure details:

```bash
pnpm --filter prism-engine exec playwright show-report
```

## 4. Clean up

The suite deletes the test project/rule it created via its own
`afterAll` hook. As a backstop (e.g. if a test crashed before that hook
ran), tear down the whole test account — this cascades and removes
anything left over:

```bash
cd apps/prism-engine
dotenv -e .env.local -- pnpm run e2e:delete-test-user
```

Confirm `git status` in docs/prism/ root shows nothing new/untracked before
finishing (no `.env.e2e.local`, no `playwright-report/`, no `test-results/`
— all should be gitignored, but verify rather than assume).

---

## Troubleshooting

| Symptom                                                                                     | Likely cause                                                                                        | What to do                                                                                        |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `playwright install` fails                                                                  | No network access, or disk space                                                                    | Not fixable from within the test run — surface this to the user as an environment problem         |
| Every test fails immediately with a connection error                                        | `E2E_BASE_URL` unreachable, or dev server didn't boot                                               | `curl -I <E2E_BASE_URL>` first to confirm it's actually up before blaming the tests               |
| `create-e2e-test-user` errors with "Missing NEXT_PUBLIC_SUPABASE_URL..."                    | Env vars not loaded in this shell                                                                   | Re-check step 0 — this is a credentials-loading problem, not a code problem                       |
| `sign in` step times out waiting for `/dashboard`                                           | Wrong password (account already existed with a different one)                                       | Re-run `pnpm run e2e:create-test-user` — it resets the password on an existing account            |
| `create a project` fails with a 500 / Postgres error visible in the trace                   | The `prism_*` migration SQL likely isn't applied to this database, or RLS/service-role key is wrong | Go back to precondition 0 — re-verify the 14 tables exist                                         |
| MCP step 403s with "Upgrade to Pro"                                                         | Test account wasn't actually granted `pro` tier                                                     | Re-run `pnpm run e2e:create-test-user` (upserts the subscription every time)                      |
| Everything passes except PayPal idempotency (not the rejection test — the signed-event one) | Expected if no fixture was provided                                                                 | Not a failure — it's a skip. Only chase this if the user explicitly asked for PayPal coverage too |

---

## What to report back to the user

A short summary, not a full log dump:

1. Pass/fail count (e.g. "7/8 passed, 1 skipped as expected").
2. For any **failure**: which step, and the one-line reason from the
   Playwright output — not speculation, the actual error text.
3. Confirm the test account was torn down (or explicitly note it wasn't,
   and why, so the user can clean it up themselves).
4. Confirm no secrets or `.env.e2e.local` ended up in `git status` or in
   anything you're about to show the user.
