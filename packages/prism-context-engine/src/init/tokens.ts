import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";

export interface ColorToken {
  /** Lowercased hex value as it appears in source, e.g. "#06b6d4". */
  hex: string;
  /** The CSS variable reference to enforce instead, e.g. "var(--brand-primary)". */
  varRef: string;
  /** File the token was found in, relative to cwd — shown in the summary. */
  source: string;
}

export interface ExtractedTokens {
  /** Hex-valued CSS custom properties from globals.css / Tailwind v4 @theme blocks. */
  colorTokens: ColorToken[];
  /** CSS files that were actually found and scanned. */
  cssFilesScanned: string[];
  /** Tailwind config file found, if any (informational). */
  tailwindConfigFile?: string;
  /** Tailwind theme colors found via config parsing — informational only:
   *  they have no CSS variable to enforce against, so they don't feed the
   *  required_token check, but their presence still signals a customized
   *  scale worth guarding with the arbitrary_value rule. */
  tailwindConfigColorCount: number;
  /** True if the tailwind.config parse fell back to regex (couldn't be
   *  dynamically imported, or import threw) — surfaced in the summary so
   *  the user knows the count above may be incomplete. */
  tailwindConfigParsedViaRegexFallback: boolean;
}

const CSS_CANDIDATES = [
  "app/globals.css",
  "src/app/globals.css",
  "app/global.css",
  "src/app/global.css",
  "styles/globals.css",
  "src/styles/globals.css",
  "styles/global.css",
];

const TAILWIND_CONFIG_CANDIDATES = [
  "tailwind.config.js",
  "tailwind.config.cjs",
  "tailwind.config.mjs",
  "tailwind.config.ts",
];

const HEX_VALUE_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const CUSTOM_PROP_RE = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;

function extractCssCustomProperties(
  cssPath: string,
  relPath: string,
): ColorToken[] {
  const content = readFileSync(cssPath, "utf8");
  const found: ColorToken[] = [];
  CUSTOM_PROP_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CUSTOM_PROP_RE.exec(content)) !== null) {
    const name = match[1]!;
    const value = match[2]!.trim();
    if (!HEX_VALUE_RE.test(value)) continue;
    found.push({
      hex: value.toLowerCase(),
      varRef: `var(--${name})`,
      source: relPath,
    });
  }
  return found;
}

function flattenColorValues(
  node: unknown,
  path: string[] = [],
): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof node === "string") {
    if (HEX_VALUE_RE.test(node)) {
      out.set(node.toLowerCase(), path.join("-") || node);
    }
    return out;
  }
  if (!node || typeof node !== "object") return out;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    for (const [hex, name] of flattenColorValues(value, [...path, key])) {
      if (!out.has(hex)) out.set(hex, name);
    }
  }
  return out;
}

/** Best-effort regex extraction of `key: '#hex'` pairs inside a `colors: {...}`
 *  block — used for .ts configs (no TS runtime available) and as a fallback
 *  when dynamically importing a .js/.mjs/.cjs config throws. Single-level;
 *  it won't catch computed values or spread palettes, only literal hex
 *  strings, which is exactly what makes it safe to run without evaluating
 *  the file. */
function regexExtractColors(configSource: string): number {
  const colorsBlockMatch = /colors\s*:\s*{([\s\S]*?)}\s*[,}]/m.exec(
    configSource,
  );
  if (!colorsBlockMatch) return 0;
  const hexMatches = colorsBlockMatch[1]!.match(/#[0-9a-fA-F]{3,8}\b/g);
  return hexMatches ? new Set(hexMatches.map((h) => h.toLowerCase())).size : 0;
}

async function extractTailwindConfig(
  cwd: string,
): Promise<
  Pick<
    ExtractedTokens,
    | "tailwindConfigFile"
    | "tailwindConfigColorCount"
    | "tailwindConfigParsedViaRegexFallback"
  >
> {
  for (const candidate of TAILWIND_CONFIG_CANDIDATES) {
    const abs = join(cwd, candidate);
    if (!existsSync(abs)) continue;

    if (candidate.endsWith(".ts")) {
      // No TypeScript runtime available here — regex-only, deliberately.
      const source = readFileSync(abs, "utf8");
      return {
        tailwindConfigFile: candidate,
        tailwindConfigColorCount: regexExtractColors(source),
        tailwindConfigParsedViaRegexFallback: true,
      };
    }

    // .js/.mjs/.cjs: dynamically import it, the same way Tailwind itself
    // loads it, to read theme.extend.colors accurately (spreads, imported
    // palettes, computed keys — regex can't see any of that). This is
    // local code execution of a file the project already trusts and runs
    // through its own build, not a network call.
    try {
      const mod = (await import(pathToFileURL(abs).href)) as {
        default?: unknown;
      };
      const config = (mod.default ?? mod) as {
        theme?: { extend?: { colors?: unknown }; colors?: unknown };
      };
      const colors = config.theme?.extend?.colors ?? config.theme?.colors;
      const flattened = flattenColorValues(colors);
      return {
        tailwindConfigFile: candidate,
        tailwindConfigColorCount: flattened.size,
        tailwindConfigParsedViaRegexFallback: false,
      };
    } catch {
      const source = readFileSync(abs, "utf8");
      return {
        tailwindConfigFile: candidate,
        tailwindConfigColorCount: regexExtractColors(source),
        tailwindConfigParsedViaRegexFallback: true,
      };
    }
  }
  return {
    tailwindConfigColorCount: 0,
    tailwindConfigParsedViaRegexFallback: false,
  };
}

/**
 * Extract design tokens from the project's own source — zero network calls.
 * CSS custom properties come from a text/regex scan of globals.css (which
 * also covers Tailwind v4's CSS-first `@theme {}` tokens, since those are
 * just custom properties too). Tailwind config colors are read via dynamic
 * import for .js/.mjs/.cjs (accurate) or regex for .ts (no TS runtime here).
 */
export async function extractTokens(cwd: string): Promise<ExtractedTokens> {
  const colorTokens: ColorToken[] = [];
  const cssFilesScanned: string[] = [];
  const seenHex = new Set<string>();

  for (const candidate of CSS_CANDIDATES) {
    const abs = join(cwd, candidate);
    if (!existsSync(abs)) continue;
    cssFilesScanned.push(candidate);
    for (const token of extractCssCustomProperties(abs, candidate)) {
      if (seenHex.has(token.hex)) continue;
      seenHex.add(token.hex);
      colorTokens.push(token);
    }
  }

  const tailwindConfig = await extractTailwindConfig(cwd);

  return {
    colorTokens,
    cssFilesScanned,
    ...tailwindConfig,
  };
}
