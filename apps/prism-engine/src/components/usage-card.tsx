'use client';

/**
 * UsageCard Component
 * 
 * Displays current usage stats with limits and progress bars.
 * Fetches from /api/usage endpoint.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  Loader2, 
  AlertCircle,
  FolderKanban,
  FileJson,
  Sparkles,
  Library
} from 'lucide-react';
import { GlassPanel, Button, Badge } from '@syntaxure/ui';

interface UsageItem {
  used: number;
  limit: number | 'unlimited';
}

interface UsageData {
  tier: string;
  usage: {
    projects: UsageItem;
    rules: UsageItem;
    components: UsageItem;
    aiGenerations: UsageItem;
  };
  resetDate: string;
}

interface UsageCardProps {
  className?: string;
}

export function UsageCard({ className }: UsageCardProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage');
      if (!response.ok) throw new Error('Failed to fetch usage');
      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GlassPanel className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      </GlassPanel>
    );
  }

  if (error || !usage) {
    return (
      <GlassPanel className={`p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error || 'Failed to load usage'}</span>
        </div>
      </GlassPanel>
    );
  }

  const resetDate = new Date(usage.resetDate);
  const tierLabel = usage.tier.charAt(0).toUpperCase() + usage.tier.slice(1);

  return (
    <GlassPanel className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-white">Usage</h3>
            <p className="text-xs text-white/50">Current period</p>
          </div>
        </div>
        <Badge variant={usage.tier === 'free' ? 'default' : 'success'}>
          {tierLabel}
        </Badge>
      </div>

      {/* Usage Bars */}
      <div className="space-y-4">
        <UsageBar 
          icon={FolderKanban}
          label="Projects" 
          used={usage.usage.projects.used} 
          limit={usage.usage.projects.limit} 
        />
        <UsageBar 
          icon={FileJson}
          label="Rules" 
          used={usage.usage.rules.used} 
          limit={usage.usage.rules.limit} 
        />
        <UsageBar 
          icon={Library}
          label="Components" 
          used={usage.usage.components.used} 
          limit={usage.usage.components.limit} 
        />
        <UsageBar 
          icon={Sparkles}
          label="AI Gen/mo" 
          used={usage.usage.aiGenerations.used} 
          limit={usage.usage.aiGenerations.limit} 
        />
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
        <p className="text-xs text-white/40">
          Resets: {resetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        {usage.tier === 'free' && (
          <Button variant="secondary" size="sm" asChild>
            <Link href="/subscription">Upgrade</Link>
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}

// =============================================================================
// USAGE BAR COMPONENT
// =============================================================================

interface UsageBarProps {
  icon: typeof FolderKanban;
  label: string;
  used: number;
  limit: number | 'unlimited';
}

function UsageBar({ icon: Icon, label, used, limit }: UsageBarProps) {
  const isUnlimited = limit === 'unlimited';
  const percentage = isUnlimited ? 0 : Math.min((used / (limit as number)) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && used >= (limit as number);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-white/40" />
          <span className="text-sm text-white/70">{label}</span>
        </div>
        <span className={`text-sm font-mono ${isAtLimit ? 'text-red-400' : isNearLimit ? 'text-amber-400' : 'text-white/70'}`}>
          {used}
          <span className="text-white/30">
            /{isUnlimited ? '∞' : limit}
          </span>
        </span>
      </div>
      
      {!isUnlimited && (
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      
      {isUnlimited && (
        <div className="h-1.5 rounded-full bg-emerald-500/30" />
      )}
    </div>
  );
}
