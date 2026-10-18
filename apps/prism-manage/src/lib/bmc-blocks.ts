/**
 * Business Model Canvas — the 9 Osterwalder blocks
 * ------------------------------------------------
 * Shared by the /bmc page and the seed action.
 */

export const BMC_BLOCKS = [
  { key: "key_partners", label: "Key Partners" },
  { key: "key_activities", label: "Key Activities" },
  { key: "key_resources", label: "Key Resources" },
  { key: "value_propositions", label: "Value Propositions" },
  { key: "customer_relationships", label: "Customer Relationships" },
  { key: "channels", label: "Channels" },
  { key: "customer_segments", label: "Customer Segments" },
  { key: "cost_structure", label: "Cost Structure" },
  { key: "revenue_streams", label: "Revenue Streams" },
] as const;

export type BmcBlockKey = (typeof BMC_BLOCKS)[number]["key"];

export const BMC_BLOCK_KEYS: BmcBlockKey[] = BMC_BLOCKS.map((b) => b.key);

/**
 * Seed content — four-person founding team facts (CEO Jeff Martinez,
 * CTO Lou Baroro, CPO Karl Calimotan, COO Hazel Dato-on), dual-engine
 * strategy, peso-first pricing. Editable in the UI after seeding.
 */
export const BMC_SEED: Record<BmcBlockKey, string> = {
  key_partners:
    "Kwadra TBI (ISAT-U incubator) · Supabase, Vercel, Google Gemini, PayPal, Resend, GitHub · MCP ecosystem",
  key_activities:
    "Engine A (Agency): zero-to-one web & SaaS builds, client engagements, CRM pipeline. Engine B (Prism): context-governance tooling — CLI, MCP server, docs, local rule enforcement for AI coding agents.",
  key_resources:
    "Four-person founding team (CEO · CTO · CPO · COO) · monorepo tooling & shared packages · Supabase Postgres · Prism Context Engine (the Pass) · Kwadra TBI support network",
  value_propositions:
    "Engine A: high-performance web apps and SaaS platforms built for scale — \"Governance over Generation.\" Engine B: local rule enforcement for AI coding agents — verifiable context control, not prompt hope.",
  customer_relationships:
    "Founder-led direct engagements · fractional COO/CTO services · long-term care plans · community support for Prism (Discord, Product Hunt)",
  channels:
    "syntaxure.dev · /quote funnel · LinkedIn · X (Twitter) · YouTube · GitHub · Product Hunt · Discord",
  customer_segments:
    "SEA startups & SMEs needing production-grade builds (agency) · AI-assisted development teams needing context governance (Prism)",
  cost_structure:
    "Infrastructure (Vercel, Supabase, AI APIs) · development tools · contractor time. Tracked in Operations → Infrastructure Costs.",
  revenue_streams:
    "Agency: Starter ₱25,000/$450 → Business ₱65,000/$1,150 → Custom ₱180,000/$3,200 → Enterprise. Care Plans ₱2,000/$35 and ₱5,000/$90 per month. Prism: Free / Pro $9/mo / Team $29/mo / Enterprise.",
};
