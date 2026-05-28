/**
 * Dashboard Trends Utility
 * ------------------------
 * Computes period-over-period trends from Supabase query results.
 * Used by the admin dashboard to show real % changes instead of hardcoded values.
 */

interface TrendResult {
  value: number;
  direction: "up" | "down" | "neutral";
}

/**
 * Compute the month-over-month change in the count of records.
 * Works with any Supabase query result that has `created_at` or a date field.
 */
export function computeCountTrend(
  records: { created_at?: string }[],
  previousRecords: { created_at?: string }[],
): TrendResult {
  const currentCount = records.length;
  const previousCount = previousRecords.length;

  if (previousCount === 0) {
    return currentCount > 0
      ? { value: 100, direction: "up" }
      : { value: 0, direction: "neutral" };
  }

  const pctChange = Math.round(
    ((currentCount - previousCount) / previousCount) * 100,
  );

  if (pctChange > 0) return { value: pctChange, direction: "up" };
  if (pctChange < 0) return { value: Math.abs(pctChange), direction: "down" };
  return { value: 0, direction: "neutral" };
}

/**
 * Split an array of records into "current period" (this month) and
 * "previous period" (last month) based on created_at.
 */
export function splitByPeriod<T extends { created_at?: string }>(
  records: T[],
): { current: T[]; previous: T[] } {
  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const current: T[] = [];
  const previous: T[] = [];

  for (const record of records) {
    if (!record.created_at) continue;
    const date = new Date(record.created_at);

    if (date >= currentStart) {
      current.push(record);
    } else if (date >= previousStart && date <= previousEnd) {
      previous.push(record);
    }
  }

  return { current, previous };
}

/**
 * Convenience: compute a trend from a single records array using
 * month-over-month comparison on created_at fields.
 */
export function computeMonthlyTrend<T extends { created_at?: string }>(
  records: T[],
): TrendResult {
  const { current, previous } = splitByPeriod(records);
  return computeCountTrend(current, previous);
}

/**
 * Compute the month-over-month change in a summed value (e.g., MRR).
 * The caller is responsible for pre-splitting records by period
 * (e.g., using splitByPeriod) before calling this function.
 */
export function computeValueTrend(
  records: { amount?: number | string }[],
  previousRecords: { amount?: number | string }[],
): TrendResult {
  const sum = (items: { amount?: number | string }[]) =>
    items.reduce((acc, item) => acc + Number(item.amount || 0), 0);

  const currentSum = sum(records);
  const previousSum = sum(previousRecords);

  if (previousSum === 0) {
    return currentSum > 0
      ? { value: 100, direction: "up" }
      : { value: 0, direction: "neutral" };
  }

  const pctChange = Math.round(
    ((currentSum - previousSum) / previousSum) * 100,
  );

  if (pctChange > 0) return { value: pctChange, direction: "up" };
  if (pctChange < 0) return { value: Math.abs(pctChange), direction: "down" };
  return { value: 0, direction: "neutral" };
}
