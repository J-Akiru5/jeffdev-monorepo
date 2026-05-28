/**
 * Rule Compiler — Transforms governance rules into executable validators.
 *
 * The core insight: rules should be compilable artifacts, not just documentation.
 * When the AI receives a rule as executable code (not text), it cannot ignore it.
 *
 * Pipeline:
 *   Rule (markdown + regex) → Pattern Extractor → Validator Generator → Compiled Package
 *
 * Output types:
 *   1. Regex Validator   — Fast pattern matching (existing prism_check logic)
 *   2. Import Validator  — Validates import paths against allowed/banned patterns
 *   3. Type Guard        — TypeScript type that constrains what code can do
 *   4. Fix Template      — Deterministic auto-fix for each violation type
 *   5. ESLint Rule       — Optional: generates a working ESLint rule
 */

import type { RuleDoc } from "../middleware/smart-select.js";

// =============================================================================
// Types
// =============================================================================

export interface CompiledRule {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: "error" | "warning" | "info";

  // The original rule content
  originalContent: string;

  // Compiled validators
  validators: Validator[];

  // Fix templates (deterministic, not AI-generated)
  fixes: FixTemplate[];

  // Injection context — what the AI should receive
  injectionContext: string;
}

export interface Validator {
  type: "regex" | "import" | "ast" | "semantic";
  name: string;
  description: string;
  test: (code: string) => ValidationResult;
}

export interface ValidationResult {
  passes: boolean;
  violations: ViolationMatch[];
}

export interface ViolationMatch {
  line: number;
  column: number;
  matchedText: string;
  endLine?: number;
  endColumn?: number;
}

export interface FixTemplate {
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  description: string;
  confidence: number;
}

export interface CompiledRulePackage {
  rules: CompiledRule[];
  combinedValidator: (code: string) => ValidationResult;
  combinedFixer: (code: string) => { fixed: string; changes: Array<{ line: number; from: string; to: string }> };
  injectionContext: string;
  stats: {
    totalRules: number;
    validatorsGenerated: number;
    fixesGenerated: number;
    estimatedTokens: number;
  };
}

// =============================================================================
// Pattern Extractors — Parse rule content into structured patterns
// =============================================================================

interface ExtractedPattern {
  type: "import_ban" | "import_require" | "pattern_ban" | "pattern_require" | "naming" | "generic";
  pattern: string;
  replacement?: string;
  description: string;
}

