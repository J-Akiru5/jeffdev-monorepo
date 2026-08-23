import type { PrismRule, RuleSet } from "../rules/types.js";
import type { ExtractedTokens } from "./tokens.js";
import type { ProjectDetection } from "./detect.js";

/** Tailwind utility prefixes worth guarding against arbitrary bracket
 *  values (`w-[123px]`) — this is the fixed set of layout/spacing/type
 *  utilities every Tailwind scale defines, not something specific to any
 *  one project's theme, so it doesn't vary with what tokens were found. */
const ARBITRARY_VALUE_PROPERTIES = [
  "w",
  "max-w",
  "min-w",
  "h",
  "min-h",
  "max-h",
  "p",
  "px",
  "py",
  "pt",
  "pb",
  "pl",
  "pr",
  "m",
  "mx",
  "my",
  "mt",
  "mb",
  "ml",
  "mr",
  "gap",
  "text",
  "rounded",
];

/** Code-file extensions the generated required_token rule applies to.
 *  Deliberately excludes .css/.scss: those hold the tokens' own definition
 *  lines, which must never violate their own rule. */
export const TOKEN_RULE_EXTENSIONS = [
  ".tsx",
  ".jsx",
  ".ts",
  ".js",
  ".html",
];

/**
 * Turn detected tokens into real rules.json v1 rules.
 *
 * Severity policy (deliberately split — see the 2026-08-24 E2E verification):
 * - `required_token` ships `block`: tokenMap entries are exact hex literals
 *   extracted from the project's own source, so a match is a true positive
 *   by construction (both E2E runs produced zero false positives on code
 *   files). A silent warn would make the Pass invisible to the agent.
 * - `arbitrary_value` stays `warn`: bracket values are heuristic (the E2E
 *   runs flagged create-next-app's own untouched scaffold), so blocking on
 *   it would stop writes on noise. Promote it by hand once trusted.
 *
 * The token rule only targets code files. CSS is excluded because the
 * tokens' own definition lines in globals.css would otherwise always
 * self-flag — every legitimate "add a token" edit would be a violation
 * of its own rule. Guarding hex values inside other CSS files is a
 * hand promotion: add ".css" to this rule's extensions.
 */
export function generateRuleSet(
  detection: ProjectDetection,
  tokens: ExtractedTokens,
): RuleSet {
  const rules: PrismRule[] = [];

  if (tokens.colorTokens.length > 0) {
    const tokenMap: Record<string, string> = {};
    for (const token of tokens.colorTokens) {
      tokenMap[token.hex] = token.varRef;
    }
    rules.push({
      id: "styling/design-tokens",
      category: "styling",
      severity: "block",
      extensions: TOKEN_RULE_EXTENSIONS,
      instruction:
        "Use this project's own CSS variable tokens instead of these raw hex values — auto-detected from " +
        tokens.cssFilesScanned.join(", ") +
        ".",
      check: {
        type: "required_token",
        tokenSet: "auto-detected-colors",
        tokenMap,
        message: "Use the CSS variable token instead of the raw hex value.",
      },
    });
  }

  if (detection.hasTailwind) {
    rules.push({
      id: "styling/no-arbitrary-tailwind-values",
      category: "styling",
      severity: "warn",
      instruction:
        "Use Tailwind scale utilities instead of arbitrary bracket values (auto-generated: Tailwind was detected in package.json).",
      extensions: [".tsx", ".jsx"],
      check: {
        type: "arbitrary_value",
        properties: ARBITRARY_VALUE_PROPERTIES,
        message:
          "Pick the closest Tailwind scale utility instead of an arbitrary value.",
      },
    });
  }

  if (rules.length === 0) {
    rules.push({
      id: "styling/placeholder-no-tokens-detected",
      category: "styling",
      instruction:
        "prism init didn't find any design tokens to enforce automatically — no hex-valued CSS custom properties in globals.css, and no Tailwind config. This is a placeholder, not a real rule: it has no `check`, so `prism check` will never flag anything from it. Add your own rules below (see the rules.json v1 format at https://prism.syntaxure.dev), or run `prism pull` once your team has rules configured on the Prism dashboard.",
    });
  }

  return { version: 1, rules };
}
