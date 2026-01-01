'use client';

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { SupportForm } from '@/components/support-form';

/**
 * 403 Forbidden Page
 * ------------------
 * Displayed when user lacks permission to access a resource.
 * Includes contact support form.
 */

export default function ForbiddenPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-md w-full">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <ShieldOff className="h-10 w-10 text-red-400" />
        </div>

        {/* Error Code */}
        <h1 className="text-7xl font-bold text-white/10">403</h1>

        {/* Title */}
        <h2 className="mt-4 text-2xl font-semibold text-white">
          Access Denied
        </h2>

        {/* Description */}
        <p className="mt-3 text-white/50">
          You don&apos;t have permission to access this resource. If you believe this is
          an error, please contact your administrator.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium text-white/50 transition-all hover:text-white"
          >
            Return Home
          </Link>
        </div>

        {/* Contact Support */}
        <div className="mt-8">
          {showForm ? (
            <div className="text-left rounded-md border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm font-medium text-white mb-4">Contact Support</h3>
              <SupportForm
                defaultSubject="Access Denied - Need Help"
                compact
              />
              <button
                onClick={() => setShowForm(false)}
                className="mt-4 text-xs text-white/40 hover:text-white/60"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/30">
              Need help?{' '}
                <button
                  onClick={() => setShowForm(true)}
                  className="text-cyan-400 hover:underline"
                >
                  Contact Support
                </button>
              </p>
          )}
        </div>
      </div>
    </div>
  );
}
