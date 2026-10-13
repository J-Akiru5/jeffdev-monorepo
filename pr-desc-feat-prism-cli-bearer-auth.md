# PR: feat/prism-cli-bearer-auth

## Summary

Adds Bearer token authentication support to the Prism CLI's HTTP client layer (`packages/prism-context-engine/src/api.ts`) and wires it into the `sync`, `connect`, `doctor`, `brands`, and `api-keys` commands. The `pull` command retains the existing `x-api-key` header path.

## What Changed

### Client-side (CLI)

- **`packages/prism-context-engine/src/api.ts`**: New `apiFetch()` helper that conditionally attaches `Authorization: Bearer <token>` when a token is present.
- **`packages/prism-context-engine/src/commands/sync.ts`**: Sends `Authorization: Bearer` header for sync requests.
- **`packages/prism-context-engine/src/commands/connect.ts`**: Sends `Authorization: Bearer` to `/api/auth/verify`.
- **`packages/prism-context-engine/src/commands/doctor.ts`**: Sends `Authorization: Bearer` to `/api/api-keys/verify`.
- **`packages/prism-context-engine/src/commands/brands.ts`**: Uses `apiFetch()` for brand operations.
- **`packages/prism-context-engine/src/commands/api-keys.ts`**: Uses `apiFetch()` for key management.

### Server-side (prism-engine)

- **`apps/prism-engine/src/lib/api-auth.ts`**: No changes to `authenticate()`. The x-api-key path remains byte-identical. The function still only reads `x-api-key` header and Supabase session cookies — it does not parse `Authorization: Bearer`.
- **CORS config** (`apps/prism-engine/src/lib/supabase/middleware.ts`): Already allows `Authorization` in `Access-Control-Allow-Headers`.

### What was NOT changed

- `authenticate()` in `api-auth.ts` — the x-api-key lookup path is untouched.
- All `/api/v1/*` route handlers — they continue to use `authenticate()` unchanged.
- The `pull` command — it still sends `x-api-key`, not Bearer.

## Known Issue / Follow-up Required

**The server does not yet parse `Authorization: Bearer` tokens from the `authenticate()` function.** The CLI sends Bearer tokens to endpoints that either:

1. Use `authenticate()` (which ignores `Authorization` header) — falls through to Supabase cookie auth, which fails for non-browser callers.
2. Use Supabase session cookies directly (`/api/auth/verify`, `/api/mcp/stdio`) — ignores the header entirely.
3. Read the key from the POST body (`/api/api-keys/verify`) — header is ignored.

This means the Bearer token sending on the client side is a **preparatory change** — the server-side parsing of `Authorization: Bearer` in `authenticate()` is needed to complete the feature. Without it, `sync`, `connect`, `doctor`, `brands`, and `api-keys` commands that send Bearer tokens will fail unless the user also has a valid Supabase session cookie.

**Recommendation:** Add a third code path in `authenticate()` that checks `Authorization: Bearer <token>`, validates the token against `prism_api_keys` (or a new token table), and returns the auth result. This is the critical missing piece.

## Testing

- The E2E test cycle (login/whoami/link/pull/check/logout) was run manually during the demo.
- `prism pull` (x-api-key path) works correctly — confirmed byte-identical.
- Other CLI commands (`sync`, `connect`, `doctor`) send Bearer tokens but depend on Supabase session cookies for server-side auth. If no session exists, these commands will fail with 401.

## Context

This PR was part of the 2026-08-23 demo preparation. The architectural review (post-demo readiness investigation) confirmed:

- x-api-key path is byte-identical in `authenticate()` — no regression.
- The feature branch was merged into `develop` with zero diff on `api-auth.ts`.
- The Bearer auth feature is a **client-side preparatory change**; server-side parsing is the follow-up work.

## Files Changed

| File                                                     | Change                                |
| -------------------------------------------------------- | ------------------------------------- |
| `packages/prism-context-engine/src/api.ts`               | Added `apiFetch()` with Bearer header |
| `packages/prism-context-engine/src/commands/sync.ts`     | Bearer header for sync                |
| `packages/prism-context-engine/src/commands/connect.ts`  | Bearer header for connect             |
| `packages/prism-context-engine/src/commands/doctor.ts`   | Bearer header for doctor              |
| `packages/prism-context-engine/src/commands/brands.ts`   | Bearer header for brands              |
| `packages/prism-context-engine/src/commands/api-keys.ts` | Bearer header for api-keys            |
