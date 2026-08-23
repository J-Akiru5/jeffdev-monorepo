import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { atomicWriteFileSync } from "../util/atomic-write.js";

/**
 * Project-local `.prism/config.json` — lives inside the repo, next to
 * `.prism/rules.json`. This is NOT the global `~/.prism/config.json`
 * managed by `../config.ts`, which holds the cloud login token used by
 * `login`/`sync`/`brands`/`generate`/etc. That file is a per-machine
 * credential store; this one is per-project state a team can choose to
 * commit (to pin everyone to the same synced project) or gitignore (to
 * keep the API key out of source control) — `prism init` and `prism pull`
 * never require it to exist.
 */
export interface ProjectConfigEntry {
  /** The Prism Cloud project id (UUID) this slug last resolved to. */
  id: string;
  /** ISO timestamp of the last successful `prism pull` for this project. */
  lastPulled?: string;
}

export interface ProjectConfig {
  /** Falls back to the PRISM_API_KEY env var when unset; env wins. */
  apiKey?: string;
  /** Falls back to the PRISM_API_URL env var / the public default. */
  apiUrl?: string;
  /** Slug of the project `prism pull` uses when --project isn't passed. */
  activeProject?: string;
  /**
   * Every project this repo has ever synced with, keyed by slug. Do not
   * assume this has exactly one entry — a repo can be pulled against more
   * than one Prism Cloud project over its life (renames, forks, monorepo
   * sub-projects), and `activeProject` is what picks the current one.
   */
  projects: Record<string, ProjectConfigEntry>;
}

function configPath(cwd: string): string {
  return join(cwd, ".prism", "config.json");
}

export function loadProjectConfig(cwd: string = process.cwd()): ProjectConfig {
  const path = configPath(cwd);
  if (!existsSync(path)) return { projects: {} };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Record<
      string,
      unknown
    >;
    const projects =
      parsed.projects && typeof parsed.projects === "object"
        ? (parsed.projects as Record<string, ProjectConfigEntry>)
        : {};
    return {
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : undefined,
      apiUrl: typeof parsed.apiUrl === "string" ? parsed.apiUrl : undefined,
      activeProject:
        typeof parsed.activeProject === "string"
          ? parsed.activeProject
          : undefined,
      projects,
    };
  } catch {
    // Corrupt config.json shouldn't crash `prism pull` — start from an
    // empty in-memory config. saveProjectConfig() will replace the file
    // with valid JSON on the next write.
    return { projects: {} };
  }
}

export function saveProjectConfig(
  config: ProjectConfig,
  cwd: string = process.cwd(),
): void {
  atomicWriteFileSync(
    configPath(cwd),
    `${JSON.stringify(config, null, 2)}\n`,
  );
}
