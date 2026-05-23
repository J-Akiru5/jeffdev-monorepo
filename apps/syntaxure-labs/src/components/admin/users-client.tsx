'use client';

/**
 * Users Page Client Component
 * ---------------------------
 * Wraps the users table, invite modal, and pending invites section.
 */

import { useState, useTransition } from 'react';
import { Plus, Mail, RefreshCw, X, Clock, Copy, Check, Loader2 } from 'lucide-react';
import { UsersTable } from '@/components/admin/users-table';
import { InviteModal } from '@/components/admin/invite-modal';
import { resendInvite, revokeInvite } from '@/app/actions/invites';
import type { UserProfile, UserInvite } from '@/types/user';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UsersClientProps {
  users: UserProfile[];
  invites: UserInvite[];
  currentUserUid: string;
}

export function UsersClient({ users, invites, currentUserUid }: UsersClientProps) {
  const router = useRouter();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter pending invites
  const pendingInvites = invites.filter((inv) => inv.status === 'pending');

  const handleResend = async (inviteId: string) => {
    startTransition(async () => {
      const result = await resendInvite(inviteId);
      if (result.success) {
        toast.success('Invite resent successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to resend invite');
      }
    });
  };

  const handleRevoke = async (inviteId: string) => {
    startTransition(async () => {
      const result = await revokeInvite(inviteId);
      if (result.success) {
        toast.success('Invite revoked');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to revoke invite');
      }
    });
  };

  const handleCopyLink = async (invite: UserInvite) => {
    const link = `${window.location.origin}/auth/invite/${invite.token}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(invite.id || null);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'accepted':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'expired':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-white/10 text-white/50 border-white/20';
    }
  };

  const formatExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="mt-2 text-white/50">{users.length} team members</p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      {/* Pending Invites Section */}
      {pendingInvites.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-4 w-4 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">
              Pending Invites ({pendingInvites.length})
            </h2>
          </div>
          <div className="rounded-md border border-white/8 bg-white/2 overflow-hidden">
            <div className="divide-y divide-white/6">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-4 hover:bg-white/2"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                      <Mail className="h-4 w-4 text-white/40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(invite.status)}`}
                        >
                          {invite.role}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-white/40">
                          <Clock className="h-3 w-3" />
                          {formatExpiry(invite.expiresAt)}
                        </span>
                        {invite.projectName && (
                          <span className="text-xs text-white/30">
                            → {invite.projectName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLink(invite)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                      title="Copy invite link"
                    >
                      {copiedId === invite.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      Copy
                    </button>
                    <button
                      onClick={() => handleResend(invite.id!)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                    >
                      {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Resend
                    </button>
                    <button
                      onClick={() => handleRevoke(invite.id!)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500/10 border border-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Team Members */}
      {users.length === 0 ? (
        <div className="rounded-md border border-white/8 bg-white/2 p-12 text-center">
          <p className="text-white/40">No team members yet</p>
          <p className="mt-2 text-sm text-white/30">
            Invite your first team member to get started.
          </p>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            Invite User
          </button>
        </div>
      ) : (
        <UsersTable users={users} currentUserUid={currentUserUid} />
      )}

      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        inviterUid={currentUserUid}
      />
    </>
  );
}
