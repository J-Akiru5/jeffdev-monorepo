# 8-Bit Nostalgia Design System Rules

> **Template**: 8bit-nostalgia  
> **Vibe**: Retro Gaming, Pixel Perfect, Playful Nostalgia

## Core Philosophy

Embrace the charm of early computing and 8-bit gaming. Pixel fonts, limited color palettes, and chunky borders. The UI should feel like a love letter to the NES/SNES era while remaining functional for modern applications.

## Color Palette

### Primary Palette (NES Inspired)
- `bg-dark`: #0f0f23 (Deep space blue)
- `bg-medium`: #1a1a2e (Midnight)
- `bg-light`: #16213e (Navy)

### Accent Colors
- `pixel-cyan`: #00fff5 (Aqua glow)
- `pixel-magenta`: #ff00ff (Hot pink)
- `pixel-yellow`: #ffff00 (Pure yellow)
- `pixel-green`: #00ff00 (Matrix green)
- `pixel-red`: #ff0054 (Danger red)

### Grayscale
- Use only: #ffffff, #cccccc, #888888, #444444, #000000
- No subtle grays - distinct steps only

## Typography

### Pixel Fonts (Required)
```css
/* Primary - for body text */
font-family: 'Press Start 2P', 'VT323', monospace;

/* Alternative - easier reading */
font-family: 'VT323', 'Courier New', monospace;
```

### Sizes
- Only use multiples of 8: 8px, 16px, 24px, 32px, 48px
- Line-height: 1.5 or 2 (generous for pixel fonts)

### No font smoothing!
```css
-webkit-font-smoothing: none;
-moz-osx-font-smoothing: grayscale;
image-rendering: pixelated;
```

## Geometry

### Pixel-Perfect Borders
- Border width: 2px, 4px, or 8px only
- NEVER use 1px or odd numbers
- No border-radius - everything is squared

### Box Shadows (8-Bit Style)
```css
/* Hard pixel shadow - no blur */
box-shadow: 4px 4px 0 #000000;
```

## Component Patterns

### Pixel Button
```jsx
<button className="border-4 border-white bg-[#0f0f23] px-6 py-3 font-pixel text-white shadow-[4px_4px_0_#00fff5] transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_#00fff5] active:translate-x-2 active:translate-y-2 active:shadow-none">
  START GAME
</button>
```

### Pixel Card
```jsx
<div className="border-4 border-[#00fff5] bg-[#0f0f23] p-6 shadow-[8px_8px_0_rgba(0,255,245,0.3)]">
  <h3 className="font-pixel text-lg text-[#00fff5]">LEVEL 01</h3>
  <p className="mt-2 font-pixel text-sm text-white">Description here</p>
</div>
```

### Pixel Input
```jsx
<input 
  className="w-full border-4 border-white bg-transparent px-4 py-3 font-pixel text-white focus:border-[#00fff5] focus:outline-none"
  placeholder="ENTER NAME..."
/>
```

### Scanlines Effect (Optional)
```css
.scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
}
```

## Animation

### Blink Animation
```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.blink { animation: blink 1s step-end infinite; }
```

### Hover Effects
- Use translate, not scale
- Step transitions, not smooth: `transition: all 0s`
- Color swaps on hover (no fade)

## Sound Effects (If Applicable)
- 8-bit blips for interactions
- Chiptune vibes
- Keep audio optional and toggle-able

## Icons

### Style
- Use pixel art icons (Phosphor Icons "fill" style works)
- Or create custom 16x16 or 32x32 pixel sprites
- No smooth/anti-aliased icons

---

## Figma Prompt

```
Create a retro 8-bit gaming inspired interface:

STYLE: NES/SNES era gaming, pixel perfect, nostalgic but usable

COLORS:
- Background: Deep dark blue (#0f0f23)
- Primary accent: Bright cyan (#00fff5)
- Secondary: Hot magenta (#ff00ff)
- Tertiary: Pure yellow (#ffff00)
- Use a LIMITED palette (max 8 colors like old consoles)
- High contrast between elements

TYPOGRAPHY:
- Pixel fonts only (Press Start 2P, VT323)
- Sizes in multiples of 8 (8px, 16px, 24px)
- All caps for headers
- NO anti-aliasing hint (crispy pixels)

GEOMETRY:
- NO border radius - everything is square
- Thick borders (4px or 8px)
- Hard drop shadows offset by 4-8px (no blur)
- Everything aligns to an 8px grid

EFFECTS:
- Pixel-perfect hard shadows
- CRT scanline overlay (optional)
- Glow effects using solid color outlines
- NO gradients, NO blur, NO glassmorphism

DECORATIONS:
- Pixel art icons and sprites
- 8-bit style illustrations
- Star/sparkle decorations
- Health bar / progress bar gaming metaphors

ANIMATION HINTS:
- Blinking cursors
- Step-based movement (no easing)
- Color cycling for highlights
- "Press Start" blinking text

MOOD:
- Fun and playful
- Nostalgic but not childish
- Clear visual hierarchy despite limited palette
```
