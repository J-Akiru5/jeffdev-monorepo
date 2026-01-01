# JDStudio Design System Rules

> **Template**: jdstudio  
> **Vibe**: Stealth Luxury, Precision Engineering, "Operating System" feel

## Core Philosophy

The JDStudio design system embodies the "Void" aesthetic - a universe of #050505 with carefully placed accents of cyan and purple. Every element should feel like it belongs on a specialized control panel, not a generic website.

## Color Palette

### Canvas (Backgrounds)
- `bg-void`: #050505 - Base application background
- `bg-glass`: rgba(10, 10, 10, 0.6) - Card/Panel layer with backdrop-blur-xl
- `bg-surface`: #0a0a0a - Solid alternative when blur is too heavy

### Accents (Holographic Gradients)
- `primary-cyan`: #06b6d4 (Cyan-500) - Information/Tech elements
- `primary-purple`: #8b5cf6 (Violet-500) - Creative/Vibe elements
- `success-emerald`: #10b981 (Emerald-500) - Status: Online/Paid

### Borders
- `border-subtle`: rgba(255, 255, 255, 0.08) - Default dividers
- `border-active`: rgba(255, 255, 255, 0.15) - Hover states

## Typography

### Headings
- **Font**: Inter (Variable)
- **Tracking**: -0.02em (Tight)
- **Weights**: 600 (SemiBold) to 900 (Black)

### Technical Data
- **Font**: JetBrains Mono
- **Usage**: Tags, Pricing, Dates, IDs, Code Snippets
- **Tracking**: -0.01em

```jsx
<span className="font-mono text-xs text-white/50">ID: 994-A</span>
```

## Geometry

- **Border Radius**: rounded-md (6px) or rounded-sm (4px)
- **NEVER** use rounded-xl or rounded-2xl - we are sharp, industrial, fast

## Component Patterns

### Buttons ("Ghost Glow")
```jsx
<button className="group relative overflow-hidden rounded-md border border-white/10 bg-black/20 px-6 py-2 transition-all hover:border-white/20 active:scale-95">
  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
  <span className="font-mono text-sm uppercase tracking-wider text-white">
    Execute_
  </span>
</button>
```

### Cards ("Glass Panels")
- Surface: `bg-white/[0.02]`
- Border: `border border-white/[0.05]`
- Highlight: Subtle radial-gradient from top-center

### Inputs
- Background: `bg-transparent`
- Border: Bottom border only, or minimal full border
- Focus: Border turns White or Cyan (no blue ring)
- Font: Always JetBrains Mono for user input

## Animation

- **Scroll**: @studio-freight/lenis (Smooth Scroll)
- **Micro**: framer-motion for layout shifts
- **Hover**: CSS group-hover for simple interactions

## Icons

- **Library**: Lucide React
- **Stroke Width**: 1.5 (Thin, precise lines)

## Mobile Adaptation

### Navigation
- Desktop: Sidebar (Left) or Minimal Top Bar
- Mobile: Bottom Navigation Bar (h-16, fixed)
  - Glassmorphism: `bg-black/80 backdrop-blur-lg border-t border-white/10`
  - Z-Index: z-50

### Reachability
- Primary actions: Fixed at bottom right
- Search: Top on mobile, filter controls in bottom drawer

---

## Figma Prompt

```
Create a modern dashboard interface with the following specifications:

STYLE: Stealth luxury, "operating system" aesthetic - NOT a generic SaaS template

COLORS:
- Background: #050505 (pure void black)
- Secondary surface: #0a0a0a with 60% opacity and heavy blur
- Primary accent: #06b6d4 (cyan) for interactive elements
- Secondary accent: #8b5cf6 (purple) for decorative gradients
- Text: White with various opacity levels (100%, 80%, 60%, 50%)
- Borders: White at 8% opacity, 15% on hover

TYPOGRAPHY:
- Headings: Inter font, semibold to black weight, tight letter-spacing
- Body: Inter regular
- Code/Data: JetBrains Mono for all technical content

GEOMETRY:
- Border radius: 6px maximum (sharp, industrial feel)
- Cards: Glass effect with subtle white/2% background
- Buttons: Ghost style with subtle gradient glow on hover

EFFECTS:
- Glassmorphism on floating panels
- Subtle radial gradient highlights from top of cards
- No heavy shadows - use border glows instead

LAYOUT:
- Generous whitespace
- Grid-based with 4-column responsive layout
- Sidebar navigation on desktop, bottom nav on mobile
```
