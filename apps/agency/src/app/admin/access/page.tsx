import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Users, Lock, Key } from 'lucide-react';
import { cookies } from 'next/headers';

/**
 * Admin Access Page
 * -----------------
 * Role-based access control management.
 * View and configure permissions for different roles.
 */

const roles = [
  {
    name: 'Founder',
    description: 'Full system access. Cannot be modified or revoked.',
    permissions: ['*'],
    users: 1,
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    name: 'Admin',
    description: 'Full access except founder-level settings and user deletion.',
    permissions: ['users.manage', 'projects.full', 'billing.view', 'settings.edit'],
    users: 0,
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  {
    name: 'Partner',
    description: 'Access to assigned projects and client communication.',
    permissions: ['projects.assigned', 'messages.view', 'invoices.view'],
    users: 0,
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    name: 'Employee',
    description: 'Limited access to assigned tasks and own profile.',
    permissions: ['profile.own', 'tasks.assigned'],
    users: 0,
    color: 'bg-white/10 text-white/60 border-white/20',
  },
];

const permissionGroups = [
  {
    group: 'Users',
    icon: Users,
    permissions: [
      { key: 'users.view', label: 'View Users' },
      { key: 'users.invite', label: 'Invite Users' },
      { key: 'users.manage', label: 'Manage Roles' },
      { key: 'users.delete', label: 'Delete Users' },
    ],
  },
  {
    group: 'Projects',
    icon: Lock,
    permissions: [
      { key: 'projects.view', label: 'View All Projects' },
      { key: 'projects.assigned', label: 'View Assigned Projects' },
      { key: 'projects.create', label: 'Create Projects' },
      { key: 'projects.full', label: 'Full Project Access' },
    ],
  },
  {
    group: 'System',
    icon: Key,
    permissions: [
      { key: 'settings.view', label: 'View Settings' },
      { key: 'settings.edit', label: 'Edit Settings' },
      { key: 'billing.view', label: 'View Billing' },
      { key: 'audit.view', label: 'View Audit Logs' },
    ],
  },
];

export default async function AdminAccessPage() {
  await cookies(); // Ensure dynamic rendering

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
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-cyan-500/10 p-2">
            <Shield className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Access Control</h1>
            <p className="mt-1 text-white/50">
              Manage roles and permissions for team members.
            </p>
          </div>
        </div>
      </div>

      {/* Roles Overview */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-white mb-4">Roles</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => (
            <div
              key={role.name}
              className="rounded-md border border-white/8 bg-white/2 p-4"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-md px-2 py-1 text-xs font-medium border ${role.color}`}>
                  {role.name}
                </span>
                <span className="text-xs text-white/40">{role.users} users</span>
              </div>
              <p className="mt-3 text-sm text-white/50">{role.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((perm) => (
                  <span
                    key={perm}
                    className="rounded-sm bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-white/40"
                  >
                    {perm}
                  </span>
                ))}
                {role.permissions.length > 3 && (
                  <span className="text-[10px] text-white/30">
                    +{role.permissions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-white mb-4">Permissions Matrix</h2>
        <div className="rounded-md border border-white/8 bg-white/2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/6">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Permission
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role.name}
                      className="px-4 py-3 text-center text-xs font-medium text-white/40 uppercase tracking-wider"
                    >
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionGroups.map((group) => (
                  <React.Fragment key={group.group}>
                    <tr className="bg-white/2">
                      <td
                        colSpan={roles.length + 1}
                        className="px-4 py-2 text-xs font-semibold text-white/60"
                      >
                        <div className="flex items-center gap-2">
                          <group.icon className="h-3.5 w-3.5" />
                          {group.group}
                        </div>
                      </td>
                    </tr>
                    {group.permissions.map((perm) => (
                      <tr key={perm.key} className="border-t border-white/4 hover:bg-white/2">
                        <td className="px-4 py-2 text-sm text-white/70">{perm.label}</td>
                        {roles.map((role) => {
                          const hasPermission =
                            role.permissions.includes('*') || role.permissions.includes(perm.key);
                          return (
                            <td key={role.name} className="px-4 py-2 text-center">
                              {hasPermission ? (
                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                              ) : (
                                <span className="inline-block h-2 w-2 rounded-full bg-white/10" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-8 rounded-md border border-yellow-500/20 bg-yellow-500/5 p-4">
        <p className="text-sm text-yellow-400">
          <strong>Note:</strong> To change a user&apos;s role, go to{' '}
          <Link href="/admin/users" className="underline hover:no-underline">
            User Management
          </Link>
          . Only Founders and Admins can modify roles.
        </p>
      </div>
    </div>
  );
}
