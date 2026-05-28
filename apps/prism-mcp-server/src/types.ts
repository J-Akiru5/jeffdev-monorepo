/**
 * Shared types for MCP tool handlers.
 * All tool inputs extend ToolInput and outputs extend ToolOutput.
 */

/** Standard MCP tool response format */
export interface ToolOutput {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

/** Severity levels for code violations */
export type ViolationSeverity = "error" | "warning" | "info";

/** A single code violation found by prism_check */
export interface Violation {
  ruleId: string;
  ruleName: string;
  pattern: string;
  message: string;
  severity: ViolationSeverity;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  matchedText: string;
  suggestion: string;
}

/** Input for prism_check / validate_code */
export interface PrismCheckInput {
  code: string;
  ruleIds?: string[];
  projectId?: string;
  filePath?: string;
  category?: string;
}

/** Input for prism_fix */
export interface PrismFixInput {
  violation: Violation;
  code: string;
}

/** Input for get_architectural_rules */
export interface GetRulesInput {
  task?: string;
  maxTokens?: number;
  projectId?: string;
  format?: "markdown" | "json";
  category?: string;
  tag?: string;
}

/** Input for get_skill */
export interface GetSkillInput {
  skillId: string;
  projectId?: string;
}

/** Input for list_skills */
export interface ListSkillsInput {
  projectId: string;
}

/** Input for prism_scan */
export interface PrismScanInput {
  url: string;
  maxPages?: number;
  depth?: number;
  projectId?: string;
  userId?: string;
  model?: string;
}

/** Input for repo_scan */
export interface RepoScanInput {
  path?: string;
}

/** Input for repo_extract */
export interface RepoExtractInput {
  scan: RepoScanData;
  model?: string;
}

/** Input for validate_code_pattern */
export interface ValidateCodePatternInput {
  code: string;
  context?: string;
  category?: string;
}

/** Input for prism_kitchen analyze */
export interface KitchenAnalyzeInput {
  task: string;
  budget?: number;
  projectId?: string;
  format?: "markdown" | "json";
}

/** Input for prism_kitchen preview */
export interface KitchenPreviewInput {
  task: string;
  projectId?: string;
  budget?: number;
}

/** Input for prism_intercept */
export interface InterceptInput {
  task?: string;
  code?: string;
  filePath?: string;
  projectId?: string;
}

/** Input for prism_health */
export interface HealthInput {
  verbose?: boolean;
}

/** Input for prism_compile */
export interface CompileInput {
  projectId?: string;
  category?: string;
  task?: string;
  format?: "markdown" | "json";
}

/** Repo scan report data structure (also used in repo_extract input) */
export interface RepoScanData {
  root: string;
  namingConventions: {
    files: Record<string, number>;
    functions: Record<string, number>;
    components: Record<string, number>;
    variables: Record<string, number>;
  };
  imports: {
    relative: number;
    absolute: number;
    external: Record<string, number>;
    internal: Record<string, number>;
  };
  structure: {
    directories: string[];
    fileCount: number;
    dirCount: number;
    languages: Record<string, number>;
  };
  configs: Record<string, unknown>;
  summary: string;
}
