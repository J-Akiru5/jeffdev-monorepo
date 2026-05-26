"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MarketingKpi, MarketingPhase, MarketingTask, MarketingTeamMember } from "@/lib/schemas";

export async function getMarketingPhases(): Promise<MarketingPhase[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("marketing_phases")
    .select("*")
    .order("order", { ascending: true });
  return data || [];
}

export async function getMarketingTeam(): Promise<MarketingTeamMember[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase.from("marketing_team").select("*");
  return data || [];
}

export async function getKpis(): Promise<MarketingKpi[]> {
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
}

export async function updateKpi(
  id: string,
  updates: { current?: number; target?: number }
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const doc: Record<string, unknown> = {};
  if (updates.current !== undefined) doc.current_value = updates.current;
  if (updates.target !== undefined) doc.target_value = updates.target;

  const { error } = await supabase
    .from("marketing_kpis")
    .upsert({ id, ...doc }, { onConflict: "id" });

  if (error) throw new Error("Failed to update KPI");
  revalidatePath("/marketing");
}

export async function getMarketingTasks(): Promise<MarketingTask[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("marketing_tasks")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createMarketingTask(task: {
  title: string;
  description?: string;
  phaseId: string;
  priority: string;
  ownerIds: string[];
  platform?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("marketing_tasks").insert({
    id: `mt-${Date.now()}`,
    title: task.title,
    description: task.description || null,
    phase_id: task.phaseId,
    priority: task.priority,
    owner_ids: task.ownerIds,
    platform: task.platform || null,
    status: "todo",
  });

  if (error) throw error;
  revalidatePath("/marketing");
}

export async function updateMarketingTaskStatus(
  taskId: string,
  status: string
): Promise<void> {
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
  data: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  data.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from("marketing_tasks")
    .update(data)
    .eq("id", taskId);

  if (error) throw error;
  revalidatePath("/marketing");
}

export async function deleteMarketingTask(taskId: string): Promise<void> {
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
  const tasks = await getMarketingTasks();
  const byStatus: Record<string, number> = { todo: 0, "in-progress": 0, done: 0 };
  const byPhase: Record<string, { total: number; done: number }> = {};

  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    if (!byPhase[t.phaseId]) {
      byPhase[t.phaseId] = { total: 0, done: 0 };
    }
    byPhase[t.phaseId].total++;
    if (t.status === "done") {
      byPhase[t.phaseId].done++;
    }
  }

  return { byStatus, byPhase };
}

export async function seedMarketingData(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

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

  for (const p of phases) {
    await supabase.from("marketing_phases").upsert(p, { onConflict: "id" });
  }
  for (const k of kpis) {
    await supabase.from("marketing_kpis").upsert(k, { onConflict: "id" });
  }
  for (const m of team) {
    await supabase.from("marketing_team").upsert(m, { onConflict: "id" });
  }
  for (const t of tasks) {
    await supabase.from("marketing_tasks").upsert(t, { onConflict: "id" });
  }

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { issueToMarketingTask } = await import("@/lib/github-utils");

  for (const issue of issues) {
    const task = issueToMarketingTask(issue);
    await supabase.from("marketing_tasks").upsert({
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
    }, { onConflict: "id" });
  }

  revalidatePath("/marketing");
}
