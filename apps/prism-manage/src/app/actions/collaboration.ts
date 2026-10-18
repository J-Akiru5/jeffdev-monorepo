"use server";

import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { notifyUsers } from "@/lib/notify";
import { notifySlack, taskUrl } from "@/lib/slack";

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  createdAt: string;
}

export interface TaskActivityEntry {
  id: string;
  action: string;
  actorName: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

/**
 * Fetch a task through the user's RLS-scoped client — returns null when the
 * user can't see it. Callers then use the admin client only for reads that
 * RLS would otherwise block (profiles, audit logs) on an already-visible task.
 */
async function getVisibleTask(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, user_id, workspace_id, assigned_to")
    .eq("id", taskId)
    .maybeSingle();

  if (!task) return null;
  return { supabase, user, task };
}

/** Resolve @mentions in a comment body against workspace members. */
async function resolveMentions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  workspaceId: string | null,
  body: string,
  excludeUserId: string,
): Promise<string[]> {
  try {
    if (!workspaceId) return [];
    const tokens = [...body.matchAll(/@([A-Za-z0-9._-]+)/g)].map((m) =>
      (m[1] || "").toLowerCase(),
    );
    if (tokens.length === 0) return [];

    const { data: members } = await admin
      .from("workspace_members")
      .select("user_id, user_profiles(full_name, email)")
      .eq("workspace_id", workspaceId);

    const matched = new Set<string>();
    for (const m of members || []) {
      const profile = m.user_profiles as Record<string, unknown> | null;
      const name = String(profile?.full_name || "").toLowerCase();
      const email = String(profile?.email || "").toLowerCase();
      const candidates = [name.replace(/\s+/g, ""), name.split(" ")[0] || "", email.split("@")[0] || ""];
      if (tokens.some((token) => candidates.includes(token))) {
        if (String(m.user_id) !== excludeUserId) matched.add(String(m.user_id));
      }
    }
    return [...matched];
  } catch {
    return [];
  }
}

// =============================================================================
// COMMENTS
// =============================================================================

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  try {
    const ctx = await getVisibleTask(taskId);
    if (!ctx) return [];

    const admin = getAdminClient();
    const { data: comments } = await admin
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .limit(200);

    const authorIds = [
      ...new Set((comments || []).map((c: Record<string, unknown>) => String(c.author_id))),
    ];
    const { data: profiles } = authorIds.length
      ? await admin
          .from("user_profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", authorIds)
      : { data: [] };
    const profileMap = new Map(
      (profiles || []).map((p: Record<string, unknown>) => [
        String(p.id),
        p as Record<string, unknown>,
      ]),
    );

    return (comments || []).map((c: Record<string, unknown>) => {
      const profile = profileMap.get(String(c.author_id));
      return {
        id: String(c.id),
        taskId: String(c.task_id),
        authorId: String(c.author_id),
        authorName: String(profile?.full_name || profile?.email || "Member"),
        authorAvatar: (profile?.avatar_url as string) || null,
        body: String(c.body),
        createdAt: String(c.created_at),
      };
    });
  } catch {
    return [];
  }
}

