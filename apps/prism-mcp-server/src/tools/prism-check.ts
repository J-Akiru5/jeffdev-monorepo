export interface Violation {
  ruleId: string;
  ruleName: string;
  pattern: string;
  message: string;
  severity: "error" | "warning" | "info";
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  matchedText: string;
  suggestion: string;
}

export interface PrismCheckInput {
  code: string;
  ruleIds?: string[];
  projectId?: string;
  filePath?: string;
  category?: string;
}

export function findLineColumn(code: string, index: number): { line: number; column: number } {
  const before = code.slice(0, index);
  const lines = before.split("\n");
  const last = lines[lines.length - 1];
  return { line: lines.length, column: (last || "").length + 1 };
}

export function buildSuggestion(ruleName: string, content: string, matchedText: string): string {
  const clean = content.replace(/\*\*/g, "").trim();
  return `Fix for "${ruleName}": ${clean.replace(matchedText, `\`${matchedText}\``)}`;
}

export async function handlePrismCheck(input: PrismCheckInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}> {
  const { code, ruleIds, projectId, category } = input;

  if (!code || typeof code !== "string") {
    return { content: [{ type: "text", text: "Error: code is required." }], isError: true };
  }

  try {
    const { getCollection } = await import("@jeffdev/db/cosmos");
    const rules = await getCollection("rules");

    const query: Record<string, unknown> = {
      isActive: true,
      pattern: { $exists: true, $ne: null },
    };
    if (ruleIds && ruleIds.length > 0) {
      const { ObjectId } = await import("mongodb");
      query._id = { $in: ruleIds.map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id)) };
    }
    if (projectId) query.projectId = projectId;
    if (category) query.category = category;

    const patternRules = await rules.find(query).sort({ priority: 1 }).toArray();

    if (patternRules.length === 0) {
      return {
        content: [{ type: "text", text: "No pattern-based rules found to check against." }],
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

          const severity = (rule.severity as string) === "error"
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
            suggestion: buildSuggestion(rule.name as string, rule.content as string, matchedText),
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
            text: JSON.stringify({ status: "pass", violations: [], checkedRules: patternRules.length }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ status: "fail", violations, checkedRules: patternRules.length }),
        },
      ],
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error checking code: ${error instanceof Error ? error.message : "Unknown error"}` }],
      isError: true,
    };
  }
}
