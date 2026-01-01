'use client';

/**
 * Support Form Component
 * ----------------------
 * Contact form for support requests. Used on error pages and support page.
 */

import { useState } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { sendSupportRequest } from '@/app/actions/support';

interface SupportFormProps {
  /** Prefill the subject field */
  defaultSubject?: string;
  /** Compact mode for embedding in modals */
  compact?: boolean;
}

export function SupportForm({ defaultSubject, compact }: SupportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await sendSupportRequest(formData);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send message');
    }

    setIsLoading(false);
  };

  if (success) {
    return (
      <div className={`rounded-md border border-emerald-500/20 bg-emerald-500/10 p-6 text-center ${compact ? '' : 'py-12'}`}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Message Sent!</h3>
        <p className="mt-2 text-sm text-white/50">
          We'll get back to you within 24-48 hours.
        </p>
      </div>
    );
  }

  const inputClass = `w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-cyan-500/50 ${compact ? 'py-2' : 'py-2.5'}`;
  const labelClass = 'block text-xs uppercase tracking-wider text-white/40 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-3">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className={compact ? '' : 'grid gap-4 sm:grid-cols-2'}>
        <div>
          <label htmlFor="name" className={labelClass}>Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Your name"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="your@email.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className={labelClass}>Subject</label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          defaultValue={defaultSubject}
          placeholder="How can we help?"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={compact ? 3 : 5}
          placeholder="Describe your issue or question..."
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-cyan-400 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
