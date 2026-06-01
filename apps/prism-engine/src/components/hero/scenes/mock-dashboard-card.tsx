"use client";

/**
 * MockDashboardCard — outcome / analytics dashboard preview.
 */

import { useEffect, useState } from "react";

const TILES = [
  { label: "Rules Deployed", value: "247", accent: "var(--aurora-1)" },
  { label: "IDE Sync", value: "100%", accent: "var(--aurora-3)" },
  { label: "Avg. Latency", value: "12ms", accent: "var(--aurora-2)" },
] as const;

const LOG_ENTRIES = [
  { time: "12:04:21", event: "Deployed 14 rules → Cursor", status: "ok" },
  { time: "12:03:55", event: "Extracted from video_3.mp4", status: "ok" },
  { time: "12:02:14", event: "MCP handshake → Claude Code", status: "ok" },
  { time: "12:01:02", event: "Context health: 98 / 100", status: "ok" },
  { time: "11:58:47", event: "Synced Windsurf workspace", status: "ok" },
] as const;

export function MockDashboardCard() {
  const [logIndex, setLogIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setLogIndex((i) => (i + 1) % LOG_ENTRIES.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-elevated rounded-xl w-full max-w-xl p-5 font-mono text-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--aurora-3)]" />
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            dashboard
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          last 24h
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {TILES.map((t) => (
          <div
            key={t.label}
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3"
          >
            <div className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] mb-1">
              {t.label}
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: t.accent }}
            >
              {t.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)]">
            Context Health
          </span>
          <span className="text-[9px] text-[var(--aurora-3)]">↑ trending</span>
        </div>
        <svg viewBox="0 0 200 40" className="w-full h-10" aria-hidden="true">
          <defs>
            <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--aurora-1)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--aurora-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 0 30 L 20 26 L 40 28 L 60 22 L 80 18 L 100 20 L 120 12 L 140 14 L 160 8 L 180 10 L 200 4 L 200 40 L 0 40 Z"
            fill="url(#spark)"
          />
          <path
            d="M 0 30 L 20 26 L 40 28 L 60 22 L 80 18 L 100 20 L 120 12 L 140 14 L 160 8 L 180 10 L 200 4"
            fill="none"
            stroke="var(--aurora-1)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Deploy log */}
      <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
        <div className="text-[9px] uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
          Deploy log
        </div>
        <div className="space-y-1">
          {LOG_ENTRIES.slice(0, Math.min(logIndex + 3, LOG_ENTRIES.length)).map((entry, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-quiet)]">{entry.time}</span>
                <span>{entry.event}</span>
              </div>
              <span className="text-[var(--aurora-3)]">●</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MockDashboardCard;
