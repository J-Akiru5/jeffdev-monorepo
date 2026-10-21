/**
 * Portfolio UI constants
 * ----------------------
 * Presentation-only lookups shared by the Portfolio list, project detail and
 * partners views. Domain rules (statuses, filters, RBAC) stay in
 * `@/lib/portfolio`; nothing here is imported by the server action layer.
 */

import type {
  MemberRole,
  MilestoneStatus,
  PartnerKind,
  PortfolioKind,
  PortfolioStatus,
  PublicProjectStatus,
  RetainerStatus,
} from "@/lib/portfolio";

// =============================================================================
// LABELS
// =============================================================================

export const KIND_LABELS: Record<PortfolioKind, string> = {
  venture: "Venture",
  client: "Client",
  internal: "Internal",
};

export const STATUS_LABELS: Record<PortfolioStatus, string> = {
  planning: "Planning",
  in_progress: "In progress",
  maintenance: "Maintenance",
  completed: "Completed",
  paused: "Paused",
  archived: "Archived",
};

export const PUBLIC_STATUS_LABELS: Record<PublicProjectStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export const RETAINER_LABELS: Record<RetainerStatus, string> = {
  none: "No retainer",
  active: "Active retainer",
  paused: "Retainer paused",
  ended: "Retainer ended",
};

export const PARTNER_KIND_LABELS: Record<PartnerKind, string> = {
  agency: "Agency",
  product: "Product",
  events: "Events",
  infrastructure: "Infrastructure",
  other: "Other",
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  lead: "Lead",
  developer: "Developer",
  designer: "Designer",
  qa: "QA",
  marketing: "Marketing",
  support: "Support",
  contributor: "Contributor",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  blocked: "Blocked",
};

// =============================================================================
// COLOURS (status pills — matches the approved plan's palette)
// =============================================================================

export const STATUS_STYLES: Record<PortfolioStatus, string> = {
  planning: "bg-white/10 text-white/50",
  in_progress: "bg-cyan-500/15 text-cyan-400",
  maintenance: "bg-amber-500/15 text-amber-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-rose-500/15 text-rose-400",
  archived: "bg-slate-500/15 text-slate-400",
};

export const KIND_STYLES: Record<PortfolioKind, string> = {
  venture: "bg-purple-500/15 text-purple-300",
  client: "bg-cyan-500/15 text-cyan-300",
  internal: "bg-white/10 text-white/60",
};

export const RETAINER_STYLES: Record<RetainerStatus, string> = {
  none: "bg-white/[0.04] text-white/35",
  active: "bg-emerald-500/15 text-emerald-400",
  paused: "bg-amber-500/15 text-amber-400",
  ended: "bg-white/10 text-white/40",
};

export const MILESTONE_STATUS_STYLES: Record<MilestoneStatus, string> = {
  pending: "bg-white/10 text-white/50",
  in_progress: "bg-cyan-500/15 text-cyan-400",
  completed: "bg-emerald-500/15 text-emerald-400",
  blocked: "bg-rose-500/15 text-rose-400",
};

export const PARTNER_STATUS_STYLES = {
  active: "bg-emerald-500/15 text-emerald-400",
  inactive: "bg-white/10 text-white/40",
} as const;

/** Display order: live work first, archived last. */
export const STATUS_SORT: Record<PortfolioStatus, number> = {
  planning: 0,
  in_progress: 1,
  maintenance: 2,
  paused: 3,
  completed: 4,
  archived: 5,
};

// =============================================================================
// OPTION LISTS (for the native selects used across the views)
// =============================================================================

export const KIND_OPTIONS: readonly PortfolioKind[] = ["venture", "client", "internal"];

export const STATUS_OPTIONS: readonly PortfolioStatus[] = [
  "planning",
  "in_progress",
  "maintenance",
  "completed",
  "paused",
  "archived",
];

export const RETAINER_OPTIONS: readonly RetainerStatus[] = ["none", "active", "paused", "ended"];

export const PARTNER_KIND_OPTIONS: readonly PartnerKind[] = [
  "agency",
  "product",
  "events",
  "infrastructure",
  "other",
];

export const MEMBER_ROLE_OPTIONS: readonly MemberRole[] = [
  "lead",
  "developer",
  "designer",
  "qa",
  "marketing",
  "support",
  "contributor",
];

export const MILESTONE_STATUS_OPTIONS: readonly MilestoneStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "blocked",
];

// =============================================================================
// FORMATTERS
// =============================================================================

const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
};

/** ₱4,500 for PHP, $1,200 for USD, `XYZ 900` for anything unmapped. */
export function formatMoney(amount: number, currency: string): string {
  const code = (currency || "PHP").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code];
  const value = amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return symbol ? `${symbol}${value}` : `${code} ${value}`;
}

/** Joined MRR string for the stats card, e.g. `₱4,500 · $200`. */
export function formatMoneyMap(amounts: Record<string, number>): string {
  return Object.entries(amounts)
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" · ");
}

/**
 * Date-only values (`YYYY-MM-DD`) are rendered in UTC so the calendar day
 * cannot shift by one in a negative-offset timezone; timestamps render local.
 */
export function formatPortfolioDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  const date = new Date(isDateOnly ? `${value.trim()}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(isDateOnly ? { timeZone: "UTC" } : {}),
  });
}

/** `J. Akiru` -> `JA`; single names keep their first two letters. */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1] ?? first) : first;
  const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  return initials || "?";
}

/**
 * Adds `https://` when a stored URL has no scheme — people paste `example.com`
 * into both the project and partner forms.
 */
export function externalHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// =============================================================================
// SHARED CLASS STRINGS (kept in one place so the views stay readable)
// =============================================================================

export const SELECT_CLASS =
  "h-9 appearance-none rounded-lg border border-border bg-glass-04 px-3 text-xs text-white/70 outline-none transition-colors hover:border-border-active focus:border-cyan-500/50";

export const FIELD_CLASS =
  "w-full rounded-lg border border-border bg-glass-04 px-3 py-2 text-sm text-white/80 outline-none transition-colors placeholder:text-text-faint hover:border-border-active focus:border-cyan-500/50";

export const FIELD_SELECT_CLASS = `${FIELD_CLASS} appearance-none`;

export const LABEL_CLASS =
  "mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/40";

export const PRIMARY_BUTTON_CLASS =
  "flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50";

export const GHOST_BUTTON_CLASS =
  "rounded-lg border border-border px-3.5 py-2 text-sm text-white/60 transition-colors hover:border-border-active hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-50";

export const SMALL_GHOST_BUTTON_CLASS =
  "flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-white/50 transition-colors hover:border-border-active hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-50";

export const CARD_CLASS = "rounded-xl border border-border glass-subtle";

export const SECTION_CLASS = "rounded-xl border border-border glass-subtle p-4";
