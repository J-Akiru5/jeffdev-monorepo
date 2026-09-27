/**
 * resolve-project.ts — shared project resolution for `prism pull` and
 * `prism link`.
 *
 * Lists the account's projects (one network call) and either matches
 * --project, auto-picks under --yes, or prompts interactively with the
 * first project as the Enter-through default. Returns null when the account
 * has no projects at all; throws (callers fail safe) on any request/response
 * problem.
 *
 * Auth-agnostic: the caller passes the headers it wants to authenticate with
 * (x-api-key for the API-key path, Authorization: Bearer for the session
 * path) — project selection itself is identical for both.
 */

import chalk from "chalk";
import { promptText } from "../util/prompt.js";

export interface RemoteProjectSummary {
  id: string;
  slug: string;
  name: string;
}

export interface ResolvedProject {
  slug: string;
  id: string;
}

export interface ResolveOptions {
  project?: string;
  yes?: boolean;
}

export async function resolveProject(
  apiUrl: string,
  headers: Record<string, string>,
  options: ResolveOptions = {},
): Promise<ResolvedProject | null> {
  const res = await fetch(`${apiUrl}/api/v1/projects?limit=50`, { headers });
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

  console.log("Which project should Prism sync rules from?");
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