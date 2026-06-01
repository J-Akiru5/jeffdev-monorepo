/**
 * Hero scene data — single source of truth for copy.
 * Edit copy here, never inside the components.
 */

export interface HeroSceneMetric {
  value: string;
  label: string;
}

export interface HeroSceneCta {
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}

export interface HeroScene {
  id: "identity" | "capture" | "deploy" | "outcome";
  index: 1 | 2 | 3 | 4;
  eyebrow: string;
  headline: string;
  sub: string;
  metric: HeroSceneMetric | null;
  cta: HeroSceneCta | null;
}

export const heroScenes: readonly HeroScene[] = [
  {
    id: "identity",
    index: 1,
    eyebrow: "Prism Context Engine v1.0.3",
    headline: "The Context Operating System",
    sub: "for Vibecoders",
    metric: null,
    cta: {
      primary: { label: "Start Free →", href: "/sign-up" },
      secondary: { label: "View Docs", href: "https://docs.syntaxure.dev" },
    },
  },
  {
    id: "capture",
    index: 2,
    eyebrow: "Capture",
    headline: "Record. Transcribe. Extract.",
    sub: "Screen-record your architecture. AI learns your patterns and writes the rules.",
    metric: { value: "1,847", label: "rules auto-extracted this week" },
    cta: null,
  },
  {
    id: "deploy",
    index: 3,
    eyebrow: "Deploy",
    headline: "Push to every IDE, instantly.",
    sub: "One click delivers curated context to Cursor, Windsurf, Claude Code — via MCP.",
    metric: { value: "12ms", label: "MCP roundtrip latency" },
    cta: null,
  },
  {
    id: "outcome",
    index: 4,
    eyebrow: "The Outcome",
    headline: "Eliminate context pollution. Forever.",
    sub: "Your AI finally thinks the way you do.",
    metric: null,
    cta: {
      primary: { label: "Start Free →", href: "/sign-up" },
      secondary: { label: "View Pricing", href: "/pricing" },
    },
  },
] as const;
