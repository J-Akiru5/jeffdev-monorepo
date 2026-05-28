import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative, basename, extname } from "path";
import type { RepoScanData } from "../types.js";

export type RepoScanReport = RepoScanData;

const SCAN_DIRS = ["src", "components", "lib", "utils", "styles", "app", "pages"];
const CONFIG_FILES = [
  "package.json",
  "tsconfig.json",
  ".eslintrc",
  ".eslintrc.json",
  ".eslintrc.js",
  "tailwind.config.ts",
  "tailwind.config.js",
  ".prettierrc",
  ".prettierrc.json",
  "next.config.ts",
  "next.config.js",
];
const SOURCE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".svelte",
]);

export interface ProjectInfo {
  root: string;
  name: string;
  stack: string[];
  framework: string;
  description: string;
}

export function detectCurrentProject(cwd?: string): ProjectInfo {
  const root = cwd || process.cwd();

  const info: ProjectInfo = {
    root,
    name: basename(root),
    stack: [],
    framework: "unknown",
    description: "",
  };

  const pkgPath = join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      info.name = pkg.name || info.name;
      info.description = pkg.description || "";

      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const depKeys = Object.keys(deps);

      if (depKeys.includes("next")) info.framework = "nextjs";
      else if (depKeys.includes("react")) info.framework = "react";
      else if (depKeys.includes("express")) info.framework = "express";
      else if (depKeys.includes("vite")) info.framework = "vite";

      if (depKeys.includes("typescript") || depKeys.includes("ts-node")) info.stack.push("TypeScript");
      if (depKeys.includes("tailwindcss")) info.stack.push("Tailwind CSS");
      if (depKeys.includes("@supabase/supabase-js")) info.stack.push("Supabase");
      if (depKeys.includes("mongodb")) info.stack.push("MongoDB");
      if (depKeys.includes("next")) info.stack.push("Next.js");
      if (depKeys.includes("react")) info.stack.push("React");
    } catch {
      // package.json unreadable — skip
    }
  }

  const tsconfigPath = join(root, "tsconfig.json");
  if (existsSync(tsconfigPath) && !info.stack.includes("TypeScript")) {
    info.stack.unshift("TypeScript");
  }

  return info;
}

