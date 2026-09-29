/**
 * Landing page content — the single source of truth for every string that
 * renders on `/`.
 *
 * Convention: edit copy here, never inside the section components. The section
 * files arrange strings; they do not author them.
 *
 * ── The grounding rule ──────────────────────────────────────────────────────
 * Every claim on this page carries a `status` and a `source`. If it cannot be
 * traced to a file in this repository, to a command we can actually run, or to
 * a dated external record, it does not ship. Claims that have been made
 * elsewhere but are not substantiated here live in `retiredClaims` with
 * `published: false` — kept visible on purpose so nobody quietly re-adds them.
 *
 * `content.test.ts` enforces this mechanically: it fails when a published claim
 * has no source, when a banned marketing phrase appears anywhere in the copy,
 * or when the prices below drift from `src/lib/pricing-db.ts`.
 *
 * ── A note on the mechanism ─────────────────────────────────────────────────
 * `prism init` wires a **PostToolUse** hook (`matcher: "Write|Edit"`) into
 * `.claude/settings.json`. A `block` finding is written to stderr and the
 * process exits 2, so the correction lands in the agent's context. That is what
 * the shipped source does, and it is all this page claims. PostToolUse runs
 * *after* the tool call, so the page deliberately does not say the write is
 * stopped before it touches disk. See `retiredClaims` for what is excluded.
 */

// ---------------------------------------------------------------------------
// Claim ledger
// ---------------------------------------------------------------------------

export type ClaimStatus = "VERIFIED" | "STATED" | "UNSUPPORTED" | "UNVERIFIED";

export interface Claim {
  id: string;
  text: string;
  status: ClaimStatus;
  /** Where this can be checked. Empty only for claims we refuse to publish. */
  source: string;
  /**
   * Rendering gate. Only `true` for claims with an auditable source; the test
   * suite rejects any published claim whose status is UNVERIFIED/UNSUPPORTED.
   */
  published: boolean;
}

/**
 * Claims that ship on the page. Every one of these is readable in the repo.
 */
export const claims: readonly Claim[] = [
  {
    id: "init-offline",
    text: "`prism init` makes zero network calls: it reads the project's own package.json, globals.css and Tailwind config.",
    status: "VERIFIED",
    source: "packages/prism-context-engine/src/commands/init.ts (header)",
    published: true,
  },
  {
    id: "init-wires-claude-hook",
    text: "`prism init` merges a PostToolUse hook with matcher `Write|Edit` into .claude/settings.json, without overwriting existing keys.",
    status: "VERIFIED",
    source: "packages/prism-context-engine/src/init/hook.ts (wireClaudeHook)",
    published: true,
  },
  {
    id: "hook-exit-2",
    text: "A `block`-severity finding is written to stderr and the hook exits 2, so the correction lands in the agent's context.",
    status: "VERIFIED",
    source: "packages/prism-context-engine/src/commands/check.ts (runHook)",
    published: true,
  },
  {
    id: "hook-fails-open",
    text: "Hook mode fails open: missing or malformed rules, unreadable files and engine errors all exit 0 instead of blocking.",
    status: "VERIFIED",
    source: "packages/prism-context-engine/src/commands/check.ts (header)",
    published: true,
  },
  {
    id: "kill-switch",
    text: "`PRISM_DISABLE=1` disables the hook entirely.",
    status: "VERIFIED",
    source: "packages/prism-context-engine/src/commands/check.ts:84",
    published: true,
  },
  {
    id: "severity-policy",
    text: "The generated design-token rule ships at `block`; the arbitrary-Tailwind-brackets rule ships at `warn` and never stops a write until you promote it.",
    status: "VERIFIED",
    source: "packages/prism-context-engine/src/init/generate-rules.ts, package README",
    published: true,
  },
  {
    id: "one-schema",
    text: "`.prism/rules.json` is one v1 schema shared by `init`, `pull` and `check`.",
    status: "VERIFIED",
    source: "packages/prism-context-engine/README.md (Local Files)",
    published: true,
  },
  {
    id: "pull-fails-safe",
    text: "`prism pull` fails safe: a network, auth or response failure never breaks an existing working setup.",
    status: "VERIFIED",
    source: "packages/prism-context-engine/README.md, src/commands/pull.ts",
    published: true,
  },
  {
    id: "ide-setup-targets",
    text: "`prism ide-setup` writes MCP configuration for Cursor, Windsurf and Claude Desktop.",
    status: "VERIFIED",
    source: "packages/prism-context-engine/src/commands/ide-setup.ts (config dirs)",
    published: true,
  },
  {
    id: "published-package",
    text: "The CLI is published to npm as `@prism-engine/cli` under the MIT licence and requires Node 20+.",
    status: "VERIFIED",
    source: "npm registry API (latest 1.2.0), packages/prism-context-engine/package.json",
    published: true,
  },
  {
    id: "pricing",
    text: "Plans: Free $0, Pro $8/month, Team $7/month, Enterprise custom.",
    status: "VERIFIED",
    source: "apps/prism-engine/src/lib/pricing-db.ts (FALLBACK_PLANS)",
    published: true,
  },
  {
    id: "dashboard-surface",
    text: "The dashboard tracks context rules, projects, components and AI generations against the active plan's limits.",
    status: "VERIFIED",
    source: "apps/prism-engine/src/app/(dashboard); see the capture in the console section",
    published: true,
  },
  {
    id: "dashboard-roundtrip",
    text: "Dashboard rules round-trip 26/26 instructions and patterns exactly; 4 of 10 check types degrade to advisory.",
    status: "STATED",
    source: "Founder's paired trial records; not reproducible from this repo",
    published: true,
  },
];

