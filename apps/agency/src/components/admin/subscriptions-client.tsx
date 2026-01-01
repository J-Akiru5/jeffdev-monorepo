'use client';

/**
 * Subscriptions Client Component
 * ------------------------------
 * Client-side table with filtering and actions.
 */

import { useState, useTransition } from 'react';
import { Search, MoreVertical, Pause, Play, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  pauseSubscription, 
  resumeSubscription, 
  cancelSubscription 
} from '@/app/actions/subscriptions';
import type { Subscription, SubscriptionStatus } from '@/types/subscription';
import { statusBadgeStyles, billingCycleLabels } from '@/types/subscription';
import { format } from 'date-fns';

interface SubscriptionsClientProps {
  initialData: Subscription[];
}

const statusLabels: Record<SubscriptionStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export function SubscriptionsClient({ initialData }: SubscriptionsClientProps) {
  const [subscriptions, setSubscriptions] = useState(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');
  const [isPending, startTransition] = useTransition();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Filter subscriptions
  const filtered = subscriptions.filter((sub) => {
    const matchesSearch = 
      sub.clientName.toLowerCase().includes(search.toLowerCase()) ||
      sub.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle actions
  const handlePause = (id: string) => {
    startTransition(async () => {
      const result = await pauseSubscription(id);
      if (result.success) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'paused' as const } : s))
        );
        toast.success('Subscription paused');
      } else {
        toast.error(result.error || 'Failed to pause subscription');
      }
      setActiveMenu(null);
    });
  };

  const handleResume = (id: string) => {
    startTransition(async () => {
      const result = await resumeSubscription(id);
      if (result.success) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'active' as const } : s))
        );
        toast.success('Subscription resumed');
      } else {
        toast.error(result.error || 'Failed to resume subscription');
      }
      setActiveMenu(null);
    });
  };

  const handleCancel = (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    
    startTransition(async () => {
      const result = await cancelSubscription(id);
      if (result.success) {
        setSubscriptions((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: 'cancelled' as const } : s))
        );
        toast.success('Subscription cancelled');
      } else {
        toast.error(result.error || 'Failed to cancel subscription');
      }
      setActiveMenu(null);
    });
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search by client or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-white/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {(['all', 'active', 'paused', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white'
              }`}
            >
              {status === 'all' ? 'All' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-white/8 bg-white/2 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/6">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                Billing
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">
                Next Billing
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/40">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-white/40">
                  No subscriptions found
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{sub.clientName}</p>
                      <p className="text-xs text-white/40">{sub.clientEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-white">{sub.serviceName}</p>
                      <p className="text-xs text-white/40 capitalize">{sub.tier}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadgeStyles[sub.status]}`}>
                      {statusLabels[sub.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {billingCycleLabels[sub.billingCycle]}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-white">
                      ${sub.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {sub.nextBillingDate?.toDate 
                      ? format(sub.nextBillingDate.toDate(), 'MMM d, yyyy')
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenu(activeMenu === sub.id ? null : sub.id)}
                        disabled={isPending}
                        className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenu === sub.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenu(null)}
                          />
                          <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-md border border-white/10 bg-[#0a0a0a] py-1 shadow-xl">
                            <Link
                              href={`/admin/subscriptions/${sub.id}`}
                              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </Link>
                            
                            {sub.status === 'active' && (
                              <button
                                onClick={() => handlePause(sub.id)}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-yellow-400/70 hover:bg-yellow-500/10 hover:text-yellow-400"
                              >
                                <Pause className="h-3.5 w-3.5" />
                                Pause
                              </button>
                            )}
                            
                            {sub.status === 'paused' && (
                              <button
                                onClick={() => handleResume(sub.id)}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-400"
                              >
                                <Play className="h-3.5 w-3.5" />
                                Resume
                              </button>
                            )}
                            
                            {(sub.status === 'active' || sub.status === 'paused') && (
                              <button
                                onClick={() => handleCancel(sub.id)}
                                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400"
                              >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
