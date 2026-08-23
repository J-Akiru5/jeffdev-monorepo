import { describe, it, expect } from "vitest";
import {
  buildCreatorPrompt,
  parseCreatorRule,
} from "../rule-creator";

describe("buildCreatorPrompt", () => {
  it("embeds the description and demands bare JSON", () => {
    const p = buildCreatorPrompt("no console.log in production code");
    expect(p.userPrompt).toContain("no console.log in production code");
    expect(p.systemPrompt).toContain("ONLY a JSON object");
    expect(p.systemPrompt).toContain('"pattern"');
  });
});

describe("parseCreatorRule", () => {
  const good = {
    name: "No Console Logs",
    category: "styling",
    content: "Never ship console.log statements to production code.",
    pattern: "\\bconsole\\.log\\(",
    severity: "warning",
  };

  it("parses a clean JSON object", () => {
    const rule = parseCreatorRule(JSON.stringify(good));
    expect(rule.name).toBe("No Console Logs");
    expect(rule.pattern).toBe("\\bconsole\\.log\\(");
  });

  it("tolerates markdown fences around the JSON", () => {
    const rule = parseCreatorRule(
      "```json\n" + JSON.stringify(good) + "\n```",
    );
    expect(rule.severity).toBe("warning");
  });

  it("extracts JSON embedded in prose", () => {
    const noisy = `Here is your rule:\n${JSON.stringify(good)}\nLet me know!`;
    expect(parseCreatorRule(noisy).name).toBe("No Console Logs");
  });

  it("rejects non-compiling regex instead of shipping a broken rule", () => {
    expect(() =>
      parseCreatorRule(JSON.stringify({ ...good, pattern: "([" })),
    ).toThrow(/non-compiling regex/i);
  });

  it("rejects invalid categories and missing content", () => {
    expect(() =>
      parseCreatorRule(JSON.stringify({ ...good, category: "vibes" })),
    ).toThrow(/failed validation/i);
    expect(() => parseCreatorRule('{"name":"x"}')).toThrow();
  });

  it("throws a readable error when the model returns no JSON at all", () => {
    expect(() => parseCreatorRule("I cannot help with that.")).toThrow(
      /did not return a JSON object/i,
    );
  });
});
