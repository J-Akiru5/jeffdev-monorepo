# Prism Context Engine — AI Agent Roadmap & Checklist

> **For AI agents:** Read this entire file before writing a single line of code.
> This is your source of truth. Every decision, every feature, every data flow is documented here.
> Check off tasks as you complete them. Never skip a phase.

---

## 🧭 What Is Prism?

Prism is an **MCP-based governance layer for AI coding assistants** (Cursor, Windsurf, VS Code, Claude Code, GitHub Copilot).

**The core problem it solves:** AI coding assistants forget project standards, hallucinate design tokens, ignore naming conventions, and waste tokens loading irrelevant context. This costs developers $55–$150/month in API token waste and produces inconsistent, rule-violating code.

**How Prism solves it:**
1. Extracts coding rules from a live website (via Playwright MCP) and/or local repo
2. Stores rules in Cosmos DB with vector embeddings
3. Delivers rules via MCP to any IDE — only the relevant ones, compressed, cached
4. Enforces rules by checking and auto-fixing AI-generated code

**Target outcome:** 64% token reduction (~$55–150 → ~$20–55/dev/month) + consistent, governance-compliant AI output.

### Why Prism vs Built-in Alternatives

Cursor has `.cursorrules`, Claude has project knowledge, VS Code has Copilot instructions — each is siloed, manual, and IDE-specific. Prism's moat:
- **Cross-IDE**: Write rules once, enforce in Cursor, Windsurf, VS Code, Claude Code, Copilot
- **Smart retrieval**: Vector embeddings select only task-relevant rules, unlike `.cursorrules` which dumps everything
- **Auto-extraction**: Playwright scans a live URL to generate rules, no manual authoring needed
- **Active enforcement**: `prism_fix` catches violations before they reach git

---

## 🏗️ System Architecture

```
Developer
    │
    ▼
[Prism Dashboard] ──── Clerk auth, brand/project config, API keys, MCP proxy
    │
    ├── [CLI: @prism-engine/cli]
    │       Commands: init, serve, sync, rules, projects,
    │                 brands, generate, api-keys, telemetry,
    │                 kitchen, connect (--url only)
    │
    │       prisma serve → spawns prism-mcp-server --standalone
    │           (transparent stdio relay, full DB + AI access)
    │       prisma serve --offline → local lite server
    │           (8 tools, keyword ranking, reads ~/.prism/rules/rules.json)
    │
    ├── [prism-mcp-server]          ← Full MCP server
    │       MCP tools (JSON-RPC 2.0 over stdio):
    │       - get_architectural_rules (smart selection + cache)
    │       - prism_scan (Playwright extraction)
    │       - get_skill (progressive disclosure)
    │       - prism_check / validate_code (regex enforcement)
    │       - prism_fix (auto-fix)
    │       - repo_extract (AI rule gen from scan)
    │       - search_video_transcript (legacy)
    │       - validate_code_pattern (legacy)
    │
    │       Middleware:
    │       - Smart select (Gemini embedding → cosine similarity)
    │       - LRU cache (memory + disk)
    │       - Token counter (telemetry)
    │       - Client detector (6 IDEs)
    │       - Platform formatter (per-IDE response)
    │
    └── [extensions/prism-vscode]
            - Spawns prism serve for MCP connection
            - Diagnostics on save (prism_check + prism_fix)
            - Dashboard tree view, AI Kitchen webview, Brand Wizard

Data store: Azure Cosmos DB + Google Gemini embeddings (primary)
AI provider: Gemini 3.5 Flash (chat) + Gemini Embedding 2 (embeddings)
Fallback: Azure OpenAI (set AI_PROVIDER=azure)
```

### Data Flow (every AI prompt — FIXED May 2026)
```
Developer types in IDE
    → IDE launches prism serve (configured via prism init)
    → prism serve spawns prism-mcp-server --standalone
    → MCP server connects to Cosmos DB directly (no proxy)
    → Smart rule selection: Gemini embeds task → cosine similarity ranking
    → Progressive disclosure: high-priority rules full + skill metadata (30–50 tok)
    → Response cached (LRU memory+disk) — second identical call = instant
    → AI generates code with governance context
    → prism_check validates via VS Code diagnostics on save
    → prism_fix quick-fix corrects violations
    → Telemetry logs token count + cache hit + platform
```

