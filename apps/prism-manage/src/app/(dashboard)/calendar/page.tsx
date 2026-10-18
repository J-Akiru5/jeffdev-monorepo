"use client";

/**
 * Calendar Page
 * -------------
 * FullCalendar view showing tasks with due dates and synced events.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useProjects } from "@/contexts/project-context";
import { PromptDialog } from "@/components/prompt-dialog";
import {
  createEvent,
  fetchEvents,
  getCalendarSyncStatus,
  syncCalendar,
  updateEvent,
} from "@/app/actions/calendar";
import type { CalendarEvent } from "@/lib/schemas";
import { toast } from "sonner";

export default function CalendarPage() {
  useProjects();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    connected: boolean;
    lastSyncedAt: string | null;
    lastError: string | null;
  }>({ connected: false, lastSyncedAt: null, lastError: null });
  const [titleDialog, setTitleDialog] = useState<
    | { kind: "create"; startStr: string; endStr: string; allDay: boolean }
    | { kind: "edit"; eventId: string; currentTitle: string }
    | null
  >(null);

  const refreshSyncStatus = useCallback(async () => {
    const status = await getCalendarSyncStatus();
    setSyncStatus(status);
  }, []);

  // Fetch events from Supabase on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch (_err) {
        console.error("Failed to load events:", _err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
    refreshSyncStatus();
  }, [refreshSyncStatus]);

  // Convert events to FullCalendar format
  const calendarEvents = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: event.linkedTaskId ? "var(--color-cyan)" : "var(--color-purple)",
      borderColor: event.linkedTaskId ? "var(--color-cyan)" : "var(--color-purple)",
      extendedProps: {
        linkedTaskId: event.linkedTaskId,
        googleCalendarId: event.googleCalendarId,
      },
    }));
  }, [events]);

  const handleDateSelect = useCallback(
    (selectInfo: { startStr: string; endStr: string; allDay: boolean }) => {
      setTitleDialog({
        kind: "create",
        startStr: selectInfo.startStr,
        endStr: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
    },
    [],
  );

  const handleEventClick = useCallback(
    (info: {
      event: {
        id: string;
        title: string;
        start: Date | null;
        end: Date | null;
      };
    }) => {
      setTitleDialog({
        kind: "edit",
        eventId: info.event.id,
        currentTitle: info.event.title,
      });
    },
    [],
  );

  const handleTitleSubmit = useCallback(
    async (title: string) => {
      const dialog = titleDialog;
      if (!dialog) return;

      if (dialog.kind === "create") {
        try {
          const created = await createEvent({
            title,
            start: dialog.startStr,
            end: dialog.endStr,
            allDay: dialog.allDay,
          });
          setEvents((prev) => [...prev, created]);
          toast.success("Event created");
        } catch {
          toast.error("Failed to create event");
        }
      } else {
        try {
          const updated = await updateEvent(dialog.eventId, { title });
          setEvents((prev) =>
            prev.map((e) => (e.id === dialog.eventId ? updated : e)),
          );
          toast.success("Event updated");
        } catch {
          toast.error("Failed to update event");
        }
      }
    },
    [titleDialog],
  );

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const syncedEvents = await syncCalendar();
      setEvents(syncedEvents);
      toast.success("Calendar synced");
    } catch (err) {
      console.error("Sync error:", err);
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Sync failed. Connect Google Calendar first.",
      );
    } finally {
      setSyncing(false);
      refreshSyncStatus();
    }
  }, [refreshSyncStatus]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="mt-1 text-sm text-white/40">
          View your tasks and events in calendar format
        </p>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-border glass-subtle p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={calendarEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          height="auto"
          select={handleDateSelect}
          eventClick={handleEventClick}
        />
      </div>

      {/* Sync Status */}
      <div className="mt-6 flex items-center justify-between rounded-lg border border-border glass-subtle p-4">
        <div>
          <h3 className="text-sm font-medium text-white">
            Google Calendar Sync
          </h3>
          <p className="text-xs text-white/40">
            {syncing
              ? "Syncing..."
              : syncStatus.connected
                ? syncStatus.lastSyncedAt
                  ? `Last synced ${new Date(syncStatus.lastSyncedAt).toLocaleString()}`
                  : "Connected — run a sync to pull events"
                : "Connect to sync your events"}
          </p>
          {syncStatus.lastError && (
            <p className="mt-1 text-xs text-amber-400/70">{syncStatus.lastError}</p>
          )}
        </div>
        <div className="flex gap-3">
          <a
            href="/api/calendar/auth"
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
          >
            Connect Calendar
          </a>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="rounded-lg border border-white/10 bg-glass-04 px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-glass-08 disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      <PromptDialog
        open={titleDialog !== null}
        onClose={() => setTitleDialog(null)}
        onSubmit={handleTitleSubmit}
        title={titleDialog?.kind === "edit" ? "Edit event title" : "New event"}
        placeholder="Event title…"
        defaultValue={titleDialog?.kind === "edit" ? titleDialog.currentTitle : ""}
        confirmLabel={titleDialog?.kind === "edit" ? "Save" : "Create"}
      />
    </div>
  );
}
