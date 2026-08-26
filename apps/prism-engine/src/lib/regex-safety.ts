/**
 * Regex safety validation (Phase 4.5, belt + suspenders per Jeff).
 *
 * Layer 1: fast internal heuristic for the classic catastrophic shape -
 *          an unbounded quantifier applied to a GROUP whose body itself
 *          contains an unbounded quantifier ((a+)+$, (?:\s*\w+)*...).
 *          Zero dependencies, microsecond cost.
 * Layer 2: safe-regex star-height analysis - authoritative second opinion;
 *          catches alternation overlap and deeper nesting that a single
 *          heuristic cannot.
 *
 * A pattern proceeds to the engine subprocess only when BOTH layers
 * consider it safe.
 */

import safeRegex from "safe-regex";

export interface RegexSafetyResult {
  safe: boolean;
  /** Human-readable reasons; empty when safe. */
  reasons: string[];
}

// An unbounded quantifier directly following a group that contains one:
// matches (a+)+ , (?:\s*\w+)* , ([a-z]{2,})+  — but NOT ([a-z]+)? on its own
// is still matched (that IS risky) while plain groups without inner
// quantifiers pass.
const NESTED_QUANTIFIER_HEURISTIC =
  /\((?:(?!\))[\s\S])*[+*]\s*(?:(?!\))[\s\S])*\)(?:[+*]|\{\d+\s*,\s*\d*\})\??/;

export function assessRegexSafety(pattern: string): RegexSafetyResult {
  const reasons: string[] = [];

  // Layer 1 - fast internal heuristic.
  if (NESTED_QUANTIFIER_HEURISTIC.test(pattern)) {
    reasons.push(
      "fast-reject: nested quantifiers (quantified group containing an unbounded quantifier) can backtrack exponentially",
    );
  }

  // Layer 2 - authoritative star-height analysis.
  let safeRegexResult: boolean | undefined;
  try {
    safeRegexResult = safeRegex(pattern);
  } catch {
    // safe-regex itself choked on the input - treat as unsafe.
    reasons.push("safe-regex failed to analyse this pattern");
    return { safe: false, reasons };
  }
  if (safeRegexResult === false) {
    reasons.push(
      "safe-regex flagged potential exponential backtracking (star height too high)",
    );
  }

  return { safe: reasons.length === 0, reasons };
}

/** Convenience wrapper: true when the pattern passes both layers. */
export function isSafeUserRegex(pattern: string): boolean {
  return assessRegexSafety(pattern).safe;
}
