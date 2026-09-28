/**
 * Pure helpers for the project rules list: severity normalization, filtering,
 * and category grouping. Extracted so the interactive list stays a thin client
 * component and the logic is unit-testable under the app's node-env vitest
 * config (no jsdom/RTL in this app).
 */

export interface FilterableRule {
  name: string;
  content: string;
  category: string;
}

export type Severity = "error" | "warning" | "info";

/** Dashboard rules store "error" | "warning" | "info"; anything unknown (or a
 *  null from older rows) displays as "warning" — the same default the rule
 *  create schema applies. */
export function normalizeSeverity(
  severity: string | null | undefined,
): Severity {
  return severity === "error" || severity === "info" ? severity : "warning";
}

/** Case-insensitive search across name + instruction, plus an optional exact
 *  category filter. Order is preserved. */
export function filterRules<T extends FilterableRule>(
  rules: T[],
  query: string,
  category: string | null,
): T[] {
  const q = query.trim().toLowerCase();
  return rules.filter((rule) => {
    if (category && rule.category !== category) return false;
    if (!q) return true;
    return (
      rule.name.toLowerCase().includes(q) ||
      rule.content.toLowerCase().includes(q)
    );
  });
}

/** Group by category with categories in stable alphabetical order; order
 *  within each group is preserved from the input. */
export function groupRulesByCategory<T extends { category: string }>(
  rules: T[],
): Array<{ category: string; rules: T[] }> {
  const groups = new Map<string, T[]>();
  for (const rule of rules) {
    const list = groups.get(rule.category);
    if (list) list.push(rule);
    else groups.set(rule.category, [rule]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, list]) => ({ category, rules: list }));
}

/** Distinct categories in alphabetical order (for the filter select). */
export function distinctCategories(
  rules: Array<{ category: string }>,
): string[] {
  return [...new Set(rules.map((r) => r.category))].sort((a, b) =>
    a.localeCompare(b),
  );
}
