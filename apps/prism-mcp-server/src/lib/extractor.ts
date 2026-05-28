/// <reference lib="dom" />

export interface ExtractedDesignTokens {
  url: string;
  pagesScanned: number;
  tokensUsed: number;
  cssVariables: Record<string, string>;
  colors: string[];
  typography: {
    fontFamily: string;
    fontSizes: string[];
    headings: Record<
      string,
      { fontSize: string; fontWeight: string; fontFamily: string }
    >;
  };
  spacing: string[];
  componentPatterns: string[];
}

export interface ScanResult {
  tokens: ExtractedDesignTokens;
  rawMarkdown: string;
}

const MAX_TOKENS_ESTIMATE = (text: string): number =>
  Math.ceil(text.length / 4);

interface PageExtractResult {
  cssVariables: Record<string, string>;
  colors: string[];
  fontSizes: string[];
  headings: Array<{
    tag: string;
    fontSize: string;
    fontWeight: string;
    fontFamily: string;
  }>;
  spacing: string[];
  componentPatterns: string[];
}

function extractPageData(): PageExtractResult {
  const results: PageExtractResult = {
    cssVariables: {},
    colors: [],
    fontSizes: [],
    headings: [],
    spacing: [],
    componentPatterns: [],
  };

  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    try {
      const rules = (sheet as CSSStyleSheet).cssRules;
      if (!rules) continue;
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        if (rule instanceof CSSStyleRule) {
          for (let k = 0; k < rule.style.length; k++) {
            const prop = rule.style[k];
            if (prop && prop.startsWith("--")) {
              results.cssVariables[prop] = rule.style
                .getPropertyValue(prop)
                .trim();
            }
          }
        }
      }
    } catch {
      /* cross-origin */
    }
  }

  const body = document.body;
  if (body) {
    const computed = getComputedStyle(body);
    results.colors.push(computed.color, computed.backgroundColor);
    results.fontSizes.push(computed.fontSize);
    results.spacing.push(computed.margin, computed.padding, computed.gap);
  }

  const allElements = document.querySelectorAll("*");
  allElements.forEach((el) => {
    const inline = el.getAttribute("style");
    if (inline) {
      const colorMatch = inline.match(
        /(?:color|background-color|border-color):\s*([^;]+)/gi,
      );
      if (colorMatch)
        colorMatch.forEach((c) => {
          const v = c.split(":")[1];
          if (v) results.colors.push(v.trim());
        });
      const spacingMatch = inline.match(/(?:margin|padding|gap):\s*([^;]+)/gi);
      if (spacingMatch)
        spacingMatch.forEach((s) => {
          const v = s.split(":")[1];
          if (v) results.spacing.push(v.trim());
        });
    }
  });

  for (const tag of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    const els = document.querySelectorAll(tag);
    els.forEach((el) => {
      const cs = getComputedStyle(el);
      results.headings.push({
        tag,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
      });
    });
  }

  const classPatterns = new Set<string>();
  allElements.forEach((el) => {
    const cls = (el as HTMLElement).className;
    if (typeof cls === "string" && cls) {
      cls.split(/\s+/).forEach((p) => {
        if (/^[A-Z]/.test(p) || p.includes("__") || p.includes("--"))
          classPatterns.add(p);
      });
    }
  });
  results.componentPatterns = Array.from(classPatterns).slice(0, 30);

  return results;
}

function findInternalLinks(baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const anchors = document.querySelectorAll("a[href]");
  const internal: string[] = [];
  anchors.forEach((a) => {
    try {
      const href = (a as HTMLAnchorElement).href;
      const u = new URL(href);
      if (
        u.hostname === base.hostname &&
        !u.hash &&
        u.pathname !== base.pathname
      ) {
        internal.push(href);
      }
    } catch {
      /* skip */
    }
  });
  return [...new Set(internal)].slice(0, 10);
}