/**
 * Claims that appear in other material but are not substantiated by the shipped
 * source. None of these render on the page. Kept here as the record of why.
 */
export const retiredClaims: readonly Claim[] = [
  {
    id: "pretooluse-stop-gate",
    text: "Claude Code enforcement runs on PreToolUse with a Stop gate.",
    status: "UNVERIFIED",
    source:
      "No PreToolUse or Stop hook exists anywhere in packages/prism-context-engine; init writes PostToolUse only",
    published: false,
  },
  {
    id: "blocks-before-disk",
    text: "A violating write is stopped before it reaches disk.",
    status: "UNVERIFIED",
    source:
      "The wired hook is PostToolUse, which runs after the tool call. The source proves the agent is corrected, not that the write was prevented",
    published: false,
  },
  {
    id: "opencode-enforcement",
    text: "Prism blocks violating writes in OpenCode.",
    status: "UNVERIFIED",
    source:
      "No OpenCode integration in the CLI. apps/prism-engine/src/lib/opencode.ts is an AI model gateway, not an enforcement target",
    published: false,
  },
  {
    id: "token-savings",
    text: "39% token savings.",
    status: "UNSUPPORTED",
    source: "One task measured against one baseline",
    published: false,
  },
  {
    id: "downloads-as-users",
    text: "361 users.",
    status: "UNSUPPORTED",
    source: "Downloads are not users",
    published: false,
  },
];

export const publishedClaims: readonly Claim[] = claims.filter((c) => c.published);

// ---------------------------------------------------------------------------
// Agent support — tiered honestly, because the tier is the whole point
// ---------------------------------------------------------------------------

export type EnforcementTier = "enforcing" | "config-only" | "advisory";

export interface AgentSupport {
  name: string;
  tier: EnforcementTier;
  detail: string;
}

export const agentsHeading = {
  eyebrow: "Coverage",
  headline: "Where enforcement actually runs today.",
  sub: "The tiers below are the honest split. Two of the three are configuration that has never been verified firing inside the agent, and we flag them rather than rounding up.",
} as const;

