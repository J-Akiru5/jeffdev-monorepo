import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { UserManagementCard } from "@/components/agency/user-management-card";

/**
 * Agency Users Page
 * -----------------
 * View team members and manage their roles.
 */

export default async function AgencyUsersPage() {
  await cookies();
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Members</h1>
          <p className="mt-1 text-sm text-white/50">
            {profiles?.length || 0} members · Manage roles and access
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {profiles && profiles.length > 0 ? (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
            >
              <UserManagementCard
                uid={profile.id}
                name={profile.full_name || "Unnamed"}
                email={profile.email || ""}
                currentRole={profile.role || "employee"}
              />
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-white/30 border border-dashed border-white/5 rounded-lg">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
