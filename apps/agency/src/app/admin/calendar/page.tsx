import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { getCalendarEvents } from '@/app/actions/calendar';
import { AdminCalendar, CalendarLegend } from '@/components/admin/calendar';

export const dynamic = 'force-dynamic';

/**
 * Admin Calendar Page
 * --------------------
 * Full calendar view with event management.
 */

export default async function AdminCalendarPage() {
  const events = await getCalendarEvents();

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendar</h1>
          <p className="mt-2 text-white/50">
            {events.length} events scheduled
          </p>
        </div>

        <CalendarLegend />
      </div>

      {/* Calendar */}
      <div className="mt-8 rounded-md border border-white/[0.08] bg-white/[0.02] p-6">
        <AdminCalendar initialEvents={events} />
      </div>

      {/* Quick Tips */}
      <div className="mt-6 rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
        <h3 className="text-sm font-medium text-white">Quick Tips</h3>
        <ul className="mt-2 space-y-1 text-xs text-white/40">
          <li>• Click on a date to create a new event</li>
          <li>• Click on an event to edit or delete it</li>
          <li>• Drag events to reschedule them</li>
        </ul>
      </div>
    </div>
  );
}
