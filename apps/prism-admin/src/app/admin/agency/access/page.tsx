import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";
import { getAdminClient } from "@/lib/supabase/admin";
import { UserManagementCard } from "@/components/agency/user-management-card";

/**
 * Agency Access Control Page
 * ---------------------------
 * View and manage user roles and permissions.
 */

const ROLE_DESCRIPTIONS: Record<string, string> = {
  founder: "Full system access. Can manage all settings, users, and billing.",
  admin: "Can manage content, users, and most settings.",
  partner: "Can manage assigned projects and limited admin features.",
  employee: "Basic access. Can view and edit assigned tasks.",
};

export default async function AgencyAccessPage() {
  await cookies();
  const supabase = getAdminClient();
  const { data: users } = await supabase
    .from("user_profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });

  // Group users by role
  const grouped = (users || []).reduce(
    (acc, user) => {
      const role = user.role || "employee";
      if (!acc[role]) acc[role] = [];
      acc[role].push(user);
      return acc;
    },
    {} as Record<string, typeof users>
  );

  const roleOrder = ["founder", "admin", "partner", "employee"];

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
        <h1 className="text-2xl font-bold text-white">Access Control</h1>
        <p className="mt-1 text-sm text-white/50">
          {users?.length || 0} team members · Manage roles and permissions
        </p>
      </div>

      {/* Role Legend */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <h3 className="text-sm font-medium text-white/80 mb-3">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roleOrder.map((role) => (
            <div key={role} className="flex items-start gap-2">
              <span
                className={`mt-0.5 rounded-sm px-1.5 py-0.5 text-[10px] uppercase tracking-wider border ${
                  role === "founder"
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : role === "admin"
                      ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                      : role === "partner"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : "text-purple-400 bg-purple-500/10 border-purple-500/20"
                }`}
              >
                {role}
              </span>
              <span className="text-xs text-white/40">
                {ROLE_DESCRIPTIONS[role]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Users by role */}
      {roleOrder.map((role) => {
        const roleUsers = grouped[role];
        if (!roleUsers || roleUsers.length === 0) return null;
        return (
          <div key={role}>
            <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3 px-1">
              {role} ({roleUsers.length})
            </h2>
            <div className="grid gap-2">
              {roleUsers.map((user: any) => (
                <div
                  key={user.id}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
                >
                  <UserManagementCard
                    uid={user.id}
                    name={user.full_name || "Unnamed"}
                    email={user.email || ""}
                    currentRole={user.role || "employee"}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {(!users || users.length === 0) && (
        <div className="py-12 text-center text-white/30 border border-dashed border-white/5 rounded-lg">
          No users found
        </div>
      )}
    </div>
  );
}