export async function addComment(
  taskId: string,
  body: string,
): Promise<{ success?: boolean; error?: string; comment?: TaskComment }> {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Comment can't be empty" };
  if (trimmed.length > 5000) {
    return { error: "Comment is too long (max 5000 characters)" };
  }

  const ctx = await getVisibleTask(taskId);
  if (!ctx) return { error: "Task not found or you don't have access" };
  const { supabase, user, task } = ctx;

  const { data: inserted, error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, author_id: user.id, body: trimmed })
    .select("*")
    .single();
  if (error || !inserted) {
    return { error: error?.message || "Failed to add comment" };
  }

  // Auto-watch: commenting means you follow the task
  await supabase
    .from("task_watchers")
    .upsert({ task_id: taskId, user_id: user.id }, { onConflict: "task_id,user_id" });

  // Fan out notifications (best-effort, admin client — notifications are
  // owner-read-only so members can't write rows for each other)
  const admin = getAdminClient();
  const { data: watchers } = await supabase
    .from("task_watchers")
    .select("user_id")
    .eq("task_id", taskId);

  const mentionIds = await resolveMentions(
    admin,
    (task.workspace_id as string) || null,
    trimmed,
    user.id,
  );

  const snippet = `${trimmed.slice(0, 120)}${trimmed.length > 120 ? "…" : ""}`;
  const recipientIds = [
    task.user_id as string,
    (task.assigned_to as string) || null,
    ...((watchers || []).map((w: Record<string, unknown>) => String(w.user_id))),
  ].filter((id): id is string => !!id && id !== user.id && !mentionIds.includes(id));

  await notifyUsers(admin, recipientIds, {
    title: "New comment",
    message: `On "${task.title}": ${snippet}`,
    type: "comment",
    relatedId: taskId,
    actionUrl: `/tasks/${taskId}/edit`,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
  });

  await notifyUsers(admin, mentionIds, {
    title: "You were mentioned",
    message: `On "${task.title}": ${snippet}`,
    type: "mention",
    relatedId: taskId,
    actionUrl: `/tasks/${taskId}/edit`,
    actorId: user.id,
    entityType: "task",
    entityId: taskId,
  });

  // Slack ping for the comment (best-effort — one post per comment)
  await notifySlack(
    `:speech_balloon: *New comment* on "${task.title}"${mentionIds.length > 0 ? ` (${mentionIds.length} mention${mentionIds.length === 1 ? "" : "s"})` : ""} — ${snippet} <${taskUrl(taskId)}|open task>`,
  );

  const { data: profile } = await admin
    .from("user_profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .single();

  revalidatePath("/tasks");

  return {
    success: true,
    comment: {
      id: String(inserted.id),
      taskId,
      authorId: user.id,
      authorName: String(profile?.full_name || profile?.email || "You"),
      authorAvatar: (profile?.avatar_url as string) || null,
      body: trimmed,
      createdAt: String(inserted.created_at),
    },
  };
}

// =============================================================================
// ACTIVITY (from audit_logs)
// =============================================================================

export async function getTaskActivity(taskId: string): Promise<TaskActivityEntry[]> {
  try {
    const ctx = await getVisibleTask(taskId);
    if (!ctx) return [];

    const admin = getAdminClient();
    const { data: rows } = await admin
      .from("audit_logs")
      .select("*")
      .eq("resource_type", "tasks")
      .eq("resource_id", taskId)
      .order("created_at", { ascending: false })
      .limit(50);

    const actorIds = [
      ...new Set(
        (rows || [])
          .map((r: Record<string, unknown>) => r.user_id)
          .filter(Boolean)
          .map(String),
      ),
    ];
    const { data: profiles } = actorIds.length
      ? await admin.from("user_profiles").select("id, full_name, email").in("id", actorIds)
      : { data: [] };
    const nameMap = new Map(
      (profiles || []).map((p: Record<string, unknown>) => [
        String(p.id),
        String(p.full_name || p.email || "Someone"),
      ]),
    );

    return (rows || []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      action: String(r.action || ""),
      actorName: nameMap.get(String(r.user_id)) || "Someone",
      changes: (r.changes as Record<string, unknown>) || null,
      createdAt: String(r.created_at),
    }));
  } catch {
    return [];
  }
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export async function getNotifications(limit = 30): Promise<NotificationItem[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("notifications")
      .select("id, title, message, type, read, action_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    return (data || []).map((n: Record<string, unknown>) => ({
      id: String(n.id),
      title: String(n.title || ""),
      message: String(n.message || ""),
      type: String(n.type || "info"),
      read: n.read === true,
      actionUrl: n.action_url ? String(n.action_url) : null,
      createdAt: String(n.created_at),
    }));
  } catch {
    return [];
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) return { error: error.message };
  return { success: true };
}
