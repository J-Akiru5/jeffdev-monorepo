/**
 * Prism3D
 * -------
 * A pure-CSS rotating triangular prism with glassmorphism, used as the mark at
 * the centre of the landing hero.
 *
 * The styles live in `app/globals.css` under "THE PRISM". They used to be a
 * `<style jsx>` block in this file, which broke the page: `styled-jsx` is only a
 * transitive dependency of Next here, and pnpm's strict isolation
 * (`.npmrc` sets `shamefully-hoist=false`) means the app cannot resolve it — so
 * the component threw during hydration and the error boundary replaced the whole
 * document with "Something went wrong".
 *
 * That move also fixed the prism's appearance. Its `:global(.dark)` overrides
 * never matched, because this app marks dark mode with `data-theme="dark"` and
 * has no `.dark` class — so the prism always drew its light-mode edges onto the
 * dark canvas. See the CSS comment for the details.
 *
 * This is a presentational component with no hooks or browser APIs, so it is
 * deliberately NOT a client component: it renders on the server and costs
 * nothing in the client bundle.
 *
 * The `size` and `withBeam` props were removed along with the dead
 * `components/hero/scenes` cluster — the only call site that passed them.
 */

import clsx from "clsx";

interface Prism3DProps {
  className?: string;
}

export function Prism3D({ className }: Prism3DProps) {
  return (
    <div
      className={clsx(
        "relative flex items-center justify-center",
        className,
      )}
    >
      <div className="prism-scene">
        <div className="prism-pivot">
          {/* Side 1 */}
          <div className="prism-face prism-side prism-side-1">
            <div className="prism-shine" />
          </div>
          {/* Side 2 */}
          <div className="prism-face prism-side prism-side-2">
            <div className="prism-shine" />
          </div>
          {/* Side 3 */}
          <div className="prism-face prism-side prism-side-3">
            <div className="prism-shine" />
          </div>

          {/* Top cap (triangle) */}
          <div className="prism-face prism-cap prism-cap-top" />
          {/* Bottom cap (triangle) */}
          <div className="prism-face prism-cap prism-cap-bottom" />

          {/* Internal glow core */}
          <div className="prism-core" />
        </div>
      </div>
    </div>
  );
}

export default Prism3D;
