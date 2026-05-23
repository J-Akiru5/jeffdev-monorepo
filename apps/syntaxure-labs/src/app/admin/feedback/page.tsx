import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getFeedback } from '@/app/actions/feedback';
import { FeedbackTable } from '@/components/admin/feedback-table';

/**
 * Admin Feedback Page
 * -------------------
 * View and manage client testimonials/reviews.
 * Features: searchable, filterable, paginated table.
 */

export default async function AdminFeedbackPage() {
  const feedback = await getFeedback();

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Client Feedback</h1>
          <p className="mt-2 text-white/50">{feedback.length} testimonials</p>
        </div>
      </div>

      <div className="mt-8">
        {feedback.length === 0 ? (
          <div className="rounded-md border border-white/8 bg-white/2 p-12 text-center">
            <p className="text-white/40">No feedback yet</p>
            <p className="mt-2 text-sm text-white/30">
              Client testimonials will appear here after they submit reviews.
            </p>
          </div>
        ) : (
          <FeedbackTable feedback={feedback as Parameters<typeof FeedbackTable>[0]['feedback']} />
        )}
      </div>
    </div>
  );
}
