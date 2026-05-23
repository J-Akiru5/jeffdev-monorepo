import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getQuotes } from '@/lib/data';
import { QuotesTable } from '@/components/admin/quotes-table';

/**
 * Admin Quotes Page
 * ------------------
 * View all quote requests with sortable, filterable table.
 */

export default async function AdminQuotesPage() {
  const quotes = await getQuotes();

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
          <h1 className="text-3xl font-bold text-white">Quote Requests</h1>
          <p className="mt-2 text-white/50">{quotes.length} total submissions</p>
        </div>
      </div>

      <div className="mt-8">
        <QuotesTable quotes={quotes as Parameters<typeof QuotesTable>[0]['quotes']} />
      </div>
    </div>
  );
}
