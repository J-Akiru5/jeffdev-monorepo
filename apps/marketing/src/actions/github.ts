'use server';

import { Octokit } from '@octokit/rest';
import { revalidatePath } from 'next/cache';
import { issueToTask, extractLabels, buildLabels } from '@/lib/github-utils';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type Task = {
  id: number;
  title: string;
  status: TaskStatus;
  phase: string;
  owner: string[];
  priority: string;
  platform: string;
  description: string;
  url: string;
  createdAt: string;
};

const octokit = new Octokit({
  auth: process.env.GITHUB_PAT,
});

const OWNER = 'J-Akiru5';
const REPO = 'jeffdev-monorepo';

export async function getTasks(): Promise<Task[]> {
  const { data: issues } = await octokit.issues.listForRepo({
    owner: OWNER,
    repo: REPO,
    labels: 'marketing',
    state: 'all',
    per_page: 100,
    sort: 'created',
    direction: 'desc',
  });

  return issues
    .filter((i) => !(i as { pull_request?: unknown }).pull_request)
    .map((i) =>
      issueToTask({
        number: i.number,
        title: i.title,
        state: i.state,
        body: i.body,
        html_url: i.html_url,
        created_at: i.created_at,
        labels: i.labels as (string | { name?: string })[],
      }),
    );
}

export async function createTask(data: {
  title: string;
  description?: string;
  phase: string;
  priority: string;
  owners: string[];
  platform?: string;
}): Promise<Task> {
  const labels = buildLabels({ ...data, status: 'todo' });

  const { data: issue } = await octokit.issues.create({
    owner: OWNER,
    repo: REPO,
    title: data.title,
    body: data.description || '',
    labels,
  });

  revalidatePath('/');
  revalidatePath('/tasks');

  return issueToTask({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    body: issue.body,
    html_url: issue.html_url,
    created_at: issue.created_at,
    labels: issue.labels as (string | { name?: string })[],
  });
}

export async function updateTaskTitle(taskId: number, title: string): Promise<void> {
  await octokit.issues.update({
    owner: OWNER,
    repo: REPO,
    issue_number: taskId,
    title,
  });
  revalidatePath('/');
  revalidatePath('/tasks');
}

export async function updateTaskStatus(taskId: number, newStatus: TaskStatus): Promise<void> {
  const { data: issue } = await octokit.issues.get({
    owner: OWNER,
    repo: REPO,
    issue_number: taskId,
  });

  const currentLabels = extractLabels(
    issue.labels as (string | { name?: string })[],
  ).filter((l) => !l.startsWith('status-'));

  if (newStatus === 'done') {
    await octokit.issues.update({
      owner: OWNER,
      repo: REPO,
      issue_number: taskId,
      labels: [...currentLabels, 'status-done'],
      state: 'closed',
    });
  } else {
    await octokit.issues.update({
      owner: OWNER,
      repo: REPO,
      issue_number: taskId,
      labels: [...currentLabels, `status-${newStatus}`],
      state: 'open',
    });
  }

  revalidatePath('/');
  revalidatePath('/tasks');
}

export async function deleteTask(taskId: number): Promise<void> {
  await octokit.issues.update({
    owner: OWNER,
    repo: REPO,
    issue_number: taskId,
    state: 'closed',
    labels: ['marketing', 'status-done'],
  });
  revalidatePath('/');
  revalidatePath('/tasks');
}

export async function getTaskStats(): Promise<{
  byStatus: Record<TaskStatus, number>;
  byPhase: Record<string, { total: number; done: number }>;
}> {
  const tasks = await getTasks();
  const byStatus: Record<TaskStatus, number> = { todo: 0, 'in-progress': 0, done: 0 };
  const byPhase: Record<string, { total: number; done: number }> = {};

  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;

    if (!byPhase[t.phase]) {
      byPhase[t.phase] = { total: 0, done: 0 };
    }
    byPhase[t.phase].total++;
    if (t.status === 'done') {
      byPhase[t.phase].done++;
    }
  }

  return { byStatus, byPhase };
}
