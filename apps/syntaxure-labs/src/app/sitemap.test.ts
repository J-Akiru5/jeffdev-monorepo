import { describe, expect, it } from "vitest";
import { staticSitemapPages } from "./sitemap";

/**
 * Sitemap coverage
 * ----------------
 * The launch page and marketing routes must stay in the sitemap — a silent
 * drop would cost discoverability exactly when it matters.
 */

describe("staticSitemapPages", () => {
  const pages = staticSitemapPages(new Date("2026-10-20T00:00:00Z"));
  const urls = pages.map((p) => p.url);

  it("includes the launch page and marketing routes", () => {
    const required = [
      "/prism",
      "/blog",
      "/community",
      "/changelog",
      "/products",
      "/services",
      "/work",
      "/quote",
      "/pricing",
    ];
    for (const path of required) {
      expect(urls).toContain(`https://www.syntaxure.dev${path}`);
    }
  });

  it("uses unique absolute https urls", () => {
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) {
      expect(url.startsWith("https://www.syntaxure.dev")).toBe(true);
    }
  });

  it("keeps the home page at the top priority", () => {
    const home = pages.find((p) => p.url === "https://www.syntaxure.dev");
    expect(home?.priority).toBe(1.0);
  });
});
