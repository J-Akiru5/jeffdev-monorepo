/**
 * PostgREST filter helpers
 * ------------------------
 * PostgREST `.or()` / `ilike` filter strings are built from user input in a
 * few places. Reserved characters (wildcards, commas, parens, quotes,
 * backslashes) can break the filter grammar, so terms are sanitized before
 * interpolation. RLS remains the real security boundary — this is
 * robustness, not authorization.
 */

/** Strips wildcard/reserved characters, collapses whitespace, caps length. */
export function sanitizeIlikeTerm(term: string): string {
  return term
    .replace(/[%_,()*"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** Wraps a sanitized term in % wildcards for ilike matching. */
export function toIlikePattern(term: string): string {
  return `%${sanitizeIlikeTerm(term)}%`;
}
