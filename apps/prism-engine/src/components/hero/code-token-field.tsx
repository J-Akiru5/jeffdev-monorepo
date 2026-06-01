"use client";

/**
 * CodeTokenField — chaotic field of floating code tokens.
 * Used in scene-capture to visualize "AI doesn't know your rules."
 *
 * Pure CSS, seeded random for SSR stability, theme-aware via CSS variables.
 * Throttles token count on small viewports and when low-end device is detected.
 */

import { useEffect, useMemo, useState } from "react";

const TOKENS = [
  "interface Props { id: string }",
  "const ctx = useContext(AuthCtx)",
  "type Rule = { pattern: RegExp }",
  "function detect(chat: Chat) { … }",
  "<Button variant=\"ghost\" />",
  "useEffect(() => { fetch() }, [])",
  "export const rules: Rule[] = []",
  "class ApiRoute { middleware = [] }",
  "import { z } from 'zod'",
  "await db.collection('rules').get()",
  "revalidatePath('/dashboard')",
  "const user = await getUser()",
  "class-variance-authority",
  "tailwind-merge(twMerge(cn))",
  "ServerAction<{ ok: boolean }>",
  "// TODO: add design tokens",
  "const [open, setOpen] = useState",
  "framer-motion: <motion.div />",
  "MCPContextProvider value={{…}}",
  "Prisma.model.findUnique({ where })",
  "stripe.checkout.sessions.create",
  "claude.messages.create({…})",
  "supabase.from('rules').select()",
  "POST /api/assistant { stream: true }",
  "No 'any' types in /lib/**",
  "Always use App Router conventions",
  "Components use forwardRef",
  "Env vars validated with Zod",
  "Glass panels: 1px hairline + glow",
  "border-radius: 6px (NEVER 2xl)",
] as const;

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CodeTokenFieldProps {
  className?: string;
  count?: number;
  seed?: number;
}

export function CodeTokenField({ className, count = 48, seed = 7 }: CodeTokenFieldProps) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (mem !== undefined && mem < 4) setEnabled(false);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) setEnabled(false);
  }, []);

  const tokens = useMemo(() => {
    const rand = mulberry32(seed);
    const out: Array<{ text: string; x: number; y: number; dur: number; delay: number; size: number; opacity: number }> = [];
    const n = Math.min(count, TOKENS.length);
    for (let i = 0; i < n; i++) {
      out.push({
        text: TOKENS[Math.floor(rand() * TOKENS.length)] ?? TOKENS[0],
        x: rand() * 100,
        y: rand() * 100,
        dur: 6 + rand() * 6,
        delay: -rand() * 8,
        size: 10 + rand() * 4,
        opacity: 0.4 + rand() * 0.4,
      });
    }
    return out;
  }, [count, seed]);

  if (!enabled) return null;

  return (
    <div className={className} aria-hidden="true">
      {tokens.map((t, i) => (
        <code
          key={i}
          className="absolute font-mono whitespace-nowrap pointer-events-none"
          style={{
            top: `${t.y}%`,
            left: `${t.x}%`,
            fontSize: `${t.size}px`,
            color: i % 2 === 0 ? "var(--code-token-color)" : "var(--code-token-color-2)",
            opacity: t.opacity,
            animation: enabled
              ? `drift ${t.dur}s ease-in-out ${t.delay}s infinite alternate`
              : "none",
            willChange: "transform",
          }}
        >
          {t.text}
        </code>
      ))}
    </div>
  );
}

export default CodeTokenField;
