import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getCollection } from "@jeffdev/db";
import { 
  BarChart3,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  FileJson,
  Sparkles,
  Monitor,
  Users,
} from "lucide-react";
import { GlassPanel, MetricTile, SectionHeader } from "@jdstudio/ui";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/subscriptions";

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const usageColl = await getCollection('usage');
  const generationsColl = await getCollection('generations');
  const rulesColl = await getCollection('rules');
  const apiKeysColl = await getCollection('apiKeys');

  const [usage, genCount, ruleCount, projectCount, apiKeyCount] = await Promise.all([
    usageColl.findOne({ userId, month }),
    generationsColl.countDocuments({ userId }),
    rulesColl.countDocuments({ createdBy: userId }),
    getCollection('projects').then(c => c.countDocuments({ userId })),
    apiKeysColl.countDocuments({ userId, revokedAt: null }),
  ]);

  const subscriptionsColl = await getCollection('subscriptions');
  const sub = await subscriptionsColl.findOne({ userId });
  const tier = (sub?.tier as SubscriptionTier) || 'free';
  const limits = TIER_LIMITS[tier];

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 mb-4">
          <BarChart3 className="h-3 w-3 text-amber-400" />
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
            Analytics
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white">Usage & Analytics</h1>
        <p className="text-white/60 mt-1">
          Track your usage across all Prism features. Resets monthly.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile
          label="AI Generations"
          value={usage?.aiGenerations || 0}
          icon={Sparkles}
          intent="default"
        />
        <MetricTile
          label="Rules Created"
          value={usage?.rulesCreated || 0}
          icon={FileJson}
          intent="purple"
        />
        <MetricTile
          label="Active Projects"
          value={projectCount}
          icon={Monitor}
          intent="cyan"
        />
        <MetricTile
          label="API Keys"
          value={apiKeyCount}
          icon={Activity}
          intent="default"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GlassPanel className="p-6">
          <SectionHeader title="Monthly Trend" kicker={`${month}`} />
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Generations</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-white">{usage?.aiGenerations || 0}</span>
                <span className="text-xs text-white/30">/ {limits.aiGenerations === -1 ? '∞' : limits.aiGenerations}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                style={{
                  width: limits.aiGenerations === -1 ? '30%' : `${Math.min(100, ((usage?.aiGenerations || 0) / limits.aiGenerations) * 100)}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-white/70">Rules</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-white">{usage?.rulesCreated || 0}</span>
                <span className="text-xs text-white/30">/ {limits.rules === -1 ? '∞' : limits.rules}</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{
                  width: limits.rules === -1 ? '20%' : `${Math.min(100, ((usage?.rulesCreated || 0) / limits.rules) * 100)}%`
                }}
              />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <SectionHeader title="All-Time Totals" kicker="Cumulative" />
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-white/70">Total Generations</span>
              </div>
              <span className="font-semibold text-white">{genCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <FileJson className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-white/70">Total Rules</span>
              </div>
              <span className="font-semibold text-white">{ruleCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-white/70">Total Projects</span>
              </div>
              <span className="font-semibold text-white">{projectCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-green-400" />
                <span className="text-sm text-white/70">Current Plan</span>
              </div>
              <Badge className="capitalize">{tier}</Badge>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border border-white/10 px-2.5 py-0.5 text-xs font-medium text-white/70 ${className || ''}`}>
      {children}
    </span>
  );
}
