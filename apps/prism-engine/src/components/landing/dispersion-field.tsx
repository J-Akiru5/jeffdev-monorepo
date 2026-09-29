/**
 * DispersionField — the page's atmosphere.
 *
 * This is the product's own physics: light enters a prism and leaves as a
 * spectrum. Because the light *bends*, the palette runs cyan → blue → violet →
 * magenta → rose → amber. That warm end is deliberate and it is the thing that
 * separates this from the standard two-colour developer glow, which is the
 * background every other tool in this category already has. A real refraction
 * bends into warm bands; drawing those bands is the difference between physics
 * and decoration.
 *
 * Three engineering decisions worth stating, because a background that stutters
 * or ships blank is worse than a plain one:
 *
 *  1. **No JavaScript.** This is a server component. The layers animate with CSS
 *     keyframes, so the atmosphere is painted with the first HTML and costs
 *     nothing in the client bundle or on hydration. The scroll story lives in
 *     the hero, where it can be driven properly.
 *  2. **`position: fixed`, content scrolls over it.** Depth comes from the
 *     backdrop holding still while the page moves. Getting this from JS would
 *     mean a scroll listener on every frame for an effect CSS already gives.
 *  3. **Transform and opacity only.** Nothing here animates a layout property,
 *     and the caustics use radially-soft colour stops rather than
 *     `filter: blur()`, so no layer has to be re-rasterised per frame.
 *
 * The scroll-linked sheen at the bottom is progressive enhancement: it is
 * wrapped in `@supports (animation-timeline: scroll())`, so browsers without
 * scroll-driven animations simply get the animated field and no sheen.
 *
 * `aria-hidden` because it is entirely decorative, and the vignette inside it is
 * load-bearing for text contrast, not ornament.
 */

export function DispersionField() {
  return (
    <div aria-hidden="true" className="dispersion-field">
      {/* The light the page sits in */}
      <div className="df-caustic df-caustic-cyan" />
      <div className="df-caustic df-caustic-violet" />
      <div className="df-caustic df-caustic-rose" />
      <div className="df-caustic df-caustic-amber" />

      {/* The rules lattice */}
      <div className="df-lattice" />

      {/* The spectrum leaving it */}
      <div className="df-fan" />

      {/* Scroll-linked spectral sheen (progressive enhancement) */}
      <div className="df-sheen" />

      {/* Contrast floor for body copy */}
      <div className="df-vignette" />
    </div>
  );
}

export default DispersionField;
