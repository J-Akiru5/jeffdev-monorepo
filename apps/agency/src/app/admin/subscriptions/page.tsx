import Link from 'next/link';
import { ArrowLeft, Plus, RefreshCcw, TrendingUp, Users, DollarSign } from 'lucide-react';
import { cookies } from 'next/headers';
import { getSubscriptions, getSubscriptionStats } from '@/app/actions/subscriptions';
import { SubscriptionsClient } from '@/components/admin/subscriptions-client';

/**
 * Admin Subscriptions Page
 * ------------------------
 * Manage recurring service subscriptions.
 */

export default async function AdminSubscriptionsPage() {
  await cookies(); // Ensure dynamic rendering

  const [subscriptions, stats] = await Promise.all([
    getSubscriptions(),
    getSubscriptionStats(),
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

      <div className="mt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
          <p className="mt-2 text-white/50">
            Manage recurring service subscriptions and billing.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan-400">
          <Plus className="h-4 w-4" />
          New Subscription
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-white/8 bg-white/2 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-white/40">Total Subscriptions</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-white/8 bg-white/2 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-xs text-white/40">Active</p>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-white/8 bg-white/2 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-500/10 text-purple-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                ${stats.mrr.toLocaleString()}
              </p>
              <p className="text-xs text-white/40">Monthly Recurring Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="mt-8">
        <SubscriptionsClient initialData={subscriptions} />
      </div>
    </div>
  );
}