export async function scanUrl(
  url: string,
  maxPages: number = 5,
  depth: number = 2,
): Promise<ScanResult> {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    throw new Error(
      "Playwright is not installed. Run `npx playwright install chromium` to enable URL scanning.",
    );
  }
  const { chromium } = playwright;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any = null;
  const visited = new Set<string>();
  const pagesToVisit: Array<{ url: string; currentDepth: number }> = [
    { url, currentDepth: 0 },
  ];

  const allCssVariables: Record<string, string> = {};
  const allColors = new Set<string>();
  const allFontSizes = new Set<string>();
  const allHeadings: Record<
    string,
    { fontSize: string; fontWeight: string; fontFamily: string }
  > = {};
  const allSpacing = new Set<string>();
  const allComponentPatterns = new Set<string>();
  let totalTokens = 0;

  try {
    browser = await chromium.launch({ headless: true });

    while (pagesToVisit.length > 0 && visited.size < maxPages) {
      const current = pagesToVisit.shift();
      if (!current || visited.has(current.url)) continue;

      visited.add(current.url);

      const page = await browser.newPage();

      try {
        await page.goto(current.url, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        const extracted: PageExtractResult =
          await page.evaluate(extractPageData);

        Object.assign(allCssVariables, extracted.cssVariables);
        extracted.colors.forEach((c) => {
          if (c && c !== "transparent" && c !== "initial" && c !== "inherit")
            allColors.add(c);
        });
        extracted.fontSizes.forEach((s) => {
          if (s) allFontSizes.add(s);
        });
        extracted.spacing.forEach((s) => {
          if (s) allSpacing.add(s);
        });
        extracted.componentPatterns.forEach((p) => allComponentPatterns.add(p));
        for (const h of extracted.headings) {
          const key = `${h.tag}`;
          if (!allHeadings[key] || h.fontSize) {
            allHeadings[key] = {
              fontSize: h.fontSize,
              fontWeight: h.fontWeight,
              fontFamily: h.fontFamily,
            };
          }
        }

        try {
          const snapshot = await (
            page as unknown as {
              accessibility: { snapshot(): Promise<unknown> };
            }
          ).accessibility.snapshot();
          if (snapshot)
            totalTokens += MAX_TOKENS_ESTIMATE(JSON.stringify(snapshot));
        } catch {
          /* accessibility snapshot unavailable */
        }

        if (current.currentDepth < depth) {
          const links: string[] = await page.evaluate(
            findInternalLinks,
            current.url,
          );
          for (const link of links) {
            if (!visited.has(link))
              pagesToVisit.push({
                url: link,
                currentDepth: current.currentDepth + 1,
              });
          }
        }
      } catch {
        // skip failed page
      } finally {
        await page.close();
      }
    }
  } finally {
    if (browser) await browser.close();
  }

  const tokens: ExtractedDesignTokens = {
    url,
    pagesScanned: visited.size,
    tokensUsed: totalTokens,
    cssVariables: allCssVariables,
    colors: Array.from(allColors).slice(0, 50),
    typography: {
      fontFamily: "",
      fontSizes: Array.from(allFontSizes).slice(0, 20),
      headings: allHeadings,
    },
    spacing: Array.from(allSpacing).slice(0, 30),
    componentPatterns: Array.from(allComponentPatterns).slice(0, 30),
  };

  const rawMarkdown = formatExtractionAsMarkdown(tokens);

  return { tokens, rawMarkdown };
}

export function formatExtractionAsMarkdown(
  tokens: ExtractedDesignTokens,
): string {
  const lines: string[] = [
    `# Design Token Extraction Report`,
    ``,
    `**URL:** ${tokens.url}`,
    `**Pages Scanned:** ${tokens.pagesScanned}`,
    `**Estimated Tokens Used:** ${tokens.tokensUsed}`,
    ``,
  ];

  if (Object.keys(tokens.cssVariables).length > 0) {
    lines.push(`## CSS Custom Properties`, ``);
    for (const [key, val] of Object.entries(tokens.cssVariables).slice(0, 40)) {
      lines.push(`- \`${key}\`: \`${val}\``);
    }
    lines.push(``);
  }

  if (tokens.colors.length > 0) {
    lines.push(`## Color Palette`, ``);
    for (const c of tokens.colors) lines.push(`- ${c}`);
    lines.push(``);
  }

  if (Object.keys(tokens.typography.headings).length > 0) {
    lines.push(`## Typography`, ``);
    lines.push(`| Tag | Font Size | Font Weight | Font Family |`);
    lines.push(`|-----|-----------|-------------|-------------|`);
    for (const [tag, h] of Object.entries(tokens.typography.headings)) {
      lines.push(
        `| ${tag} | ${h.fontSize} | ${h.fontWeight} | ${h.fontFamily} |`,
      );
    }
    lines.push(``);
  }

  if (tokens.spacing.length > 0) {
    lines.push(`## Spacing Scale`, ``);
    for (const s of tokens.spacing) lines.push(`- \`${s}\``);
    lines.push(``);
  }

  if (tokens.componentPatterns.length > 0) {
    lines.push(`## Detected Component Patterns`, ``);
    for (const p of tokens.componentPatterns) lines.push(`- \`${p}\``);
    lines.push(``);
  }

  return lines.join("\n");
}