export async function scanCurrentRepo(
  repoPath?: string,
): Promise<RepoScanReport> {
  const root = repoPath || process.cwd();

  const naming: RepoScanReport["namingConventions"] = {
    files: {},
    functions: {},
    components: {},
    variables: {},
  };
  const imports: RepoScanReport["imports"] = {
    relative: 0,
    absolute: 0,
    external: {},
    internal: {},
  };
  const dirs: string[] = [];
  let fileCount = 0;
  let dirCount = 0;
  const languages: Record<string, number> = {};
  const configs: Record<string, unknown> = {};

  for (const cfg of CONFIG_FILES) {
    const cfgPath = join(root, cfg);
    if (existsSync(cfgPath)) {
      try {
        const raw = readFileSync(cfgPath, "utf-8");
        if (cfg.endsWith(".json")) {
          configs[cfg] = JSON.parse(raw);
        } else {
          configs[cfg] = raw.slice(0, 500);
        }
      } catch {
        configs[cfg] = "<unreadable>";
      }
    }
  }

  function walk(dir: string, depth: number = 0): void {
    if (depth > 8) return;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = join(dir, entry);
      let stats;
      try {
        stats = statSync(full);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        if (
          !entry.startsWith(".") &&
          entry !== "node_modules" &&
          entry !== ".next" &&
          entry !== "dist" &&
          entry !== "build"
        ) {
          dirCount++;
          dirs.push(relative(root, full));
          walk(full, depth + 1);
        }
      } else if (stats.isFile()) {
        fileCount++;
        const ext = extname(entry).toLowerCase();
        if (ext) languages[ext] = (languages[ext] || 0) + 1;

        if (SOURCE_EXTENSIONS.has(ext)) {
          const name = basename(entry, ext);
          const convention = detectConvention(name);
          naming.files[convention] = (naming.files[convention] || 0) + 1;

          try {
            const content = readFileSync(full, "utf-8");
            analyzeContent(content, naming, imports);
          } catch {
            // skip unreadable
          }
        }
      }
    }
  }

  const rootDirs = SCAN_DIRS.filter((d) => existsSync(join(root, d)));
  if (rootDirs.length > 0) {
    for (const d of rootDirs) {
      walk(join(root, d));
    }
  } else {
    walk(root);
  }

  const totalNaming = Object.values(naming.files).reduce((a, b) => a + b, 0);
  const dominantFileConvention =
    Object.entries(naming.files).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
  const topExternal = Object.entries(imports.external)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const summary = [
    `Scanned ${fileCount} files in ${dirCount} directories`,
    `Languages: ${Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([e, c]) => `${e}: ${c}`)
      .join(", ")}`,
    totalNaming > 0
      ? `File naming convention: ${dominantFileConvention} (${Math.round(((naming.files[dominantFileConvention] ?? 0) / totalNaming) * 100)}%)`
      : "No source files found",
    imports.relative > 0
      ? `Imports: ${imports.relative} relative, ${imports.absolute} absolute`
      : "",
    topExternal.length > 0
      ? `Top deps: ${topExternal.map(([d]) => d).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    root,
    namingConventions: naming,
    imports,
    structure: { directories: dirs, fileCount, dirCount, languages },
    configs,
    summary,
  };
}

function detectConvention(name: string): string {
  if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return "PascalCase";
  if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return "camelCase";
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return "kebab-case";
  if (/^[a-z0-9]+(_[a-z0-9]+)*$/.test(name)) return "snake_case";
  if (/^[A-Z0-9_]+$/.test(name)) return "UPPER_CASE";
  return "other";
}

function detectVarConvention(name: string): string {
  if (/^[a-z][a-zA-Z0-9]*$/.test(name)) return "camelCase";
  if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) return "PascalCase";
  if (/^[A-Z0-9_]+$/.test(name)) return "UPPER_CASE";
  if (/^[a-z0-9]+(_[a-z0-9]+)*$/.test(name)) return "snake_case";
  return "other";
}

function analyzeContent(
  content: string,
  naming: RepoScanReport["namingConventions"],
  imports: RepoScanReport["imports"],
): void {
  const funcRegex = /(?:export\s+)?(?:function|const)\s+(\w+)\s*(?:=\s*(?:\(|async\s*\())?/g;
  let m: RegExpExecArray | null;
  while ((m = funcRegex.exec(content)) !== null) {
    const convention = detectVarConvention(m[1]!);
    naming.functions[convention] = (naming.functions[convention] || 0) + 1;
  }

  const compRegex = /(?:export\s+)?(?:function|const)\s+([A-Z]\w*)\s*(?::\s*(?:React\.)?FC|=(?:\s*React\.)?\s*(?:memo\s*)?\s*(?:\(|async\s*\())?/g;
  while ((m = compRegex.exec(content)) !== null) {
    const convention = detectVarConvention(m[1]!);
    naming.components[convention] = (naming.components[convention] || 0) + 1;
  }

  const varRegex = /(?:const|let|var)\s+(\w+)\s*[=:]/g;
  while ((m = varRegex.exec(content)) !== null) {
    const convention = detectVarConvention(m[1]!);
    naming.variables[convention] = (naming.variables[convention] || 0) + 1;
  }

  const importRegex = /(?:import\s+(?:\w+\s*,?\s*)?(?:\{[^}]*\})?\s*from\s+["']([^"']+)["']|import\s+["']([^"']+)["'])/g;
  while ((m = importRegex.exec(content)) !== null) {
    const spec = m[1] || m[2];
    if (!spec) continue;

    if (spec.startsWith(".") || spec.startsWith("/")) {
      imports.relative++;
    } else if (spec.startsWith("@")) {
      imports.absolute++;
      const pkg = spec!.split("/").slice(0, 2).join("/");
      imports.internal[pkg] = (imports.internal[pkg] || 0) + 1;
    } else {
      imports.absolute++;
      const pkg = spec!.startsWith("@")
        ? spec!.split("/").slice(0, 2).join("/")
        : spec!.split("/")[0]!;
      imports.external[pkg] = (imports.external[pkg] || 0) + 1;
    }
  }
}

export function formatScanReport(report: RepoScanReport): string {
  const topExt = Object.entries(report.imports.external)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const topInt = Object.entries(report.imports.internal)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return [
    `# Repo Scan Report\n`,
    `**Root:** ${report.root}`,
    `**Files:** ${report.structure.fileCount} | **Dirs:** ${report.structure.dirCount}`,
    `**Languages:** ${Object.entries(report.structure.languages)
      .map(([e, c]) => `${e}: ${c}`)
      .join(", ")}`,
    ``,
    `## Naming Conventions`,
    `**Files:** ${formatConvention(report.namingConventions.files)}`,
    `**Functions:** ${formatConvention(report.namingConventions.functions)}`,
    `**Components:** ${formatConvention(report.namingConventions.components)}`,
    `**Variables:** ${formatConvention(report.namingConventions.variables)}`,
    ``,
    `## Import Patterns`,
    `Relative imports: ${report.imports.relative}`,
    `Absolute imports: ${report.imports.absolute}`,
    topExt.length > 0
      ? `\n**Top external packages:**\n${topExt.map(([p, c]) => `- ${p} (${c})`).join("\n")}`
      : "",
    topInt.length > 0
      ? `\n**Internal packages:**\n${topInt.map(([p, c]) => `- ${p} (${c})`).join("\n")}`
      : "",
    ``,
    `## Config Files`,
    Object.keys(report.configs).length > 0
      ? Object.entries(report.configs)
          .map(([k]) => `- ${k}`)
          .join("\n")
      : "None found",
  ]
    .filter(Boolean)
    .join("\n");
}

function formatConvention(map: Record<string, number>): string {
  const total = Object.values(map).reduce((a, b) => a + b, 0);
  if (total === 0) return "none detected";
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}: ${v} (${Math.round((v / total) * 100)}%)`)
    .join(", ");
}
