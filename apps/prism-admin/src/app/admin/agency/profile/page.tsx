import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/agency/profile-form";
import { getAgencyUserProfile } from "@/app/actions/agency-users";

/**
 * Agency Profile Page
 * --------------------
 * View and edit user profile settings.
 */

export default async function AgencyProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const profile = await getAgencyUserProfile(user.id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-sm text-white/50">Manage your account settings and profile</p>
      </div>

      <ProfileForm profile={profile} uid={user.id} />
    </div>
  );
}
