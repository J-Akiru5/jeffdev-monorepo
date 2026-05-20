import { describe, it, expect } from "vitest";
import { countTokensInText, trackToolResponse } from "./token-counter.js";

describe("countTokensInText", () => {
  it("should count tokens for plain text", () => {
    const tokens = countTokensInText("Hello world this is a test");
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(10);
  });

  it("should count tokens for markdown", () => {
    const markdown = `
# Prism Architectural Rules

**Category:** styling  
**Priority:** 1

Use Tailwind CSS classes instead of inline styles.
Always prefer utility-first approach.
    `.trim();
    const tokens = countTokensInText(markdown);
    expect(tokens).toBeGreaterThan(5);
    expect(tokens).toBeLessThan(100);
  });

  it("should count tokens for code snippets", () => {
    const code = `
function Button({ label, variant }: { label: string; variant: "primary" | "secondary" }) {
  return <button className={clsx("px-4 py-2 rounded", { "bg-blue-500": variant === "primary" })}>{label}</button>;
}
    `.trim();
    const tokens = countTokensInText(code);
    expect(tokens).toBeGreaterThan(10);
    expect(tokens).toBeLessThan(200);
  });

  it("should return 0 for empty string", () => {
    expect(countTokensInText("")).toBe(0);
  });

  it("should handle very large text without crashing", () => {
    const large = "token ".repeat(10000);
    const tokens = countTokensInText(large);
    expect(tokens).toBeGreaterThan(1000);
  });
});

describe("trackToolResponse", () => {
  it("should add tokenCount and byteSize to _meta", () => {
    const result = trackToolResponse({
      content: [{ type: "text", text: "Hello world test" }],
    });

    expect(result._meta).toBeDefined();
    expect(result._meta.tokenCount).toBeGreaterThan(0);
    expect(result._meta.byteSize).toBeGreaterThan(0);
  });

  it("should preserve existing _meta fields", () => {
    const result = trackToolResponse({
      content: [{ type: "text", text: "Hello" }],
      _meta: { source: "test" },
    });

    expect(result._meta.source).toBe("test");
    expect(result._meta.tokenCount).toBeGreaterThan(0);
  });

  it("should count tokens across multiple content blocks", () => {
    const result = trackToolResponse({
      content: [
        { type: "text", text: "First block with some tokens" },
        { type: "text", text: "Second block with more tokens here" },
      ],
    });

    expect(result._meta.tokenCount).toBeGreaterThan(5);
  });

  it("should track content length", () => {
    const short = trackToolResponse({
      content: [{ type: "text", text: "short" }],
    });
    const long = trackToolResponse({
      content: [{ type: "text", text: "a ".repeat(100) }],
    });

    expect(long._meta.byteSize).toBeGreaterThan(short._meta.byteSize);
  });

  it("should handle empty content", () => {
    const result = trackToolResponse({
      content: [{ type: "text", text: "" }],
    });

    expect(result._meta.tokenCount).toBe(0);
    expect(result._meta.byteSize).toBe(0);
  });

  it("should mark error responses", () => {
    const result = trackToolResponse({
      content: [{ type: "text", text: "Error occurred" }],
      isError: true,
    });

    expect(result.isError).toBe(true);
    expect(result._meta.tokenCount).toBeGreaterThan(0);
  });
});