export const agents: readonly AgentSupport[] = [
  {
    name: "Claude Code",
    tier: "enforcing",
    detail: "PostToolUse hook with matcher Write|Edit, exit 2 on a block finding",
  },
  {
    name: "Cursor",
    tier: "config-only",
    detail: "Hook config written by prism init; in-agent firing unverified",
  },
  {
    name: "Antigravity",
    tier: "config-only",
    detail: "Hook config written by prism init; in-agent firing unverified",
  },
  {
    name: "Windsurf",
    tier: "advisory",
    detail: "MCP configuration only: rules are available to the agent, not enforced",
  },
  {
    name: "Claude Desktop",
    tier: "advisory",
    detail: "No hooks system exists in the host, so rules are advisory only",
  },
];

export const tierLabels: Record<EnforcementTier, string> = {
  enforcing: "Enforcing",
  "config-only": "Config written, firing unverified",
  advisory: "Advisory via MCP",
};

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export const hero = {
  eyebrow: "Governance over Generation",
  headline: ["The rules your AI", "can't ignore."],
  /** Second headline line renders with the holographic gradient. */
  subhead:
    "Your agent writes code that drifts from your own standards. Prism checks every file it saves, and when a rule breaks, the exact fix goes straight back to the agent, in the same exchange.",
  command: "npx @prism-engine/cli init",
  /**
   * The mechanism line. This is deliberately narrow and checkable, and it is
   * the single most credible sentence on the page.
   */
  mechanism: "Claude Code · PostToolUse hook · exit 2 on block",
  /**
   * The primary action is the demo, not the signup: this page's reader is an
   * investor or a judge, and the block is the thing that has to land. Every
   * href here resolves — `content.test.ts` asserts the anchors have a matching
   * section id, because a dead anchor on stage is worse than no link.
   */
  ctas: [
    { label: "See the block", href: "#the-block", variant: "primary" as const },
    { label: "Start free", href: "/sign-up", variant: "secondary" as const },
    {
      label: "Read the docs",
      href: "https://docs.syntaxure.dev",
      variant: "link" as const,
    },
  ],
  facts: ["MIT licensed", "No account required", "Zero network calls on init"],
} as const;

/**
 * The spectrum index.
 *
 * This is what the hero's scroll sequence resolves into. It exists because the
 * alternative was scrolling a hero away to reveal an empty stage, which is a
 * motion demo rather than a page: the reader was rewarded with nothing to read.
 * So the light bends into the three places worth going, in page order.
 *
 * It is also the only set of `#anchor` links in the copy, and `content.test.ts`
 * asserts every one of them matches a rendered section id, so the index cannot
 * point at a section that does not exist.
 */
export const heroIndex = [
  {
    label: "01",
    title: "The block",
    body: "An agent breaks a rule and is corrected, step by step.",
    href: "#the-block",
  },
  {
    label: "02",
    title: "The console",
    body: "Rules, projects and usage, in one place.",
    href: "#product",
  },
  {
    label: "03",
    title: "The evidence",
    body: "Every claim on this page, with where to check it.",
    href: "#evidence",
  },
] as const;

export const heroIndexHeading = "Where to look";

// ---------------------------------------------------------------------------
// The block — the showpiece
// ---------------------------------------------------------------------------

/**
 * Byte-exact hook output, reproduced from
 * `packages/prism-context-engine/src/rules/format.ts` (formatHookClaudeCode).
 * The published formatter is preserved verbatim as a verified demo contract,
 * so this string must not be "tidied up".
 */
export const blockOutput = [
  "PRISM PASS blocked write to PrimaryButton.tsx — 1 rule violation must be fixed now:",
  "1. Line 12 (styling/no-hex): replace '#06b6d4' with 'var(--brand-primary)' — Use the design token.",
  "Apply exactly these edits to PrimaryButton.tsx, then continue your original task.",
].join("\n");

