'use client';

/**
 * Quote Details Modal
 * -------------------
 * Displays full quote information with action buttons:
 * - Open Email (mailto: with quote context)
 * - Add to Calendar (creates a meeting event)
 * - Update Status
 */

import { useState } from 'react';
import { X, Mail, Calendar, Building, Clock, DollarSign, FileText, User } from 'lucide-react';
import { QuoteStatusSelector } from './quote-status-selector';
import { createCalendarEvent } from '@/app/actions/calendar';

interface Quote {
  id: string;
  refNo?: string;
  name: string;
  email: string;
  company?: string;
  projectType: string;
  budget: string;
  timeline: string;
  details: string;
  status: 'new' | 'contacted' | 'in-progress' | 'closed';
  createdAt: string;
}

interface QuoteModalProps {
  quote: Quote | null;
  onClose: () => void;
}

const projectTypeLabels: Record<string, string> = {
  web: 'Web Application',
  saas: 'SaaS Platform',
  mobile: 'Mobile App',
  ai: 'AI Integration',
  other: 'Other',
};

export function QuoteModal({ quote, onClose }: QuoteModalProps) {
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventCreated, setEventCreated] = useState(false);

  if (!quote) return null;

  // Build mailto link with quote context
  const mailtoSubject = encodeURIComponent(
    `Re: Quote Request - ${projectTypeLabels[quote.projectType] || quote.projectType} (${quote.refNo || quote.id})`
  );
  const mailtoBody = encodeURIComponent(
    `Hi ${quote.name},\n\nThank you for your interest in our services.\n\nRegarding your ${projectTypeLabels[quote.projectType] || quote.projectType} project with a budget of ${quote.budget}:\n\n---\n\nBest regards,\nJD Studio`
  );
  const mailtoLink = `mailto:${quote.email}?subject=${mailtoSubject}&body=${mailtoBody}`;

  // Handle adding meeting to calendar
  const handleAddToCalendar = async () => {
    setIsCreatingEvent(true);
    try {
      // Create a meeting 2 days from now at 10 AM
      const meetingDate = new Date();
      meetingDate.setDate(meetingDate.getDate() + 2);
      meetingDate.setHours(10, 0, 0, 0);

      await createCalendarEvent({
        title: `Discovery Call: ${quote.name}`,
        description: `Quote discussion for ${projectTypeLabels[quote.projectType] || quote.projectType} project.\nBudget: ${quote.budget}\nTimeline: ${quote.timeline}\n\nDetails: ${quote.details}`,
        type: 'meeting',
        start: meetingDate.toISOString(),
        end: new Date(meetingDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour
        allDay: false,
      });
      setEventCreated(true);
    } catch (error) {
      console.error('Failed to create calendar event:', error);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg border border-white/[0.08] bg-[#0a0a0a] p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">{quote.name}</h2>
            <QuoteStatusSelector quoteId={quote.id} currentStatus={quote.status} />
          </div>
          {quote.refNo && (
            <p className="mt-1 font-mono text-xs text-white/40">REF: {quote.refNo}</p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow icon={Mail} label="Email" value={quote.email} />
          {quote.company && (
            <InfoRow icon={Building} label="Company" value={quote.company} />
          )}
          <InfoRow
            icon={FileText}
            label="Project Type"
            value={projectTypeLabels[quote.projectType] || quote.projectType}
          />
          <InfoRow icon={DollarSign} label="Budget" value={quote.budget} />
          <InfoRow icon={Clock} label="Timeline" value={quote.timeline} />
          <InfoRow
            icon={User}
            label="Submitted"
            value={new Date(quote.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
        </div>

        {/* Details */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-2">
            Project Details
          </h3>
          <div className="rounded-md bg-white/[0.02] border border-white/[0.06] p-4">
            <p className="text-sm text-white/70 whitespace-pre-wrap">
              {quote.details || 'No additional details provided.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={mailtoLink}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-400 transition-all hover:bg-cyan-500/20"
          >
            <Mail className="h-4 w-4" />
            Open Email Client
          </a>

          <button
            onClick={handleAddToCalendar}
            disabled={isCreatingEvent || eventCreated}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              eventCreated
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
            } disabled:opacity-50`}
          >
            <Calendar className="h-4 w-4" />
            {eventCreated
              ? 'Added to Calendar'
              : isCreatingEvent
                ? 'Creating...'
                : 'Add to Calendar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md bg-white/[0.04] p-2">
        <Icon className="h-4 w-4 text-white/40" />
      </div>
      <div>
        <div className="text-xs text-white/40 uppercase tracking-wider">{label}</div>
        <div className="text-sm text-white">{value}</div>
      </div>
    </div>
  );
}
