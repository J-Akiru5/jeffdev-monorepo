"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  UpdateMarketingKpiSchema,
  UpdateMarketingTaskSchema,
  CreateMarketingTaskSchema,
  GitHubIssueSchema,
} from "@/lib/schemas";
import type { MarketingKpi, MarketingPhase, MarketingTask, MarketingTeamMember } from "@/lib/schemas";
import { issueToMarketingTask } from "@/lib/github-utils";

export async function getMarketingPhases(): Promise<MarketingPhase[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("marketing_phases")
      .select("*")
      .order("order", { ascending: true });
    return data || [];
  } catch {
    return [];
  }
}

export async function getMarketingTeam(): Promise<MarketingTeamMember[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase.from("marketing_team").select("*");
    return data || [];
  } catch {
    return [];
  }
}

export async function getKpis(): Promise<MarketingKpi[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("marketing_kpis")
      .select("*");

    if (data && data.length > 0) {
      return data.map((k: Record<string, unknown>) => ({
        id: k.id as string,
        label: k.label as string,
        current: (k.current_value as number) ?? 0,
        target: (k.target_value as number) ?? 0,
        unit: (k.unit as string) || "",
      }));
    }

    return [
      { id: "waitlist-signups", label: "Waitlist Signups", current: 0, target: 1500, unit: "" },
      { id: "linkedin-followers", label: "LinkedIn Followers", current: 0, target: 2000, unit: "" },
      { id: "twitter-followers", label: "Twitter Followers", current: 0, target: 3000, unit: "" },
      { id: "youtube-subs", label: "YouTube Subs", current: 0, target: 1000, unit: "" },
      { id: "github-stars", label: "GitHub Stars", current: 0, target: 1000, unit: "" },
      { id: "mrr", label: "MRR", current: 0, target: 1500, unit: "$" },
      { id: "paying-customers", label: "Pay Customers", current: 0, target: 75, unit: "" },
      { id: "discord-members", label: "Discord Members", current: 0, target: 500, unit: "" },
    ];
  } catch {
    return [];
  }
}

export async function updateKpi(
  id: string,
  updates: { current?: number; target?: number }
): Promise<void> {
  const parsed = UpdateMarketingKpiSchema.safeParse(updates);
  if (!parsed.success) throw new Error(parsed.error!.issues[0]!.message);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const doc: Record<string, unknown> = {};
  if (updates.current !== undefined) doc.current_value = updates.current;
  if (updates.target !== undefined) doc.target_value = updates.target;

  const { error } = await supabase
    .from("marketing_kpis")
    .upsert({ id, ...doc }, { onConflict: "id" });

  if (error) throw error;
  revalidatePath("/marketing");
}

