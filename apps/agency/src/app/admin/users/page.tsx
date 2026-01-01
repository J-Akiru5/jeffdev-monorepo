import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllUsers } from '@/app/actions/users';
import { getInvites } from '@/app/actions/invites';
import { UsersClient } from '@/components/admin/users-client';
import { cookies } from 'next/headers';

/**
 * Admin Users Page
 * ----------------
 * Manage team members: invite, edit roles, assign projects.
 * Requires Founder or Admin role.
 */

// TODO: Replace with actual auth session
async function getCurrentUserUid(): Promise<string> {
  // This would come from session in production
  return process.env.FOUNDER_UID || 'founder-001';
}

export default async function AdminUsersPage() {
  const _ = await cookies(); // Ensure dynamic rendering
  const [users, invites, currentUserUid] = await Promise.all([
    getAllUsers(),
    getInvites(),
    getCurrentUserUid(),
  ]);

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
        <UsersClient
          users={users}
          invites={invites}
          currentUserUid={currentUserUid}
        />
      </div>
    </div>
  );
}

