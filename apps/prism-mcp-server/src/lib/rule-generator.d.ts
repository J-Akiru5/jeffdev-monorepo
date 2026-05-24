import type { ExtractedDesignTokens } from "./extractor.js";
export interface GeneratedRules {
  rulesMd: string;
  skillsMd: string;
  rulesCount: number;
  skillsCount: number;
  modelUsed: string;
}
export declare function generateRulesFromTokens(
  tokens: ExtractedDesignTokens,
  modelOverride?: string,
): Promise<GeneratedRules>;
export declare function saveRulesLocal(rulesMd: string, skillsMd: string): void;
export declare function saveRulesToCosmos(
  rulesMd: string,
  skillsMd: string,
  projectId: string,
  userId: string,
): Promise<void>;
//# sourceMappingURL=rule-generator.d.ts.map
