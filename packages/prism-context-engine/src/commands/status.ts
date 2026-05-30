/**
 * status command — Quick Prism state overview
 *
 * Shows a compact snapshot of the user's current Prism configuration:
 * active project, rule count, last sync time, cache warmth, and server state.
 */

import chalk from "chalk";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { loadConfig } from "../config.js";
import { getApiOptions } from "../api.js";

const PRISM_DIR = join(homedir(), ".prism");

interface StatusOptions {
  json?: boolean;
}

export async function status(options: StatusOptions = {}): Promise<void> {
  const config = loadConfig();
  const opts = getApiOptions();

  // ── Read local cache ──────────────────────────────────────────────────────
  const rulesCache = join(PRISM_DIR, "rules", "rules.json");
  const projectsCache = join(PRISM_DIR, "projects.json");

  let ruleCount = 0;
  let highPriority = 0;
  let activeProject: string | null = null;

  if (existsSync(rulesCache)) {
    try {
      const rules = JSON.parse(readFileSync(rulesCache, "utf-8")) as Array<{
        priority?: number;
        isActive?: boolean;
      }>;
      const active = rules.filter((r) => r.isActive !== false);
      ruleCount = active.length;
      highPriority = active.filter((r) => (r.priority || 50) <= 3).length;
    } catch {
      /* corrupted */
    }
  }

  if (existsSync(projectsCache)) {
    try {
      const raw = JSON.parse(readFileSync(projectsCache, "utf-8")) as
        | Array<{ name: string }>
        | {
            data?: Array<{ name: string }>;
            projects?: Array<{ name: string }>;
          };
      const projects = Array.isArray(raw)
        ? raw
        : ((raw as { data?: Array<{ name: string }> }).data ??
          (raw as { projects?: Array<{ name: string }> }).projects ??
          []);
      const first = projects[0];
      if (first) {
        activeProject = first.name;
      }
    } catch {
      /* ignore */
    }
  }

  // ── Last sync ─────────────────────────────────────────────────────────────
  let lastSync = "never";
  if (config.lastSync) {
    const age = Date.now() - new Date(config.lastSync).getTime();
    const hours = Math.floor(age / 3600000);
    const mins = Math.floor((age % 3600000) / 60000);
    if (hours > 24) {
      lastSync = `${Math.floor(hours / 24)}d ago`;
    } else if (hours > 0) {
      lastSync = `${hours}h ago`;
    } else {
      lastSync = `${mins}m ago`;
    }
  }

  // ── Cache warmth ──────────────────────────────────────────────────────────
  const cacheDir = join(PRISM_DIR, "cache");
  let cacheEntries = 0;
  if (existsSync(cacheDir)) {
    try {
      const { readdirSync } = await import("fs");
      cacheEntries = readdirSync(cacheDir).filter((f) =>
        f.endsWith(".json"),
      ).length;
    } catch {
      /* ignore */
    }
  }
  const cacheStatus =
    cacheEntries > 10 ? "warm" : cacheEntries > 0 ? "cold" : "empty";

  // ── JSON output ───────────────────────────────────────────────────────────
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          authenticated: !!opts.token,
          project: activeProject,
          rules: { total: ruleCount, highPriority },
          lastSync: config.lastSync || null,
          cache: { entries: cacheEntries, status: cacheStatus },
        },
        null,
        2,
      ),
    );
    return;
  }

  // ── Pretty output ─────────────────────────────────────────────────────────
  console.log(chalk.cyan("\n◈ Prism Status\n"));

  const row = (label: string, value: string) => {
    console.log(`  ${chalk.dim(label.padEnd(18))} ${value}`);
  };

  row(
    "Auth:",
    opts.token
      ? chalk.green(`✓ Authenticated (${opts.token.slice(0, 14)}...)`)
      : chalk.yellow("Not authenticated — run `prism login`"),
  );
  row(
    "Project:",
    activeProject ? chalk.white(activeProject) : chalk.dim("none"),
  );
  row(
    "Rules:",
    ruleCount > 0
      ? `${chalk.white(String(ruleCount))} total — ${chalk.cyan(String(highPriority))} high priority`
      : chalk.dim("none — run `prism sync`"),
  );
  row(
    "Last sync:",
    lastSync === "never"
      ? chalk.yellow("never — run `prism sync`")
      : chalk.white(lastSync),
  );
  row(
    "Cache:",
    cacheStatus === "warm"
      ? chalk.green(`warm (${cacheEntries} entries)`)
      : cacheStatus === "cold"
        ? chalk.yellow(`cold (${cacheEntries} entries)`)
        : chalk.dim("empty"),
  );
  row("Prism dir:", chalk.dim(PRISM_DIR));

  console.log("");

  // ── Quick next-steps ──────────────────────────────────────────────────────
  if (!opts.token) {
    console.log(chalk.yellow("  → Run `prism login` to authenticate."));
  } else if (ruleCount === 0) {
    console.log(chalk.yellow("  → Run `prism sync` to download your rules."));
  } else if (lastSync === "never") {
    console.log(chalk.dim("  → Run `prism sync` to download your rules."));
  }

  console.log("");
}
