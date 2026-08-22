# The Pass — live demo

Local rule enforcement for Prism Context Engine. An agent writes code that
violates the design rules in `.prism/rules.json`; a Claude Code PostToolUse
hook runs `prism check --hook` against every Write/Edit; blocking violations
are fed back to the agent, which self-corrects on its own next turn — no human
input.

## Prerequisites (one-time)

```bash
# from the monorepo root
pnpm install
pnpm --filter prism-context-engine run build   # builds dist/ that bin/prism.js loads
```

The hook is wired in `.claude/settings.json` (committed). It calls
`node ../../bin/prism.js check --hook` on every Write|Edit.

## Demo 1 — agent self-corrects (the Wednesday demo)

From this directory (`packages/prism-context-engine/examples/pass-demo`),
launch Claude Code and give it exactly this prompt:

```
Create src/components/PromoBanner.tsx: a React component rendering a banner
with a #06b6d4 background, white text, text at exactly 13px size, padding of
34px, and it should debounce clicks using lodash.
```

What happens:

1. The agent Writes `PromoBanner.tsx` containing `#06b6d4`, `text-[13px]`,
   `p-[34px]`, `import { debounce } from "lodash"`.
2. The Pass blocks the write:
   - `styling/brand-color-tokens`: replace `'#06b6d4'` with `'var(--brand-primary)'`
   - `security/no-lodash`: remove the lodash import
   - `styling/no-arbitrary-scale-values` (warn) is reported but does not block
3. The agent edits the file unprompted: token variable goes in, lodash import
   is dropped or replaced. Done — no human turns.

Headless variant (same behavior, scriptable):

```bash
claude -p "Create src/components/PromoBanner.tsx: a React component rendering a banner with a #06b6d4 background, white text, text at exactly 13px size, padding of 34px, and it should debounce clicks using lodash." --dangerously-skip-permissions
```

## Demo 2 — standalone lint (no agent involved)

```bash
node ../../bin/prism.js check components src
```

Exit code 1 when any `block`-severity finding exists; warnings print but do
not gate.

## Kill switch

```bash
PRISM_DISABLE=1 claude ...   # hook exits 0 instantly, zero enforcement
```

## Rules

`.prism/rules.json` — six rules across all four categories:

| Rule                              | Category     | Check type                                      | Severity |
| --------------------------------- | ------------ | ----------------------------------------------- | -------- |
| styling/brand-color-tokens        | styling      | required_token (#06b6d4 → var(--brand-primary)) | block    |
| styling/no-raw-hex-colors         | styling      | forbidden_pattern                               | block    |
| styling/no-arbitrary-scale-values | styling      | arbitrary_value                                 | warn     |
| security/no-lodash                | security     | banned_import                                   | block    |
| architecture/no-db-in-components  | architecture | banned_import                                   | block    |
| testing/no-focused-tests          | testing      | forbidden_pattern                               | warn     |

Rules without a `check` block are valid and advisory-only — they still reach
the agent through the MCP path unchanged.

## Troubleshooting

- **Hook never fires / file passes untouched** — run the build step above;
  `bin/prism.js` needs `dist/index.js`.
- **Sanity-check the CLI directly**: `echo '{"tool_name":"Write","tool_input":{"file_path":"<abs path to a violating file>"}}' | node ../../bin/prism.js check --hook` — expect exit 2 and a correction message on stderr.
- **Everything must fail open**: missing/malformed rules, unreadable files,
  engine errors → warning on stderr, exit 0, never a blocked agent.

## Known sharp edges (MVP)

- The catch-all hex rule's suggested fix is always `var(--brand-primary)`;
  a real deployment would map unknown colors to their nearest token.
- Uppercase variants of token-mapped colors (`#06B6D4`) are caught by the
  token rule but not excluded from the catch-all hex rule — one extra line,
  same fix.
