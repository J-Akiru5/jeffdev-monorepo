import type { Task, TaskStatus } from '@/actions/github';

const LABEL_PREFIX_PHASE = 'Phase-';
const LABEL_PREFIX_PRIORITY = 'Priority-';
const LABEL_PREFIX_OWNER = 'Owner-';
const LABEL_PREFIX_TYPE = 'Type-';

export function extractLabels<T extends { name?: string }>(labels?: (string | T)[]): string[] {
  if (!labels) return [];
  return labels.map((l) => (typeof l === 'string' ? l : l.name ?? '')).filter(Boolean);
}

export function issueToTask(issue: {
  number: number;
  title: string;
  state: string;
  body?: string | null;
  html_url: string;
  created_at: string;
  labels: (string | { name?: string })[];
}): Task {
  const labels = extractLabels(issue.labels as (string | { name?: string })[]);

  let status: TaskStatus = 'todo';
  if (issue.state === 'closed') {
    status = 'done';
  } else if (labels.some((l) => l === 'status-in-progress')) {
    status = 'in-progress';
  } else if (labels.some((l) => l === 'status-done')) {
    status = 'done';
  }

  const phase = labels.find((l) => l.startsWith(LABEL_PREFIX_PHASE))?.replace(LABEL_PREFIX_PHASE, '') || '1';
  const priority = labels
    .find((l) => l.startsWith(LABEL_PREFIX_PRIORITY))
    ?.replace(LABEL_PREFIX_PRIORITY, '')
    .toLowerCase() || 'medium';

  const owners = labels
    .filter((l) => l.startsWith(LABEL_PREFIX_OWNER))
    .map((l) => l.replace(LABEL_PREFIX_OWNER, '').toLowerCase());

  const platform = labels
    .find((l) => l.startsWith(LABEL_PREFIX_TYPE))
    ?.replace(LABEL_PREFIX_TYPE, '') || '';

  return {
    id: issue.number,
    title: issue.title,
    status,
    phase: `phase-${phase.toLowerCase()}`,
    owner: owners,
    priority,
    platform,
    description: issue.body || '',
    url: issue.html_url,
    createdAt: issue.created_at,
  };
}

export function getAttrsNormal(labelName: string): string {
  return labelName.charAt(0).toUpperCase() + labelName.slice(1).toLowerCase();
}

export function buildLabels(params: {
  phase: string;
  priority: string;
  owners: string[];
  platform?: string;
  status?: TaskStatus;
}): string[] {
  const phaseLabel = `Phase-${params.phase.replace('phase-', '')}`;
  const priorityLabel = `Priority-${getAttrsNormal(params.priority)}`;
  const ownerLabels = params.owners.map((o) => `Owner-${getAttrsNormal(o)}`);
  const platformLabel = params.platform ? `Type-${getAttrsNormal(params.platform)}` : null;
  const statusLabel = params.status ? `status-${params.status}` : null;

  return ['marketing', phaseLabel, priorityLabel, ...ownerLabels, platformLabel, statusLabel].filter(
    Boolean,
  ) as string[];
}