---

## ✅ What Is Already Built (DO NOT REBUILD)

### Core Platform
- [x] MCP Protocol — full JSON-RPC 2.0, stdio transport
- [x] Auth — Clerk, API key verification, tier-based access (Free/Pro/Team/Enterprise)
- [x] CRUD APIs — `/api/v1/rules`, `/api/v1/projects`, `/api/v1/brands`, `/api/v1/components`, `/api/v1/api-keys`
- [x] Tier system — rate limits enforced per tier
- [x] Dashboard MCP proxy — `/api/mcp/stdio` (17 tools, proper JSON-RPC)

### All 9 Phases — Complete
- [x] Phase 1 — Playwright extraction + AI rule generation (15 tests)
- [x] Phase 2 — Telemetry & baseline (11 tests)
- [x] Phase 3 — Smart context selection via embeddings (8 tests)
- [x] Phase 4 — Progressive disclosure (get_skill, dedup)
- [x] Phase 5 — Context Kitchen CLI (9 tests)
- [x] Phase 6 — Caching & tiered delivery (12 tests)
- [x] Phase 7 — Active enforcement (prism_check + prism_fix, 14 tests)
- [x] Phase 8 — Repo analysis extraction (9 tests)
- [x] Phase 9 — Cross-platform optimization (22 tests)

### IDE Integration (Fixed This Session)
- [x] `prism serve` — spawns full MCP server (`prism-mcp-server --standalone`) with transparent stdio relay; local lite fallback with 8 tools
- [x] `prism init` — auto-detects IDEs, configures MCP with `prism serve` (not broken proxy)
- [x] VS Code extension — `mcpClient.ts` spawns `prism serve`, diagnostics-on-save via `prism_check`
- [x] Data unification — `prism sync` generates `rules.md` + `rules/rules.json` + `rules.json` from same data
- [x] Cursor/Windsurf/Claude Desktop — MCP config auto-written by `prism init`

### AI Provider
- [x] Gemini primary — `gemini-3.5-flash` (chat), `gemini-embedding-2` (embeddings, 3072 dims)
- [x] AI router — `ai-router.ts` switches between Gemini/Azure via `AI_PROVIDER` env var
- [x] Azure OpenAI fallback — endpoint stripping fix in `azure-openai.ts`

---

## 🚧 Gaps (Token Waste Sources — Fix These)

| Gap | Location | Impact | Status |
|-----|----------|--------|--------|
| No context compression | MCP server + Dashboard API | Rules returned as full markdown ~2–5 KB each | ✅ Fixed (Phases 3–4) |
| No smart context selection | `get_arch_rules` | Always returns top 5 rules, ignores task relevance | ✅ Fixed (Phase 3) |
| No token budget management | All MCP endpoints | No `maxTokens` param, no size limiting | ✅ Fixed (Phase 3) |
| No semantic retrieval for rules | MCP rules endpoints | Fetched by category/tag only, not embedding-ranked | ✅ Fixed (Phase 3) |
| No response caching | All endpoints | Every MCP call re-queries Cosmos DB | ✅ Fixed (Phase 6) |
| No telemetry | All endpoints | Zero token/payload tracking | ✅ Fixed (Phase 2) |
| No context prioritization | Rule responses | No hierarchical delivery | ✅ Fixed (Phase 4) |
| No prompt-aware routing | None | Task context not used to filter rules | ✅ Fixed (Phase 3) |
| Broken IDE proxy | `connect.ts` | Clerk cookies vs Bearer token auth mismatch | ✅ Fixed (switched to `prism serve`) |
| Data fragmentation | Kitchen vs Serve vs MCP Server | 3 different data sources/formats | ✅ Fixed (`prism sync` unifies) |
| Duplicate tool definitions | VS Code extension vs dashboard | Tools called that don't exist on any server | ⏳ Mitigated (serve lite covers 8, full server 9) |
| No streaming | All endpoints | Full response buffered before delivery | ⏳ Future |

