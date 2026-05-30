# JeffDev Monorepo — Agent Guide

## Package Manager

- **Actual:** `pnpm@9.1.0` (README says `npm install` — ignore that, use `pnpm install`)
- `.npmrc` sets `shamefully-hoist=false` (strict isolation for faster resolution) and `strict-peer-dependencies=false`
- Node 20+ (`.nvmrc`), TypeScript 5.9

## Key Commands

| Command                                    | Description                                           |
| ------------------------------------------ | ----------------------------------------------------- |
| `pnpm install`                             | Install all workspace deps                            |
| `doppler run -- turbo dev --concurrency=2` | Start up to 2 apps concurrently (secrets via Doppler) |
| `doppler run -- turbo build`               | Build all apps/packages                               |
| `turbo run lint`                           | ESLint all workspaces                                 |
| `turbo run check-types`                    | TypeScript check all workspaces                       |
| `turbo run test`                           | Run all tests                                         |
| `prettier --write \"**/*.{ts,tsx,md}\"`    | Format code                                           |

CI order: `check-types` → `lint` → `test` → `build`. Run in that sequence before pushing.

## Apps & Ports

| App                     | Port | Stack                               |
| ----------------------- | ---- | ----------------------------------- |
| `apps/prism-docs`       | 3002 | Nextra 4                            |
| `apps/prism-admin`      | 3004 | Next.js 16 + Supabase + Clerk       |
| `apps/prism-engine`     | 3001 | Next.js 16 + Supabase + Cosmos DB   |
| `apps/prism-manage`     | 3007 | Next.js 16 + Supabase               |
| `apps/prism-mcp-server` | —    | Node.js + MCP SDK (stdio transport) |
| `apps/syntaxure-labs`   | 3000 | Next.js 16 + Supabase               |
| `apps/prism-analytics`  | 8000 | Python FastAPI + Supabase + pandas  |

## Architecture Rules

- **No cross-app imports.** Shared code goes in `packages/` (`@syntaxure/ui`, `@syntaxure-labs/db`, `@repo/eslint-config`, `@repo/typescript-config`, `prism-context-engine`).
- DB clients are singletons via `@syntaxure-labs/db` — use `getPrismContainer()` (Cosmos) or Firestore exports.
- UI components live in `packages/ui/src/` — check there before creating new ones in apps.
- `@repo/typescript-config` and `@repo/eslint-config` are shared; apps extend them.

## Critical Next.js 16 Patterns

- **Firestore `Timestamp` → Client Components will crash.** Serialize with `.toDate().toISOString()` in server actions before passing to client components.
- **Force dynamic rendering** on admin pages: call `await cookies()` in the page component.
- Server actions return `{ success: boolean; error?: string }`.
- Revalidate cache after mutations: `revalidatePath()`.
- Zustand for global client state (not Context API).

## Testing

- **Unit tests:** Vitest. **E2E:** Playwright.
- MCP server must be built before CLI tests: `pnpm --filter prism-mcp-server run build`.
- DB integration tests skip if `MONGODB_URI` not set (`.skipIf` pattern).
- Focused test: `pnpm --filter <package> run test` (e.g., `pnpm --filter prism-mcp-server run test`).

## Release

- **Versioning & changelog:** Changesets (`@changesets/cli`) — run `pnpm changeset` to create, `pnpm changeset version` to bump.
- Changelog auto-generated in `CHANGELOG.md`; commit messages follow conventional commits.
- Release workflow (`.github/workflows/release.yml`) handles PR automation on push to `main`.

## Existing Docs (worth reading)

- `.github/copilot-instructions.md` — comprehensive AI agent guide (205 lines)
- `.agent/rules/` — tech stack, security, design, debugging, SEO, admin guide
- `.agent/skills/` — Prism development, monorepo patterns, Firestore boundaries, design system
- `TESTING.md` — detailed test setup and troubleshooting

## Build Performance

- **Use `pnpm --filter <app> run dev`** for focused work on a single app instead of `turbo dev`.
- **Cache sizes are aggressive:** `.turbo/cache` grows to several GB. Run `pnpm clean` periodically.
- **`NODE_OPTIONS=--max-old-space-size=4096`** is set automatically via `scripts/with-memory-limit.js` for dev/build commands. Each Node.js worker gets a 4 GB heap ceiling.
- **`@next/bundle-analyzer`** is lazy-loaded — only activates when `ANALYZE=true` is set.
- **CI/CD:** Use `turbo prune --scope=<app>` for focused deployments instead of full workspace builds.
- **After adding deps:** Run `pnpm install --fix-lockfile` to keep lockfile clean.

## Tooling Quirks

- Secrets via **Doppler**: `doppler run -- <command>`. Never commit `.env` files.
- Tailwind CSS v4, PostCSS config in each app.
- Docker Compose at root (`docker-compose.yml`) for local Cosmos DB (Mongo 7) + all apps.
- `syncpack` manages dependency versions across workspaces: `npx syncpack list-mismatches` / `npx syncpack fix-mismatches`.
- **Port assignments:** Labs=3000, Engine=3001, Docs=3002, Admin=3004, Manage=3007, MCP=3003, Analytics=8000. Each app must set `PORT=<n>` in its Doppler config or `package.json` dev script.