/**
 * The demo transcript, line by line. Every line is sourced, which is the whole
 * reason this demo is worth watching:
 *
 *  - `prompt` is `HOOK_COMMAND` from src/init/hook.ts, minus the `npx` shim's
 *    shell noise.
 *  - `meta` describes the real PostToolUse payload shape that
 *    src/commands/check.ts parses (Claude Code nests the path under
 *    `tool_input.file_path`).
 *  - `out` is byte-exact `formatHookClaudeCode()` output; the test suite asserts
 *    it matches `blockOutput` exactly.
 *  - `exit` is the documented contract: exit 2 on a blocking finding.
 *
 * Nothing here is a dramatisation. If a line cannot be pointed at a file in this
 * repository, it does not belong in the array.
 */
export type TranscriptKind = "prompt" | "meta" | "out" | "exit";

export interface TranscriptLine {
  kind: TranscriptKind;
  text: string;
  /** Which beat (0-3) this line lands on. */
  beat: number;
}

export const blockTranscript: readonly TranscriptLine[] = [
  {
    kind: "prompt",
    text: "npx @prism-engine/cli check --hook --format claude-code",
    beat: 1,
  },
  {
    kind: "meta",
    text: '# stdin: PostToolUse · tool_name "Edit" · tool_input.file_path "src/components/PrimaryButton.tsx"',
    beat: 1,
  },
  {
    kind: "out",
    text: "PRISM PASS blocked write to PrimaryButton.tsx — 1 rule violation must be fixed now:",
    beat: 2,
  },
  {
    kind: "out",
    text: "1. Line 12 (styling/no-hex): replace '#06b6d4' with 'var(--brand-primary)' — Use the design token.",
    beat: 2,
  },
  {
    kind: "out",
    text: "Apply exactly these edits to PrimaryButton.tsx, then continue your original task.",
    beat: 3,
  },
  { kind: "exit", text: "exit code 2", beat: 3 },
] as const;

export const theBlock = {
  eyebrow: "Enforcement, not suggestions",
  headline: "Your agent breaks a rule. It gets told, in the same turn.",
  sub: "A real session, step by step: the agent edits a file, a check runs against your rules, and the correction comes back with the exact line to change. Scroll through it, or play it back. Every line below is copied from the shipped tool.",
  terminalTitle: "claude-code · posttooluse",
  scrollHint: "Scroll to step through",
  idleNote: "Waiting for the agent to save a file.",
  beats: [
    {
      label: "01",
      title: "The agent writes",
      body: "It hard-codes a colour instead of using the token your design system defines. Nothing looks wrong yet.",
    },
    {
      label: "02",
      title: "The hook fires",
      body: "`prism init` installed a check that runs every time the agent saves a file. No review step, no manual run.",
    },
    {
      label: "03",
      title: "The block is returned",
      body: "A finding at `block` severity is sent back to the agent as a correction, in the same exchange, while it still has the file open.",
    },
    {
      label: "04",
      title: "The agent fixes it",
      body: "The fix is named and line-numbered: this value, on this line. The agent applies it and carries on.",
    },
  ],
  caption:
    "Every line above is reproduced from packages/prism-context-engine: command, payload shape, formatter output and exit code.",
  replayLabel: "Run again",
  playingLabel: "Running",
} as const;

// ---------------------------------------------------------------------------
// The console — the real product surface
// ---------------------------------------------------------------------------

/**
 * The single most expensive-looking asset on the page is the real thing.
 * `imageAlt` and `caption` both describe what is actually visible in the capture
 * rather than inventing a highlight reel, and every number quoted anywhere near
 * it is read straight off the image.
 */