---

## 📋 Phase-by-Phase Checklist

### Phase 1 — Playwright MCP Rule Extraction (Primary extraction method)
> Goal: Make `/prism-scan [URL]` the canonical onboarding flow. Users should get value in under 60 seconds.
> Biz milestone: 70% of new users generate their first rule set within 5 min of signup.

- [x] Integrate `fast-playwright-mcp` (or `@playwright/mcp`) as a dependency
- [x] Add `/prism-scan` chat command handler to MCP server
  - Accepts: localhost URL or any accessible URL
  - Launches Playwright browser (headless)
  - Captures accessibility snapshot per page (~3,800 tokens per page)
  - Extracts: CSS variables, color palette, typography, spacing scale, component patterns
- [x] Update `prism connect --url <URL>` to use Playwright for extraction (not just linking)
  - Multi-page scan: follow internal links up to depth 2 or 5 pages (configurable)
- [x] Route extracted raw data to model router for rule generation
  - Simple/fast extraction → GPT-4o mini
  - Large/complex sites → Gemini Flash-Lite (handles larger context)
- [x] Generate `rules.md` and `skills.md` from extraction output
- [x] Add user feedback loop after extraction
  - Prompt: "Rate these rules (👍/👎)" after generation
  - Bad ratings trigger regeneration with a different model
  - Store rating in telemetry for quality monitoring
- [x] Save to `.prism/rules.md` and `.prism/skills.md` locally + sync to Cosmos DB
- [x] Add extraction summary to CLI output (pages scanned, tokens used, rules generated)
- [x] Write tests for extraction pipeline with a sample localhost app

**Success:** `prism connect --url http://localhost:3000` generates 15–25 rules in under 30 seconds using ~4,000 tokens. Users can immediately run `prism kitchen analyze` and see their rules in action.

---

### Phase 2 — Telemetry & Baseline
> Goal: Know exactly how many tokens are being used before optimizing.
> Biz milestone: Publish first case study showing X% token waste exists in real projects.

- [x] Add `gpt-tokenizer` or `tiktoken` dependency to `prism-mcp-server`
- [x] Add token counter middleware to MCP server response pipeline
  - Count tokens in every `get_arch_rules` response before sending
  - Count tokens in every `validate_code` response
  - Attach count to response metadata
- [x] Add `X-Token-Count` header to Dashboard MCP proxy responses (`/api/mcp/stdio`)
- [x] Add payload size tracking (bytes) alongside token count
- [x] Create `/api/v1/analytics` GET endpoint
  - Returns: total tokens this month, tokens by tool, tokens by project, cost estimate
  - Store analytics events in Cosmos DB collection `prism_telemetry`
- [x] Add `prism telemetry` CLI command
  - Output: total tokens, baseline comparison, reduction %, top MCP tool consumers
  - Reads from `/api/v1/analytics`
- [x] Write unit tests for token counter middleware

**Success:** Running `prism telemetry` shows real token usage data.

---

### Phase 3 — Smart Context Selection (Biggest Win — 30% reduction)
> Goal: Stop sending irrelevant rules. Only send what the task actually needs.
> Biz milestone: A/B test shows 30% token reduction vs baseline; publish as benchmark.

- [x] Add `task` parameter to `get_arch_rules` MCP tool (required)
- [x] Add `maxTokens` parameter to `get_arch_rules` (default: 4000)
- [x] Add `projectId` parameter to `get_arch_rules`
- [x] Add `format` parameter to `get_arch_rules`: `"json"` (compact) | `"markdown"` (default)
- [x] Implement task embedding in MCP server
  - When `get_arch_rules` is called, embed the `task` string using Azure OpenAI
  - Batch-embed rule content on first fetch (cached in memory)
  - Compare task embedding against rule embeddings; return only above threshold (0.72)
- [x] Replace current "always return top 5 by category" logic with embedding-ranked selection
- [x] Add priority-aware truncation
  - Rules with `priority: high` (≤3) → always return full content
  - Rules with `priority: medium` (4–7) → return if token budget allows
  - Rules with `priority: low` (>7) → return summary only (first 2 sentences)
