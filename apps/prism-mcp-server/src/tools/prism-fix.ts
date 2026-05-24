import type { Violation } from "./prism-check.js";

export interface PrismFixInput {
  violation: Violation;
  code: string;
}

export interface FixResult {
  correctedCode: string;
  appliedRule: string;
  confidence: number;
  changes: Array<{ line: number; from: string; to: string }>;
}

const KNOWN_FIXES: Array<{
  test: (v: Violation) => boolean;
  apply: (
    v: Violation,
    code: string,
  ) => { result: string; confidence: number; description: string };
}> = [
  // Cross-app imports → @repo/ prefix
  {
    test: (v) =>
      v.pattern.includes("../../apps/") || v.pattern.includes("../apps/"),
    apply: (v, code) => {
      const match = v.matchedText;
      const parts = match.split("../../apps/");
      if (parts.length < 2)
        return { result: code, confidence: 0, description: "" };
      const appName = parts[1]?.split("/")[0] || "";
      if (!appName) return { result: code, confidence: 0, description: "" };
      const fixed = match.replace(`../../apps/${appName}`, `@repo/${appName}`);
      return {
        result: code.replace(match, fixed),
        confidence: 0.95,
        description: `Replaced cross-app import with \`@repo/${appName}\` package alias`,
      };
    },
  },
  // Inline styles → Tailwind placeholder comment
  {
    test: (v) =>
      v.pattern.includes("style={") ||
      v.pattern.includes("style:") ||
      v.message.toLowerCase().includes("inline style"),
    apply: (v, code) => {
      const match = v.matchedText;
      const replacement = ` {/* TODO: Replace with Tailwind classes */}`;
      const fixed = match.replace(/style=\{[\s\S]*?\}/, replacement);
      return {
        result: code.replace(match, fixed),
        confidence: 0.6,
        description:
          "Replaced inline style with Tailwind placeholder — manual review recommended",
      };
    },
  },
  // Removes console.log (matching common patterns)
  {
    test: (v) =>
      v.pattern.includes("console\\.log") ||
      v.message.toLowerCase().includes("console.log"),
    apply: (v, code) => {
      let result = code;
      let count = 0;
      const logRegex = /console\.(log|debug|info)\([^)]*\);?\s*/g;
      result = result.replace(logRegex, (match) => {
        count++;
        return `// ${match.trim()}`;
      });
      return {
        result,
        confidence: count > 0 ? 0.9 : 0,
        description:
          count > 0
            ? `Commented out ${count} console.log statement(s)`
            : "No console.log found",
      };
    },
  },
];

export async function handlePrismFix(input: PrismFixInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}> {
  const { violation, code } = input;

  if (!violation || !code) {
    return {
      content: [
        { type: "text", text: "Error: violation and code are required." },
      ],
      isError: true,
    };
  }

  const matched = KNOWN_FIXES.find((f) => f.test(violation));

  if (!matched) {
    // Generic fallback: comment out the violated line
    const codeLines = code.split("\n");
    const targetLine = violation.line - 1;
    if (targetLine >= 0 && targetLine < codeLines.length) {
      const original = codeLines[targetLine];
      codeLines[targetLine] = `${original} // FIXME: ${violation.ruleName}`;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              correctedCode: codeLines.join("\n"),
              appliedRule: violation.ruleName,
              confidence: 0.3,
              changes: [
                {
                  line: violation.line,
                  from: original,
                  to: codeLines[targetLine],
                },
              ],
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
            correctedCode: code,
            appliedRule: violation.ruleName,
            confidence: 0,
            changes: [],
            message: `No automatic fix available for "${violation.ruleName}". Manual review required.`,
          }),
        },
      ],
    };
  }

  const { result, confidence, description } = matched.apply(violation, code);

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          correctedCode: result,
          appliedRule: violation.ruleName,
          confidence,
          changes: [
            {
              line: violation.line,
              from: violation.matchedText,
              to: description,
            },
          ],
          description,
        }),
      },
    ],
  };
}
