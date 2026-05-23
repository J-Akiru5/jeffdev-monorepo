'use client';

/**
 * Quote Status Selector
 * ---------------------
 * Dropdown to update quote status with optimistic UI.
 */

import { useState, useTransition } from 'react';
import { updateQuoteStatus } from '@/app/actions/quote';

interface QuoteStatusSelectorProps {
  quoteId: string;
  currentStatus: string;
}

const statuses = [
  { value: 'draft', label: 'Draft', color: 'bg-white/10 text-white/60' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500/20 text-red-400' },
  { value: 'expired', label: 'Expired', color: 'bg-yellow-500/20 text-yellow-400' },
];

export function QuoteStatusSelector({ quoteId, currentStatus }: QuoteStatusSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (newStatus: string) => {
    setError(null);
    const previousStatus = status;
    setStatus(newStatus); // Optimistic update

    startTransition(async () => {
      const result = await updateQuoteStatus(
        quoteId,
        newStatus as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
      );

      if (!result.success) {
        setStatus(previousStatus); // Rollback
        setError(result.error || 'Failed to update');
      }
    });
  };

  const currentStatusConfig = statuses.find((s) => s.value === status) || statuses[0];

  return (
    <div className="relative">
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className={`cursor-pointer appearance-none rounded-sm px-3 py-1.5 text-xs font-medium uppercase tracking-wider ${currentStatusConfig.color} border-0 bg-opacity-100 pr-8 transition-opacity ${isPending ? 'opacity-50' : ''}`}
      >
        {statuses.map((s) => (
          <option key={s.value} value={s.value} className="bg-void text-white">
            {s.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="absolute -bottom-5 left-0 text-[10px] text-red-400">{error}</span>
      )}
    </div>
  );
}