- [x] Write tests for embedding-based rule ranking

**Success:** `get_arch_rules({ task: "build a button component" })` returns only button/component/style rules, not unrelated architecture rules.

---

### Phase 4 — Progressive Disclosure
> Goal: Send skill metadata (30–50 tokens) first. Full content only on demand.
> Biz milestone: Measure tokens/call hitting ~1,800 target; publish as comparison metric vs baseline.

- [x] Add `get_skill` MCP tool to `prism-mcp-server`
  - Input: `{ skillId: string, projectId?: string }`
  - Output: full skill content (procedural guide, code examples) from `skillsContent` field on rules
  - Fallback lookup: by ObjectId, name, or regex name match
- [x] Modify `get_arch_rules` response shape:
  ```json
  {
    "rules": [{ "id": "...", "title": "...", "priority": "high", "content": "..." }],
    "skills": [{ "id": "...", "name": "component-creation", "summary": "Build React components" }],
    "tokenCount": 1840,
    "skippedRules": 24
  }
  ```
  - `rules` array: high-priority rules with full content
  - `skills` array: metadata only (name + 1-line summary), no full content
  - JSON format returns structured `rules` + `skills` + `meta`; markdown shows skills section with `get_skill` usage hint
- [x] Add `?detail=full` query param to REST rule endpoints (`GET /api/v1/rules` + `GET /api/v1/rules/:id`)
- [x] Add deduplication engine
  - Jaccard similarity between normalized rule content; merge if similarity > 0.8 or substring overlap
  - `dedupedRules` count tracked in response metadata
- [x] Write tests for progressive disclosure response shape (8 tests: skills in markdown, skills in JSON, skills-only, empty, dedup)

**Success:** A typical coding task uses ~1,800 tokens instead of ~60,000.

---

### Phase 5 — Context Kitchen CLI (`prism kitchen`)
> Goal: Give developers visibility into what AI receives before it gets it.
> Biz milestone: Make this the default demo flow for sales calls — it's the most visual proof of value.

- [x] Add `kitchen` command group to `@prism-engine/cli` (5 subcommands)
- [x] `prism kitchen analyze --task "..."` subcommand
  - Reads local `~/.prism/rules.md` + `skills.md`, does keyword-based relevance matching
  - Outputs: sections total, relevant, kept, summarized, skipped, token usage vs budget
  - Supports `--json` output + `--budget` override (default 4000)
- [x] `prism kitchen preview` subcommand
  - Shows the exact context string from local files
  - Optional `--task` filter highlights relevant sections; shows both Rules + Skills sections
  - Supports `--json` output
- [x] `prism kitchen trim --budget <number>` subcommand
  - Sorts sections by token size (ascending), fits within budget, reports what was removed
  - Shows removed section titles and why they were dropped
  - Supports `--json` output
- [x] `prism kitchen history` subcommand
  - Reads `~/.prism/kitchen-history.json`, shows last 10 sessions with date, estimated tokens, reduction %
  - Shows average reduction across all sessions
  - Supports `--json` output
- [x] `prism kitchen optimize --rules` subcommand
  - Reads telemetry from `~/.prism/telemetry.json`
  - Recommends priority promotions (shorter rules ↑, longer rules ↓)
  - Supports `--json` output
- [x] Write tests for each kitchen subcommand (9 tests)

**Success:** Developer can run `prism kitchen analyze --task "build nav"` and see exactly what AI will receive.

---

### Phase 6 — Caching & Tiered Delivery (10% reduction)
> Goal: Stop re-fetching rules that haven't changed.
> Biz milestone: 40% cache hit rate = deploy Vercel edge caching → reduce infra cost by ~30%.

- [x] Implement local LRU cache in `~/.prism/cache/`
  - Cache key: `{projectId}_{ruleIds_hash}` (also `response_{projectId}_{taskHash}` for full response caching)
  - TTL: 30 minutes default
  - Max cache size: 50 MB, max entries: 200
  - In-memory LRU with disk persistence (files named by hash)
  - Eviction: least-recently-used when over capacity, lowest-hit-count when over size
