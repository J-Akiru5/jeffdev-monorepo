# Prism Context Engine — Full Project Context

> **Read this first.** Canonical handoff document for AI agents. Every Phase, every file, every decision, every test result, every known bug.
>
> Last updated: May 22 2026. Companion to `PRISM_ROADMAP.md` (the checklist).

## 1. What Is Prism?

The **Prism Context Engine** is an MCP-based governance layer for AI coding assistants (Cursor, Windsurf, VS Code, Claude Desktop, GitHub Copilot, Cline). It:

1. Extracts coding rules and step-by-step skills from websites (Playwright) and repos (scanner)
2. Stores rules and skills in Cosmos DB
3. Delivers rules/skills via MCP to any IDE — smart-ranked, compressed, cached
4. Enforces rules by checking + auto-fixing AI-generated code

**Target:** 64% token reduction ($55–150 → $20–55/dev/month).

## 2. How It Works (Fixed May 2026)

```
IDE (Cursor/Windsurf/VS Code/Claude)
  │
  │ stdio (MCP JSON-RPC)
  ▼
prism serve  (configured by prism init)
  │
  ├─ spawns prism-mcp-server --standalone  (full server, Cosmos DB)
  │   → 9 tools, Gemini embeddings, LRU cache, telemetry
  │
  └─ fallback: local lite server  (8 tools, keyword ranking, offline)
      → reads ~/.prism/rules/rules.json
```

**One-time setup:**

```bash
prism login          # Auth with Prism Cloud
prism sync           # Fetch rules → ~/.prism/rules.json + rules.md + rules/rules.json
prism init           # Auto-configure Cursor/Windsurf/VS Code/Claude Desktop
```

**Daily use:**

- IDE auto-starts `prism serve` when you open it
- AI assistant calls `get_architectural_rules({ task: "build a button" })` to check constraints
- AI assistant calls `list_skills` to discover available workflows, then `get_skill({ skillId })` for step-by-step execution guides
- Server returns only relevant rules, ranked by Gemini embedding similarity
- VS Code underlines violations on save, quick-fix corrects them

## 3. All 9 Phases — Complete

| Phase | What                                | Tests | Key Files                                                  |
| ----- | ----------------------------------- | ----- | ---------------------------------------------------------- |
| 1     | Playwright extraction + AI rule gen | 15    | `extractor.ts`, `rule-generator.ts`, `prism-scan.ts`       |
| 2     | Telemetry & baseline                | 11    | `token-counter.ts`, CLI `telemetry.ts`                     |
| 3     | Smart context selection             | 8     | `smart-select.ts`, `ai-router.ts`, `gemini.ts`             |
| 4     | Progressive disclosure              | —     | `get-skill.ts`                                             |
| 5     | Context Kitchen CLI                 | 9     | CLI `kitchen.ts`                                           |
| 6     | Caching & tiered delivery           | 12    | `cache.ts`                                                 |
| 7     | Active enforcement                  | 14    | `prism-check.ts`, `prism-fix.ts`, VS Code `diagnostics.ts` |
| 8     | Repo analysis extraction            | 9     | CLI `repo-scanner.ts`, `repo-extract.ts`                   |
| 9     | Cross-platform optimization         | 22    | `client-detector.ts`, `platform-formatter.ts`              |

## 4. Directory Structure

```
apps/prism-mcp-server/src/
  index.ts                    # Entry: DB, MCP handler dispatch, all 9 tools
  middleware/
    token-counter.ts          # Phase 2 — telemetry
    smart-select.ts           # Phase 3+4 — Gemini embedding ranking + skills
    cache.ts                  # Phase 6 — LRU (memory+disk)
    client-detector.ts        # Phase 9 — 6 IDE platforms
    platform-formatter.ts     # Phase 9 — per-platform format/maxTokens
  tools/
    prism-scan.ts             # Phase 1
    get-skill.ts              # Phase 4 (Updated for skills collection)
    list-skills.ts            # New: Discovery of project workflows
    prism-check.ts            # Phase 7
    prism-fix.ts              # Phase 7
    repo-extract.ts           # Phase 8
  lib/
    extractor.ts              # Phase 1 — Playwright crawl
    rule-generator.ts         # Phase 1 — AI rule gen
    azure-openai.ts           # Azure embeddings/chat (fallback)
    gemini.ts                 # Gemini embeddings/chat (primary)
    ai-router.ts              # Picks provider via AI_PROVIDER env
    vector-search.ts          # Cosine similarity
  scripts/
    smoke-test.ts             # E2E test — 18 steps, connects to real DB + Gemini
    debug-gemini.ts           # Direct Gemini API test tool

packages/prism-cli/src/commands/
  init.ts           # Auto-detect IDEs, write MCP config (→ prism serve)
  serve.ts          # Spawns prism-mcp-server, or local lite fallback
  sync.ts           # Cloud API → local cache (unified: rules.md + json + rules/ json)
  connect.ts        # URL scan mode only (proxy removed — use prism serve)
  kitchen.ts        # analyze/preview/trim/history/optimize
  telemetry.ts      # View token usage
  repo-scanner.ts   # Phase 8 — scan local repo

extensions/prism-vscode/src/
  mcpClient.ts      # Spawns prism serve, JSON-RPC calls (prism_check/fix/rules)
  diagnostics.ts    # On-save validation + quick-fix code actions
  extension.ts      # Command registration
```

