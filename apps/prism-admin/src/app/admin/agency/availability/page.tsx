import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { AvailabilityForm } from "@/components/agency/availability-form";
import { createAvailabilitySlot, deleteAvailabilitySlot } from "@/app/actions/agency-availability";

/**
 * Agency Availability Page
 * -------------------------
 * Manage availability slots for meetings/calls.
 */

const typeColors: Record<string, string> = {
  available: "bg-emerald-500/20 text-emerald-400",
  busy: "bg-red-500/20 text-red-400",
  unavailable: "bg-white/10 text-white/40",
  tentative: "bg-yellow-500/20 text-yellow-400",
};

export default async function AgencyAvailabilityPage() {
  const supabase = await createClient();
  const { data: slots } = await supabase
    .from("agency_availability")
    .select("*")
    .order("date", { ascending: true });

  async function handleCreate(data: any) {
    "use server";
    await createAvailabilitySlot(data);
  }

  async function handleDelete(id: string) {
    "use server";
    await deleteAvailabilitySlot(id);
    revalidatePath("/admin/agency/availability");
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcomingSlots = slots?.filter((s: any) => s.date >= today) || [];
  const pastSlots = slots?.filter((s: any) => s.date < today) || [];

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
        <h1 className="text-2xl font-bold text-white">Availability</h1>
        <p className="mt-1 text-sm text-white/50">
          Manage your availability for meetings and calls
        </p>
      </div>

      {/* Create new slot */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-6">
        <h3 className="text-sm font-medium text-white/80 mb-4">Add Time Slot</h3>
        <AvailabilityForm mode="create" onSubmit={handleCreate} />
      </div>

      {/* Upcoming slots */}
      <div>
        <h3 className="text-sm font-medium text-white/80 mb-3">
          Upcoming ({upcomingSlots.length})
        </h3>
        {upcomingSlots.length > 0 ? (
          <div className="space-y-2">
            {upcomingSlots.map((slot: any) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-white">
                    {new Date(slot.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="text-xs text-white/50">
                    {slot.start_time} — {slot.end_time}
                  </span>
                  <span className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    typeColors[slot.type] || typeColors.available
                  }`}>
                    {slot.type}
                  </span>
                  {slot.note && (
                    <span className="text-xs text-white/40">{slot.note}</span>
                  )}
                </div>
                <form
                  action={handleDelete.bind(null, slot.id)}
                  onSubmit={(e) => {
                    if (!confirm("Delete this slot?")) e.preventDefault();
                  }}
                >
                  <button
                    type="submit"
                    className="flex h-7 items-center gap-1 rounded border border-red-500/20 px-2 text-[11px] text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-white/30 text-sm">No upcoming slots</div>
        )}
      </div>

      {/* Past slots */}
      {pastSlots.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white/50 mb-3">
            Past ({pastSlots.length})
          </h3>
          <div className="space-y-2 opacity-50">
            {pastSlots.slice(0, 10).map((slot: any) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/60">
                    {new Date(slot.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                  <span className="text-xs text-white/40">
                    {slot.start_time} — {slot.end_time}
                  </span>
                  <span className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                    typeColors[slot.type] || typeColors.available
                  }`}>
                    {slot.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
