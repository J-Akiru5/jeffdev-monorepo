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
import { createEvent, updateEvent, syncCalendar } from "@/app/actions/calendar";
import { fetchEvents } from "@/app/actions/calendar";
import type { CalendarEvent } from "@/lib/schemas";
import { toast } from "sonner";

export default function CalendarPage() {
  useProjects();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

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
  }, []);

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
    async (selectInfo: {
      startStr: string;
      endStr: string;
      allDay: boolean;
    }) => {
      const title = prompt("Event title:");
      if (!title) return;

      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
        googleCalendarId: "",
        syncedAt: new Date().toISOString(),
      };

      try {
        const created = await createEvent(newEvent);
        setEvents((prev) => [...prev, created]);
        toast.success("Event created");
      } catch {
        toast.error("Failed to create event");
      }
    },
    [],
  );

  const handleEventClick = useCallback(
    async (info: {
      event: {
        id: string;
        title: string;
        start: Date | null;
        end: Date | null;
      };
    }) => {
      const newTitle = prompt("Edit title:", info.event.title);
      if (!newTitle || newTitle === info.event.title) return;

      try {
        const updated = await updateEvent(info.event.id, { title: newTitle });
        setEvents((prev) =>
          prev.map((e) => (e.id === info.event.id ? updated : e)),
        );
        toast.success("Event updated");
      } catch {
        toast.error("Failed to update event");
      }
    },
    [],
  );

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const syncedEvents = await syncCalendar();
      setEvents(syncedEvents);
      toast.success("Calendar synced");
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Sync failed. Connect Google Calendar first.");
    } finally {
      setSyncing(false);
    }
  }, []);

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
      <div className="rounded-xl border border-white/10 glass-subtle p-4">
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
      <div className="mt-6 flex items-center justify-between rounded-lg border border-white/10 glass-subtle p-4">
        <div>
          <h3 className="text-sm font-medium text-white">
            Google Calendar Sync
          </h3>
          <p className="text-xs text-white/40">
            {syncing ? "Syncing..." : "Connect to sync your events"}
          </p>
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
            className="rounded-lg border border-white/10 bg-glass-04 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-glass-08 disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