## 5. Configuration

### Required env vars (root `.env`, Doppler-managed)

| Variable                 | Value                                              |
| ------------------------ | -------------------------------------------------- |
| `MONGODB_URI`            | Cosmos DB connection string                        |
| `COSMOS_DATABASE_NAME`   | Default `prism`                                    |
| `GEMINI_API_KEY`         | Google Gemini API key                              |
| `GEMINI_MODEL`           | Chat model = `gemini-3.5-flash`                    |
| `GEMINI_EMBEDDING_MODEL` | Embedding model = `gemini-embedding-2` (3072 dims) |

### AI Provider

- Default: **Gemini** (set `GEMINI_API_KEY`)
- Switch: `AI_PROVIDER=azure` (needs `AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_API_KEY`)
- Router: `src/lib/ai-router.ts`

### Local files

```
~/.prism/
  rules.md              # Kitchen reads this (generated by prism sync)
  rules.json            # API cache (generated by prism sync)
  rules/
    rules.json          # Serve lite fallback (generated by prism sync)
  skills.md             # Generated by prism connect --url
  telemetry.json        # JSONL token events
  cache/                # LRU disk cache (*.json by hash)
  kitchen-history.json  # Past analysis sessions
  config.json           # lastSync timestamp
  repo-scan.json        # From prism sync --repo
  token                 # Saved auth token
```

## 6. Running the System

```bash
# Install
pnpm install

# Unit tests
pnpm --filter prism-mcp-server run test     # 109 tests
pnpm --filter prism-cli run test            # 30 tests

# E2E smoke test (needs MONGODB_URI + GEMINI_API_KEY)
pnpm --filter prism-mcp-server run smoke-test

# Debug Gemini directly
pnpm --filter prism-mcp-server exec tsx scripts/debug-gemini.ts

# Start full MCP server (standalone)
pnpm --filter prism-mcp-server exec tsx src/index.ts --standalone

# Start for IDE use
pnpm --filter prism-cli exec tsx src/index.ts serve

# Offline mode
pnpm --filter prism-cli exec tsx src/index.ts serve --offline

# Dashboard + all services
doppler run -- turbo dev
```

## 7. Test Results

- **109 unit tests** (11 test files, MCP server)
- **30 CLI unit tests**
- **18/18 E2E smoke tests** — pass, 0 fail, 0 skip
  - DB connect ✅ | Server startup ✅ | MCP handshake ✅
  - Smart selection (Gemini embeddings) ✅
  - Response cache hit ✅
  - get_skill ✅ | prism_check ✅ | prism_fix ✅
  - repo_extract (Gemini chat) ✅
  - Platform format (JSON) ✅ | validate_code alias ✅

## 8. MCP Tools

| Tool                      | Handler                    | Notes                                         |
| ------------------------- | -------------------------- | --------------------------------------------- |
| `get_architectural_rules` | `index.ts` in-house        | Smart ranking + cache + platform format       |
| `prism_scan`              | `handlePrismScan`          | Playwright URL scan → AI rules                |
| `list_skills`             | `handleListSkills`         | Lightweight discovery of procedural workflows |
| `get_skill`               | `handleGetSkill`           | Lazy-loads heavy step-by-step markdown        |
| `prism_check`             | `handlePrismCheck`         | Regex validation with line/column             |
| `validate_code`           | → prism_check              | Alias                                         |
| `prism_fix`               | `handlePrismFix`           | 3 KNOWN_FIXES + generic FIXME                 |
| `repo_extract`            | `extractRulesFromRepoScan` | AI gen from scan report                       |
| `search_video_transcript` | Legacy in-house            | Semantic search                               |
| `validate_code_pattern`   | Legacy in-house            | Built-in checks                               |

## 9. Known Issues

1. **No embedding model on Azure** — Azure only has `gpt-4o-mini`, no `text-embedding-3-small`. Use Gemini for embeddings.
2. **Port conflicts** — `mht`/`prism-exercise` both claim 3003; `joularix`/`tracker` both claim 3005.
3. **CLI typecheck** — 2 pre-existing errors (cross-app import in `connect.ts`, config module resolution).
4. **No `prism_scan` E2E test** — Requires Playwright browsers installed.
5. **VS Code tools mismatch** — Extension calls `list_projects`, `get_brand_profile` etc. as MCP tools, but `prism serve` lite doesn't expose them. Full server only has 9 tools. Extension falls back to direct REST API for these.
6. **`connect.ts` cross-app import** — `--url` mode imports `../../../../apps/prism-mcp-server/src/lib/extractor.js` (violates repo rules, but works as pragmatic exception).

## 10. Key Architecture Decisions

