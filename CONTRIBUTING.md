# Contributing to JeffDev Monorepo

Welcome! To keep this repository clean, type-safe, and high-performing, please follow these guidelines when contributing.

## Monorepo Architecture

We organize code using **Turborepo** and **pnpm workspaces**:

- `apps/` contains deployable products and marketing sites.
- `packages/` contains shared code.

### 🚫 Boundary Rules

1.  **No Cross-App Imports:** Never import directly from one app to another. (e.g. importing from `apps/agency` to `apps/prism-dashboard` is strictly forbidden).
2.  **Shared UI First:** Generic components (Buttons, Modals, Inputs) must be built in `packages/ui` instead of duplicating them inside apps.

## Key Commands

- `pnpm install`: Install dependencies.
- `doppler run -- turbo dev`: Run the local dev server (requires Doppler CLI).
- `turbo run build`: Build all workspaces.
- `turbo run lint`: Lint all code.
- `turbo run check-types`: TypeScript check.
- `turbo run test`: Run tests.

## Code Standards

1.  **React 19 & Next.js 16:** Use Server Actions, `useTransition`, and server-side logic where possible. Ensure all Firestore timestamps or complex non-serializable objects are serialized (`.toISOString()`) before passing them across Server/Client component boundaries.
2.  **Design System:** Align UI components with the specifications in `DESIGN-SYSTEM.md` (e.g., `#050505` background, sharp `rounded-md` corners, glassmorphism card designs).
3.  **Clean Builds:** Pull requests must compile with zero typescript errors or linter warnings.
