# Turborepo Monorepo Structure & Patterns

This skill covers the organization, build patterns, and development workflows for the Turborepo-based monorepo.

## 🏗️ Directory Structure

```
jeffdev-monorepo/
├── apps/                          # Deployable applications
│   ├── agency/                    # Marketing + Admin (Next.js 16 + Firebase)
│   ├── prism-dashboard/           # SaaS Portal (Next.js 16 + Cosmos DB + Clerk)
│   ├── prism-mcp-server/          # MCP Context Server (Node.js 20)
│   ├── prism-docs/                # Documentation (Nextra 4)
│   ├── prism-exercise/            # Practice Platform (Next.js 16 + Supabase)
│   ├── prism-admin/               # Admin Dashboard (Next.js 16 + Firebase)
│   └── joularix, mht, nexure, tracker/  # Specialized apps
│
├── packages/                      # Shared code (published as npm packages)
│   ├── ui/                        # Ghost Glow component library (@jdstudio/ui)
│   ├── db/                        # Database clients (@jeffdev/db)
│   ├── eslint-config/             # ESLint rules (@repo/eslint-config)
│   ├── typescript-config/         # TypeScript config (@repo/typescript-config)
│   └── prism-cli/                 # CLI tools (prism-cli)
│
├── .agent/                        # AI Agent guidelines
│   ├── rules/                     # Technical rules (always-on)
│   └── skills/                    # Specialized skill guides
│
├── .github/                       # GitHub workflows & docs
│   ├── copilot-instructions.md    # Main AI agent guide
│   └── workflows/                 # CI/CD pipelines
│
├── scripts/                       # Shared scripts
├── turbo.json                     # Turborepo configuration
├── pnpm-workspace.yaml            # Workspace definition
└── package.json                   # Root package.json
```

---

## 🔑 Key Files

| File | Purpose | Who |
|------|---------|-----|
| `turbo.json` | Task definitions, caching, pipelines | All developers |
| `pnpm-workspace.yaml` | Workspace member definitions | All developers |
| `.syncpackrc` | Dependency version alignment | DevOps/Setup |
| `packages/db/src/schema.ts` | Zod schemas (single source of truth) | Full-stack devs |
| `packages/ui/src/index.ts` | Component exports | Frontend devs |
| `.agent/rules/*` | Technical constitution | AI agents |

---

## 📦 Package Architecture

### The "No Cross-App Imports" Law

**FORBIDDEN:** Apps cannot import code from other apps.

```typescript
// ❌ STRICTLY FORBIDDEN in apps/agency
import { useWidget } from "../../apps/prism-dashboard/src/hooks";

// ❌ FORBIDDEN in apps/prism-dashboard
import { AdminLayout } from "../../apps/agency/src/layouts";
```

**WHY?** Apps are independently deployable. Cross-dependencies create circular builds.

### The "Shared First" Heuristic

If code is reusable (UI components, utilities, types), it goes in `packages/`:

```typescript
// ✅ CORRECT: Shared component lives in packages/ui
import { Button, Card } from "@jdstudio/ui";

// If it doesn't exist, CREATE it there
// apps/agency/src/components/Button.tsx → packages/ui/src/Button.tsx

// ✅ CORRECT: Shared database logic in packages/db
import { firestore, getPrismContainer } from "@jeffdev/db";
```

### Workspace Dependency Management

Declare dependencies in each package's `package.json`:

```json
// apps/agency/package.json
{
  "dependencies": {
    "@jdstudio/ui": "workspace:*",
    "@jeffdev/db": "workspace:*",
    "react": "^19.0.0"
  }
}

// apps/prism-dashboard/package.json
{
  "dependencies": {
    "@jdstudio/ui": "workspace:*",
    "@jeffdev/db": "workspace:*",
    "@clerk/nextjs": "^5.0.0"
  }
}
```

**`workspace:*` means:** Use the local version during development, publish to npm in CI.

---

## 🚀 Build & Dev Workflows

### Starting Development

```bash
# Install dependencies (across all workspaces)
pnpm install

# Start all apps (parallelized by Turborepo)
doppler run -- turbo dev

# Start specific app
cd apps/agency && npm run dev
```

### Building

```bash
# Build all apps/packages (respects dependency order)
turbo run build

# Build specific app
turbo run build --filter=apps/agency

# Build with source maps
turbo run build --filter=apps/prism-dashboard -- --sourcemaps
```

### Testing

```bash
# Run all tests
turbo run test

# Watch mode
turbo run test:watch

# Specific app
turbo run test --filter=apps/agency

# Unit tests only
turbo run test:unit

# E2E tests (Playwright)
turbo run test:e2e
```

### Linting & Type Checking