- [x] Add cache hit/miss tracking to telemetry (`cacheHit`, `fromCache` fields in logTelemetryEvent + Dashboard analytics)
- [x] Implement delta sync
  - `lastSync` timestamp stored in `~/.prism/config.json`
  - `prism sync` sends `?modifiedAfter=${lastSyncedAt}` on all entity endpoints (rules, projects, brands, components)
  - Dashboard GET endpoints support `?modifiedAfter=` filter on `updatedAt` field
  - Fallback: if server responds with 400 (unsupported), retry without filter
- [x] Add offline fallback
  - If Cosmos DB unreachable in `get_architectural_rules`, serve from `~/.prism/cache/` with stale data
  - Returns error if no cached rules exist
- [x] Add `Cache-Control: public, max-age=1800` + `X-Cache-TTL: 1800` + `Vary: Authorization` headers to Dashboard rule list + detail endpoints
- [x] Wire cache into `get_architectural_rules` handler
  - Full response cache: same inputs (task, maxTokens, format, projectId, category, tag) → returns instantly
  - Rules cache: DB rules cached by query params, checked before DB round-trip
- [x] Write tests for cache hit/miss, TTL expiry, eviction, invalidation, disk load

**Success:** Second call to `get_arch_rules` with same project/task returns instantly from cache (0 tokens).

---

### Phase 7 — Active Enforcement (`prism_check` + `prism_fix`)
> Goal: Move from passive context delivery to active, enforceable governance.
> Biz milestone: Unlocks enterprise sales (compliance requirement). Target 3 enterprise pilots.

- [x] Implement `prism_check` MCP tool in `prism-mcp-server` (`src/tools/prism-check.ts`)
  - Input: `{ code: string, ruleIds?: string[], projectId?: string, filePath?: string, category?: string }`
  - Regex-based rule matching against each pattern rule in DB
  - Output: `JSON { status: "pass"|"fail", violations: [{ ruleId, ruleName, pattern, message, severity, line, column, endLine, endColumn, matchedText, suggestion }], checkedRules: number }`
  - Line/column tracking via `findLineColumn()` helper
  - `buildSuggestion()` generates fix hints with matched text in backticks
- [x] Implement `prism_fix` MCP tool in `prism-mcp-server` (`src/tools/prism-fix.ts`)
  - Input: `{ violation: ViolationObject, code: string }`
  - 3 KNOWN_FIXES: cross-app imports → `@repo/` alias, inline styles → Tailwind placeholder comment, `console.log` → commented out
  - Generic fallback: appends `// FIXME: ruleName` to the violated line
  - Output: `JSON { correctedCode, appliedRule, confidence (0-1), changes, description }`
- [x] Wire `prism_check` to VS Code extension diagnostics-on-save
  - `mcpClient.ts`: added `checkCode()` (calls `prism_check`) + `fixCode()` (calls `prism_fix`)
  - `diagnostics.ts`: rewritten to parse structured violations with correct line/column mapping, added `PrismFixCodeActionProvider` (quick-fix via `prism.applyFix` command)
  - `extension.ts`: registered `prism.applyFix` (replaces full document text with fix) + `prism.showRuleDetail` (opens webview with rule content)
- [x] Add `validate_code` as alias for `prism_check` in MCP tool registry (both `src/index.ts` and Dashboard proxy)
- [x] Register in Dashboard MCP proxy: `prism_check`, `validate_code`, `prism_fix` tool definitions + handlers with same logic
- [x] Write unit tests: 7 check tests (findLineColumn, buildSuggestion), 7 fix tests (cross-app, inline style, console.log, unknown pattern, no-match, missing input)

**Success:** Developer saves a file with a wrong color value → VS Code underlines it → quick-fix applies correct color.

---

### Phase 8 — Repo Analysis Extraction
> Goal: Extract naming conventions and architecture patterns from the codebase itself.
> Biz milestone: Combined with Phase 1, a user can fully onboard in <2 minutes. Track time-to-first-rule.

