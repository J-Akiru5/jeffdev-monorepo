/**
 * Pure transform: a `prism_rules` DB row -> a rules.json v1 `PrismRule`.
 * Extracted out of the `/api/v1/projects/:id/rules/pass` route handler so
 * it's unit-testable without mocking Supabase/Next.js — see
 * `prism-rules-transform.test.ts`.
 *
 * See the route handler's file-level comment for the mapping rationale
 * (severity vocabulary, category fold, pattern -> forbidden_pattern).
 */

export type V1Category = "architecture" | "styling" | "security" | "testing";
export type V1Severity = "block" | "warn";

const CATEGORY_MAP: Record<string, V1Category> = {
  architecture: "architecture",
  styling: "styling",
  security: "security",
  testing: "testing",
  performance: "architecture",
  documentation: "architecture",
  custom: "architecture",
};

export function mapSeverity(severity: string | null | undefined): V1Severity {
  return severity === "error" ? "block" : "warn";
}

export function mapCategory(category: string | null | undefined): V1Category {
  return CATEGORY_MAP[category ?? "custom"] ?? "architecture";
}

export interface PrismRulesRow {
  id: string;
  name: string;
  description: string | null;
  content: string;
  category: string | null;
  severity: string | null;
  pattern: string | null;
}

export interface V1RuleOut {
  id: string;
  category: V1Category;
  severity: V1Severity;
  instruction: string;
  check?: {
    type: "forbidden_pattern";
    pattern: string;
    message: string;
  };
}

export function toV1Rule(row: PrismRulesRow): V1RuleOut {
  const base: V1RuleOut = {
    id: row.id,
    category: mapCategory(row.category),
    severity: mapSeverity(row.severity),
    instruction: row.content || row.description || row.name,
  };

  if (!row.pattern) return base;
  try {
    new RegExp(row.pattern);
  } catch {
    // Doesn't compile as a regex — ship advisory-only rather than letting
    // one bad stored rule break the check field (or the whole pull).
    return base;
  }

  return {
    ...base,
    check: {
      type: "forbidden_pattern",
      pattern: row.pattern,
      message: row.description || row.content || row.name,
    },
  };
}
