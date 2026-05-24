/**
 * Beta Badge Component
 *
 * Superscript-style badge with pulsing cyan/purple glow effect.
 * Used to indicate beta status of Prism Context Engine.
 */

export function BetaBadge() {
  return (
    <span className="relative ml-1 inline-flex items-center">
      {/* Pulsing glow effect */}
      <span className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-cyan-500/50 to-violet-500/50 blur-sm" />

      {/* Badge */}
      <span className="relative -top-2 inline-flex items-center rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
        Beta
      </span>
    </span>
  );
}

/**
 * Beta Notice Banner
 *
 * Full-width notice for docs/landing pages.
 */
export function BetaNotice() {
  return (
    <div className="w-full bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-cyan-500/10 border-b border-cyan-500/20 py-2 px-4">
      <p className="text-center text-sm text-white/80">
        <span className="inline-flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            Beta
          </span>
          <span>
            Prism Context Engine is currently in beta. Some features are still
            being refined.
          </span>
        </span>
      </p>
    </div>
  );
}
