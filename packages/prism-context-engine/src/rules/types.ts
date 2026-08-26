export type RuleCategory =
  | "architecture"
  | "styling"
  | "security"
  | "testing";

export type RuleSeverity = "block" | "warn";

export interface ForbiddenPatternCheck {
  type: "forbidden_pattern";
  pattern: string;
  flags?: string;
  allowlist?: string[];
  fix?: string;
  message?: string;
}

export interface RequiredTokenCheck {
  type: "required_token";
  tokenSet: string;
  tokenMap: Record<string, string>;
  message?: string;
}

export interface BannedImportCheck {
  type: "banned_import";
  specifiers: string[];
  message?: string;
}

export interface ArbitraryValueCheck {
  type: "arbitrary_value";
  properties: string[];
  message?: string;
}

/** Phase 4 breadth. File/symbol naming: the FILE's base name (without
 *  extension) must match `pattern` for every file covered by the rule's
 *  extensions. e.g. React components must be PascalCase:
 *  { type:"naming_pattern", pattern:"^[A-Z][A-Za-z0-9]*$" } */
export interface NamingPatternCheck {
  type: "naming_pattern";
  pattern: string;
  message?: string;
}

/** Phase 4 breadth. Files whose base name matches `matchPattern` must live
 *  inside `directory` (relative, forward slashes). e.g. hooks live in
 *  src/hooks: { type:"file_placement", matchPattern:"^use[A-Z]", directory:"src/hooks" } */
export interface FilePlacementCheck {
  type: "file_placement";
  matchPattern: string;
  directory: string;
  message?: string;
}

/** Phase 4 breadth. Every covered file must import `specifier`. Inverse of
 *  banned_import: { type:"required_import", specifier:"@/lib/auth" } */
export interface RequiredImportCheck {
  type: "required_import";
  specifier: string;
  /** Optional path regex — only files whose normalized path matches are
   *  required to import the specifier (e.g. pytest only in test files). */
  includePattern?: string;
  message?: string;
}

export type CheckBlock =
  | ForbiddenPatternCheck
  | RequiredTokenCheck
  | BannedImportCheck
  | ArbitraryValueCheck
  | NamingPatternCheck
  | FilePlacementCheck
  | RequiredImportCheck;

export interface PrismRule {
  id: string;
  category: RuleCategory;
  severity?: RuleSeverity;
  instruction?: string;
  extensions?: string[];
  check?: CheckBlock;
}

export interface RuleSet {
  version: number;
  rules: PrismRule[];
}

export interface Finding {
  ruleId: string;
  severity: RuleSeverity;
  category: RuleCategory;
  file: string;
  line: number;
  offending: string;
  replacement?: string;
  message: string;
}
