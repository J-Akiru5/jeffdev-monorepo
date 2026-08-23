import type { Violation, PrismCheckInput, ToolOutput } from "../types.js";

export type { Violation, PrismCheckInput };

export function findLineColumn(
  code: string,
  index: number,
): { line: number; column: number } {
  const before = code.slice(0, index);
  const lines = before.split("\n");
  const last = lines[lines.length - 1];
  return { line: lines.length, column: (last || "").length + 1 };
}

export function buildSuggestion(
  ruleName: string,
  content: string,
  matchedText: string,
): string {
  const clean = content.replace(/\*\*/g, "").trim();
  return `Fix for "${ruleName}": ${clean.replace(matchedText, `\`${matchedText}\``)}`;
}

export async function handlePrismCheck(input: PrismCheckInput): Promise<ToolOutput> {
  const { code, ruleIds, projectId, category } = input;

  if (!code || typeof code !== "string") {
    return {
      content: [{ type: "text", text: "Error: code is required." }],
      isError: true,
    };
  }

  try {
    const { getPrismDb, isValidId } = await import("@syntaxure-labs/db/prism");
    const db = getPrismDb();

    let query = db
      .from("prism_rules")
      .select("_id:id, name, category, content, pattern, severity, priority")
      .eq("is_active", true)
      .not("pattern", "is", null);
    if (ruleIds && ruleIds.length > 0) {
      query = query.in("id", ruleIds.filter((id) => isValidId(id)));
    }
    if (projectId) query = query.eq("project_id", projectId);
    if (category) query = query.eq("category", category);

    const { data: patternRulesData, error: queryError } = await query.order(
      "priority",
      { ascending: true },
    );
    if (queryError) throw queryError;
    const patternRules = patternRulesData ?? [];

    if (patternRules.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No pattern-based rules found to check against.",
          },
        ],
      };
    }

    const violations: Violation[] = [];

    for (const rule of patternRules) {
      const pattern = rule.pattern as string | undefined;
      if (!pattern) continue;

      try {
        const regex = new RegExp(pattern, "g");
        let match: RegExpExecArray | null;

        while ((match = regex.exec(code)) !== null) {
          const matchedText = match[0];
          const startPos = match.index;
          const endPos = startPos + matchedText.length;
          const start = findLineColumn(code, startPos);
          const end = findLineColumn(code, endPos);

          const severity =
            (rule.severity as string) === "error"
              ? "error"
              : (rule.severity as string) === "warning"
                ? "warning"
                : "info";

          violations.push({
            ruleId: rule._id.toString(),
            ruleName: rule.name as string,
            pattern,
            message: rule.content as string,
            severity,
            line: start.line,
            column: start.column,
            endLine: end.line,
            endColumn: end.column,
            matchedText,
            suggestion: buildSuggestion(
              rule.name as string,
              rule.content as string,
              matchedText,
            ),
          });
        }
      } catch {
        continue;
      }
    }

    if (violations.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "pass",
              violations: [],
              checkedRules: patternRules.length,
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "fail",
            violations,
            checkedRules: patternRules.length,
          }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error checking code: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}
