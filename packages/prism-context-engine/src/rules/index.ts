/**
 * Barrel export for the Prism rules subsystem.
 *
 * Lets server-side consumers (e.g. apps/prism-engine sandbox preview)
 * reuse the EXACT parser + matcher the CLI hook runs, instead of
 * duplicating matching logic that would drift from the Pass.
 */
export type {
  CheckBlock,
  Finding,
  ForbiddenPatternCheck,
  PrismRule,
  RequiredTokenCheck,
  BannedImportCheck,
  ArbitraryValueCheck,
  RuleCategory,
  RuleSeverity,
  RuleSet,
} from "./types.js";
export {
  parseRuleSet,
  findRulesPath,
  loadRuleSet,
  ruleSeverity,
  RulesParseError,
  normalizeExtension,
} from "./parse.js";
export {
  applicableExtensions,
  checkContent,
  checkFile,
  isFileApplicable,
} from "./engine.js";
export { formatFindingLine, formatPretty, formatHookClaudeCode } from "./format.js";
