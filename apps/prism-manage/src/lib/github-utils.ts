import type { MarketingTask } from "@/lib/schemas";

const LABEL_PREFIX_PHASE = "Phase-";
const LABEL_PREFIX_PRIORITY = "Priority-";
const LABEL_PREFIX_OWNER = "Owner-";
const LABEL_PREFIX_TYPE = "Type-";

export function extractLabels<T extends { name?: string }>(
  labels?: (string | T)[]
): string[] {
  if (!labels) return [];
  return labels
    .map((l) => (typeof l === "string" ? l : l.name ?? ""))
    .filter(Boolean);
}

export function issueToMarketingTask(issue: {
  number: number;
  title: string;
  state: string;
  body?: string | null;
  html_url: string;
  created_at: string;
  labels: (string | { name?: string })[];
}): MarketingTask {
  const labels = extractLabels(
    issue.labels as (string | { name?: string })[]
  );

  let status: "todo" | "in-progress" | "done" = "todo";
  if (issue.state === "closed") {
    status = "done";
  } else if (labels.some((l) => l === "status-in-progress")) {
    status = "in-progress";
  } else if (labels.some((l) => l === "status-done")) {
    status = "done";
  }

  const phase =
    labels
      .find((l) => l.startsWith(LABEL_PREFIX_PHASE))
      ?.replace(LABEL_PREFIX_PHASE, "")
      .toLowerCase() || "1";

  const priority =
    labels
      .find((l) => l.startsWith(LABEL_PREFIX_PRIORITY))
      ?.replace(LABEL_PREFIX_PRIORITY, "")
      .toLowerCase() || "medium";

  const ownerIds = labels
    .filter((l) => l.startsWith(LABEL_PREFIX_OWNER))
    .map((l) => l.replace(LABEL_PREFIX_OWNER, "").toLowerCase());

  const platform =
    labels
      .find((l) => l.startsWith(LABEL_PREFIX_TYPE))
      ?.replace(LABEL_PREFIX_TYPE, "") || "";

  return {
    id: String(issue.number),
    title: issue.title,
    status,
    phaseId: `phase-${phase}`,
    ownerIds,
    priority: priority as "high" | "medium" | "low",
    platform: platform || undefined,
    description: issue.body || undefined,
    githubIssueNumber: issue.number,
    createdAt: issue.created_at,
    updatedAt: issue.created_at,
  };
}

export function toTitleCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

export function buildLabels(params: {
  phase: string;
  priority: string;
  owners: string[];
  platform?: string;
  status?: string;
}): string[] {
  const phaseLabel = `Phase-${params.phase.replace("phase-", "")}`;
  const priorityLabel = `Priority-${toTitleCase(params.priority)}`;
  const ownerLabels = params.owners.map((o) => `Owner-${toTitleCase(o)}`);
  const platformLabel = params.platform
    ? `Type-${toTitleCase(params.platform)}`
    : null;
  const statusLabel = params.status ? `status-${params.status}` : null;

  return [
    "marketing",
    phaseLabel,
    priorityLabel,
    ...ownerLabels,
    platformLabel,
    statusLabel,
  ].filter(Boolean) as string[];
}

export function getDefaultRepo(): { owner: string; repo: string } {
  return {
    owner: process.env.GITHUB_MARKETING_REPO_OWNER || "",
    repo: process.env.GITHUB_MARKETING_REPO_NAME || "",
  };
}
