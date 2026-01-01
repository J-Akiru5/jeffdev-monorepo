import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProfileForm } from '@/components/admin/profile-form';
import { cookies } from 'next/headers';

/**
 * Admin Profile Page
 * ------------------
 * Edit user profile, bio, photo, and namecard settings.
 */

import { auth as adminAuth, db } from '@/lib/firebase/admin';
import { redirect } from 'next/navigation';
import { UserProfile } from '@/types/user';

async function getCurrentUser(): Promise<UserProfile> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    redirect('/admin/login');
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie.value,
      true // checkRevoked
    );

    const userDoc = await db.collection('users').doc(decodedClaims.uid).get();

    if (!userDoc.exists) {
      console.error('User document not found for UID:', decodedClaims.uid);
      redirect('/admin/login');
    }

    const data = userDoc.data();

    // Serializing basic timestamps
    return {
      uid: userDoc.id,
      email: data?.email || decodedClaims.email || '',
      displayName: data?.displayName || '',
      photoURL: data?.photoURL || undefined,
      role: data?.role || 'employee',
      status: data?.status || 'active',
      bio: data?.bio || '',
      title: data?.title || '',
      phone: data?.phone || '',
      location: data?.location || '',
      assignedProjects: data?.assignedProjects || [],
      social: {
        linkedin: data?.social?.linkedin || '',
        github: data?.social?.github || '',
        twitter: data?.social?.twitter || '',
        website: data?.social?.website || '',
      },
      namecard: {
        username: data?.namecard?.username || '',
        tagline: data?.namecard?.tagline || '',
        showEmail: data?.namecard?.showEmail ?? true,
        showPhone: data?.namecard?.showPhone ?? false,
        accentColor: data?.namecard?.accentColor || '#06b6d4',
        background: data?.namecard?.background || 'gradient-dark',
        socials: {
          linkedin: data?.namecard?.socials?.linkedin ?? true,
          github: data?.namecard?.socials?.github ?? true,
          twitter: data?.namecard?.socials?.twitter ?? true,
          website: data?.namecard?.socials?.website ?? true,
        }
      },
      // Safely handle Firestore Timestamps
      createdAt: data?.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()
        ? data.updatedAt.toDate().toISOString()
        : new Date().toISOString(),
    } as UserProfile;
  } catch (error) {
    console.error('Session verification failed:', error);
    redirect('/admin/login');
  }
}

export default async function AdminProfilePage() {
  const _ = await cookies(); // Ensure dynamic rendering
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
