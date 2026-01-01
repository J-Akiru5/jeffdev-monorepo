# Glassmorphic Design System Rules

> **Template**: glassmorphic  
> **Vibe**: Futuristic, Premium, Floating Layers

## Core Philosophy

Everything floats. Glass panels hover over gradient backgrounds. Blur is your best friend. The UI should feel like it exists in a translucent, dreamlike space where depth is created through transparency rather than shadows.

## Color Palette

### Background Layers
- `bg-gradient`: Linear gradient mesh (multiple overlapping gradients)
- Example: `from-purple-900 via-blue-900 to-teal-900`
- The background should feel alive, not static

### Glass Surfaces
- `glass-light`: rgba(255, 255, 255, 0.1)
- `glass-medium`: rgba(255, 255, 255, 0.15)
- `glass-heavy`: rgba(255, 255, 255, 0.25)

### Text
- `text-primary`: #ffffff
- `text-secondary`: rgba(255, 255, 255, 0.7)
- `text-muted`: rgba(255, 255, 255, 0.5)

### Accents
- Preferred: Gradient text/borders
- From: #60a5fa (Blue-400)
- Via: #a78bfa (Violet-400)
- To: #f472b6 (Pink-400)

### Borders
- `border-glass`: rgba(255, 255, 255, 0.18)
- Gradient borders are encouraged

## Typography

### Font
- **Primary**: Plus Jakarta Sans or Inter
- **Monospace**: SF Mono or JetBrains Mono

### Weights
- Light (300) for large display text
- Regular (400) for body
- Semibold (600) for headings
- Bold (700) for emphasis

## Effects

### Blur (Critical)
```css
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
```

### Border Glow
```css
box-shadow: 
  0 0 0 1px rgba(255, 255, 255, 0.1),
  0 8px 32px rgba(0, 0, 0, 0.3);
```

### Gradient Border Trick
```jsx
<div className="relative p-[1px] rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
  <div className="bg-black/80 backdrop-blur-xl rounded-xl p-6">
    Content
  </div>
</div>
```

## Geometry

- **Border Radius**: rounded-xl (12px) to rounded-2xl (16px)
- **Generous rounding** - everything should feel soft
- **No sharp corners** except for small chips/badges

## Component Patterns

### Glass Card
```jsx
<div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
  {/* Gradient orb decoration */}
  <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-purple-500/30 blur-3xl" />
  <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />
  
  <div className="relative p-6">
    <h3 className="text-xl font-semibold text-white">Card Title</h3>
    <p className="mt-2 text-white/70">Card description</p>
  </div>
</div>
```

### Glass Button
```jsx
<button className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/30">
  Click me
</button>
```

### Gradient Text
```jsx
<h1 className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
  Gradient Heading
</h1>
```

## Animation

- **Micro-animations**: Scale 1.02 on hover
- **Floating elements**: Subtle y-axis oscillation
- **Gradient animation**: Slow color shift on backgrounds
- **Blur transitions**: Animate backdrop-blur values

## Layout

- Layered depth: Elements at different z-levels
- Floating action buttons
- Overlapping cards (negative margins)
- Generous padding (24-48px)

---

## Figma Prompt

```
Create a glassmorphic interface with these specifications:

STYLE: iOS/macOS inspired transparency, futuristic floating panels

BACKGROUND:
- Gradient mesh with multiple color nodes
- Colors: Deep purples (#3b0764), blues (#172554), teals (#134e4a)
- Blend mode: Normal with soft light overlays
- Animated gradient orbs (blurred circles) as decoration

GLASS SURFACES:
- Background: White at 5-15% opacity
- Border: White at 10-20% opacity
- Blur: 16-24px gaussian blur
- NO solid backgrounds - everything must be transparent

EFFECTS:
- Heavy use of backdrop-filter blur
- Soft glows instead of shadows
- Gradient borders on primary elements
- Floating orb decorations behind panels

TYPOGRAPHY:
- Clean sans-serif (Inter, Plus Jakarta Sans)
- White text with opacity variations
- Gradient text for headings
- Light weights for large text

GEOMETRY:
- Large border radius (12-24px)
- Rounded corners everywhere
- Soft, pillowy shapes
- No sharp angles

LAYOUT:
- Layered depth with overlapping elements
- Cards that appear to float
- Generous negative space
- Center-aligned compositions

ANIMATION HINTS:
- Suggest subtle scale on hover
- Floating animation on decorative orbs
- Gradient color shifts over time
```
