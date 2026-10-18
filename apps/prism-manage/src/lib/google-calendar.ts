/**
 * Google Calendar integration
 * ---------------------------
 * Two-way sync helpers for prism-manage (plan ADR-5):
 *   - prism-manage is authoritative for work items (tasks with due dates)
 *   - native app events mirror to Google (push on change)
 *   - Google-sourced events are pulled + reconciled (pullGoogleEvents)
 *   - tokens auto-refresh with rotation; sync state lives in
 *     user_tokens.metadata (no schema changes needed)
 *
 * All functions are best-effort: they never throw. Callers get sync results
 * or nothing.
 */

import { google } from "googleapis";
import { getAdminClient } from "@/lib/supabase/admin";

export interface TaskCalendarFields {
  id: string;
  title: string;
  due_date: string | null;
  due_time: string | null;
  description?: string | null;
  google_event_id?: string | null;
}

export interface AppEventFields {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  description?: string | null;
}

export function isGoogleConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.NEXT_PUBLIC_SITE_URL
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createOAuthClient(): any {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/callback`,
  );
}

async function getUserTimeZone(userId: string): Promise<string> {
  try {
    const admin = getAdminClient();
    const { data } = await admin
      .from("user_profiles")
      .select("timezone")
      .eq("id", userId)
      .maybeSingle();
    return (data?.timezone as string) || "Asia/Manila";
  } catch {
    return "Asia/Manila";
  }
}

/** Merge sync status into user_tokens.metadata (best-effort). */
export async function updateSyncMetadata(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  error?: string | null,
): Promise<void> {
  try {
    const { data: row } = await admin
      .from("user_tokens")
      .select("metadata")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();
    const metadata = {
      ...((row?.metadata as Record<string, unknown>) || {}),
      last_synced_at: new Date().toISOString(),
      last_sync_error: error || null,
    };
    await admin
      .from("user_tokens")
      .update({ metadata })
      .eq("user_id", userId)
      .eq("provider", "google");
  } catch {
    // best-effort
  }
}

/**
 * Load the user's Google tokens and return an authorized OAuth client,
 * refreshing the access token when it's within 60s of expiry. Persists
 * rotated tokens. Returns null when not connected / refresh fails.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getAuthorizedGoogleClient(userId: string): Promise<any | null> {
  if (!isGoogleConfigured()) return null;
  try {
    const admin = getAdminClient();
    const { data: tokenRow } = await admin
      .from("user_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();
    if (!tokenRow) return null;

    const client = createOAuthClient();
    client.setCredentials({
      access_token: tokenRow.access_token,
      refresh_token: tokenRow.refresh_token || undefined,
      expiry_date: tokenRow.token_expiry
        ? new Date(tokenRow.token_expiry).getTime()
        : undefined,
    });

    const expiry = tokenRow.token_expiry
      ? new Date(tokenRow.token_expiry).getTime()
      : 0;
    if (expiry < Date.now() + 60_000) {
      if (!tokenRow.refresh_token) {
        await updateSyncMetadata(admin, userId, "Google connection expired — reconnect Calendar");
        return null;
      }
      try {
        const { credentials } = await client.refreshAccessToken();
        client.setCredentials(credentials);
        await admin
          .from("user_tokens")
          .update({
            access_token: credentials.access_token || tokenRow.access_token,
            refresh_token: credentials.refresh_token || tokenRow.refresh_token,
            token_expiry: credentials.expiry_date
              ? new Date(credentials.expiry_date).toISOString()
              : tokenRow.token_expiry,
          })
          .eq("user_id", userId)
          .eq("provider", "google");
      } catch {
        await updateSyncMetadata(admin, userId, "Token refresh failed — reconnect Google Calendar");
        return null;
      }
    }

    return client;
  } catch {
    return null;
  }
}

// ─── Event body builders ─────────────────────────────────────────────────────

/** Add minutes to a local "YYYY-MM-DDTHH:mm:ss" string via UTC arithmetic. */
function addMinutesToLocal(localIso: string, minutes: number): string {
  const d = new Date(`${localIso}Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString().slice(0, 19);
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function taskToGoogleEvent(task: TaskCalendarFields, timeZone: string) {
  if (task.due_time && task.due_date) {
    const start = `${task.due_date}T${task.due_time}:00`;
    return {
      summary: task.title,
      description: task.description || undefined,
      start: { dateTime: start, timeZone },
      end: { dateTime: addMinutesToLocal(start, 60), timeZone },
    };
  }
  // All-day event on the due date
  return {
    summary: task.title,
    description: task.description || undefined,
    start: { date: task.due_date || undefined },
    end: { date: nextDay(task.due_date || "") },
  };
}

function isNotFound(err: unknown): boolean {
  const e = err as { code?: number; status?: number; response?: { status?: number } } | null;
  const status = e?.code ?? e?.status ?? e?.response?.status;
  return status === 404;
}

// ─── Task ↔ Google (prism-manage authoritative) ──────────────────────────────

export async function pushTaskToGoogleCalendar(
  userId: string,
  task: TaskCalendarFields,
): Promise<void> {
  try {
    if (!task.due_date) return;
    const client = await getAuthorizedGoogleClient(userId);
    if (!client) return;

    const timeZone = await getUserTimeZone(userId);
    const calendar = google.calendar({ version: "v3", auth: client });
    const requestBody = taskToGoogleEvent(task, timeZone);

    let googleEventId = task.google_event_id || null;
    if (googleEventId) {
      try {
        await calendar.events.patch({
          calendarId: "primary",
          eventId: googleEventId,
          requestBody,
        });
        return;
      } catch (err) {
        if (isNotFound(err)) {
          googleEventId = null; // deleted in Google → recreate below
        } else {
          throw err;
        }
      }
    }

    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody,
    });
    const newId = created.data.id || null;
    if (newId) {
      const admin = getAdminClient();
      await admin.from("tasks").update({ google_event_id: newId }).eq("id", task.id);
    }
  } catch {
    try {
      await updateSyncMetadata(getAdminClient(), userId, "Task sync to Google failed");
    } catch {
      // best-effort
    }
  }
}

