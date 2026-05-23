'use client';

/**
 * Calendar Legend Component
 * --------------------------
 * Shows event type color legend.
 */

import type { EventType } from '@/types/firestore';

const eventTypes: { type: EventType; label: string; color: string }[] = [
  { type: 'deadline', label: 'Deadline', color: '#ef4444' },
  { type: 'meeting', label: 'Meeting', color: '#06b6d4' },
  { type: 'milestone', label: 'Milestone', color: '#8b5cf6' },
  { type: 'reminder', label: 'Reminder', color: '#f59e0b' },
  { type: 'holiday', label: 'Holiday', color: '#10b981' },
];

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {eventTypes.map(({ type, label, color }) => (
        <div key={type} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-white/60">{label}</span>
        </div>
      ))}
    </div>
  );
}