```bash
# ESLint all packages
turbo run lint

# Fix lint errors
turbo run lint -- --fix

# TypeScript check
turbo run check-types

# Combined check
turbo run lint check-types
```

---

## 🔧 Turborepo Configuration (turbo.json)

The `turbo.json` file defines all tasks:

```json
{
  "version": "1",
  "extends": ["//"],
  
  // Task definitions
  "tasks": {
    // Build task
    "build": {
      "dependsOn": ["^build"],          // Depends on deps' builds first
      "outputs": [".next/**", "dist/**"],
      "cache": true
    },
    
    // Dev task (no caching, runs forever)
    "dev": {
      "cache": false,
      "persistent": true
    },
    
    // Test task
    "test": {
      "outputs": ["coverage/**"],
      "cache": true,
      "inputs": ["src/**", "tests/**", "package.json"]
    }
  },
  
  // Global environment variables
  "globalEnv": [
    "NODE_ENV",
    "NEXT_PUBLIC_*"
  ]
}
```

---

## 🎯 Common Development Tasks

### Task 1: Add a New Component to @jdstudio/ui

```bash
# 1. Create the component in packages/ui
packages/ui/src/Button/
├── Button.tsx
├── Button.stories.tsx
└── index.ts

# 2. Export from index
# packages/ui/src/index.ts
export { Button } from "./Button";

# 3. Use in any app
import { Button } from "@jdstudio/ui";
```

### Task 2: Create a New API Route

**In apps/agency:**
```typescript
// apps/agency/src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth();
  const data = await getUserData(params.id);
  return NextResponse.json(data);
}
```

**In apps/prism-dashboard:**
```typescript
// apps/prism-dashboard/src/app/api/rules/[id]/route.ts
import { Clerk } from '@clerk/clerk-sdk-node';
import { getPrismContainer } from '@/lib/cosmos';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const container = await getPrismContainer();
  const result = await container.items.create({ id: params.id });
  return NextResponse.json(result.resource);
}
```

### Task 3: Update a Shared Package

```bash
# 1. Make changes in packages/db
# packages/db/src/schema.ts

# 2. Update version (pnpm handles this)
pnpm install

# 3. Test locally in dependent apps
turbo run test --filter=apps/agency

# 4. CI will automatically publish to npm on merge
```

### Task 4: Fix a Dependency Version Mismatch

```bash
# Check mismatches across workspaces
npx syncpack list-mismatches

# Auto-fix
npx syncpack fix-mismatches

# Reinstall
pnpm install
```

---

## 🔍 Debugging Monorepo Issues

### Issue: "Module not found" after installing package

```bash
# Cause: Workspace hoisting issue
# Fix: 
pnpm install
turbo run build --filter=packages/ui
turbo run build --filter=apps/agency
```

### Issue: Build succeeds locally but fails in CI

```bash
# Cause: Cached artifacts not cleaned
# Fix:
turbo clean              # Remove .turbo/ and build outputs
pnpm install
turbo run build
```

### Issue: "Invalid Hook Call" across workspaces

```bash
# Cause: React version mismatch between apps/packages
# Check:
npx syncpack list-mismatches

# Fix:
npx syncpack fix-mismatches
pnpm install
```

### Issue: App-to-app import works locally but fails in CI

```bash
# Cause: Importing from another app (forbidden pattern)
# Fix: Move code to packages/

# Before:
// apps/agency/src/helpers.ts → used by apps/prism-dashboard

// After:
// packages/shared-helpers/src/index.ts
// Import in both apps:
import { helper } from "@jeffdev/shared-helpers";
```

---

## 📋 Testing Strategy

### Unit Tests (Vitest)
```bash
turbo run test:unit              # Run all unit tests
turbo run test:unit:watch        # Watch mode
turbo run test:unit --filter=apps/agency
```

### E2E Tests (Playwright)
```bash
turbo run test:e2e                    # Run all E2E tests
turbo run test:e2e:ui --filter=apps/agency  # UI mode for one app
```

### Coverage Reports
```bash
turbo run test:coverage
# Reports in apps/*/coverage/
```

---

## 🚢 Deployment Workflow

### Vercel (Automatic)
Each app has its own Vercel project:
- Push to `main` → Auto-deploy
- Pull request → Preview deployment
- Secrets via Doppler integration

### Custom Deployments
```bash
# Build for production
turbo run build

# Create deployment artifacts
# Dockerfile references specific apps/*/dist or apps/*/.next
```

---

## 📚 Related Documentation

- [turbo.json](../../turbo.json) — Full Turborepo config
- [pnpm-workspace.yaml](../../pnpm-workspace.yaml) — Workspace members
- [Tech Stack Rules](../rules/tech-stack.md) — Dependencies & versions
- [Monorepo Geography](../rules/monorepo-geography.md) — Architectural boundaries