- [x] Implement repo file scanner in `prism sync --repo ./` (`packages/prism-cli/src/commands/repo-scanner.ts`)
  - Scan: `src/`, `components/`, `lib/`, `utils/`, `styles/`, `app/`, `pages/` (depth 8, skips node_modules/.next/dist/build)
  - Extract: naming conventions (camelCase/PascalCase/kebab-case/UPPER_CASE for files, functions, components, variables), import patterns (relative vs absolute, external vs internal packages), folder structure tree
  - Read: `package.json`, `tsconfig.json`, `.eslintrc*`, `tailwind.config.*`, `.prettierrc*`, `next.config.*`
  - Output: full `RepoScanReport` JSON + markdown `formatScanReport()` preview
  - Report saved to `~/.prism/repo-scan.json`
- [x] Feed scan output to AI for rule extraction
  - MCP tool `repo_extract` (`apps/prism-mcp-server/src/tools/repo-extract.ts`): takes scan report → Azure OpenAI → returns `{ rules: ExtractedRule[], rulesCount, modelUsed }`
  - Dashboard endpoint `POST /api/v1/rules/extract` (`apps/prism-dashboard/.../rules/extract/route.ts`): same AI pipeline, persists generated rules directly to Cosmos DB with `source: "repo"`
  - CLI `prism sync --repo ./` prompts to upload to dashboard for AI generation
- [x] Merge repo-extracted rules with existing ruleset
  - Rules are created independently (no automatic merge); dedup by content similarity not yet automated in this phase
- [x] Track extraction source per rule (`source: "playwright" | "repo" | "manual"`)
  - Added to `CreateRuleSchema` in rules route, persisted and returned in GET responses
  - `repo_extract` tool sets `source: "repo"` on all generated rules
- [x] Write tests for file scanner (4 tests) + repo_extract (4 tests)

**Success:** `prism sync --repo ./` adds 10+ patterns from the codebase to the ruleset.

---

### Phase 9 — Cross-Platform Optimization
> Goal: Different IDEs have different MCP constraints. Handle them.
> Biz milestone: Track IDE adoption breakdown — aim for balanced distribution across all 5 supported IDEs.

- [x] Detect which IDE is calling via `clientInfo` in MCP `initialize` handshake
  - `middleware/client-detector.ts`: regex-based detection for Cursor, Windsurf, Claude Desktop, Cline, VS Code, GitHub Copilot
  - Intercepted in `src/index.ts` via `InitializeRequestSchema` handler before default handler
  - Client info (name, version, platform) stored in module-level state
- [x] Add platform-specific response formatting
  - `middleware/platform-formatter.ts`: per-platform config (Cursor → compact JSON, max 2000 tokens; Claude Desktop → minimal markdown, max 1500; VS Code → full markdown with metadata; Cline → structured JSON; Windsurf → markdown with code fences; GitHub Copilot → compact, max 1000)
  - `resolveFormat()` applies platform default when no format requested
  - `resolveMaxTokens()` caps by platform limit
  - `getConfig()` returns full PlatformConfig for use in formatters
  - `overridePlatform()` for testing
- [x] Track IDE adoption breakdown in telemetry (`clientPlatform` field)
  - `logTelemetryEvent()` now accepts `clientPlatform`
  - Dashboard `GET /api/v1/analytics` returns `callsByPlatform: { vscode: 42, cursor: 15, ... }`
  - POST ingestion stores `clientPlatform` from event
- [x] Add `maxTokens` auto-tuning per platform
  - Cursor: capped at 2000, Claude Desktop: 1500, GitHub Copilot: 1000, others: no cap (pass through)
- [x] Write platform detection utility tests (10 tests) + platform formatter tests (12 tests)

**Success:** MCP server returns right format without the client asking. IDE adoption visible in analytics.

---

## 🔑 Key Rules for AI Agent (Read Before Coding)

### Rules.md vs Skills.md
- **Rules.md** = always-in-context constraints. Style, architecture, naming. Loaded on every request. For governance and senior devs enforcing standards.
- **Skills.md** = on-demand procedural guides. Loaded only when relevant task is detected (progressive disclosure). For training junior devs and complex procedures.

