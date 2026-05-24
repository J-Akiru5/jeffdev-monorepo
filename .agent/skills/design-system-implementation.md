# Design System: Ghost Glow Implementation

This skill covers building user interfaces according to JeffDev's proprietary "Ghost Glow" design system—a dark-mode-only, high-precision UI framework for building premium, professional interfaces.

## 🎨 Design Philosophy

**The Void Universe:** Everything is built on `#050505` (absolute black)  
**The "Operating System" Vibe:** Interfaces feel like specialized professional tools, not marketing sites  
**Ghost Glow Aesthetic:** Buttons and interactive elements are transparent/dark with glowing borders on hover  
**Precision Typography:** Distinct roles for Inter (headings) and JetBrains Mono (technical data)  
**Dark Mode Only:** No light mode variants exist; the system assumes darkness

---

## 🎭 Color Palette

### Backgrounds

| Token          | Hex                  | Usage                                   | CSS                            |
| -------------- | -------------------- | --------------------------------------- | ------------------------------ |
| **bg-void**    | `#050505`            | Base application background             | `bg-black` (or `#050505`)      |
| **bg-glass**   | `rgba(10,10,10,0.6)` | Cards, panels (with `backdrop-blur-xl`) | `bg-black/60 backdrop-blur-xl` |
| **bg-surface** | `#0a0a0a`            | Solid alternative (no blur)             | `bg-gray-950`                  |

### Accents (Holographic Gradients)

| Token               | Hex                     | Usage                | Purpose               |
| ------------------- | ----------------------- | -------------------- | --------------------- |
| **primary-cyan**    | `#06b6d4` (Cyan-500)    | Buttons, highlights  | Information / Tech    |
| **primary-purple**  | `#8b5cf6` (Violet-500)  | Secondary actions    | Creative / Vibe       |
| **success-emerald** | `#10b981` (Emerald-500) | Status indicators    | Status: Online / Paid |
| **warning-amber**   | `#f59e0b` (Amber-500)   | Warnings             | Caution / Review      |
| **error-red**       | `#ef4444` (Red-500)     | Errors / Destructive | Error / Delete        |

### Borders (The "Wireframe")

| Token             | Value                    | Usage                      |
| ----------------- | ------------------------ | -------------------------- |
| **border-subtle** | `rgba(255,255,255,0.08)` | Default dividers, inactive |
| **border-active** | `rgba(255,255,255,0.15)` | Hover states, focus        |
| **border-hover**  | `rgba(255,255,255,0.20)` | Interactive elements       |

---

## ✍️ Typography

### Heading Font: Inter (Variable Weight)

```tsx
// Tailwind class: font-sans (configured for Inter)
<h1 className="text-4xl font-black -tracking-[0.02em] text-white">
  Bold Heading
</h1>

<h2 className="text-2xl font-semibold -tracking-[0.02em] text-white">
  Section Title
</h2>
```

**Rules:**

- Headings: Weights 600 (Semibold) to 900 (Black)
- Tracking: `-0.02em` (tight, professional)
- Color: Always `text-white` in dark mode

### Data Font: JetBrains Mono (Monospace)

```tsx
// Tailwind class: font-mono
<span className="font-mono text-xs text-white/50">
  ID: 994-A
</span>

<code className="font-mono text-sm text-cyan-400 bg-black/50 px-2 py-1 rounded-sm">
  const value = true;
</code>
```

**Rules:**

- Tags, IDs, prices, dates, code snippets
- Weight: 400-600 (Regular to SemiBold)
- Tracking: `-0.01em`
- Color: Usually `text-white/70` or accent color

---

## 🔲 Component Patterns

### Pattern 1: Ghost Glow Button

The signature interaction element—transparent button with glowing border on hover.

```tsx
// packages/ui/src/Button.tsx
"use client";

export function Button({
  variant = "default",
  size = "md",
  children,
  ...props
}) {
  return (
    <button
      className={`
        group relative overflow-hidden rounded-md
        border border-white/10
        bg-black/20 backdrop-blur-md
        px-6 py-2.5
        transition-all duration-200
        
        hover:border-white/20 hover:bg-black/30
        active:scale-95
        
        focus:outline-none focus:ring-1 focus:ring-cyan-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      {...props}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 blur-xl" />
      </div>

      <span className="relative font-mono text-sm uppercase tracking-wider text-white">
        {children}
      </span>
    </button>
  );
}
```

**Variants:**

- `variant="cyan"` → Cyan accent
- `variant="purple"` → Purple accent
- `variant="ghost"` → Minimal border
- `variant="danger"` → Red accent for destructive actions

### Pattern 2: Glass Card

Data containers with subtle glass effect.

```tsx
// packages/ui/src/Card.tsx
"use client";

