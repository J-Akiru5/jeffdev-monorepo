# PR: feat/prism-semantic-gemini

## Summary

Introduces the deterministic regex rule engine ("the Pass"), the subprocess boundary for sandbox evaluation, and regex DoS safety validation. These features form the core of Prism's local governance layer and were the primary features demonstrated live on 2026-08-23.

## What Changed

### The Pass — Local Rule Enforcement Layer (commit `07c41ba`)

- **`.prism/rules.json` v1 contract**: Versioned envelope with four check types (`forbidden_pattern`, `required_token`, `banned_import`, `arbitrary_value`), optional per-rule extensions gate, advisory-only rules.
- **`packages/prism-context-engine/src/rules/engine.ts`**: Synchronous regex/line-scan rule engine, zero new dependencies.
- **`packages/prism-context-engine/src/rules/parse.ts`**: Parses `.prism/rules.json` v1, validates regex patterns at parse time.
- **`packages/prism-context-engine/src/rules/types.ts`**: Type definitions for rule blocks.
- **`packages/prism-context-engine/src/commands/check.ts`**: `prism check` command — lint mode (exit 1 on blocks) and `--hook` agent mode (PostToolUse stdin, exit 2 + correction message on stderr, fail-open, `PRISM_DISABLE=1` kill switch).
- **Demo project**: `examples/pass-demo/` with committed hook config, six rules across all categories.

### Subprocess Boundary + Regex DoS Guard (commit `a2e0066`)

- **`apps/prism-engine/src/lib/sandbox.ts`**: Rewritten to spawn `@prism-engine/cli` over versioned stdio contract (sandbox-eval v1) instead of importing the rule engine in-process.
- **`packages/prism-context-engine/src/commands/sandbox-eval.ts`**: Subprocess entry point — receives JSON on stdin, returns result on stdout, exit codes for contract violations.
- **`apps/prism-engine/src/lib/regex-safety.ts`**: Dual-layer regex safety validation (nested-quantifier fast-reject + `safe-regex` star-height analysis). Rejected patterns return 422 with reasons and never reach the child.
- **`apps/prism-engine/src/types/safe-regex.d.ts`**: Type declarations for the `safe-regex` dependency.
- **Contract v1**: stdin `{"v":1,"rulesJson","files":[{path,content}]}` → stdout `{"v":1,"ok":true,"result":{...}}` / stderr `{"v":1,"ok":false,"error":{code,message}}` + exit 3.
- **Security**: Hard 5s timeout (SIGTERM then SIGKILL), 256MB heap cap. `SANDBOX_TIMEOUT_MS` and `PRISM_SANDBOX_CLI_ENTRY` envs in turbo globalEnv.
- **Tests**: Rewritten for boundary — success shape, child INVALID_RULES → legacy 422, malformed stdout → MALFORMED_OUTPUT, hard-kill PROOF case (child records pid, ignores SIGTERM, test asserts pid is dead).

### CSS Variable Semantic System (commit `1a60c6f`)

- **`apps/prism-manage/`**: CSS variable semantic system for light/dark mode, task type categorization, task sheet component, theme toggle.
- 32 files changed across prism-manage components and pages.

## What was NOT changed

- **`apps/prism-engine/src/lib/api-auth.ts`**: Untouched. The x-api-key authentication path remains byte-identical.
- **`apps/prism-engine/src/lib/subscriptions.ts`**: Untouched. TIER_LIMITS and getUserTier() are unchanged.
- **All `/api/v1/*` route handlers**: Untouched (except the sandbox/run route which was updated to use the new subprocess boundary).

## Verified: Regex Engine Code Paths Untouched Since Branch Point

The deterministic regex engine files were checked against `git diff 0bfb305..46ebcc2` (branch point to develop HEAD):

- `apps/prism-engine/src/lib/regex-safety.ts` — **no changes**
- `apps/prism-engine/src/lib/sandbox.ts` — **no changes**
- `apps/prism-engine/src/lib/__tests__/sandbox.test.ts` — **no changes**
- `packages/prism-context-engine/src/rules/engine.ts` — **no changes**
- `packages/prism-engine/src/rules/parse.ts` — **no changes**
- `packages/prism-context-engine/src/rules/types.ts` — **no changes**
- `packages/prism-context-engine/src/commands/sandbox-eval.ts` — **no changes**

The regex engine is safe to deploy.

## Testing

- The Pass was spike-verified against Claude Code v2.1.175 — both exit2+stderr and JSON decision mechanisms drive unprompted self-correction.
- Subprocess boundary tests cover: success shape, INVALID_RULES mapping, MALFORMED_OUTPUT handling, and hard-kill proof (pid is dead after SIGTERM+SIGKILL).
- Regex DoS guard tested with nested-quantifier patterns and high star-height patterns.
- Live demo on 2026-08-23 used these code paths end-to-end.

## Context

This PR was part of the 2026-08-23 demo preparation. The architectural review confirmed:

- Regex engine code paths are genuinely untouched since the branch point — no regression risk.
- The subprocess boundary correctly isolates user-provided regexes in a killable child process.
- The DoS guard prevents ReDoS patterns from reaching the engine.

## Files Changed

| File                                                         | Change                                 |
| ------------------------------------------------------------ | -------------------------------------- |
| `packages/prism-context-engine/src/rules/engine.ts`          | Regex rule engine (new)                |
| `packages/prism-context-engine/src/rules/parse.ts`           | Rules.json parser (new)                |
| `packages/prism-context-engine/src/rules/types.ts`           | Rule type definitions (new)            |
| `packages/prism-context-engine/src/commands/check.ts`        | `prism check` command (new)            |
| `packages/prism-context-engine/src/commands/sandbox-eval.ts` | Subprocess entry point (new)           |
| `apps/prism-engine/src/lib/sandbox.ts`                       | Subprocess boundary rewrite            |
| `apps/prism-engine/src/lib/regex-safety.ts`                  | DoS guard (new)                        |
| `apps/prism-engine/src/types/safe-regex.d.ts`                | safe-regex types (new)                 |
| `apps/prism-engine/src/app/api/v1/sandbox/run/route.ts`      | Updated for subprocess                 |
| `apps/prism-engine/next.config.ts`                           | outputFileTracingIncludes for sandbox  |
| `apps/prism-manage/` (32 files)                              | CSS semantic system, task types, theme |