- **On-the-fly embeddings** — Rules don't store vectors in DB. Smart-select batch-embeds on first fetch.
- **gpt-tokenizer** — Pure JS, not tiktoken (no WASM).
- **Dedup via Jaccard** — Bag-of-words >0.8, no NLP.
- **Cache dual-layer** — Memory Map + disk JSON files.
- **Response cache key** — `response_{projectId}_{task}_{maxTokens}_{format}_{category}_{tag}`.
- **Platform maxTokens = ceiling** — `min(requested, platform.cap)`.
- **`prism serve` spawns child process** — Zero code duplication between CLI and MCP server. Full server inherits env vars from parent.
- **Data unification** — `prism sync` generates all 3 formats (markdown, JSON, rules/JSON) from same API data.
- **Gemini primary, Azure fallback** — via `AI_PROVIDER` env var + `ai-router.ts`.

## 11. Recent Session Changes

| Date         | Change                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| May 2026     | Created `scripts/smoke-test.ts` — 18-step E2E test                                                                                                                                                            |
| May 2026     | Migrated AI from Azure to Gemini: `gemini-3.5-flash` + `gemini-embedding-2`                                                                                                                                   |
| May 2026     | Created `src/lib/gemini.ts`, `src/lib/ai-router.ts`                                                                                                                                                           |
| May 2026     | Fixed `connect.ts` → broken IDE proxy replaced with `prism serve`                                                                                                                                             |
| May 2026     | Rewrote `serve.ts` — spawns full MCP server with lite fallback                                                                                                                                                |
| May 2026     | Updated `prism init` → configures IDEs with `prism serve`                                                                                                                                                     |
| May 2026     | Fixed data fragmentation — `sync` generates all 3 formats                                                                                                                                                     |
| May 2026     | Fixed VS Code `mcpClient.ts` → spawns `prism serve`                                                                                                                                                           |
| May 2026     | Fixed cache `cacheHit` metadata bug                                                                                                                                                                           |
| May 2026     | Fixed Azure endpoint stripping in `azure-openai.ts`                                                                                                                                                           |
| May 2026     | Removed dead `--port` from serve command                                                                                                                                                                      |
| May 2026     | Created `PRISM_CONTEXT.md` and updated `PRISM_ROADMAP.md`                                                                                                                                                     |
| May 2026     | Separated "Rules" and "Skills" into two collections. Created Skill Studio UI.                                                                                                                                 |
| May 2026     | Added `list_skills` MCP tool for AI agent discovery pattern.                                                                                                                                                  |
| May 2026     | Added Pre-built Rule Templates (Next.js 16, React 19, Tailwind v4, Security).                                                                                                                                 |
| May 22, 2026 | **100% Warn-Free Monorepo Cleanups**: Cleaned up all remaining ESLint, TypeScript, and React compilation warnings across the monorepo. The verification build/lint checks now pass with zero warnings/errors. |
| May 22, 2026 | **Quality & Safety Automation**: Set up Husky, monorepo-aware `lint-staged.config.js`, Commitlint, `.editorconfig`, `.github/CODEOWNERS`, and Gitleaks CI workflow, committed and pushed to `lou` branch.     |

## 12. Next Steps

- Deploy to staging, test with real IDE (Cursor/Windsurf/VS Code)
- Add `prism_scan` to smoke test (needs Playwright browsers)
- Consider AST-based rule matching for `prism_check`
- Consider caching config overrides per project
- Automated dedup/content-merge for repo-extracted rules

## 13. ESLint Cleanup Sprint (May 22, 2026)

**Goal:** Achieve `--max-warnings 0` across all apps so Vercel/CI never fails on warnings.
**Status:** **100% Complete & Staged/Committed**
**Branch:** `lou`

All monorepo workspaces (`apps/prism-mcp-server`, `apps/prism-dashboard`, `apps/agency`, `apps/prism-admin`, `apps/marketing`, `apps/tracker`, `apps/nexure`, `packages/*`) have been thoroughly cleaned of unused imports, unused variables, unescaped HTML entities, and inappropriate native `<img>` tag usages.

## 14. Monorepo Quality Controls & Safety Nets (May 22, 2026)

To prevent code degradation, the following protections are now active on the `lou` branch:

1. **Husky & lint-staged**: Intercepts `pre-commit` to format and run `eslint --fix` on modified files. Path differences across packages are dynamically resolved by grouping files by workspace inside `lint-staged.config.js`.
2. **Commitlint**: Validates commit messages relative to the Conventional Commit conventions on the `commit-msg` hook.
3. **.editorconfig**: Ensures all editors format whitespace, line-endings, and final newlines identically.
4. **CODEOWNERS**: Automates reviewer assignments on PRs.
5. **Gitleaks CI**: Added `.github/workflows/gitleaks.yml` to automatically verify in CI that secrets are never leaked.

### Pattern notes for AI agents

- `<img>` for dynamic remote URLs (Mux, R2): use `// eslint-disable-next-line @next/next/no-img-element` or Next.js `<Image />` component.
- Unused catch vars: `} catch {` (no binding) or rename to `_e`
- Unused params in exported functions: prefix with `_` (e.g. `_request`)
- Secrets: managed via Doppler, never `.env` files
