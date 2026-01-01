'use client';

/**
 * Feature Flags Admin Page
 * -------------------------
 * Admin interface to toggle feature flags.
 */

import { useState, useEffect, useTransition } from 'react';
import { Flag, Loader2, Check, Sparkles, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { getFeatureFlags, updateFeatureFlags, type FeatureFlags } from '@/lib/feature-flags';
import { cn } from '@/lib/utils';

interface FeatureToggleProps {
  id: keyof FeatureFlags;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (id: keyof FeatureFlags, value: boolean) => void;
  isPending: boolean;
}

function FeatureToggle({
  id,
  label,
  description,
  icon,
  enabled,
  onToggle,
  isPending,
}: FeatureToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-4">
        <div className="rounded-md bg-white/10 p-2">{icon}</div>
        <div>
          <h3 className="font-medium text-white">{label}</h3>
          <p className="mt-1 text-sm text-white/50">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onToggle(id, !enabled)}
        disabled={isPending}
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          enabled ? 'bg-emerald-500' : 'bg-white/20',
          isPending && 'opacity-50'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
            enabled && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}

export default function FeaturesSettingsPage() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFlags() {
      const data = await getFeatureFlags();
      setFlags(data);
      setLoading(false);
    }
    loadFlags();
  }, []);

  const handleToggle = (id: keyof FeatureFlags, value: boolean) => {
    startTransition(async () => {
      const result = await updateFeatureFlags({ [id]: value });
      if (result.success) {
        setFlags((prev) => (prev ? { ...prev, [id]: value } : null));
        toast.success(`Feature "${id}" ${value ? 'enabled' : 'disabled'}`);
      } else {
        toast.error(result.error || 'Failed to update feature');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!flags) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">Failed to load feature flags</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
          <Flag className="h-6 w-6 text-cyan-400" />
          Feature Flags
        </h1>
        <p className="mt-1 text-white/50">
          Toggle features on or off without redeploying
        </p>
      </div>

      {/* Status Badge */}
      {flags.updatedAt && (
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Check className="h-4 w-4 text-emerald-400" />
          Last updated: {new Date(flags.updatedAt).toLocaleString()}
        </div>
      )}

      {/* Feature Toggles */}
      <div className="space-y-4">
        <FeatureToggle
          id="prismEngineEnabled"
          label="Prism Engine (Full)"
          description="Enable the full Prism Engine experience with pricing, registration, and dashboard access."
          icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
          enabled={flags.prismEngineEnabled}
          onToggle={handleToggle}
          isPending={isPending}
        />

        <FeatureToggle
          id="prismEngineTeaser"
          label="Prism Engine Teaser"
          description="Show the Coming Soon page and waitlist signup. Adds 'Prism Engine' link to navigation."
          icon={<Sparkles className="h-5 w-5 text-purple-400" />}
          enabled={flags.prismEngineTeaser}
          onToggle={handleToggle}
          isPending={isPending}
        />
      </div>

      {/* Warning */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-400">
          <strong>Note:</strong> Changes may take a few seconds to propagate across all pages.
          Users may need to refresh to see updates.
        </p>
      </div>
    </div>
  );
}