export async function deleteTaskFromGoogleCalendar(
  userId: string,
  googleEventId: string | null | undefined,
): Promise<void> {
  try {
    if (!googleEventId) return;
    const client = await getAuthorizedGoogleClient(userId);
    if (!client) return;
    const calendar = google.calendar({ version: "v3", auth: client });
    try {
      await calendar.events.delete({ calendarId: "primary", eventId: googleEventId });
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
  } catch {
    // best-effort
  }
}

// ─── App events ↔ Google ─────────────────────────────────────────────────────

export async function pushEventToGoogleCalendar(
  userId: string,
  event: AppEventFields,
): Promise<void> {
  try {
    const client = await getAuthorizedGoogleClient(userId);
    if (!client) return;

    const admin = getAdminClient();
    const { data: row } = await admin
      .from("calendar_events")
      .select("google_calendar_id")
      .eq("id", event.id)
      .maybeSingle();

    const timeZone = await getUserTimeZone(userId);
    const requestBody = event.allDay
      ? {
          summary: event.title,
          description: event.description || undefined,
          start: { date: event.start.slice(0, 10) },
          end: { date: nextDay(event.end.slice(0, 10)) },
        }
      : {
          summary: event.title,
          description: event.description || undefined,
          start: { dateTime: event.start.slice(0, 19), timeZone },
          end: { dateTime: event.end.slice(0, 19), timeZone },
        };

    const calendar = google.calendar({ version: "v3", auth: client });
    const existingId = row?.google_calendar_id || null;

    let googleId: string | null = existingId;
    if (existingId) {
      try {
        await calendar.events.patch({
          calendarId: "primary",
          eventId: String(existingId),
          requestBody,
        });
      } catch (err) {
        if (isNotFound(err)) googleId = null;
        else throw err;
      }
    }

    if (!googleId) {
      const created = await calendar.events.insert({
        calendarId: "primary",
        requestBody,
      });
      googleId = created.data.id || null;
    }

    if (googleId) {
      await admin
        .from("calendar_events")
        .update({
          google_calendar_id: googleId,
          synced_at: new Date().toISOString(),
        })
        .eq("id", event.id);
    }
  } catch {
    // best-effort
  }
}

export async function deleteEventFromGoogleCalendar(
  userId: string,
  googleCalendarId: string | null | undefined,
): Promise<void> {
  try {
    if (!googleCalendarId) return;
    const client = await getAuthorizedGoogleClient(userId);
    if (!client) return;
    const calendar = google.calendar({ version: "v3", auth: client });
    try {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: googleCalendarId,
      });
    } catch (err) {
      if (!isNotFound(err)) throw err;
    }
  } catch {
    // best-effort
  }
}

