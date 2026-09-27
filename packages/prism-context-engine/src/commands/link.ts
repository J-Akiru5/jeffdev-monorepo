/**
 * link command — connect the current directory to a Prism Cloud project.
 *
 * Uses the Bearer session token (from `prism login`) — NOT the API key —
 * to list the account's projects and resolve one (--project <slug>, --yes
 * auto-pick, or the interactive numbered picker shared with `prism pull`).
 *
 * The resolved project is persisted into the existing project-local
 * `.prism/config.json` shape (activeProject + projects[slug] = { id }) —
 * the exact same file and schema `prism pull` already reads and writes, so
 * a linked directory is immediately pullable with a bare `prism pull`.
 */

import chalk from "chalk";
import { getApiOptions } from "../api.js";
import { loadProjectConfig, saveProjectConfig } from "../rules/project-config.js";
import { resolveProject } from "./resolve-project.js";

const DEFAULT_API_URL = "https://prism.syntaxure.dev";

export interface LinkOptions {
  project?: string;
  yes?: boolean;
  /** Internal — lets tests point link() at a fixture directory. */
  cwd?: string;
}

export async function link(options: LinkOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const opts = getApiOptions();
  const token = opts.token;

  if (!token) {
    console.error(
      chalk.yellow("Not logged in — run `prism login` or `prism login --token <token>` first."),
    );
    process.exitCode = 1;
    return;
  }

  const apiUrl = (opts.apiUrl || DEFAULT_API_URL).replace(/\/$/, "");
  const headers = { Authorization: `Bearer ${token}` };

  let resolved;
  try {
    resolved = await resolveProject(apiUrl, headers, options);
  } catch (err) {
    console.error(chalk.red(`Could not resolve a project: ${String(err)}`));
    process.exitCode = 1;
    return;
  }

  if (!resolved) {
    console.error(
      chalk.yellow(
        "No projects found on your account — create one on the Prism dashboard first.",
      ),
    );
    process.exitCode = 1;
    return;
  }

  const config = loadProjectConfig(cwd);
  config.activeProject = resolved.slug;
  config.projects[resolved.slug] = {
    ...config.projects[resolved.slug],
    id: resolved.id,
  };
  saveProjectConfig(config, cwd);

  console.log(
    chalk.green(
      `✓ Linked this directory to "${resolved.slug}" (${resolved.id}).`,
    ),
  );
  console.log(
    chalk.dim("  Run `prism pull` — no arguments — to fetch that project's rules."),
  );
}