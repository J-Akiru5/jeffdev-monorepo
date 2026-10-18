"use server";

import { Octokit } from "@octokit/rest";
import { revalidatePath } from "next/cache";
import type { MarketingTask } from "@/lib/schemas";
import { buildLabels, issueToMarketingTask, extractLabels, toTitleCase } from "@/lib/github-utils";
import { createClient } from "@/lib/supabase/server";
import { requireMarketingAccess } from "@/lib/authorization-server";

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

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return supabase;
}

async function requireMarketingAuth() {
  const supabase = await requireAuth();
  await requireMarketingAccess(supabase);
  return supabase;
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
  await requireMarketingAuth();
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
    await requireMarketingAccess(supabase);
    const issues = await fetchGitHubIssues();
    if (issues.length === 0) return { imported: 0 };

    const tasks = issues.map(issueToMarketingTask);

    const { error } = await supabase.from("marketing_tasks").upsert(
      tasks.map((task) => ({
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
      })),
      { onConflict: "id", ignoreDuplicates: false }
    );

    if (error) throw error;

    revalidatePath("/marketing");
    return { imported: tasks.length };
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
}): Promise<MarketingTask> {
  await requireMarketingAuth();
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

  revalidatePath("/marketing");

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
  await requireMarketingAuth();
  const octokit = getOctokit();
  const { owner, repo } = getRepoConfig();

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

// =============================================================================
// TASK <-> GITHUB (phase 5 — write-back)
// =============================================================================

const TASK_STATUS_TO_GITHUB: Record<string, "todo" | "in-progress" | "done"> = {
  backlog: "todo",
  todo: "todo",
  in_progress: "in-progress",
  in_review: "in-progress",
  approved: "done",
};

function buildTaskLabels(task: {
  taskType?: string | null;
  priority?: string | null;
  status?: string | null;
}): string[] {
  const labels = ["task"];
  if (task.taskType) labels.push(`Type-${toTitleCase(task.taskType)}`);
  if (task.priority) labels.push(`Priority-${toTitleCase(task.priority)}`);
  labels.push(`status-${TASK_STATUS_TO_GITHUB[task.status || "todo"] || "todo"}`);
  return labels;
}

/**
 * Create a GitHub issue from a task and link it (stores the issue number on
 * the task). Any workspace member who can see the task may create the issue.
 */
export async function createIssueForTask(taskId: string): Promise<{
  success?: boolean;
  error?: string;
  issueNumber?: number;
  issueUrl?: string;
}> {
  try {
    const supabase = await requireAuth();
    const { data: task } = await supabase
      .from("tasks")
      .select("id, title, description, notes, task_type, priority, status, github_issue_number")
      .eq("id", taskId)
      .maybeSingle();
    if (!task) return { error: "Task not found or you don't have access" };
    if (task.github_issue_number) {
      return { error: `This task is already linked to issue #${task.github_issue_number}` };
    }

    const octokit = getOctokit();
    const { owner, repo } = getRepoConfig();

    const body = [
      task.description || "",
      task.notes ? `\n\n---\n**Internal notes:** ${task.notes}` : "",
      `\n\n---\n_Created from prism-manage task \`${task.id}\`_`,
    ].join("");

    const { data: issue } = await octokit.issues.create({
      owner,
      repo,
      title: String(task.title || "Task"),
      body,
      labels: buildTaskLabels(task),
    });

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ github_issue_number: issue.number })
      .eq("id", taskId);

    if (updateError) return { error: updateError.message };

    revalidatePath("/tasks");
    return { success: true, issueNumber: issue.number, issueUrl: issue.html_url };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to create GitHub issue",
    };
  }
}

/**
 * Push a task's status to its linked GitHub issue (best-effort).
 * Mapping: backlog/todo -> todo, in_progress/in_review -> in-progress,
 * approved -> done (issue closed).
 */
export async function pushTaskStatusToGitHub(
  taskId: string,
  status: string,
): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: task } = await supabase
      .from("tasks")
      .select("github_issue_number")
      .eq("id", taskId)
      .maybeSingle();

    const issueNumber = task?.github_issue_number as number | undefined;
    if (!issueNumber) return;

    const octokit = getOctokit();
    const { owner, repo } = getRepoConfig();

    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    const currentLabels = extractLabels(
      issue.labels as (string | { name?: string })[],
    ).filter((l) => !l.startsWith("status-"));

    const mapped = TASK_STATUS_TO_GITHUB[status] || "todo";

    await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      labels: [...currentLabels, `status-${mapped}`],
      state: mapped === "done" ? "closed" : "open",
    });
  } catch {
    // best-effort — GitHub is not a source of truth for tasks
  }
}