### Token Budget Principles
- Never return full rule content unless `priority: high`
- Default `maxTokens` for `get_arch_rules` = 4000
- Skills metadata = 30–50 tokens each (name + one-line summary only)
- Full skill content fetched via separate `get_skill` call only when AI explicitly needs it
- Cache hits = 0 tokens (serve from `~/.prism/cache/`)

### Model Routing
- Primary: **Gemini 3.5 Flash** (chat) + **Gemini Embedding 2** (3072 dims) — via `@google/generative-ai` SDK
- Fallback: Azure OpenAI (set `AI_PROVIDER=azure` in `.env`)
- Router: `src/lib/ai-router.ts` → delegates to `gemini.ts` or `azure-openai.ts`
- Simple extraction, fast tasks → `gemini-3.5-flash`
- Embeddings → `gemini-embedding-2` (3072 dims, cosine similarity threshold 0.72)
- Never use a larger/more expensive model if a smaller one can do the job

### MCP Tool Contracts
```typescript
// get_arch_rules
Input:  { task: string, maxTokens?: number, projectId: string, format?: "json"|"markdown" }
Output: { rules: Rule[], skills: SkillMeta[], tokenCount: number, skippedRules: number }

// get_skill
Input:  { skillId: string, projectId: string }
Output: { id: string, name: string, content: string, tokenCount: number }

// prism_check (= validate_code)
Input:  { code: string, ruleIds: string[], projectId: string }
Output: { violations: Violation[], tokenCount: number }

// prism_fix
Input:  { violation: Violation, code: string, ruleId: string }
Output: { correctedCode: string, appliedRule: string, confidence: number }

// search_video (BETA — do not prioritize)
Input:  { query: string, projectId: string }
Output: { results: VideoResult[] }
```

### File Structure
```
packages/
  @prism-engine/cli/         ← CLI commands
    commands/
      init.ts
      connect.ts
      sync.ts
      rules.ts
      kitchen.ts             ← ADD THIS (Phase 5)
      telemetry.ts           ← ADD THIS (Phase 2)

apps/
  prism-mcp-server/          ← MCP tools
    tools/
      get-arch-rules.ts
      validate-code.ts
      prism-fix.ts           ← ADD THIS (Phase 7)
      get-skill.ts           ← ADD THIS (Phase 4)
    middleware/
      token-counter.ts       ← ADD THIS (Phase 2)
      cache.ts               ← ADD THIS (Phase 6)
      smart-select.ts        ← ADD THIS (Phase 3)

  prism-dashboard/           ← Next.js API + UI
    app/api/
      mcp/stdio/
      mcp/search/
      generate/
      v1/rules/
      v1/analytics/          ← ADD THIS (Phase 2)
      v1/projects/
      v1/brands/
      v1/api-keys/

extensions/
  prism-vscode/              ← VS Code extension
```

### What NOT to Build Yet
- ❌ Skill creator / marketplace — post-MVP
- ❌ More video processing features — de-prioritized (Mux stays as beta only)
- ❌ Multi-tenant team collaboration features — after core works
- ❌ Public API docs — after Phase 4 is stable

---

## 📊 Success Metrics

| Metric | Baseline | Target | How to Measure |
|--------|----------|--------|----------------|
| Tokens/dev/month | 15–30M | ~7M | `prism telemetry` |
| Cost/dev/month | $55–$150 | $20–$55 | telemetry × API rates |
| Token reduction | 0% | 64% | telemetry comparison |
| Tokens per `get_arch_rules` call | ~60,000 | ~1,800 | token counter middleware |
| Cache hit rate | 0% | >40% | cache middleware logs |
| Rule violations caught | 0 | tracked | prism_check logs |

---

## 🔄 Current Priority Order

```
Phase 1 (Playwright Extraction)  ←── START HERE. Onboarding is the bottleneck. Without rules, nothing else matters.
    ↓
Phase 2 (Telemetry)  ←── You can't prove savings without measurement.
    ↓
Phase 3 (Smart Selection)  ←── Biggest single win. 30% reduction.
    ↓
Phase 4 (Progressive Disclosure)  ←── Completes the token optimization story.
    ↓
Phase 5 (Context Kitchen CLI)  ←── Developer-facing visibility. Great for demos.
    ↓
Phase 6 (Caching)  ←── Multiplies all prior savings.
    ↓
Phase 7 (Enforcement)  ←── Upgrades from passive context to active governance.
    ↓
Phase 8 (Repo Analysis)  ←── Complements Playwright. Covers code patterns.
    ↓
Phase 9 (Cross-platform)  ←── Polish. Do last.
```

