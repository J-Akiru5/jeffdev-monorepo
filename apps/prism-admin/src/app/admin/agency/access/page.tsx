import Link from "next/link";
import { ArrowLeft, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Agency Access Control Page
 * ---------------------------
 * View and manage user roles and permissions.
 */

const roleIcons: Record<string, React.ReactNode> = {
  founder: <ShieldCheck className="h-4 w-4 text-amber-400" />,
  admin: <Shield className="h-4 w-4 text-cyan-400" />,
  partner: <Shield className="h-4 w-4 text-emerald-400" />,
  employee: <ShieldAlert className="h-4 w-4 text-purple-400" />,
};

const roleColors: Record<string, string> = {
  founder: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  admin: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  partner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  employee: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default async function AgencyAccessPage() {
  const supabase = getAdminClient();
  const { data: users } = await supabase
    .from("user_profiles")
    .select("id, email, full_name, role, created_at")
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
        <h1 className="text-2xl font-bold text-white">Access Control</h1>
        <p className="mt-1 text-sm text-white/50">
          {users?.length || 0} team members · Manage roles and permissions
        </p>
      </div>

      <div className="space-y-3">
        {users && users.length > 0 ? (
          users.map((user: any) => (
            <div
              key={user.id}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:border-white/10 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                    {roleIcons[user.role] || <ShieldAlert className="h-4 w-4 text-white/40" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {user.full_name || "Unnamed"}
                    </p>
                    <p className="text-xs text-white/40">{user.email}</p>
                  </div>
                </div>
                <span
                  className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider border ${
                    roleColors[user.role] || "text-white/40 bg-white/10 border-white/10"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-white/30">No users found</div>
        )}
      </div>
    </div>
  );
}
