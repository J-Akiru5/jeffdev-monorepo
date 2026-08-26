/**
 * Rules creator (Phase 3): plain-language convention -> a rule.json v1
 * candidate with a WORKING check block. Pure functions only — the LLM call
 * lives in the route so this stays unit-testable.
 */

import { z } from "zod";

const CATEGORIES = [
  "architecture",
  "styling",
  "security",
  "testing",
  "performance",
  "documentation",
  "custom",
] as const;

export const CreatorRuleSchema = z.object({
  name: z.string().min(3).max(100),
  category: z.enum(CATEGORIES).default("custom"),
  content: z
    .string()
    .min(10)
    .max(1000)
    .describe("Imperative instruction shown to agents and humans."),
  pattern: z
    .string()
    .optional()
    .describe("Regex the Pass runs against written files. Empty = advisory."),
  severity: z.enum(["error", "warning", "info"]).default("warning"),
});

export type CreatorRule = z.infer<typeof CreatorRuleSchema>;

export function buildCreatorPrompt(description: string): {
  systemPrompt: string;
  userPrompt: string;
} {
  return {
    systemPrompt:
      "You translate a developer's convention description into ONE machine-enforceable rule for the Prism Context Engine. " +
      "Respond with ONLY a JSON object, no markdown fences, matching exactly:\n" +
      '{"name":string(3-100 chars, title case),"category":"architecture"|"styling"|"security"|"testing"|"performance"|"documentation"|"custom",' +
      '"content":string(10-1000 chars, imperative: what agents MUST or MUST NOT do),' +
      '"pattern":string(optional regex WITHOUT flags; omit entirely if the convention is not mechanically checkable),' +
      '"severity":"error"|"warning"|"info"}\n' +
      'Rules of thumb: severity "error" only when the pattern is exact and unambiguous; prefer "warning". ' +
      "If no regex can capture the convention faithfully, OMIT pattern — an advisory rule beats a false-positive one.",
    userPrompt: `Convention description:\n${description}`,
  };
}

/**
 * Parse + validate an LLM response into a CreatorRule. Throws Error with a
 * human-readable message on garbage output — the route turns that into a 502.
 */
export function parseCreatorRule(raw: string): CreatorRule {
  // Models like to wrap JSON in fences despite instructions.
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object");
  }
  const json = stripped.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    throw new Error(`Model returned invalid JSON: ${(err as Error).message}`);
  }

  const result = CreatorRuleSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Rule failed validation: ${result.error.issues.map((i) => i.message).join(", ")}`,
    );
  }

  // A pattern that doesn't compile would break every future engine run —
  // reject here rather than shipping a broken rule to the user's repo.
  if (result.data.pattern) {
    try {
      new RegExp(result.data.pattern);
    } catch (err) {
      throw new Error(
        `Model produced a non-compiling regex (${(err as Error).message}). Rejected.`,
      );
    }
  }

  return result.data;
}