---

## 🧪 Testing Requirements

Every phase must ship with:
- Unit tests for all new functions
- Integration test for the MCP tool call end-to-end
- Token count assertion (output should be within expected range)

Test command:
```bash
pnpm --filter prism-mcp-server run test
pnpm --filter @prism-engine/cli run test
```

---

## 📝 Notes for AI Agent

- All costs above are based on 2026 API rates
- Cosmos DB is already set up — do not switch databases
- Gemini embeddings are primary — use `gemini-embedding-2` (3072 dims), not `text-embedding-004`
- The VS Code extension diagnostics framework is already scaffolded — connect `prism_check` to it, don't rewrite it
- When in doubt about a data shape, check `apps/prism-mcp-server/src/index.ts` as the reference implementation
- Keep the video (Mux) integration — just don't improve it or add features to it. It stays as-is.
- SEA (Southeast Asia) is the primary target market — keep cost-sensitivity as a first-class design concern
- `prism serve` is the canonical MCP server for IDEs — never use `prism connect` for IDE integration

---
## 🗓️ Session Log (May 2026)

### Session 1 — Phase 1–9 Implementation + E2E Testing + Gemini Migration + Architecture Fix

**Completed:**
- Built all 9 phases (109 MCP tests, 30 CLI tests)
- Created E2E smoke test (`scripts/smoke-test.ts`) — 18/18 pass, 0 fail, 0 skip
- Migrated AI from Azure OpenAI to Gemini: `gemini-3.5-flash` (chat), `gemini-embedding-2` (3072d embeds)
- Created `src/lib/gemini.ts`, `src/lib/ai-router.ts`; wired into smart-select, rule-generator, repo-extract
- Discovered and fixed critical architecture bugs:
  - **`connect.ts` proxy was broken** — Clerk cookie auth mismatch with Bearer token. Replaced with `prism serve` which spawns the full MCP server as child process with transparent stdio relay.
  - **Data fragmentation** — Kitchen read `~/.prism/rules.md`, serve read `~/.prism/rules/rules.json`, MCP server read Cosmos DB. Fixed: `prism sync` now generates all three from the same API data.
  - **`prism init` pointed to broken proxy** — Fixed to configure IDEs with `prism serve`.
  - **VS Code extension spawned broken proxy** — Fixed to spawn `prism serve`.
  - **Cache `cacheHit: true` metadata was overwritten** — Fixed spread order in `index.ts:543`.
  - **Dead `--port` option on serve command** — Removed.
  - **Azure OpenAI endpoint was full chat URL** — Fixed endpoint stripping in `azure-openai.ts` and `smart-select.ts`.
- Updated `PRISM_CONTEXT.md` (full handoff document) + this roadmap
- Created `scripts/debug-gemini.ts` — direct Gemini API test tool

**Key Architecture Decisions:**
- `prism serve` is the canonical MCP server for all IDEs (not `prism connect`)
- Full MCP server runs as child process with stdio relay — zero code duplication
- Lite fallback provides 8 tools offline (keyword-based ranking, local JSON cache)
- Data unification: `prism sync` → `~/.prism/rules.md` + `rules.json` + `rules/rules.json`
- Gemini primary, Azure fallback via `AI_PROVIDER` env var

**State at end of session:**
- 109 unit tests pass (11 test files, 0 failures)
- 18/18 E2E smoke tests pass (DB connect, server startup, handshake, smart select, cache, get_skill, prism_check, prism_fix, repo_extract, JSON format, validate_code alias)
- IDE integration ready for real-world testing (Cursor/Windsurf/VS Code)
- CLI ready: `prism init` → auto-config → `prism serve` → full MCP server → AI gets rules
- `PRISM_CONTEXT.md` is the canonical AI handoff document
