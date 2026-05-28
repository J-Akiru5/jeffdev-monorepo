import { createClient } from "@/lib/supabase/server";
import { CalendarManager } from "@/components/admin/calendar-manager";

export default async function AgencyCalendarPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_time", { ascending: true });

  return (
    <div className="space-y-6">
      <CalendarManager initialData={events ?? []} />
    </div>
  );
}
