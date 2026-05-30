"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, MapPin } from "lucide-react";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  type EventInput,
} from "@/app/actions/calendar";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: string | null;
  project_id?: string | null;
}

interface Props {
  initialData: CalendarEvent[];
}

const EVENT_TYPES = ["meeting", "deadline", "review", "delivery", "other"] as const;

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: "bg-cyan-400",
  deadline: "bg-red-400",
  review: "bg-yellow-400",
  delivery: "bg-emerald-400",
  other: "bg-white/40",
};

function emptyForm(): EventInput {
  const now = new Date();
  const start = new Date(now.getTime() + 3600000);
  const end = new Date(start.getTime() + 3600000);
  return {
    title: "",
    description: null,
    start_time: start.toISOString().slice(0, 16),
    end_time: end.toISOString().slice(0, 16),
    event_type: "meeting",
    location: null,
  };
}

export function CalendarManager({ initialData }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialData);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<EventInput>(emptyForm());
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function resetForm() {
    setForm(emptyForm());
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(event: CalendarEvent) {
    setEditing(event);
    setForm({
      title: event.title,
      description: event.description ?? null,
      start_time: event.start_time.slice(0, 16),
      end_time: event.end_time.slice(0, 16),
      event_type: event.event_type as EventInput["event_type"],
      location: event.location ?? null,
    });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = editing
      ? await updateEvent(editing.id, form)
      : await createEvent(form);

    if (result.success) {
      setMessage({ type: "success", text: editing ? "Event updated" : "Event created" });
      resetForm();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to save" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    const result = await deleteEvent(id);
    if (result.success) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setMessage({ type: "success", text: "Event deleted" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to delete" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="mt-1 text-sm text-white/50">{events.length} events</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "Add Event"}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">
            {editing ? "Edit Event" : "New Event"}
          </h3>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Description</label>
            <textarea
              value={form.description || ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
              rows={2}
              className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Location</label>
            <input
              value={form.location || ""}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value || null }))}
              className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/10"
              placeholder="Office, Zoom, etc."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Start Time</label>
              <input
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">End Time</label>
              <input
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Type</label>
            <select
              value={form.event_type}
              onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value as EventInput["event_type"] }))}
              className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/10"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#030303]">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-colors"
            >
              {editing ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-lg border border-white/5 bg-white/[0.02]">
        <div className="space-y-1 p-2">
          {events.length === 0 ? (
            <div className="py-12 text-center text-white/30">No events scheduled</div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-md p-3 hover:bg-white/[0.02] transition-all group"
              >
                <div
                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    EVENT_TYPE_COLORS[event.event_type] || "bg-white/40"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{event.title}</div>
                  {event.description && (
                    <p className="text-xs text-white/40 mt-0.5">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                  <p className="text-[10px] text-white/30 mt-0.5 font-mono">
                    {new Date(event.start_time).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    {" — "}
                    {new Date(event.end_time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-white/30 font-mono uppercase mr-2">
                    {event.event_type}
                  </span>
                  <button
                    onClick={() => startEdit(event)}
                    className="rounded p-1.5 text-white/20 hover:text-white hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="rounded p-1.5 text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
