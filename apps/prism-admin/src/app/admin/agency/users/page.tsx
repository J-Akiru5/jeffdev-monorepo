import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Agency Users Page
 * -----------------
 * View team members and their roles.
 */

export default async function AgencyUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false });

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
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="mt-1 text-sm text-white/50">{profiles?.length || 0} team members</p>
      </div>

      <div className="grid gap-3">
        {profiles && profiles.length > 0 ? profiles.map((profile) => (
          <div
            key={profile.id}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white">
                  {(profile.full_name || profile.email || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {profile.full_name || "Unnamed"}
                  </p>
                  <p className="text-xs text-white/40">{profile.email}</p>
                </div>
              </div>
              <span
                className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                  profile.role === "admin" || profile.role === "founder"
                    ? "bg-amber-500/20 text-amber-400"
                    : profile.role === "manager"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : profile.role === "employee"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-white/10 text-white/40"
                }`}
              >
                {profile.role || "client"}
              </span>
            </div>
          </div>
        )) : (
          <div className="py-12 text-center text-white/30">No users found</div>
        )}
      </div>
    </div>
  );
}
