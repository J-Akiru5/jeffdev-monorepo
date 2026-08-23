import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface ProjectDetection {
  hasPackageJson: boolean;
  isNextjs: boolean;
  nextVersion?: string;
  router: "app" | "pages" | "both" | "none";
  hasTailwind: boolean;
  tailwindVersion?: string;
  tailwindMajor?: number;
}

function readVersion(
  deps: Record<string, unknown> | undefined,
  name: string,
): string | undefined {
  const raw = deps?.[name];
  return typeof raw === "string" ? raw : undefined;
}

function majorVersion(range: string | undefined): number | undefined {
  if (!range) return undefined;
  const match = /(\d+)/.exec(range);
  return match ? parseInt(match[1]!, 10) : undefined;
}

/**
 * Detect the project's stack from package.json and its own directory
 * layout — no network, no code execution. Missing/unreadable package.json
 * degrades to "nothing detected" rather than throwing, so `prism init`
 * can still fall through to the empty-case starter rules.json.
 */
export function detectProject(cwd: string): ProjectDetection {
  const pkgPath = join(cwd, "package.json");
  if (!existsSync(pkgPath)) {
    return {
      hasPackageJson: false,
      isNextjs: false,
      router: "none",
      hasTailwind: false,
    };
  }

  let pkg: Record<string, unknown> = {};
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  } catch {
    return {
      hasPackageJson: true,
      isNextjs: false,
      router: "none",
      hasTailwind: false,
    };
  }

  const deps = pkg.dependencies as Record<string, unknown> | undefined;
  const devDeps = pkg.devDependencies as Record<string, unknown> | undefined;
  const nextVersion = readVersion(deps, "next") ?? readVersion(devDeps, "next");
  const tailwindVersion =
    readVersion(deps, "tailwindcss") ?? readVersion(devDeps, "tailwindcss");

  const hasAppRouter =
    existsSync(join(cwd, "app")) || existsSync(join(cwd, "src", "app"));
  const hasPagesRouter =
    existsSync(join(cwd, "pages")) || existsSync(join(cwd, "src", "pages"));

  let router: ProjectDetection["router"] = "none";
  if (hasAppRouter && hasPagesRouter) router = "both";
  else if (hasAppRouter) router = "app";
  else if (hasPagesRouter) router = "pages";

  return {
    hasPackageJson: true,
    isNextjs: nextVersion !== undefined,
    nextVersion,
    router,
    hasTailwind: tailwindVersion !== undefined,
    tailwindVersion,
    tailwindMajor: majorVersion(tailwindVersion),
  };
}