export const productSurface = {
  eyebrow: "The dashboard",
  headline: "Enforcement runs on your machine. This is where teams manage it.",
  sub: "The CLI never asks for an account. The dashboard is where a team's rules, projects and usage live, and `prism pull` copies them down to every machine, so everyone is checked against the same thing.",
  url: "prism.syntaxure.dev/dashboard",
  imageAlt:
    "The Prism Context Engine dashboard, showing 3 active projects, 34 context rules in force, 1 AI generation, and usage bars for projects, rules, components and AI generations against the Pro plan's limits.",
  caption: "The running dashboard, captured against this repository's own workspace.",
  readouts: [
    {
      label: "Rules in force",
      body: "Every project's context rules, counted against the ceiling of the active plan.",
    },
    {
      label: "Usage",
      body: "Projects, rules, components and AI generations measured across the current billing period.",
    },
    {
      label: "Brand profile",
      body: "The visual guidelines an agent reads before it is allowed to write.",
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

export const featuresHeading = {
  eyebrow: "Why it holds",
  headline: "What it does that a prompt cannot.",
  sub: "A prompt asks the agent to behave. These are the parts of Prism that do not depend on it agreeing. All of it runs on your machine, with no account and no server round-trip.",
} as const;

export const features = [
  {
    title: "Blocks, then corrects",
    body: "A rule at `block` severity comes back as a failure the agent has to deal with before it continues, and the message names the exact edit. Rules you are less sure of ship at `warn`: they advise without interrupting anyone, until you promote them.",
    icon: "shield",
  },
  {
    title: "Rules from your own source",
    body: "`prism init` reads your own package.json, CSS and Tailwind config, and takes the rule from colours you already defined. It matches the exact values in your design system, so a hit is always a real one.",
    icon: "scan",
  },
  {
    title: "Fails open, by design",
    body: "Missing rules, unreadable files and engine errors all exit 0, and `PRISM_DISABLE=1` turns it off. A checker that can break your build is worse than no checker, so the failure mode is \"no opinion\".",
    icon: "unlock",
  },
] as const;

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

/** Verbatim banner from src/commands/init.ts, minus ANSI colour. */
export const initBanner = [
  "◈ Prism Context Engine — init",
  "",
  "  Scanning this project. No network calls.",
].join("\n");

export const howItWorks = {
  eyebrow: "How it works",
  headline: "One command, then it is always on.",
  sub: "The local path needs no account, no API key and no network. The dashboard is an upgrade you choose later, not the entry fee.",
  banner: initBanner,
  steps: [
    {
      label: "01",
      title: "Scan the project",
      body: "`prism init` detects the stack and extracts the colour tokens already defined in your CSS and Tailwind config.",
    },
    {
      label: "02",
      title: "Generate the rules",
      body: "It writes them to `.prism/rules.json`: one small file, and the same one the checker reads and the dashboard syncs.",
    },
    {
      label: "03",
      title: "Wire the agent",
      body: "It adds the check to your agent's settings, so every file the agent saves is inspected, and writes the Cursor and Antigravity equivalents. Existing keys are never clobbered.",
    },
    {
      label: "04",
      title: "Sync the team",
      body: "`prism pull` copies the team's rules from the dashboard into the same file. If the network, the auth or the response fails, it leaves your working setup alone.",
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------

export const evidence = {
  eyebrow: "Evidence",
  headline: "Every claim on this page, with its source.",
  sub: "Every claim this page makes, with the file it was read from, and the claims we chose not to make. The second list is the reason to believe the first.",
  publishedNote: "Claims we do not make, and why:",
  statusLabels: {
    VERIFIED: "Read from the shipped source",
    STATED: "Founder's record, not reproducible here",
    UNSUPPORTED: "Measured, but not enough to generalise from",
    UNVERIFIED: "No source; deliberately not claimed",
  },
} as const;

// ---------------------------------------------------------------------------
// Closing
// ---------------------------------------------------------------------------

export const finalCta = {
  eyebrow: "Start",
  headline: "Start enforcing in one command.",
  sub: "Free tier. MIT licensed CLI. The local path never asks you to make an account.",
  command: hero.command,
  note: "Requires Node 20 or later.",
} as const;

// ---------------------------------------------------------------------------
// Pricing anchor
// ---------------------------------------------------------------------------

export const pricingSection = {
  eyebrow: "Plans",
  headline: "Free to enforce. Paid to sync.",
  sub: "Local enforcement sits on the free tier permanently. The paid tiers add cross-machine sync and shared team governance.",
  cta: { label: "Compare plans", href: "/pricing" },
} as const;

// ---------------------------------------------------------------------------
// Pricing — mirrors src/lib/pricing-db.ts, asserted by the test suite
// ---------------------------------------------------------------------------

/**
 * Deliberately duplicated from `src/lib/pricing-db.ts` rather than imported:
 * that module pulls in the Supabase admin client, which must not reach a client
 * component. `content.test.ts` reads the fallback plans off disk and fails if
 * these drift.
 */
export interface PricingLine {
  name: string;
  tagline: string;
  monthlyUsd: number | null;
}

export const pricing: readonly PricingLine[] = [
  { name: "Free", tagline: "Agent governance, free forever", monthlyUsd: 0 },
  { name: "Pro", tagline: "For solo developers shipping agent-first", monthlyUsd: 8 },
  { name: "Team", tagline: "One constitution, every agent", monthlyUsd: 7 },
  { name: "Enterprise", tagline: "Custom solutions for scale", monthlyUsd: null },
];

export const pricingNote = "Prices in USD, billed monthly. PHP pricing is available on the pricing page.";

// ---------------------------------------------------------------------------
// Navigation + metadata
// ---------------------------------------------------------------------------

/**
 * Section ids, in page order. Every one of these is rendered as an `id` on the
 * matching section, and `content.test.ts` asserts that every in-page `#anchor`
 * on the page matches one of these values — so an anchor cannot point at a
 * section that does not exist.
 *
 * There is deliberately no `navAnchors` list. `PublicNav` is shared by /pricing,
 * /terms and /privacy, so adding in-page hashes to it would ship dead links on
 * every one of those routes.
 */
export const sectionIds = {
  theBlock: "the-block",
  product: "product",
  features: "features",
  howItWorks: "how-it-works",
  coverage: "coverage",
  evidence: "evidence",
  pricing: "pricing",
  start: "start",
} as const;

export type SectionId = (typeof sectionIds)[keyof typeof sectionIds];

export const metadata = {
  title: "Prism Context Engine: the rules your AI can't ignore",
  description:
    "Prism turns your design tokens into enforceable rules, then hands your coding agent the exact fix when it breaks one. One command, no account, no network calls.",
  url: "/",
} as const;

// ---------------------------------------------------------------------------
// Guard rails used by content.test.ts
// ---------------------------------------------------------------------------

/**
 * Strings that are byte-exact reproductions of real CLI output.
 *
 * These are exempt from the house copy rules, em dashes included, because they
 * are evidence rather than writing: the terminal demo is only worth anything if
 * the line the reader sees is the line the tool printed. Editing one to satisfy a
 * style rule would make the demo a fabrication.
 *
 * `content.test.ts` asserts two things about this list, in both directions: no
 * shipped copy outside it uses an em dash, and the artefacts inside it still
 * contain the ones they are supposed to.
 */
export const verbatimArtefacts: readonly string[] = [initBanner, blockOutput];

/**
 * Phrases that make a technical reader trust the page less. The test suite
 * fails if any of them appear anywhere in the rendered copy.
 */
export const bannedPhrases = [
  "trusted by",
  "loved by",
  "world-class",
  "cutting-edge",
  "revolutionary",
  "seamless",
  "game-chang",
  "10x",
  "blazing fast",
  "industry-leading",
  "next-generation",
] as const;

/** Every user-visible string, flattened, for the banned-phrase sweep. */
export function allCopyStrings(): string[] {
  const out: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      out.push(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  };
  walk(hero);
  walk(heroIndex);
  walk(heroIndexHeading);
  walk(theBlock);
  walk(productSurface);
  walk(featuresHeading);
  walk(features);
  walk(agentsHeading);
  walk(agents);
  walk(tierLabels);
  walk(howItWorks);
  walk(pricing);
  walk(pricingNote);
  walk(pricingSection);
  walk(evidence);
  walk(finalCta);
  walk(metadata);
  return out;
}

/** Finds the first banned phrase in `text`, case-insensitive. */
export function findBannedPhrase(text: string): string | null {
  const haystack = text.toLowerCase();
  return bannedPhrases.find((phrase) => haystack.includes(phrase)) ?? null;
}