export async function getMarketingTasks(): Promise<MarketingTask[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("marketing_tasks")
      .select("*")
      .order("created_at", { ascending: false });
    return (data || []).map((t: Record<string, unknown>) => ({
      id: t.id as string,
      title: t.title as string,
      status: (t.status as "todo" | "in-progress" | "done") || "todo",
      phaseId: (t.phase_id as string) || "",
      ownerIds: (t.owner_ids as string[]) || [],
      priority: (t.priority as "high" | "medium" | "low") || "medium",
      platform: t.platform as string | undefined,
      description: t.description as string | undefined,
      githubIssueNumber: t.github_issue_number as number | undefined,
      createdAt: (t.created_at as string) || new Date().toISOString(),
      updatedAt: (t.updated_at as string) || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function createMarketingTask(input: {
  title: string;
  description?: string;
  phaseId: string;
  priority: string;
  ownerIds: string[];
  platform?: string;
}): Promise<void> {
  const parsed = CreateMarketingTaskSchema.safeParse({
    title: input.title,
    status: "todo",
    phaseId: input.phaseId,
    ownerIds: input.ownerIds,
    priority: input.priority as "high" | "medium" | "low",
    platform: input.platform,
    description: input.description,
  });
  if (!parsed.success) throw new Error(parsed.error!.issues[0]!.message);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("marketing_tasks").insert({
    id: `mt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: parsed.data.title,
    description: parsed.data.description || null,
    phase_id: parsed.data.phaseId,
    priority: parsed.data.priority,
    owner_ids: parsed.data.ownerIds,
    platform: parsed.data.platform || null,
    status: "todo",
  });

  if (error) throw error;
  revalidatePath("/marketing");
}

export async function updateMarketingTaskStatus(
  taskId: string,
  status: "todo" | "in-progress" | "done"
): Promise<void> {
  if (!taskId) throw new Error("Task ID is required");
  if (!["todo", "in-progress", "done"].includes(status)) {
    throw new Error("Invalid status");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("marketing_tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw error;
  revalidatePath("/marketing");
}

export async function updateMarketingTask(
  taskId: string,
  data: Record<string, unknown>,
): Promise<void> {
  if (!taskId) throw new Error("Task ID is required");

  const parsed = UpdateMarketingTaskSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error!.issues[0]!.message);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.phaseId !== undefined) updateData.phase_id = parsed.data.phaseId;
  if (parsed.data.ownerIds !== undefined) updateData.owner_ids = parsed.data.ownerIds;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.platform !== undefined) updateData.platform = parsed.data.platform;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;

  const { error } = await supabase
    .from("marketing_tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) throw error;
  revalidatePath("/marketing");
}

export async function deleteMarketingTask(taskId: string): Promise<void> {
  if (!taskId) throw new Error("Task ID is required");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("marketing_tasks")
    .delete()
    .eq("id", taskId);

  if (error) throw error;
  revalidatePath("/marketing");
}

export async function getMarketingTaskStats(): Promise<{
  byStatus: Record<string, number>;
  byPhase: Record<string, { total: number; done: number }>;
}> {
  try {
    const tasks = await getMarketingTasks();
    const byStatus: Record<string, number> = { todo: 0, "in-progress": 0, done: 0 };
    const byPhase: Record<string, { total: number; done: number }> = {};

    for (const t of tasks) {
      if (t.status in byStatus) {
        byStatus[t.status]!++;
      }
      const entry = byPhase[t.phaseId] ?? (byPhase[t.phaseId] = { total: 0, done: 0 });
      entry.total++;
      if (t.status === "done") {
        entry.done++;
      }
    }

    return { byStatus, byPhase };
  } catch {
    return { byStatus: { todo: 0, "in-progress": 0, done: 0 }, byPhase: {} };
  }
}

export async function seedMarketingData(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if data already exists to prevent double-seeding
  const { data: existing } = await supabase.from("marketing_phases").select("id").limit(1);
  if (existing && existing.length > 0) {
    throw new Error("Marketing data already seeded. Delete existing data first if you want to reseed.");
  }

  const phases = [
    { id: "phase-1", name: "Foundation", timeframe: "May-June 2026", description: "Build the audience engine — accounts, waitlist, first content wave, visual assets.", color: "cyan", order: 1 },
    { id: "phase-2", name: "Authority Building", timeframe: "July-August 2026", description: "Content engine, open-source releases, case studies, social proof.", color: "purple", order: 2 },
    { id: "phase-3", name: "Launch", timeframe: "September-October 2026", description: "Product Hunt launch, Founding Member conversion, paid ads, growth levers.", color: "emerald", order: 3 },
    { id: "ongoing", name: "Ongoing", timeframe: "Running daily/weekly/monthly", description: "Sustained content, community, analytics, and iteration.", color: "amber", order: 4 },
  ];

  const kpis = [
    { id: "waitlist-signups", label: "Waitlist Signups", current_value: 0, target_value: 1500, unit: "" },
    { id: "linkedin-followers", label: "LinkedIn Followers", current_value: 0, target_value: 2000, unit: "" },
    { id: "twitter-followers", label: "Twitter Followers", current_value: 0, target_value: 3000, unit: "" },
    { id: "youtube-subs", label: "YouTube Subs", current_value: 0, target_value: 1000, unit: "" },
    { id: "github-stars", label: "GitHub Stars", current_value: 0, target_value: 1000, unit: "" },
    { id: "mrr", label: "MRR", current_value: 0, target_value: 1500, unit: "$" },
    { id: "paying-customers", label: "Pay Customers", current_value: 0, target_value: 75, unit: "" },
    { id: "discord-members", label: "Discord Members", current_value: 0, target_value: 500, unit: "" },
  ];

  const team = [
    { id: "jeff", name: "Jeff Edrick Martinez", role: "CEO & Founder", initials: "JM", color: "cyan", focus: "Strategy, vision, fundraising" },
    { id: "lou", name: "Lou", role: "CTO", initials: "LC", color: "purple", focus: "Engineering, product architecture" },
    { id: "karl", name: "Karl", role: "CPO", initials: "KD", color: "emerald", focus: "Product design, UX, brand assets" },
    { id: "hazel", name: "Hazel", role: "COO", initials: "HM", color: "amber", focus: "Operations, partnerships, onboarding" },
    { id: "mark", name: "Mark", role: "CMO", initials: "MM", color: "rose", focus: "Marketing, content, social media" },
  ];

  const tasks = [
    { id: "p1-01", title: "Create LinkedIn company page with logo, banner, tagline", status: "todo", phase_id: "phase-1", owner_ids: ["mark"], priority: "high", platform: "LinkedIn" },
    { id: "p1-02", title: "Create Twitter/X account (@syntaxurelabs)", status: "todo", phase_id: "phase-1", owner_ids: ["mark"], priority: "high", platform: "Twitter" },
    { id: "p1-03", title: "Create YouTube channel + upload first teaser", status: "todo", phase_id: "phase-1", owner_ids: ["mark"], priority: "high", platform: "YouTube" },
    { id: "p1-04", title: "Set up Buffer/Publer for social scheduling", status: "todo", phase_id: "phase-1", owner_ids: ["mark"], priority: "medium", platform: "Twitter" },
    { id: "p1-05", title: "Create Linktree/Beacons bio link page", status: "todo", phase_id: "phase-1", owner_ids: ["mark"], priority: "medium", platform: "Twitter" },
    { id: "p1-06", title: "Update hero with 'Governance over Generation' subtext", status: "todo", phase_id: "phase-1", owner_ids: ["karl"], priority: "high", platform: "Website" },
    { id: "p1-07", title: "Create Team page with all 5 bios + ISAT-U TBI badge", status: "todo", phase_id: "phase-1", owner_ids: ["karl", "jeff"], priority: "high", platform: "Website" },
    { id: "p1-08", title: "Add ISAT-U Kwadra TBI partner section to homepage + about", status: "todo", phase_id: "phase-1", owner_ids: ["karl"], priority: "high", platform: "Website" },
    { id: "p1-09", title: "Implement /blog route with MDX rendering", status: "todo", phase_id: "phase-1", owner_ids: ["lou"], priority: "high", platform: "Website" },
    { id: "p1-10", title: 'Write blog: "What is Context-as-a-Service?"', status: "todo", phase_id: "phase-1", owner_ids: ["jeff"], priority: "high", platform: "Blog" },
    { id: "p1-11", title: 'Write blog: "The $150/month AI Token Waste Problem"', status: "todo", phase_id: "phase-1", owner_ids: ["jeff"], priority: "high", platform: "Blog" },
    { id: "p1-12", title: 'Write blog: "Context Governance 101 for Engineering Teams"', status: "todo", phase_id: "phase-1", owner_ids: ["lou"], priority: "high", platform: "Blog" },
    { id: "p1-13", title: "Expand /prism waitlist page with Founding Member CTA", status: "todo", phase_id: "phase-1", owner_ids: ["karl", "lou"], priority: "high", platform: "Website" },
    { id: "p1-14", title: "Add newsletter signup to footer + landing page", status: "todo", phase_id: "phase-1", owner_ids: ["lou"], priority: "medium", platform: "Website" },
    { id: "p1-15", title: "Add team headshots to About page", status: "todo", phase_id: "phase-1", owner_ids: ["mark"], priority: "medium", platform: "Website" },
    { id: "p1-16", title: "Create media kit page (logos, brand, bios)", status: "todo", phase_id: "phase-1", owner_ids: ["karl"], priority: "low", platform: "Website" },
    { id: "p1-17", title: "Design waitlist landing page with Founding Member CTA", status: "todo", phase_id: "phase-1", owner_ids: ["karl", "lou"], priority: "high", platform: "Website" },
    { id: "p1-18", title: "Write Founding Member offer copy ($9/mo lifetime)", status: "todo", phase_id: "phase-1", owner_ids: ["jeff", "lou"], priority: "high", platform: "Website" },
    { id: "p1-19", title: "Add email capture form (Resend)", status: "todo", phase_id: "phase-1", owner_ids: ["lou"], priority: "high", platform: "Website" },
    { id: "p1-20", title: "Embed product demo video on landing page", status: "todo", phase_id: "phase-1", owner_ids: ["lou"], priority: "high", platform: "Website" },
    { id: "p1-26", title: "Write Founding Member waitlist LinkedIn post", status: "todo", phase_id: "phase-1", owner_ids: ["mark", "jeff"], priority: "high", platform: "LinkedIn" },
    { id: "p1-27", title: 'Write "AI Token Waste" Twitter thread (5-7 tweets)', status: "todo", phase_id: "phase-1", owner_ids: ["mark", "lou"], priority: "high", platform: "Twitter" },
    { id: "p1-28", title: "Schedule first week of LinkedIn posts", status: "todo", phase_id: "phase-1", owner_ids: ["mark"], priority: "high", platform: "LinkedIn" },
    { id: "p1-29", title: "Record first product demo video (90s)", status: "todo", phase_id: "phase-1", owner_ids: ["lou"], priority: "high", platform: "YouTube" },
    { id: "p1-30", title: "Create social media post templates", status: "todo", phase_id: "phase-1", owner_ids: ["karl"], priority: "high", platform: "Twitter" },
    { id: "p2-01", title: "Write case study #1: Internal token reduction", status: "todo", phase_id: "phase-2", owner_ids: ["jeff", "lou"], priority: "high", platform: "Blog" },
    { id: "p2-02", title: "Publish case study on LinkedIn, Twitter, blog", status: "todo", phase_id: "phase-2", owner_ids: ["mark"], priority: "high", platform: "LinkedIn" },
    { id: "p2-03", title: 'Record tutorial: "Set up Prism with Cursor"', status: "todo", phase_id: "phase-2", owner_ids: ["lou"], priority: "high", platform: "YouTube" },
    { id: "p2-04", title: 'Record tutorial: "Prism + Windsurf setup"', status: "todo", phase_id: "phase-2", owner_ids: ["lou"], priority: "high", platform: "YouTube" },
    { id: "p2-10", title: "Release first MCP tool as open source", status: "todo", phase_id: "phase-2", owner_ids: ["lou"], priority: "high", platform: "GitHub" },
    { id: "p2-11", title: "Launch GitHub star campaign", status: "todo", phase_id: "phase-2", owner_ids: ["mark"], priority: "high", platform: "GitHub" },
    { id: "p3-01", title: "Research successful MCP/AI tool Product Hunt launches", status: "todo", phase_id: "phase-3", owner_ids: ["mark"], priority: "high", platform: "Website" },
    { id: "p3-02", title: "Write PH tagline + description + first comment", status: "todo", phase_id: "phase-3", owner_ids: ["jeff", "mark"], priority: "high", platform: "Website" },
    { id: "p3-03", title: "Create Product Hunt media kit", status: "todo", phase_id: "phase-3", owner_ids: ["karl"], priority: "high", platform: "Website" },
    { id: "p3-04", title: "Build PH community outreach list (50+ hunters)", status: "todo", phase_id: "phase-3", owner_ids: ["mark"], priority: "high", platform: "Website" },
    { id: "p3-05", title: "Schedule launch week", status: "todo", phase_id: "phase-3", owner_ids: ["mark"], priority: "high", platform: "Website" },
    { id: "p3-06", title: "All-hands launch day: reply to every PH comment", status: "todo", phase_id: "phase-3", owner_ids: ["jeff", "lou", "karl", "hazel", "mark"], priority: "high", platform: "Website" },
    { id: "p3-07", title: "Coordinate social blast across all platforms on launch day", status: "todo", phase_id: "phase-3", owner_ids: ["mark"], priority: "high", platform: "Twitter" },
    { id: "og-01", title: "1 Twitter thread or 3-5 tweets daily", status: "todo", phase_id: "ongoing", owner_ids: ["mark"], priority: "high", platform: "Twitter" },
    { id: "og-02", title: "Engage with AI/dev community on Twitter daily", status: "todo", phase_id: "ongoing", owner_ids: ["mark"], priority: "high", platform: "Twitter" },
    { id: "og-03", title: "Monitor Discord for community questions daily", status: "todo", phase_id: "ongoing", owner_ids: ["mark"], priority: "medium", platform: "Discord" },
    { id: "og-04", title: "3-4 LinkedIn posts weekly", status: "todo", phase_id: "ongoing", owner_ids: ["mark"], priority: "high", platform: "LinkedIn" },
    { id: "og-05", title: "1 YouTube tutorial or 3 Shorts weekly", status: "todo", phase_id: "ongoing", owner_ids: ["lou"], priority: "high", platform: "YouTube" },
    { id: "og-06", title: "1 blog post weekly", status: "todo", phase_id: "ongoing", owner_ids: ["jeff", "lou"], priority: "high", platform: "Blog" },
    { id: "og-09", title: "Review analytics weekly", status: "todo", phase_id: "ongoing", owner_ids: ["mark"], priority: "high", platform: "Website" },
    { id: "og-10", title: "Newsletter monthly", status: "todo", phase_id: "ongoing", owner_ids: ["mark"], priority: "high", platform: "Blog" },
    { id: "og-12", title: "Review waitlist numbers + MRR monthly", status: "todo", phase_id: "ongoing", owner_ids: ["jeff", "mark"], priority: "high", platform: "Website" },
  ];

  const { error: pErr } = await supabase.from("marketing_phases").upsert(phases, { onConflict: "id", ignoreDuplicates: false });
  if (pErr) throw pErr;

  const { error: kErr } = await supabase.from("marketing_kpis").upsert(kpis, { onConflict: "id", ignoreDuplicates: false });
  if (kErr) throw kErr;

  const { error: tErr } = await supabase.from("marketing_team").upsert(team, { onConflict: "id", ignoreDuplicates: false });
  if (tErr) throw tErr;

  const { error: taskErr } = await supabase.from("marketing_tasks").upsert(tasks, { onConflict: "id", ignoreDuplicates: false });
  if (taskErr) throw taskErr;

  revalidatePath("/marketing");
}

export async function syncGitHubToSupabase(
  issues: Array<{
    number: number;
    title: string;
    state: string;
    body?: string | null;
    html_url: string;
    created_at: string;
    labels: (string | { name?: string })[];
  }>
): Promise<void> {
  const parsedIssues = issues.map((issue) => GitHubIssueSchema.safeParse(issue));
  const validIssues = parsedIssues.filter((r) => r.success).map((r) => r.data!);
  if (validIssues.length === 0) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const tasks = validIssues
    .map((issue) => {
      const task = issueToMarketingTask(issue);
      return {
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
      };
    });

  const { error } = await supabase
    .from("marketing_tasks")
    .upsert(tasks, { onConflict: "id", ignoreDuplicates: false });

  if (error) throw error;
  revalidatePath("/marketing");
}
