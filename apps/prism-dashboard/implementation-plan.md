# Prism Dashboard Beautification – Implementation Plan

## Goals
- Match the marketing/landing visual quality while staying app-focused (toned-down holographic OS feel).
- Centralize styling into shared components in `@jdstudio/ui`; avoid per-page bespoke CSS.
- Add mobile-first UX with an Android-style bottom navigation bar that matches the brand system.
- Keep performance friendly (no heavy parallax on the app), with clear accessibility and focus states.

## Stack & Constraints
- Next.js App Router (app dir), Tailwind v4 tokens defined in `globals.css`.
- Auth via Clerk; layout shell at `src/app/(dashboard)/layout.tsx`; dashboard page at `src/app/(dashboard)/dashboard/page.tsx`.
- Shared library `@jdstudio/ui` provides Button/Card/Input/Badge/ProgressBar/DataTable; extend there first.
- Design system in `.agent/rules/design-system.md` (void bg, glass, cyan→purple accents, tight tracking, 6px radii, mono for data).
- Motion: subtle entrance/hover only; no continuous parallax on dashboard.

## Mobile-First Requirements
- Responsive-first layouts; ensure all grids collapse gracefully to single column.
- Introduce bottom navigation (Android-inspired):
  - Glass bar: `bg-black/80`, `backdrop-blur-lg`, `border-t border-white/10`, height `h-16`, `z-50`.
  - 4–5 core icons evenly spaced; active state uses cyan accent and thin top indicator.
  - Accommodate safe-area insets; hide left sidebar on mobile.
- Primary actions available to the thumb (e.g., floating CTA or prominent button near bottom on small screens).

## Phased Execution

### Phase 1 – Tokens & Foundations
- Extend `globals.css` tokens: elevated glass levels, spotlight radial, grid line color, glow shadows, gradient presets.
- Expose new tokens via `@theme inline` for Tailwind utility use.

### Phase 2 – Shared UI Enhancements (`@jdstudio/ui`)
- Add components/variants:
  - `GlassPanel`/`Panel` with spotlight and glow border states.
  - `MetricTile` (label, value, icon, trend/footnote) with hover beam.
  - `CTAButton` ghost-glow variant; `IconPill` for small chips.
  - `SectionHeader` (kicker + title + optional actions).
  - `GridBackground` overlay (lightweight, toggleable).
  - Motion wrappers (framer-motion) for fade/slide in; export optional helpers.
- Update Button/Card variants to include holographic/glass options and consistent radii/border.

### Phase 3 – Shell & Navigation
- Refine `(dashboard)/layout.tsx`:
  - Sidebar: glass surface, tighter tracking, active/hover beam, consistent icon sizing.
  - Add responsive behavior: hide sidebar on mobile, introduce bottom nav bar; ensure header spacing/padding.
  - Define `PageShell` spacing (paddings, max widths, background overlays) and apply to children.

### Phase 4 – Dashboard Screen Redesign
- Header hero strip: product pill, title, subcopy, primary/secondary CTA buttons (ghost-glow), optional doc link.
- Stats row: swap to `MetricTile` components with iconography and mono footers.
- Quick actions: two-up gradient CTAs with subtle spotlight and clear action labels.
- Recent projects: glass cards with meta (stack, design system, updated date), hover glow; add empty state.
- Add optional background grid/vignette for depth (toggleable for perf).

### Phase 5 – Responsive Polish & States
- Implement bottom nav; ensure route highlighting and touch targets ≥48px.
- Add floating primary action on mobile (e.g., “New Project”) where contextually relevant.
- Empty/loading states: branded empties, skeleton shimmer for tiles/panels; consistent toasts/snackbars.
- Accessibility: focus rings, contrast on glass, reduced-motion respects `prefers-reduced-motion`.

### Phase 6 – QA & Launch
- Visual QA on desktop + mobile breakpoints; check Clerk surfaces under new theme.
- Performance sanity: ensure grids/spotlights are lightweight; no layout thrash.
- Verify navigation (sidebar/bottom nav) works across routes; lint/typecheck.

## Deliverables
- Updated tokens in `globals.css`.
- New/updated shared UI components in `@jdstudio/ui` with docs/stories (if applicable).
- Refined dashboard layout + main dashboard page using shared components.
- Mobile bottom nav and responsive adjustments across dashboard shell.
- Documented usage notes inline (succinct comments) and in this plan.