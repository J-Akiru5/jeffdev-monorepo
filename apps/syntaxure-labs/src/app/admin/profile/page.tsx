import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileForm } from '@/components/admin/profile-form';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserProfile } from '@/types/user';

/**
 * Admin Profile Page
 * ------------------
 * Edit user profile, bio, photo, and namecard settings.
 */

async function getCurrentUser(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/admin/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/admin/login');
  }

  const prefs = (profile.preferences || {}) as Record<string, unknown>;

  return {
    uid: user.id,
    email: user.email || '',
    displayName: profile.full_name || '',
    photoURL: profile.avatar_url || undefined,
    role: profile.role || 'employee',
    status: (prefs.status as string) || 'active',
    bio: profile.bio || '',
    title: (prefs.title as string) || '',
    phone: profile.phone || '',
    location: profile.location || '',
    assignedProjects: (prefs.assigned_projects as string[]) || [],
    social: {
      linkedin: ((prefs.socials as Record<string, string>)?.linkedin) || '',
      github: ((prefs.socials as Record<string, string>)?.github) || '',
      twitter: ((prefs.socials as Record<string, string>)?.twitter) || '',
      website: (prefs.website as string) || '',
    },
    namecard: {
      username: ((prefs.namecard as Record<string, unknown>)?.username as string) || '',
      tagline: ((prefs.namecard as Record<string, unknown>)?.tagline as string) || '',
      showEmail: ((prefs.namecard as Record<string, unknown>)?.showEmail as boolean) ?? true,
      showPhone: ((prefs.namecard as Record<string, unknown>)?.showPhone as boolean) ?? false,
      accentColor: ((prefs.namecard as Record<string, unknown>)?.accentColor as string) || '#06b6d4',
      background: ((prefs.namecard as Record<string, unknown>)?.background as string) || 'gradient-dark',
      socials: {
        linkedin: ((prefs.namecard as Record<string, unknown>)?.socials as Record<string, boolean>)?.linkedin ?? true,
        github: ((prefs.namecard as Record<string, unknown>)?.socials as Record<string, boolean>)?.github ?? true,
        twitter: ((prefs.namecard as Record<string, unknown>)?.socials as Record<string, boolean>)?.twitter ?? true,
        website: ((prefs.namecard as Record<string, unknown>)?.socials as Record<string, boolean>)?.website ?? true,
      },
    },
    createdAt: profile.created_at || new Date().toISOString(),
    updatedAt: profile.updated_at || new Date().toISOString(),
  };
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
        {profile ? <ProfileForm profile={profile} /> : <p className="text-white/50">Profile not found.</p>}
      </div>
    </div>
  );
}
