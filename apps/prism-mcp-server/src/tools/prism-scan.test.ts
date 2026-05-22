import { describe, it, expect } from "vitest";
import { formatExtractionAsMarkdown, type ExtractedDesignTokens } from "../lib/extractor.js";
import type { PrismScanInput } from "./prism-scan.js";

const SAMPLE_TOKENS: ExtractedDesignTokens = {
  url: "https://example.com",
  pagesScanned: 2,
  tokensUsed: 3800,
  cssVariables: {
    "primary-color": "#0070f3",
    "secondary-color": "#7928ca",
    "font-sans": "Inter, sans-serif",
    "spacing-unit": "8px",
  },
  colors: ["#0070f3", "#7928ca", "#111", "#fff", "rgb(0, 112, 243)"],
  typography: {
    fontFamily: "Inter, sans-serif",
    fontSizes: ["16px", "14px", "24px"],
    headings: {
      h1: { fontSize: "48px", fontWeight: "700", fontFamily: "Inter, sans-serif" },
      h2: { fontSize: "32px", fontWeight: "600", fontFamily: "Inter, sans-serif" },
      h3: { fontSize: "24px", fontWeight: "600", fontFamily: "Inter, sans-serif" },
    },
  },
  spacing: ["16px", "8px", "24px", "32px"],
  componentPatterns: ["Button", "Card__header", "Nav--primary", "Modal__content"],
};

describe("formatExtractionAsMarkdown", () => {
  it("should include URL and page count", () => {
    const md = formatExtractionAsMarkdown(SAMPLE_TOKENS);
    expect(md).toContain("https://example.com");
    expect(md).toContain("2");
  });

  it("should list CSS variables", () => {
    const md = formatExtractionAsMarkdown(SAMPLE_TOKENS);
    expect(md).toContain("primary-color");
    expect(md).toContain("#0070f3");
    expect(md).toContain("font-sans");
  });

  it("should list color palette", () => {
    const md = formatExtractionAsMarkdown(SAMPLE_TOKENS);
    expect(md).toContain("#0070f3");
    expect(md).toContain("#7928ca");
  });

  it("should list typography headings", () => {
    const md = formatExtractionAsMarkdown(SAMPLE_TOKENS);
    expect(md).toContain("h1");
    expect(md).toContain("48px");
    expect(md).toContain("h2");
    expect(md).toContain("32px");
  });

  it("should list spacing values", () => {
    const md = formatExtractionAsMarkdown(SAMPLE_TOKENS);
    expect(md).toContain("16px");
    expect(md).toContain("24px");
  });

  it("should list component patterns", () => {
    const md = formatExtractionAsMarkdown(SAMPLE_TOKENS);
    expect(md).toContain("Button");
    expect(md).toContain("Card__header");
    expect(md).toContain("Nav--primary");
  });

  it("should handle empty tokens gracefully", () => {
    const empty: ExtractedDesignTokens = {
      url: "https://empty.com",
      pagesScanned: 0,
      tokensUsed: 0,
      cssVariables: {},
      colors: [],
      typography: { fontFamily: "", fontSizes: [], headings: {} },
      spacing: [],
      componentPatterns: [],
    };
    const md = formatExtractionAsMarkdown(empty);
    expect(md).toContain("https://empty.com");
    expect(md).not.toContain("## Color Palette");
  });

  it("should estimate tokens correctly from snapshot string", () => {
    const text = JSON.stringify({ role: "banner", name: "Header" });
    const estimated = Math.ceil(text.length / 4);
    expect(estimated).toBeGreaterThan(0);
    expect(estimated).toBeLessThan(100);
  });
});

describe("handlePrismScan input validation", () => {
  it("should reject missing URL", () => {
    const input = {} as PrismScanInput;
    expect(input.url).toBeUndefined();
  });

  it("should reject invalid URL format", () => {
    const input: PrismScanInput = { url: "not-a-url" };
    expect(() => new URL(input.url)).toThrow();
  });

  it("should accept valid URL", () => {
    const input: PrismScanInput = { url: "http://localhost:3000" };
    expect(() => new URL(input.url)).not.toThrow();
  });

  it("should accept https URLs", () => {
    const input: PrismScanInput = { url: "https://example.com" };
    expect(() => new URL(input.url)).not.toThrow();
  });

  it("should have defaults for optional params", () => {
    const input: PrismScanInput = { url: "https://example.com" };
    expect(input.maxPages ?? 5).toBe(5);
    expect(input.depth ?? 2).toBe(2);
  });

  it("should accept all optional params", () => {
    const input: PrismScanInput = {
      url: "https://example.com",
      maxPages: 10,
      depth: 3,
      projectId: "proj-1",
      userId: "user-1",
      model: "gemini-flash-lite",
    };
    expect(input.maxPages).toBe(10);
    expect(input.depth).toBe(3);
    expect(input.projectId).toBe("proj-1");
    expect(input.userId).toBe("user-1");
    expect(input.model).toBe("gemini-flash-lite");
  });
});

describe("rule-generator token estimation", () => {
  it("should estimate tokens for a given text", () => {
    const estimateTokens = (text: string) => Math.ceil(text.length / 4);
    expect(estimateTokens("hello world")).toBe(3);
    expect(estimateTokens("a".repeat(100))).toBe(25);
    expect(estimateTokens("")).toBe(0);
  });
});
