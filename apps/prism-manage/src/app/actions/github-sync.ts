"use server";

import { Octokit } from "@octokit/rest";
import { revalidatePath } from "next/cache";
import type { MarketingTask } from "@/lib/schemas";
import { buildLabels, issueToMarketingTask } from "@/lib/github-utils";
import { createClient } from "@/lib/supabase/server";

function getOctokit() {
  const token = process.env.GITHUB_PAT;
  if (!token) throw new Error("GITHUB_PAT environment variable is not configured");
  return new Octokit({ auth: token });
}

function getRepoConfig(): { owner: string; repo: string } {
  const owner = process.env.GITHUB_MARKETING_REPO_OWNER;
  const repo = process.env.GITHUB_MARKETING_REPO_NAME;
  if (!owner || !repo) {
    throw new Error(
      "GITHUB_MARKETING_REPO_OWNER and GITHUB_MARKETING_REPO_NAME must be configured"
    );
  }
  return { owner, repo };
}

export async function fetchGitHubIssues(): Promise<
  Array<{
    number: number;
    title: string;
    state: string;
    body?: string | null;
    html_url: string;
    created_at: string;
    labels: (string | { name?: string })[];
  }>
> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoConfig();

  const { data: issues } = await octokit.issues.listForRepo({
    owner,
    repo,
    labels: "marketing",
    state: "all",
    per_page: 100,
    sort: "created",
    direction: "desc",
  });

  return issues
    .filter((i) => !(i as { pull_request?: unknown }).pull_request)
    .map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      body: i.body,
      html_url: i.html_url,
      created_at: i.created_at,
      labels: i.labels as (string | { name?: string })[],
    }));
}

export async function syncGitHubIssuesToSupabase(): Promise<{
  imported: number;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { imported: 0, error: "Unauthorized" };

  try {
    const issues = await fetchGitHubIssues();

    let imported = 0;
    for (const issue of issues) {
      const task = issueToMarketingTask(issue);
      const { error } = await supabase.from("marketing_tasks").upsert(
        {
          id: task.id,
          title: task.title,
          status: task.status,
          phase_id: task.phaseId,
          owner_ids: task.ownerIds,
          priority: task.priority,
          platform: task.platform,
          description: task.description,
          github_issue_number: task.githubIssueNumber,
          updated_at: task.updatedAt,
        },
        { onConflict: "id" }
      );
      if (!error) imported++;
    }

    revalidatePath("/marketing");
    return { imported };
  } catch (err) {
    return {
      imported: 0,
      error: err instanceof Error ? err.message : "Sync failed",
    };
  }
}

export async function createGitHubIssue(task: {
  title: string;
  description?: string;
  phaseId: string;
  priority: string;
  ownerIds: string[];
  platform?: string;
}): Promise<MarketingTask | null> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoConfig();

  const labels = buildLabels({
    phase: task.phaseId,
    priority: task.priority,
    owners: task.ownerIds,
    platform: task.platform,
    status: "todo",
  });

  const { data: issue } = await octokit.issues.create({
    owner,
    repo,
    title: task.title,
    body: task.description || "",
    labels,
  });

  return issueToMarketingTask({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    body: issue.body,
    html_url: issue.html_url,
    created_at: issue.created_at,
    labels: issue.labels as (string | { name?: string })[],
  });
}

export async function updateGitHubIssueStatus(
  issueNumber: number,
  newStatus: "todo" | "in-progress" | "done"
): Promise<void> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoConfig();
  const { githubUtils } = await import("@/lib/github-utils");
  const { extractLabels } = githubUtils;

  const { data: issue } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  const currentLabels = extractLabels(
    issue.labels as (string | { name?: string })[]
  ).filter((l) => !l.startsWith("status-"));

  if (newStatus === "done") {
    await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      labels: [...currentLabels, "status-done"],
      state: "closed",
    });
  } else {
    await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      labels: [...currentLabels, `status-${newStatus}`],
      state: "open",
    });
  }

  revalidatePath("/marketing");
}
