/**
 * Profile Page
 * ------------
 * Dedicated profile editing page using the shared ProfileEditor from @syntaxure/ui.
 * Handles avatar upload, profile fields, and password change via server actions.
 */

import { createClient } from "@/lib/supabase/server";
import { ProfilePageClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch full profile from user_profiles
  let userName = "User";
  let userEmail = "";
  let userBio: string | null = null;
  let userCompany: string | null = null;
  let userPhone: string | null = null;
  let userTimezone: string | null = null;
  let userAvatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("full_name, email, bio, company_name, phone, timezone, avatar_url")
      .eq("id", user.id)
      .single();

    userName =
      profile?.full_name ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split("@")[0] ||
      "User";
    userEmail = profile?.email || user.email || "";
    userBio = profile?.bio || null;
    userCompany = profile?.company_name || null;
    userPhone = profile?.phone || null;
    userTimezone = profile?.timezone || null;
    userAvatarUrl = profile?.avatar_url || null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-white/40">
          Manage your account details, password, and avatar
        </p>
      </div>

      <ProfilePageClient
        initialData={{
          fullName: userName,
          email: userEmail,
          bio: userBio,
          companyName: userCompany,
          phone: userPhone,
          timezone: userTimezone,
          avatarUrl: userAvatarUrl,
        }}
      />
    </div>
  );
}
