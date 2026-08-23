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
import { promptText } from "../util/prompt.js";
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

interface RemoteProjectSummary {
  id: string;
  slug: string;
  name: string;
}

interface ResolvedProject {
  slug: string;
  id: string;
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

  const apiKey = process.env.PRISM_API_KEY || config.apiKey;
  if (!apiKey) {
    warn(
      "No API key found (checked PRISM_API_KEY and .prism/config.json). Kept .prism/rules.json untouched.",
    );
    warn(
      "Get a key from the Prism dashboard → Settings → API Keys, then set PRISM_API_KEY or add { \"apiKey\": \"...\" } to .prism/config.json.",
    );
    return;
  }
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
      resolved = await resolveProject(apiUrl, apiKey, options);
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
        headers: { "x-api-key": apiKey },
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
 * Figure out which Prism Cloud project to pull. Lists the account's
 * projects (one network call) and either matches --project, auto-picks
 * under --yes, or prompts interactively with the first project as the
 * Enter-through default. Returns null when the account has no projects at
 * all; throws (caller fails safe) on any request/response problem.
 */
async function resolveProject(
  apiUrl: string,
  apiKey: string,
  options: PullOptions,
): Promise<ResolvedProject | null> {
  const res = await fetch(`${apiUrl}/api/v1/projects?limit=50`, {
    headers: { "x-api-key": apiKey },
  });
  if (!res.ok) {
    throw new Error(`listing projects returned HTTP ${res.status}`);
  }
  const parsed = (await res.json()) as { data?: RemoteProjectSummary[] };
  const projects = parsed.data ?? [];

  if (options.project) {
    const match = projects.find((p) => p.slug === options.project);
    if (!match) {
      throw new Error(`no project with slug "${options.project}" found`);
    }
    return { slug: match.slug, id: match.id };
  }

  if (projects.length === 0) return null;
  if (options.yes || projects.length === 1) {
    return { slug: projects[0]!.slug, id: projects[0]!.id };
  }

  console.log("Which project should `prism pull` sync rules from?");
  for (let i = 0; i < projects.length; i++) {
    console.log(
      `  ${chalk.cyan(`[${i + 1}]`)} ${projects[i]!.name} ${chalk.dim(`(${projects[i]!.slug})`)}`,
    );
  }
  const answer = await promptText(`Pick 1-${projects.length}`, "1");
  const idx = Math.min(
    Math.max(parseInt(answer, 10) || 1, 1),
    projects.length,
  ) - 1;
  const picked = projects[idx]!;
  return { slug: picked.slug, id: picked.id };
}

// Re-exported so tests can construct a ProjectConfig without importing the
// module twice under two different type names.
export type { ProjectConfig };
