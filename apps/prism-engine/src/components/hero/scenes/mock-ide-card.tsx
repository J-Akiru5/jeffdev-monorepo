"use client";

/**
 * MockIdeCard — faked Cursor/Windsurf editor with MCP + AI chat panel.
 */

import { useEffect, useState } from "react";

const FILES: { name: string; depth: number; type: "folder" | "file"; active?: boolean }[] = [
  { name: "app", depth: 0, type: "folder" },
  { name: "components", depth: 0, type: "folder" },
  { name: "lib", depth: 0, type: "folder" },
  { name: "prism.ts", depth: 1, type: "file", active: true },
  { name: "context.ts", depth: 1, type: "file" },
  { name: "rules.ts", depth: 1, type: "file" },
  { name: "mcp.ts", depth: 1, type: "file" },
  { name: "globals.css", depth: 0, type: "file" },
];

const CODE_LINES = [
  { n: 1, tokens: [["export", "kw"], [" ", "ws"], ["async", "kw"], [" ", "ws"], ["function", "kw"], [" ", "ws"], ["extractRules", "fn"]] },
  { n: 2, tokens: [["  ", "ws"]] },
  { n: 3, tokens: [["  ", "ws"], ["const", "kw"], [" ", "ws"], ["ctx", "var"], [" ", "ws"], ["=", "ws"], [" ", "ws"], ["await", "kw"], [" ", "ws"], ["loadContext()", "fn"]] },
  { n: 4, tokens: [["  ", "ws"]] },
  { n: 5, tokens: [["  ", "ws"], ["return", "kw"], [" ", "ws"], ["ctx", "var"],[".", "ws"], ["filter", "fn"], ["(", "ws"], ["isArchitecturalRule", "fn"], ["(", "ws"], [")", "ws"], [")", "ws"]] },
  { n: 6, tokens: [["", "ws"]] },
  { n: 7, tokens: [["", "ws"]] },
  { n: 8, tokens: [["", "ws"]] },
  { n: 9, tokens: [["", "ws"]] },
  { n: 10, tokens: [["", "ws"]] },
  { n: 11, tokens: [["", "ws"]] },
  { n: 12, tokens: [["", "ws"]] },
  { n: 13, tokens: [["", "ws"]] },
] as const;

const CHAT_LINES = [
  { role: "user", text: "Add a new feature: pricing card" },
  { role: "ai", text: "Using your Prism rules: Tailwind v4 only, no `any`, App Router." },
  { role: "ai", text: "Creating /components/billing/pricing-card.tsx…" },
] as const;

const COLOR_MAP: Record<string, string> = {
  kw: "text-[var(--aurora-2)]",
  fn: "text-[var(--aurora-1)]",
  var: "text-[var(--aurora-3)]",
  ws: "",
};

export function MockIdeCard() {
  const [typedLines, setTypedLines] = useState(0);
  const [typedChat, setTypedChat] = useState(0);
  const [caret, setCaret] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setCaret((c) => !c), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTypedChat((c) => (c >= CHAT_LINES.length ? 0 : c + 1)), 1400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTypedLines((c) => (c >= 7 ? 0 : c + 1)), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-elevated rounded-xl w-full max-w-2xl overflow-hidden font-mono text-xs">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3 py-2 bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--aurora-3)]" />
          <div className="w-2 h-2 rounded-full bg-[var(--aurora-2)]/60" />
          <div className="w-2 h-2 rounded-full bg-[var(--aurora-1)]/40" />
          <span className="ml-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
            cursor
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--aurora-3)]" />
          <span>MCP Connected</span>
        </div>
      </div>

      <div className="grid grid-cols-12 h-[280px]">
        {/* File tree */}
        <div className="col-span-3 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2 space-y-0.5 text-[11px]">
          {FILES.map((f, i) => (
            <div
              key={i}
              className={`px-1.5 py-0.5 rounded ${
                f.active ? "bg-[var(--aurora-1)]/15 text-[var(--aurora-1)]" : "text-[var(--text-secondary)]"
              }`}
              style={{ paddingLeft: `${4 + f.depth * 8}px` }}
            >
              {f.type === "folder" ? "▸ " : "  "}
              {f.name}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div className="col-span-5 p-2 space-y-0.5 overflow-hidden">
          {CODE_LINES.slice(0, Math.max(typedLines, 5)).map((line) => (
            <div key={line.n} className="flex gap-2 text-[11px]">
              <span className="w-5 text-right text-[var(--text-quiet)] select-none">
                {line.n}
              </span>
              <span>
                {line.tokens.map(([text, kind], ti) => (
                  <span key={ti} className={COLOR_MAP[kind] ?? ""}>
                    {text}
                  </span>
                ))}
                {line.n === typedLines && caret ? (
                  <span className="inline-block w-1.5 h-3 bg-[var(--aurora-1)] align-middle ml-0.5" />
                ) : null}
              </span>
            </div>
          ))}
        </div>

        {/* AI chat */}
        <div className="col-span-4 border-l border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-2 space-y-2 text-[11px]">
          {CHAT_LINES.slice(0, typedChat).map((c, i) => (
            <div
              key={i}
              className={
                c.role === "user"
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--aurora-1)]"
              }
            >
              <div className="text-[9px] uppercase tracking-widest opacity-60 mb-0.5">
                {c.role === "user" ? "you" : "prism"}
              </div>
              <div>{c.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MockIdeCard;
