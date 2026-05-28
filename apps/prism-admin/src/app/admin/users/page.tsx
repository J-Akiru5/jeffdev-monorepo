import { createClient } from "@/lib/supabase/server";
import { getCollection } from "@syntaxure-labs/db/cosmos";
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
    const usersCollection = await getCollection("users");
    users = await usersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[users] Failed to fetch users from MongoDB:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-white/50">{users.length} total users</p>
        </div>
      </div>

      <UsersTable users={users} isFounder={isFounder} />
    </div>
  );
}
