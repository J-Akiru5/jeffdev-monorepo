import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProfileForm } from "@/components/admin/profile-form";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserProfile } from "@/types/user";

/**
 * Admin Profile Page
 * ------------------
 * Edit user profile, bio, photo, and namecard settings.
 */

import { getAdminClient } from "@/lib/supabase/admin";

async function getCurrentUser(): Promise<UserProfile> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/admin/login");
  }

  try {
    const adminSupabase = getAdminClient() as any;
    const { data: profile, error: dbError } = await adminSupabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (dbError || !profile) {
      console.error("User document not found for UID:", user.id);
      redirect("/admin/login");
    }

    const prefs = (profile.preferences || {}) as Record<string, any>;
    const namecard = (prefs.namecard || {}) as Record<string, any>;
    const socials = (prefs.socials || {}) as Record<string, any>;

    return {
      uid: profile.id,
      email: profile.email || "",
      displayName: profile.full_name || "",
      photoURL: profile.avatar_url || undefined,
      role: profile.role || "employee",
      status: (prefs.status as any) || "active",
      bio: profile.bio || "",
      title: prefs.title || "",
      phone: profile.phone || "",
      location: prefs.location || "",
      assignedProjects: prefs.assigned_projects || prefs.assignedProjects || [],
      social: {
        linkedin: socials.linkedin || "",
        github: socials.github || "",
        twitter: socials.twitter || "",
        website: socials.website || prefs.website || "",
      },
      namecard: {
        username: namecard.username || "",
        tagline: namecard.tagline || "",
        showEmail: namecard.showEmail ?? true,
        showPhone: namecard.showPhone ?? false,
        accentColor: namecard.accentColor || "#06b6d4",
        background: namecard.background || "gradient-dark",
        socials: {
          linkedin: namecard.socials?.linkedin ?? true,
          github: namecard.socials?.github ?? true,
          twitter: namecard.socials?.twitter ?? true,
          website: namecard.socials?.website ?? true,
        },
      },
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString(),
      createdAt: profile.created_at || new Date().toISOString(),
      updatedAt: profile.updated_at || new Date().toISOString(),
    } as unknown as UserProfile;
  } catch (error) {
    console.error("Session verification failed:", error);
    redirect("/admin/login");
  }
}

export default async function AdminProfilePage() {
  await cookies(); // Ensure dynamic rendering
  const profile = await getCurrentUser();

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-8">
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <p className="mt-2 text-white/50">
          Manage your profile, photo, and digital namecard.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        {profile ? (
          <ProfileForm profile={profile} />
        ) : (
          <p className="text-white/50">Profile not found.</p>
        )}
      </div>
    </div>
  );
}
