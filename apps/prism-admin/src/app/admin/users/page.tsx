import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { SkeletonTable } from "@syntaxure/ui";
import { UsersTable } from "@/components/admin/users-table";

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: currentUserProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", currentUser?.id || "")
    .single();

  const role = currentUserProfile?.role || "employee";
  const isFounder = role === "founder";

  if (!currentUser) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type UserRecord = any;
  let users: UserRecord[] = [];
  try {
    // Note: this now lists every user_profiles row (shared across all apps
    // in the monorepo), not a Prism-only collection — see PRISM_MIGRATION.md.
    // The pre-migration Cosmos `users` collection had no code path that ever
    // wrote to it, so in practice this table was rendering empty before.
    const db = getPrismDb();
    const { data, error } = await db
      .from("user_profiles")
      .select(
        "_id:id, email, name:full_name, tier, status, createdAt:created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    users = data ?? [];
  } catch (error) {
    console.error("[users] Failed to fetch users from Postgres:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-white/50">{users.length} total users</p>
        </div>
      </div>

      <Suspense fallback={<SkeletonTable rows={8} columns={5} />}>
        <UsersTable users={users} isFounder={isFounder} />
      </Suspense>
    </div>
  );
}
