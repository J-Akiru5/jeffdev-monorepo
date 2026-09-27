/**
 * pull command — the synced onboarding path
 *
 * Fetches this project's rules from Prism Cloud and writes
 * `.prism/rules.json` in the same v1 shape `prism init` generates locally
 * and `prism check` already parses.
 *
 * Fails safe, always:
 *   - no API key                  -> warn, leave rules.json untouched, exit 0
 *   - network error               -> warn, leave rules.json untouched, exit 0
 *   - non-2xx response (incl 401) -> warn, leave rules.json untouched, exit 0
 *   - malformed/invalid response  -> warn, leave rules.json untouched, exit 0
 * A failed pull must never break a working local setup. Writes go through
 * atomicWriteFileSync (temp file + rename) so a killed process can't leave
 * a half-written rules.json either.
 */

import chalk from "chalk";
import { join } from "path";
import { atomicWriteFileSync } from "../util/atomic-write.js";
import { loadConfig } from "../config.js";
import {
  resolveProject,
  type ResolvedProject,
} from "./resolve-project.js";
import {
  loadProjectConfig,
  saveProjectConfig,
  type ProjectConfig,
} from "../rules/project-config.js";
import { parseRuleSet } from "../rules/parse.js";

const DEFAULT_API_URL = "https://prism.syntaxure.dev";

export interface PullOptions {
  project?: string;
  yes?: boolean;
  /** Internal — lets tests point pull() at a fixture directory instead of
   *  the real process.cwd(). Not exposed as a CLI flag. */
  cwd?: string;
}

function warn(message: string): void {
  console.warn(chalk.yellow(`[prism pull] ${message}`));
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function pull(options: PullOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const rulesPath = join(cwd, ".prism", "rules.json");
  const config = loadProjectConfig(cwd);

  // Auth resolution — API key first (unchanged, demo-critical path), then
  // the global Bearer session token as a fallback. Both paths fail safe
  // identically: no credentials at all means warn + leave rules.json alone.
  const apiKey = process.env.PRISM_API_KEY || config.apiKey;
  const sessionToken = apiKey
    ? undefined
    : loadConfig().token || process.env.PRISM_TOKEN || undefined;

  if (!apiKey && !sessionToken) {
    warn(
      "No credentials found (checked PRISM_API_KEY, .prism/config.json, and the saved session from `prism login`). Kept .prism/rules.json untouched.",
    );
    warn(
      "Get a key from the Prism dashboard → Settings → API Keys, then set PRISM_API_KEY or add { \"apiKey\": \"...\" } to .prism/config.json — or run `prism login --token <token>` once to save a session.",
    );
    return;
  }
  const authHeaders: Record<string, string> = apiKey
    ? { "x-api-key": apiKey }
    : { Authorization: `Bearer ${sessionToken}` };
  const apiUrl = (
    process.env.PRISM_API_URL ||
    config.apiUrl ||
    DEFAULT_API_URL
  ).replace(/\/$/, "");

  let slug = options.project ?? config.activeProject;
  let projectId = slug ? config.projects[slug]?.id : undefined;

  if (!slug || !projectId) {
    let resolved: ResolvedProject | null;
    try {
      resolved = await resolveProject(apiUrl, authHeaders, options);
    } catch (err) {
      warn(`Could not resolve a project: ${errorMessage(err)}`);
      warn("Kept .prism/rules.json untouched.");
      return;
    }
    if (!resolved) {
      warn(
        "No projects found on your account — create one on the Prism dashboard first.",
      );
      return;
    }
    slug = resolved.slug;
    projectId = resolved.id;
    config.activeProject = slug;
    config.projects[slug] = { ...config.projects[slug], id: projectId };
    saveProjectConfig(config, cwd);
  }

  let body: unknown;
  try {
    let res: Response;
    try {
      res = await fetch(`${apiUrl}/api/v1/projects/${projectId}/rules/pass`, {
        headers: authHeaders,
      });
    } catch (err) {
      warn(`Could not reach Prism Cloud: ${errorMessage(err)}.`);
      warn("Kept .prism/rules.json untouched.");
      return;
    }
    if (!res.ok) {
      let detail = "";
      try {
        const errBody = (await res.json()) as { error?: string };
        if (errBody?.error) detail = `: ${errBody.error}`;
      } catch {
        /* body wasn't JSON — no extra detail available */
      }
      warn(`Pull failed (HTTP ${res.status})${detail}.`);
      warn("Kept .prism/rules.json untouched.");
      return;
    }
    try {
      body = await res.json();
    } catch (err) {
      warn(`Pull failed: server response was not valid JSON (${errorMessage(err)}).`);
      warn("Kept .prism/rules.json untouched.");
      return;
    }
  } catch (err) {
    // Belt-and-suspenders: any unexpected throw in the block above still
    // fails safe instead of crashing the CLI or touching rules.json.
    warn(`Pull failed: ${errorMessage(err)}.`);
    warn("Kept .prism/rules.json untouched.");
    return;
  }

  let ruleSet;
  try {
    ruleSet = parseRuleSet(JSON.stringify(body));
  } catch (err) {
    warn(
      `Pull failed: server response is not a valid rules.json (${errorMessage(err)}).`,
    );
    warn("Kept .prism/rules.json untouched.");
    return;
  }

  atomicWriteFileSync(rulesPath, `${JSON.stringify(ruleSet, null, 2)}\n`);

  const now = new Date().toISOString();
  config.activeProject = slug;
  config.projects[slug] = { id: projectId, lastPulled: now };
  saveProjectConfig(config, cwd);

  console.log(
    chalk.green(
      `✓ Pulled ${ruleSet.rules.length} rule(s) for "${slug}" → .prism/rules.json`,
    ),
  );
  console.log(
    chalk.dim(
      "  Run `prism check <file>` to try it, or just write code — the Claude Code hook (wired by `prism init`) enforces it automatically.",
    ),
  );
}

/**
 * Figure out which Prism Cloud project to pull.
 */
// (resolveProject now lives in ./resolve-project.ts — shared with prism link)

// Re-exported so tests can construct a ProjectConfig without importing the
// module twice under two different type names.
export type { ProjectConfig };