export function Card({ variant = "default", children, ...props }) {
  return (
    <div
      className={`
        rounded-md
        border border-white/[0.05]
        bg-white/[0.02] backdrop-blur-md
        p-6
        
        ${
          variant === "interactive"
            ? "hover:border-white/[0.1] hover:bg-white/[0.03] transition-all"
            : ""
        }
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Usage:
<Card variant="interactive">
  <h3 className="font-semibold text-white">Project Title</h3>
  <p className="text-white/60 text-sm mt-2">Description here</p>
</Card>;
```

### Pattern 3: Input Field (Minimal Border)

No background, border appears on focus only.

```tsx
// packages/ui/src/Input.tsx
"use client";

export function Input({ placeholder, ...props }) {
  return (
    <input
      className={`
        w-full
        font-mono text-sm text-white
        bg-transparent
        border-b border-white/10
        pb-2 px-0
        
        placeholder:text-white/30
        focus:outline-none
        focus:border-cyan-500/50
        focus:bg-white/[0.02]
        focus:transition-colors
        
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      placeholder={placeholder}
      {...props}
    />
  );
}
```

### Pattern 4: Badge (Status Indicator)

Lightweight tag for categorization.

```tsx
// packages/ui/src/Badge.tsx
'use client';

export function Badge({
  variant = 'default',
  children,
  ...props
}) {
  const variantClasses = {
    default: 'bg-white/[0.05] text-white/70 border-white/10',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/10 text-red-400 border-red-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  };

  return (
    <span
      className={`
        inline-flex items-center
        rounded-full
        border px-3 py-1
        font-mono text-xs uppercase tracking-wider
        ${variantClasses[variant]}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

// Usage:
<Badge variant="success">Active</Badge>
<Badge variant="warning">Review</Badge>
```

---

## 📱 Mobile Adaptation (The "Thumb Zone")

### Navigation: Sidebar → Bottom Bar

**Desktop:**

```tsx
// layouts/desktop-sidebar.tsx
<aside className="fixed left-0 top-0 h-screen w-64 bg-black/50 border-r border-white/10 backdrop-blur">
  {/* Navigation items */}
</aside>

<main className="ml-64">{children}</main>
```

**Mobile:**

```tsx
// layouts/mobile-bottom-nav.tsx
<nav className="fixed bottom-0 left-0 right-0 h-16 bg-black/80 border-t border-white/10 backdrop-blur-lg z-50">
  <div className="flex justify-around items-center h-full">
    {/* 4-5 icon buttons */}
  </div>
</nav>

<main className="pb-20">{children}</main>
```

### Responsive Breakpoints

```tsx
// Conditional rendering
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function Navigation() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <MobileNav /> : <DesktopSidebar />;
}
```

### Bottom Sheet for Mobile Filters

```tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function FilterSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Filters</button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 rounded-t-lg"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Filter controls */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## 🎬 Animation Patterns

### Micro: Hover/Click Feedback

```tsx
// Use CSS transitions + Tailwind group-hover
<div className="group rounded-md border border-white/10 hover:border-white/20 transition-colors">
  <p className="text-white/60 group-hover:text-white transition-colors">
    Hover to reveal
  </p>
</div>
```

### Macro: Layout Shifts & Modal Opens

```tsx
"use client";
import { motion } from "framer-motion";

export function ModalDialog({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <Card>{children}</Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Scroll Animations

```tsx
"use client";
import Lenis from "@studio-freight/lenis";
import { useEffect } from "react";

export function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis();

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return children;
}
```

---

## 🎨 Tailwind Configuration

```javascript
// tailwind.config.js (in packages/ui or app)
export default {
  theme: {
    extend: {
      colors: {
        void: "#050505",
        glass: "rgba(10, 10, 10, 0.6)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backdropBlur: {
        xl: "80px",
      },
    },
  },
  plugins: [],
};
```

---

## 📚 Component Checklist

Before building a new component, ensure:

- [ ] Dark mode only (no light variants)
- [ ] Uses Ghost Glow borders for interactive elements
- [ ] Monospace for technical data (IDs, prices, dates)
- [ ] Rounded: `rounded-md` (6px) or `rounded-sm` (4px)—never `rounded-xl` or `rounded-2xl`
- [ ] Hover state defined (border glow, color shift, or subtle scale)
- [ ] Active state (`active:scale-95` for buttons)
- [ ] Focus state (ring-cyan-500/50 for keyboard nav)
- [ ] Disabled state with `opacity-50`
- [ ] Mobile responsive (sidebar → bottom nav)
- [ ] Accessibility: `aria-*` labels, semantic HTML

---

## 📚 Related Documentation

- [Design System Rules](../rules/design-system.md) — Full design specification
- [@jdstudio/ui Components](../../packages/ui/src/index.ts) — Available components
- [Tech Stack](../rules/tech-stack.md) — Design tool versions
