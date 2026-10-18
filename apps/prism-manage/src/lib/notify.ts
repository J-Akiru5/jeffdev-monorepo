/**
 * Notification fan-out helper
 * ---------------------------
 * Inserts notification rows via the service-role client (the `notifications`
 * table is owner-read-only, so members can't write rows for each other).
 * Best-effort: never throws.
 */

export interface NotifyPayload {
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  actionUrl?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
}

export async function notifyUsers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userIds: (string | null | undefined)[],
  payload: NotifyPayload,
): Promise<void> {
  try {
    const unique = [...new Set(userIds.filter((id): id is string => !!id))];
    if (unique.length === 0) return;

    const rows = unique.map((user_id) => ({
      user_id,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      related_id: payload.relatedId ?? null,
      action_url: payload.actionUrl ?? null,
      actor_id: payload.actorId ?? null,
      entity_type: payload.entityType ?? null,
      entity_id: payload.entityId ?? null,
      read: false,
    }));

    await admin.from("notifications").insert(rows);
  } catch {
    // Notifications are best-effort; never throw
  }
}
