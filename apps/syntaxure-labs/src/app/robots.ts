import { MetadataRoute } from "next";

/**
 * ROBOTS.TXT
 * ----------
 * 2026 best practice: Separate AI training crawlers (blocked)
 * from search/retrieval crawlers (allowed).
 *
 * Training crawlers: harvest content to train foundation models.
 * Search/retrieval crawlers: fetch pages to generate cited answers
 * that drive referral traffic back to the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Block AI training crawlers (protect IP from model training)
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ClaudeBot",
        disallow: "/",
      },
      {
        userAgent: "Claude-Web",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "Google-Extended",
        disallow: "/",
      },
      {
        userAgent: "Applebot-Extended",
        disallow: "/",
      },
      // Allow AI search/retrieval crawlers (drives referral traffic)
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      // Default rule for all other crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: "https://www.syntaxure.dev/sitemap.xml",
  };
}
