import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllUsers } from '@/app/actions/users';
import { getInvites } from '@/app/actions/invites';
import { UsersClient } from '@/components/admin/users-client';
import { requireAdmin } from '@/lib/access';

/**
 * Admin Users Page
 * ----------------
 * Manage team members: invite, edit roles, assign projects.
 * Requires Founder or Admin role.
 */

export default async function AdminUsersPage() {
  const currentUser = await requireAdmin();
  const currentUserUid = currentUser.uid;
  const [users, invites] = await Promise.all([
    getAllUsers(),
    getInvites(),
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

