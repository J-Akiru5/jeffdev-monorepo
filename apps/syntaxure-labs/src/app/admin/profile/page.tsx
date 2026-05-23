import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileForm } from '@/components/admin/profile-form';
import { cookies } from 'next/headers';

/**
 * Admin Profile Page
 * ------------------
 * Edit user profile, bio, photo, and namecard settings.
 */

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { UserProfile } from '@/types/user';

async function getCurrentUser(): Promise<UserProfile> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/admin/login');
  }

  try {
    const adminSupabase = getAdminClient() as any;
    const { data: profile, error: dbError } = await adminSupabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (dbError || !profile) {
      console.error('User document not found for UID:', user.id);
      redirect('/admin/login');
    }

    const preferences = (profile.preferences || {}) as Record<string, any>;
    const namecard = (preferences.namecard || {}) as Record<string, any>;
    const socials = (preferences.socials || {}) as Record<string, any>;

    // Serializing basic timestamps
    return {
      uid: profile.id,
      email: profile.email || '',
      displayName: profile.full_name || '',
      photoURL: profile.avatar_url || undefined,
      role: profile.role || 'employee',
      status: (profile.status as any) || 'active',
      bio: profile.bio || '',
      title: profile.title || '',
      phone: profile.phone || '',
      location: (profile as any).location || '',
      assignedProjects: (profile as any).assignedProjects || [],
      social: {
        linkedin: socials.linkedin || '',
        github: socials.github || '',
        twitter: socials.twitter || '',
        website: socials.website || '',
      },
      namecard: {
        username: namecard.username || '',
        tagline: namecard.tagline || '',
        showEmail: namecard.showEmail ?? true,
        showPhone: namecard.showPhone ?? false,
        accentColor: namecard.accentColor || '#06b6d4',
        background: namecard.background || 'gradient-dark',
        socials: {
          linkedin: namecard.socials?.linkedin ?? true,
          github: namecard.socials?.github ?? true,
          twitter: namecard.socials?.twitter ?? true,
          website: namecard.socials?.website ?? true,
        }
      },
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: profile.updated_at || new Date().toISOString(),
      createdAt: profile.created_at || new Date().toISOString(),
      updatedAt: profile.updated_at || new Date().toISOString(),
    } as unknown as UserProfile;
  } catch (error) {
    console.error('Session verification failed:', error);
    redirect('/admin/login');
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
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
