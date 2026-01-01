'use client';

/**
 * Bootstrap Button
 * -----------------
 * One-click button to set up founder account.
 * Shows in System Info section of Settings page.
 */

import { useState } from 'react';
import { Shield, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { bootstrapCurrentUserAsFounder } from '@/app/actions/seed';
import { useUser } from '@/contexts/user-context';

export function BootstrapButton() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleBootstrap = async () => {
    if (!user) {
      toast.error('You must be logged in to bootstrap your account');
      return;
    }

    setIsLoading(true);
    try {
      const result = await bootstrapCurrentUserAsFounder(
        user.uid,
        user.email,
        user.displayName
      );

      if (result.success) {
        toast.success('Founder account created! Refresh the page.');
        setIsDone(true);
      } else {
        toast.error(result.error || 'Failed to bootstrap account');
      }
    } catch (error) {
      console.error('Bootstrap error:', error);
      toast.error('Failed to bootstrap account');
    } finally {
      setIsLoading(false);
    }
  };

  if (isDone) {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        <Check className="h-4 w-4" />
        <span className="text-sm">Account bootstrapped! Refresh to see changes.</span>
      </div>
    );
  }

  // Only show if user appears to be an employee (fallback role)
  if (user?.role !== 'employee') {
    return null;
  }

  return (
    <button
      onClick={handleBootstrap}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-md bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 border border-cyan-500/20 transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Shield className="h-4 w-4" />
      )}
      {isLoading ? 'Setting up...' : 'Bootstrap as Founder'}
    </button>
  );
}