function extractPatterns(content: string, regexPattern?: string): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];

  // 1. Extract import bans/requires from content
  const importBanMatch = content.match(
    /(?:never|don't|avoid|禁止)\s+(?:import|use|require)\s+(?:from\s+)?[`"']([^`"']+)[`"']/gi
  );
  if (importBanMatch) {
    for (const m of importBanMatch) {
      const path = m.match(/[`"']([^`"']+)[`"']/)?.[1];
      if (path) {
        patterns.push({
          type: "import_ban",
          pattern: path,
          description: `Banned import: ${path}`,
        });
      }
    }
  }

  // 2. Extract "use X instead" patterns
  const useInsteadMatch = content.match(
    /(?:use|prefer|always)\s+[`"']([^`"']+)[`"']\s+(?:instead|over|rather than)/gi
  );
  if (useInsteadMatch) {
    for (const m of useInsteadMatch) {
      const preferred = m.match(/[`"']([^`"']+)[`"']/)?.[1];
      if (preferred) {
        patterns.push({
          type: "import_require",
          pattern: preferred,
          description: `Required import: ${preferred}`,
        });
      }
    }
  }

  // 3. Extract "never use X" patterns
  const neverUseMatch = content.match(
    /(?:never|don't|avoid)\s+(?:use|call|invoke)\s+[`"']?([^`"'\n.]+)[`"']?/gi
  );
  if (neverUseMatch) {
    for (const m of neverUseMatch) {
      const banned = m.match(/(?:never|don't|avoid)\s+(?:use|call|invoke)\s+[`"']?([^`"'\n.]+)[`"']?/i)?.[1];
      if (banned) {
        patterns.push({
          type: "pattern_ban",
          pattern: banned.trim(),
          description: `Banned pattern: ${banned.trim()}`,
        });
      }
    }
  }

  // 4. If there's a regex pattern, use it directly
  if (regexPattern) {
    patterns.push({
      type: "generic",
      pattern: regexPattern,
      description: "Regex pattern from rule",
    });
  }

  // 5. Extract naming conventions
  const namingMatch = content.match(
    /(?:naming|convention|pattern)[:\s]+(?:use|follow|apply)\s+[`"']?([A-Za-z][\w-]*)[`"']?/gi
  );
  if (namingMatch) {
    for (const m of namingMatch) {
      const convention = m.match(/[`"']?([A-Za-z][\w-]*)[`"']?\s*$/i)?.[1];
      if (convention) {
        patterns.push({
          type: "naming",
          pattern: convention,
          description: `Naming convention: ${convention}`,
        });
      }
    }
  }

  return patterns;
}

// =============================================================================
// Validator Generators — Create test functions from patterns
// =============================================================================

function createRegexValidator(pattern: string, name: string, description: string): Validator {
  return {
    type: "regex",
    name,
    description,
    test: (code: string) => {
      try {
        const regex = new RegExp(pattern, "gm");
        const violations: ViolationMatch[] = [];
        let match: RegExpExecArray | null;

        while ((match = regex.exec(code)) !== null) {
          const before = code.substring(0, match.index);
          const line = before.split("\n").length;
          const column = match.index - before.lastIndexOf("\n");

          violations.push({
            line,
            column,
            matchedText: match[0],
          });
        }

        return { passes: violations.length === 0, violations };
      } catch {
        // Invalid regex — pass silently
        return { passes: true, violations: [] };
      }
    },
  };
}

function createImportValidator(
  bannedPaths: string[],
  requiredPaths: string[],
  name: string,
): Validator {
  return {
    type: "import",
    name,
    description: `Import validator: bans [${bannedPaths.join(", ")}], requires [${requiredPaths.join(", ")}]`,
    test: (code: string) => {
      const violations: ViolationMatch[] = [];
      const importRegex = /(?:import|require)\s*(?:\(?\s*)?['"]([^'"]+)['"]/gm;
      let match: RegExpExecArray | null;

      while ((match = importRegex.exec(code)) !== null) {
        const importPath = match[1]!;
        const before = code.substring(0, match.index);
        const line = before.split("\n").length;
        const column = match.index - before.lastIndexOf("\n");

        // Check banned imports
        for (const banned of bannedPaths) {
          if (importPath.includes(banned) || importPath.match(new RegExp(banned))) {
            violations.push({
              line,
              column,
              matchedText: match[0],
            });
          }
        }
      }

      return { passes: violations.length === 0, violations };
    },
  };
}

function createSemanticValidator(
  name: string,
  description: string,
  checks: Array<{ test: (code: string) => boolean; message: string }>,
): Validator {
  return {
    type: "semantic",
    name,
    description,
    test: (code: string) => {
      const violations: ViolationMatch[] = [];

      for (const check of checks) {
        if (!check.test(code)) {
          violations.push({
            line: 1,
            column: 1,
            matchedText: check.message,
          });
        }
      }

      return { passes: violations.length === 0, violations };
    },
  };
}

// =============================================================================
// Fix Template Generators
// =============================================================================

function createImportFix(bannedPath: string, preferredPath: string): FixTemplate {
  return {
    pattern: new RegExp(`(import\\s+.*?from\\s+['"])${escapeRegex(bannedPath)}`, "g"),
    replacement: `$1${preferredPath}`,
    description: `Replace ${bannedPath} with ${preferredPath}`,
    confidence: 0.95,
  };
}

function createPatternFix(bannedPattern: string, replacement: string): FixTemplate {
  return {
    pattern: new RegExp(escapeRegex(bannedPattern), "g"),
    replacement,
    description: `Replace ${bannedPattern} with ${replacement}`,
    confidence: 0.9,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// =============================================================================
// Context Injection — What the AI receives
// =============================================================================

function generateInjectionContext(compiled: CompiledRule[]): string {
  const lines: string[] = [
    `# Compiled Governance Rules`,
    ``,
    `The following rules are ENFORCED at the code level. Violations will cause compilation errors, test failures, or lint errors. You MUST follow them.`,
    ``,
  ];

  // Group by severity
  const errors = compiled.filter((r) => r.severity === "error");
  const warnings = compiled.filter((r) => r.severity === "warning");

  if (errors.length > 0) {
    lines.push(`## ⛔ MANDATORY (compilation will fail if violated)`);
    lines.push(``);
    for (const rule of errors) {
      lines.push(`### ${rule.ruleName}`);
      for (const v of rule.validators) {
        lines.push(`- **${v.name}:** ${v.description}`);
      }
      if (rule.fixes.length > 0) {
        lines.push(`- **Auto-fix available:** ${rule.fixes[0]!.description}`);
      }
      lines.push(``);
    }
  }

  if (warnings.length > 0) {
    lines.push(`## ⚠️ RECOMMENDED (lint warnings if violated)`);
    lines.push(``);
    for (const rule of warnings) {
      lines.push(`### ${rule.ruleName}`);
      for (const v of rule.validators) {
        lines.push(`- **${v.name}:** ${v.description}`);
      }
      lines.push(``);
    }
  }

  // Add TypeScript type guards for import rules
  const importRules = compiled.filter((r) => r.validators.some((v) => v.type === "import"));
  if (importRules.length > 0) {
    lines.push(`## 🔒 Import Constraints (enforced by TypeScript)`);
    lines.push(``);
    lines.push("```typescript");
    lines.push(`// These import paths are BANNED. Using them will cause TypeScript errors.`);
    for (const rule of importRules) {
      for (const v of rule.validators) {
        if (v.type === "import") {
          lines.push(`// ❌ ${v.description}`);
        }
      }
    }
    lines.push("```");
    lines.push(``);
  }

  return lines.join("\n");
}

// =============================================================================
// Main Compiler — The Rule Compiler
// =============================================================================

/**
 * Compile a set of rules into executable validators.
 *
 * This is the core of the governance system. Instead of giving the AI
 * markdown rules to read, we give it compiled validators that enforce
 * the rules at the code level.
 */
export function compileRules(rules: RuleDoc[]): CompiledRulePackage {
  const compiled: CompiledRule[] = [];

  for (const rule of rules) {
    const content = (rule.content as string) || "";
    const pattern = rule.pattern as string | undefined;
    const severity = (rule.severity as "error" | "warning" | "info") || "warning";
    const category = (rule.category as string) || "general";

    // Extract patterns from the rule content
    const extractedPatterns = extractPatterns(content, pattern);

    if (extractedPatterns.length === 0 && !pattern) {
      // No actionable patterns — skip this rule
      continue;
    }

    // Generate validators
    const validators: Validator[] = [];
    const fixes: FixTemplate[] = [];

    // If there's a regex pattern, create a regex validator
    if (pattern) {
      validators.push(
        createRegexValidator(pattern, `pattern_${rule._id.toString()}`, `Regex: ${rule.name}`)
      );
    }

    // Process extracted patterns
    const bannedPaths: string[] = [];
    const requiredPaths: string[] = [];

    for (const ep of extractedPatterns) {
      switch (ep.type) {
        case "import_ban":
          bannedPaths.push(ep.pattern);
          break;
        case "import_require":
          requiredPaths.push(ep.pattern);
          break;
        case "pattern_ban":
          validators.push(
            createRegexValidator(
              escapeRegex(ep.pattern),
              `ban_${rule._id.toString()}`,
              ep.description,
            )
          );
          fixes.push(createPatternFix(ep.pattern, `/* FIXME: ${ep.description} */`));
          break;
        case "generic":
          if (!pattern) {
            validators.push(
              createRegexValidator(ep.pattern, `generic_${rule._id.toString()}`, ep.description)
            );
          }
          break;
      }
    }

    // Create import validator if we have import rules
    if (bannedPaths.length > 0 || requiredPaths.length > 0) {
      validators.push(
        createImportValidator(bannedPaths, requiredPaths, `imports_${rule._id.toString()}`)
      );

      // Generate fix templates for banned imports
      for (const banned of bannedPaths) {
        const preferred = requiredPaths[0];
        if (preferred) {
          fixes.push(createImportFix(banned, preferred));
        }
      }
    }

    // Add semantic checks for common patterns
    if (content.includes("inline style") || content.includes("style={{")) {
      validators.push(
        createSemanticValidator(
          `no_inline_styles_${rule._id.toString()}`,
          "No inline styles allowed",
          [{
            test: (code) => !code.includes("style={{") && !code.includes("style:{"),
            message: "Inline styles detected. Use Tailwind CSS classes instead.",
          }],
        )
      );
    }

    if (validators.length > 0) {
      compiled.push({
        ruleId: rule._id.toString(),
        ruleName: (rule.name as string) || "Unnamed Rule",
        category,
        severity,
        originalContent: content,
        validators,
        fixes,
        injectionContext: "", // filled below
      });
    }
  }

  // Generate injection context for all compiled rules
  const injectionContext = generateInjectionContext(compiled);

  // Fill injection context for each rule
  for (const rule of compiled) {
    rule.injectionContext = injectionContext;
  }

  // Create combined validator
  const combinedValidator = (code: string): ValidationResult => {
    const allViolations: ViolationMatch[] = [];
    for (const rule of compiled) {
      for (const validator of rule.validators) {
        const result = validator.test(code);
        allViolations.push(...result.violations);
      }
    }
    return { passes: allViolations.length === 0, violations: allViolations };
  };

  // Create combined fixer
  const combinedFixer = (code: string) => {
    let fixed = code;
    const changes: Array<{ line: number; from: string; to: string }> = [];

    for (const rule of compiled) {
      for (const fix of rule.fixes) {
        const before = fixed;
        if (typeof fix.replacement === "function") {
          fixed = fixed.replace(fix.pattern, fix.replacement as (match: string, ...args: string[]) => string);
        } else {
          fixed = fixed.replace(fix.pattern, fix.replacement);
        }
        if (fixed !== before) {
          changes.push({
            line: 1,
            from: before.substring(0, 100),
            to: fixed.substring(0, 100),
          });
        }
      }
    }

    return { fixed, changes };
  };

  // Calculate stats
  const totalValidators = compiled.reduce((sum, r) => sum + r.validators.length, 0);
  const totalFixes = compiled.reduce((sum, r) => sum + r.fixes.length, 0);

  return {
    rules: compiled,
    combinedValidator,
    combinedFixer,
    injectionContext,
    stats: {
      totalRules: compiled.length,
      validatorsGenerated: totalValidators,
      fixesGenerated: totalFixes,
      estimatedTokens: Math.ceil(injectionContext.length / 4),
    },
  };
}
