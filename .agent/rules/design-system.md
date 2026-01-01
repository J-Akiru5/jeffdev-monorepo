---
trigger: always_on
---

💎 JEFFDEV MONOREPO - VISUAL CONSTITUTION
1. CORE PHILOSOPHY ("THE ENDGAME")
Vibe: Precision Engineering, Stealth Luxury, "Operating System" feel.

The "Void" Law: The universe is #050505. There is no light mode.

The "Anti-Template" Rule: If it looks like a standard Bootstrap/Material template, reject it. We build custom interfaces that feel like specialized tools.

2. PRIMITIVES (THE ATOMS)
A. Color Palette
Canvas (Backgrounds):

bg-void: #050505 (Base Layer - application background).

bg-glass: rgba(10, 10, 10, 0.6) (Card/Panel Layer + backdrop-blur-xl).

bg-surface: #0a0a0a (Solid alternative when blur is too heavy).

Accents (Holographic Gradients):

primary-cyan: #06b6d4 (Cyan-500) → Used for "Information/Tech".

primary-purple: #8b5cf6 (Violet-500) → Used for "Creative/Vibe".

success-emerald: #10b981 (Emerald-500) → Used for "Status: Online/Paid".

Borders (The "Wireframe"):

border-subtle: rgba(255, 255, 255, 0.08) (Default dividers).

border-active: rgba(255, 255, 255, 0.15) (Hover states).

B. Typography
Headings (The Voice): Inter (Variable).

Tracking: -0.02em (Tight).

Weights: 600 (SemiBold) to 900 (Black).

Technical Data (The Code): JetBrains Mono.

Mandatory Usage: Tags, Pricing numbers, Dates, IDs, Code Snippets.

Tracking: -0.01em.

Example: <span className="font-mono text-xs text-white/50">ID: 994-A</span>

C. Geometry (Selected: Precision)
Radius: rounded-md (6px) or rounded-sm (4px).

Constraint: NEVER use rounded-xl or rounded-2xl unless building a massive modal overlay. We are sharp, industrial, and fast. Not bubbly or "friendly."

3. MOBILE ADAPTATION PROTOCOL ("THE THUMB ZONE")
Goal: Native App Feel on the Web.

A. Navigation Transformation
Desktop Strategy: Sidebar (Left) or Minimal Top Bar.

Mobile Strategy (The Android Standard):

Sidebar MUST disappear.

Bottom Navigation Bar appears fixed at bottom-0.

Height: h-16 (64px).

Structure: 4-5 core icons evenly spaced.

Glassmorphism: bg-black/80 backdrop-blur-lg border-t border-white/10.

Z-Index: z-50 (Always on top).

B. "Reachability" Layouts
Action Buttons (FABs): Primary actions (e.g., "New Project", "Save") on mobile must be floating or fixed at the bottom right, accessible by the thumb.

Search Bars: On mobile, search bars move to the top, but filter controls move to a bottom drawer/sheet.

4. COMPONENT ARCHITECTURE (packages/ui)
A. Buttons ("Ghost Glow")
The primary action is NOT a solid block of color. It is a void that glows.

Base: bg-black/50 backdrop-blur-md border border-white/10.

Interactive: Hover triggers a "Border Beam" or internal glow.

Code Reference (Tailwind):

TypeScript

<button className="group relative overflow-hidden rounded-md border border-white/10 bg-black/20 px-6 py-2 transition-all hover:border-white/20 active:scale-95">
  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
  <span className="font-mono text-sm uppercase tracking-wider text-white">
    Execute_
  </span>
</button>
B. Cards ("Glass Panels")
Surface: Never pure black. Use bg-white/[0.02].

Border: border border-white/[0.05].

Highlight: A subtle radial-gradient from the top-center simulates a spotlight.

C. Inputs (Headless UI)
Style: No background (bg-transparent). Bottom border ONLY or minimal full border.

Focus: No blue ring. The border turns White or Cyan (border-cyan-500).

Font: Always JetBrains Mono for user input fields.

5. TECHNICAL IMPLEMENTATION (AGENCY & PRISM)
Library: All components in packages/ui must implement these styles using Headless UI logic + Tailwind classes.

Animation:

Use framer-motion for complex state changes (e.g., Bottom Sheet sliding up).

Use group-hover CSS for simple interactions (e.g., Button glow).

Icons: Use Lucide React with stroke-width={1.5} (Thin, precise lines).