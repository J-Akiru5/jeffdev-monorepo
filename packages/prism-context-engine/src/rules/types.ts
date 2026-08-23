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

export type CheckBlock =
  | ForbiddenPatternCheck
  | RequiredTokenCheck
  | BannedImportCheck
  | ArbitraryValueCheck;

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
