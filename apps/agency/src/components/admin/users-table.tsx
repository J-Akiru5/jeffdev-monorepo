'use client';

/**
 * Users Table Component
 * ---------------------
 * DataTable for user management with role editing.
 */

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Shield, MoreHorizontal, UserX, FolderKanban } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { updateUserRole, deactivateUser } from '@/app/actions/invites';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types/rbac';
import type { UserProfile } from '@/types/user';

interface UsersTableProps {
  users: UserProfile[];
  currentUserUid: string;
}

const roleLabels: Record<UserRole, { label: string; className: string }> = {
  founder: { label: 'Founder', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  admin: { label: 'Admin', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  partner: { label: 'Partner', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  employee: { label: 'Employee', className: 'bg-white/10 text-white/60 border-white/20' },
};

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-400' },
  inactive: { label: 'Inactive', className: 'bg-red-500/10 text-red-400' },
  pending: { label: 'Pending', className: 'bg-yellow-500/10 text-yellow-400' },
};

export function UsersTable({ users, currentUserUid }: UsersTableProps) {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    await updateUserRole(uid, newRole, currentUserUid);
    setActiveMenu(null);
    router.refresh();
  };

  const handleDeactivate = async (uid: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    await deactivateUser(uid);
    setActiveMenu(null);
    router.refresh();
  };

  const columns: ColumnDef<UserProfile>[] = [
    {
      accessorKey: 'displayName',
      header: 'User',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-white">{row.original.displayName || 'No Name'}</div>
          <div className="text-xs text-white/40">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const config = roleLabels[row.original.role];
        return (
          <span className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-wider ${config.className}`}>
            <Shield className="h-3 w-3" />
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const config = statusLabels[row.original.status] || statusLabels.pending;
        return (
          <span className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${config.className}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'assignedProjects',
      header: 'Projects',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-white/50">
          <FolderKanban className="h-3 w-3" />
          <span className="text-xs">
            {row.original.role === 'founder' || row.original.role === 'admin'
              ? 'All'
              : row.original.assignedProjects?.length || '0'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-white/40">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = user.uid === currentUserUid;
        const isFounder = user.role === 'founder';

        // Don't show actions for current user or founder
        if (isCurrentUser || isFounder) return null;

        return (
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === user.uid ? null : user.uid)}
              className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {activeMenu === user.uid && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setActiveMenu(null)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-md border border-white/10 bg-[#0a0a0a] py-1 shadow-xl">
                  {/* Role options */}
                  {(['admin', 'partner', 'employee'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(user.uid, role)}
                      disabled={user.role === role}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5 ${
                        user.role === role ? 'text-cyan-400' : 'text-white/60'
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      Set as {roleLabels[role].label}
                    </button>
                  ))}

                  <div className="my-1 border-t border-white/10" />

                  {/* Deactivate */}
                  <button
                    onClick={() => handleDeactivate(user.uid)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <UserX className="h-3 w-3" />
                    Deactivate User
                  </button>
                </div>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={users}
      searchKey="email"
      searchPlaceholder="Search by email..."
    />
  );
}
