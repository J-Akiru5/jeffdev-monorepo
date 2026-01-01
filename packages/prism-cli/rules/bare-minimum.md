# Bare Minimum Design System Rules

> **Template**: bare-minimum  
> **Vibe**: Ultra-minimal, Functional, No-nonsense

## Core Philosophy

Less is more, taken to the extreme. No shadows, no gradients, no blur effects. Just clean typography, generous whitespace, and perfect alignment. Every pixel must earn its place.

## Color Palette

### Canvas
- `bg-page`: #ffffff (Light mode) / #0a0a0a (Dark mode)
- `bg-surface`: #f5f5f5 (Light) / #141414 (Dark)

### Text
- `text-primary`: #0a0a0a (Light) / #ffffff (Dark)
- `text-secondary`: #666666 (Light) / #a0a0a0 (Dark)

### Accents
- `accent`: #0a0a0a (Light) / #ffffff (Dark)
- No color gradients - monochrome only

### Borders
- `border`: #e5e5e5 (Light) / #252525 (Dark)
- 1px solid only - never thicker

## Typography

### Font Stack
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Scale
- Display: 48px / 1.1 line-height
- H1: 32px / 1.2
- H2: 24px / 1.3
- H3: 18px / 1.4
- Body: 16px / 1.5
- Small: 14px / 1.5

### Weights
- Regular (400) for body
- Medium (500) for emphasis
- Semibold (600) for headings only

## Geometry

- **Border Radius**: 0px (sharp corners) OR 2px (subtle rounding)
- **Shadows**: NONE - use borders instead
- **Blur**: NONE - fully opaque surfaces only

## Component Patterns

### Buttons
```jsx
// Primary
<button className="bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
  Action
</button>

// Secondary
<button className="border border-black text-black px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition-colors">
  Action
</button>
```

### Cards
```jsx
<div className="border border-gray-200 p-6">
  <h3 className="font-semibold">Title</h3>
  <p className="text-gray-600 mt-2">Description</p>
</div>
```

### Inputs
```jsx
<input 
  className="w-full border-b border-gray-300 py-2 focus:border-black outline-none transition-colors"
  placeholder="Enter text..."
/>
```

## Layout Principles

- Maximum content width: 1200px
- Generous padding: 24px mobile, 48px desktop
- Consistent spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
- No decorative elements

## Animation

- Transitions: 150ms ease-out only
- No spring animations
- No entrance animations
- Only hover state changes

## Icons

- Line icons only, 1.5px stroke
- Monochrome (same color as text)
- 16px, 20px, or 24px sizes only

---

## Figma Prompt

```
Create a ultra-minimal interface with these strict rules:

STYLE: Swiss design inspired, Dieter Rams philosophy - "Less, but better"

COLORS:
- Light mode: #ffffff background, #0a0a0a text
- Dark mode: #0a0a0a background, #ffffff text
- Secondary text: 60% opacity of primary
- Accent: Same as text color (monochrome only)
- NO color gradients, NO multi-color accents

TYPOGRAPHY:
- System font stack (SF Pro, Segoe UI, etc.)
- Strict type scale: 14, 16, 18, 24, 32, 48px
- Regular weight for body, semibold for headings only
- Generous line-height (1.4-1.5)

GEOMETRY:
- 0px or 2px border radius (sharp or barely rounded)
- NO shadows whatsoever
- NO blur effects
- 1px borders only

EFFECTS:
- None - completely flat design
- Only color change on hover (no transforms)

LAYOUT:
- 8px grid system
- Maximum width containers
- Generous whitespace (ratio: content 1, space 2)
- Strict vertical rhythm

PHILOSOPHY:
- If it doesn't serve a function, remove it
- No decorative elements
- Perfect alignment is non-negotiable
```
