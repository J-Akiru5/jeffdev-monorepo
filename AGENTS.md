# JeffDev Monorepo — Agent Guide

## Package Manager

- **Actual:** `pnpm@9.1.0` (README says `npm install` — ignore that, use `pnpm install`)
- `.npmrc` sets `shamefully-hoist=true` and `strict-peer-dependencies=false`
- Node 20+ (`.nvmrc`), TypeScript 5.9

## Key Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace deps |
| `doppler run -- turbo dev` | Start all apps (secrets via Doppler) |
| `turbo run build` | Build all apps/packages |
| `turbo run lint` | ESLint all workspaces |
| `turbo run check-types` | TypeScript check all workspaces |
| `turbo run test` | Run all tests |
| `prettier --write \"**/*.{ts,tsx,md}\"` | Format code |

CI order: `check-types` → `lint` → `test` → `build`. Run in that sequence before pushing.

## Apps & Ports

| App | Port | Stack |
|-----|------|-------|
| `apps/agency` | 3000 | Next.js 16 + Firebase |
| `apps/prism-dashboard` | 3001 | Next.js 16 + Cosmos DB + Clerk |
| `apps/prism-docs` | 3002 | Nextra 4 |
| `apps/prism-mcp-server` | — | Node.js + MCP SDK (stdio transport) |
| `apps/prism-admin` | 3004 | Next.js 16 + Firebase + Clerk |
| `apps/joularix` | 3005 | Next.js 16 |
| `apps/mht` | 3003 | Next.js 16 + Firebase |
| `apps/nexure` | 3004 | Next.js 16 |
| `apps/tracker` | 3005 | Next.js 16 + Firebase |
| `apps/prism-exercise` | — | Skeleton (no package.json, only build artifacts) |

## Architecture Rules

- **No cross-app imports.** Shared code goes in `packages/` (`@jdstudio/ui`, `@jeffdev/db`, `@repo/eslint-config`, `@repo/typescript-config`, `@prism-engine/cli`).
- DB clients are singletons via `@jeffdev/db` — use `getPrismContainer()` (Cosmos) or Firestore exports.
- UI components live in `packages/ui/src/` — check there before creating new ones in apps.
- `@repo/typescript-config` and `@repo/eslint-config` are shared; apps extend them.

## Critical Next.js 16 Patterns

- **Firestore `Timestamp` → Client Components will crash.** Serialize with `.toDate().toISOString()` in server actions before passing to client components.
- **Force dynamic rendering** on admin pages: call `await cookies()` in the page component.
- Server actions return `{ success: boolean; error?: string }`.
- Revalidate cache after mutations: `revalidatePath()`.
- Zustand for global client state (not Context API).

## Testing

- **Unit tests:** Vitest. **E2E:** Playwright (agency only).
- MCP server must be built before CLI tests: `pnpm --filter @prism-engine/cli run build`.
- DB integration tests skip if `MONGODB_URI` not set (`.skipIf` pattern).
- Focused test: `pnpm --filter <package> run test` (e.g., `pnpm --filter prism-mcp-server run test`).

## Release

- Semantic release on push to `main` (via `.releaserc.json`).
- Changelog auto-generated in `CHANGELOG.md`; commit messages follow conventional commits.

## Existing Docs (worth reading)

- `.github/copilot-instructions.md` — comprehensive AI agent guide (205 lines)
- `.agent/rules/` — tech stack, security, design, debugging, SEO, admin guide
- `.agent/skills/` — Prism development, monorepo patterns, Firestore boundaries, design system
- `TESTING.md` — detailed test setup and troubleshooting

## Tooling Quirks

- Secrets via **Doppler**: `doppler run -- <command>`. Never commit `.env` files.
- Tailwind CSS v4, PostCSS config in each app.
- Docker Compose at root (`docker-compose.yml`) for local Cosmos DB (Mongo 7) + all apps.
- `syncpack` manages dependency versions across workspaces: `npx syncpack list-mismatches` / `npx syncpack fix-mismatches`.
- Two port conflicts exist: `mht` and `prism-exercise` both claim 3003; `joularix` and `tracker` both claim 3005.
