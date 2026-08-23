import { existsSync, readdirSync, readFileSync } from "fs";
import { join, relative } from "path";
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
const CUSTOM_PROP_RE_SOURCE = "--([a-zA-Z0-9-]+)\\s*:\\s*([^;]+);";

function extractCssCustomProperties(
  cssPath: string,
  relPath: string,
): ColorToken[] {
  const content = readFileSync(cssPath, "utf8");
  return extractCustomPropsFromText(content, relPath);
}

/** Phase 4 Batch B: text-based core so SFC harvesters (Vue/Svelte style
 *  blocks) and the repo scanner reuse ONE matching pipeline. */
export function extractCustomPropsFromText(
  content: string,
  displayPath: string,
): ColorToken[] {
  const found: ColorToken[] = [];
  const re = new RegExp(CUSTOM_PROP_RE_SOURCE, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const name = match[1]!;
    const value = match[2]!.trim();
    if (!HEX_VALUE_RE.test(value)) continue;
    found.push({
      hex: value.toLowerCase(),
      varRef: `var(--${name})`,
      source: displayPath,
    });
  }
  return found;
}

/**
 * Phase 4 Batch B: for Vue/Svelte files, return ONLY <style> block content
 * concatenated (scoped/module/lang attributes irrelevant to token regex).
 * Everything else returns the full file text.
 */
export function harvestStyleContent(filePath: string, content: string): string {
  const lower = filePath.toLowerCase();
  if (!lower.endsWith(".vue") && !lower.endsWith(".svelte")) return content;
  const blocks: string[] = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) blocks.push(m[1]!);
  return blocks.join("\n");
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

  // Phase 4 Batch A: priority candidates first (globals.css locations),
  // then a bounded walk over every other .css/.scss in the workspace so
  // plain-CSS and SCSS projects get token coverage without hand-listing.
  const absTargets = new Map<string, string>(); // abs -> display path
  for (const candidate of CSS_CANDIDATES) {
    const abs = join(cwd, candidate);
    if (existsSync(abs)) absTargets.set(abs, candidate);
  }
  for (const abs of walkStyleFiles(cwd)) {
    if (!absTargets.has(abs)) {
      absTargets.set(abs, relative(cwd, abs) || abs);
    }
  }

  for (const [abs, display] of absTargets) {
    cssFilesScanned.push(display);
    const content = harvestStyleContent(abs, readFileSync(abs, "utf8"));
    for (const token of extractCustomPropsFromText(content, display)) {
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

// ---------------------------------------------------------------------------
// Phase 4 Batch A: workspace style-file walker (plain CSS + SCSS).
// ---------------------------------------------------------------------------

const WALK_EXTENSIONS = [".css", ".scss", ".vue", ".svelte"];
const WALK_EXCLUDES = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".git",
  ".next",
  ".nuxt",
  ".output",
  ".svelte-kit",
]);
const MAX_WALK_DEPTH = 10;
const MAX_WALKED_FILES = 200;

/** Bounded depth-first collection of .css/.scss files, excluding vendored
 *  and build output directories. Deterministic order (sorted per dir) so
 *  output is stable run-to-run. */
function walkStyleFiles(cwd: string): string[] {
  const found: string[] = [];

  function walk(dir: string, depth: number): void {
    if (depth > MAX_WALK_DEPTH || found.length >= MAX_WALKED_FILES) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const sorted = [...entries].sort((a, b) => (a.name < b.name ? -1 : 1));
    // Two passes: directories first keeps stack depth shallow on wide trees.
    for (const entry of sorted) {
      if (!entry.isDirectory()) continue;
      if (WALK_EXCLUDES.has(entry.name) || entry.name.startsWith(".")) continue;
      walk(join(dir, entry.name), depth + 1);
      if (found.length >= MAX_WALKED_FILES) return;
    }
    for (const entry of sorted) {
      if (entry.isDirectory()) continue;
      const lower = entry.name.toLowerCase();
      if (WALK_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
        found.push(join(dir, entry.name));
        if (found.length >= MAX_WALKED_FILES) return;
      }
    }
  }

  walk(cwd, 0);
  return found;
}