// ─── Pull / reconcile ────────────────────────────────────────────────────────

export interface PullResult {
  synced: number;
  removed: number;
  error?: string;
}

/**
 * Pull Google events (-30d .. +90d) and reconcile local rows:
 *   - upsert by google_calendar_id (Google is authoritative for these rows)
 *   - task-mirrored rows (linked_task_id) are never overwritten or swept —
 *     prism-manage is authoritative for work items
 *   - google-sourced rows deleted in Google are removed locally
 */
export async function pullGoogleEvents(userId: string): Promise<PullResult> {
  try {
    const client = await getAuthorizedGoogleClient(userId);
    if (!client) {
      return { synced: 0, removed: 0, error: "Google Calendar not connected" };
    }

    const calendar = google.calendar({ version: "v3", auth: client });
    const timeMin = new Date(Date.now() - 30 * 864e5).toISOString();
    const timeMax = new Date(Date.now() + 90 * 864e5).toISOString();

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      maxResults: 250,
      orderBy: "startTime",
    });

    const items = res.data.items || [];
    const admin = getAdminClient();

    const { data: localRows } = await admin
      .from("calendar_events")
      .select("id, google_calendar_id, linked_task_id")
      .eq("user_id", userId)
      .not("google_calendar_id", "is", null)
      .gte("start_time", timeMin)
      .lte("start_time", timeMax);

    const localByGoogleId = new Map(
      (localRows || []).map((r: Record<string, unknown>) => [
        String(r.google_calendar_id),
        r,
      ]),
    );

    const seen = new Set<string>();
    let synced = 0;
    let removed = 0;

    for (const item of items) {
      if (!item.id || item.status === "cancelled") continue;
      seen.add(item.id);

      const existing = localByGoogleId.get(item.id);
      if (existing?.linked_task_id) continue; // task-mirrored: prism-manage wins

      const start = item.start?.dateTime || item.start?.date || null;
      const end = item.end?.dateTime || item.end?.date || null;
      if (!start || !end) continue;

      const row = {
        user_id: userId,
        title: item.summary || "(untitled)",
        description: item.description || null,
        start_time: start,
        end_time: end,
        all_day: !item.start?.dateTime,
        google_calendar_id: item.id,
        synced_at: new Date().toISOString(),
      };

      if (existing) {
        await admin
          .from("calendar_events")
          .update(row)
          .eq("id", String(existing.id));
      } else {
        await admin.from("calendar_events").insert(row);
      }
      synced++;
    }

    // Sweep google-sourced rows that no longer exist in Google
    for (const [googleId, row] of localByGoogleId) {
      if (!seen.has(googleId) && !row.linked_task_id) {
        await admin.from("calendar_events").delete().eq("id", String(row.id));
        removed++;
      }
    }

    await updateSyncMetadata(admin, userId);
    return { synced, removed };
  } catch {
    try {
      await updateSyncMetadata(getAdminClient(), userId, "Calendar sync failed");
    } catch {
      // best-effort
    }
    return { synced: 0, removed: 0, error: "Calendar sync failed" };
  }
}
