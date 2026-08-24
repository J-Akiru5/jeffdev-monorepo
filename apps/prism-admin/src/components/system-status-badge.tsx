"use client";

/**
 * SystemStatusBadge (Phase 5) — replaces the hardcoded pulsing-green dot.
 *
 * Fetches /api/admin/system-status once on mount and renders the aggregate
 * state with per-check detail. States: operational (green) / degraded
 * (amber) / down (rose) / unknown (grey, on fetch failure).
 */

import { useEffect, useState } from "react";

interface CheckDetail {
  ok: boolean;
  latencyMs: number;
  configured?: boolean;
  detail?: string;
  status?: string;
}

interface StatusPayload {
  status: "operational" | "degraded" | "down";
  checks: Record<string, CheckDetail>;
  failing?: string[];
}

const STYLES: Record<
  string,
  { dot: string; text: string; label: string }
> = {
  operational: {
    dot: "bg-emerald-500 animate-pulse",
    text: "text-emerald-400",
    label: "System Operational",
  },
  degraded: {
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-400",
    label: "Degraded",
  },
  down: { dot: "bg-rose-500", text: "text-rose-400", label: "Systems Down" },
  unknown: { dot: "bg-white/30", text: "text-white/40", label: "Status Unknown" },
};

export function SystemStatusBadge() {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/system-status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: StatusPayload) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const key = failed ? "unknown" : (payload?.status ?? "unknown");
  const fallback = STYLES.unknown;
  const style = (key in STYLES ? STYLES[key] : fallback) as NonNullable<
    typeof fallback
  >;

  return (
    <div className="group relative flex items-center gap-2 text-xs text-white/40 font-mono">
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      <span className={style.text}>{style.label}</span>
      {payload && payload.failing && payload.failing.length > 0 && (
        <span className="text-rose-300/80">({payload.failing.join(", ")})</span>
      )}
      {payload && (
        <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 hidden w-72 rounded-lg border border-white/10 bg-[#0E1219] p-3 text-left shadow-xl group-hover:block">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
            Subsystem checks
          </p>
          <ul className="space-y-1.5">
            {Object.entries(payload.checks).map(([name, check]) => (
              <li
                key={name}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      check.ok ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span className="capitalize text-white/70">{name}</span>
                </span>
                <span className="text-white/40">
                  {check.latencyMs}ms
                  {check.configured === false ? " · not configured" : ""}
                  {check.detail ? ` · ${check.detail}` : ""}
                  {check.status ? ` · engine: ${check.status}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
