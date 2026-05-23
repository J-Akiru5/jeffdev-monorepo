'use client';

/**
 * Feedback Status Selector
 * ------------------------
 * Dropdown to change feedback status (pending, approved, featured, rejected).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { updateFeedbackStatus } from '@/app/actions/feedback';
import type { FeedbackStatus } from '@/types/firestore';

interface FeedbackStatusSelectorProps {
  feedbackId: string;
  currentStatus: FeedbackStatus;
}

const statusConfig: Record<FeedbackStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  featured: {
    label: 'Featured',
    className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
};

export function FeedbackStatusSelector({
  feedbackId,
  currentStatus,
}: FeedbackStatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<FeedbackStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setStatus(newStatus);
    setIsOpen(false);

    await updateFeedbackStatus(feedbackId, newStatus);
    router.refresh();
    setIsUpdating(false);
  };

  const config = statusConfig[status];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-wider transition-all ${config.className} ${isUpdating ? 'opacity-50' : ''}`}
      >
        {config.label}
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-md border border-white/10 bg-[#0a0a0a] py-1 shadow-xl">
            {(Object.keys(statusConfig) as FeedbackStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5 ${
                  s === status ? 'text-white' : 'text-white/60'
                }`}
              >
                {statusConfig[s].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
