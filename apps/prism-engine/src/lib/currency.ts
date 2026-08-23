import { headers } from "next/headers";

/**
 * Regional pricing currency (roadmap v1.0): PH visitors see pesos,
 * everyone else USD. Regional pricing is the mechanism, not a discount —
 * ₱299 and $8 are the same product priced to local purchasing power.
 *
 * Manual override: pass ?currency=PHP|USD in the URL (wins over geo), or
 * set the x-prism-currency header for tests/admin previews.
 */
export type Currency = "PHP" | "USD";

export async function getVisitorCurrency(
  urlOverride?: string | null,
): Promise<Currency> {
  if (urlOverride === "PHP" || urlOverride === "USD") return urlOverride;

  try {
    const h = await headers();
    const forced = h.get("x-prism-currency");
    if (forced === "PHP" || forced === "USD") return forced;
    const country = h.get("x-vercel-ip-country");
    return country === "PH" ? "PHP" : "USD";
  } catch {
    // headers() unavailable outside a request scope (rare static paths)
    return "USD";
  }
}

/** Format a monthly price for display. null = custom/enterprise pricing. */
export function formatMonthlyPrice(
  monthlyUsd: number | null,
  monthlyPhp: number | null,
  currency: Currency,
): string {
  const amount = currency === "PHP" ? monthlyPhp : monthlyUsd;
  if (amount === null || amount === undefined) return "Custom";
  if (amount === 0) return "Free";
  return currency === "PHP"
    ? `₱${amount.toLocaleString("en-PH")}`
    : `$${amount.toLocaleString("en-US")}`;
}
