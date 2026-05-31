import { createClient } from "@/lib/supabase/server";
import { ProfilePageClient } from "./client";

/**
 * Profile Page
 * ------------
 * Server component: fetches user profile data and renders the client form.
 */
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "User";
  const avatarUrl = user?.user_metadata?.avatar_url || "";

  return (
    <div className="max-w-2xl mx-auto space-y-8 pt-4">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Profile</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage your personal information and profile photo.
        </p>
      </div>

      <ProfilePageClient
        userId={user.id}
        email={user.email || ""}
        displayName={displayName}
        avatarUrl={avatarUrl}
      />
    </div>
  );
}
