import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Agency Calendar Page
 * --------------------
 * List of upcoming calendar events.
 */

export default async function AgencyCalendarPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_time", { ascending: true });

  const eventTypeColors: Record<string, string> = {
    meeting: "bg-cyan-400",
    deadline: "bg-red-400",
    review: "bg-yellow-400",
    delivery: "bg-emerald-400",
    other: "bg-white/40",
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="mt-1 text-sm text-white/50">
          {events?.length || 0} events
        </p>
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6">
        <div className="space-y-3">
          {events && events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 rounded-md bg-white/[0.02] p-3 hover:bg-white/5 transition-all"
              >
                <div
                  className={`mt-1 h-2 w-2 rounded-full ${
                    eventTypeColors[event.event_type] || "bg-white/40"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">
                    {event.title}
                  </div>
                  {event.description && (
                    <p className="text-xs text-white/40 mt-0.5">
                      {event.description}
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
                <span className="text-[10px] text-white/30 font-mono uppercase">
                  {event.event_type}
                </span>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-white/30">
              No events scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
