'use client';

/**
 * Quotes Table Client Component
 * ------------------------------
 * Uses TanStack Table for sortable, filterable quotes list.
 * Clicking a row opens the QuoteModal with full details.
 */

import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { QuoteStatusSelector } from '@/components/admin/quote-status-selector';
import { QuoteModal } from '@/components/admin/quote-modal';

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

const projectTypeLabels: Record<string, string> = {
  web: 'Web App',
  saas: 'SaaS',
  mobile: 'Mobile',
  ai: 'AI Integration',
  other: 'Other',
};

interface QuotesTableProps {
  quotes: Quote[];
}

export function QuotesTable({ quotes }: QuotesTableProps) {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const columns: ColumnDef<Quote>[] = [
    {
      accessorKey: 'refNo',
      header: 'Ref No.',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-white/60">
          {row.original.refNo || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Client',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-white">{row.original.name}</div>
          <div className="text-xs text-white/40">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'projectType',
      header: 'Project',
      cell: ({ row }) => (
        <span className="text-white/70">
          {projectTypeLabels[row.original.projectType] || row.original.projectType}
        </span>
      ),
    },
    {
      accessorKey: 'budget',
      header: 'Budget',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-white/50">{row.original.budget}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <QuoteStatusSelector
          quoteId={row.original.id}
          currentStatus={row.original.status}
        />
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-white/40">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedQuote(row.original)}
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={quotes}
        searchKey="name"
        searchPlaceholder="Search by client name..."
        onRowClick={(row) => setSelectedQuote(row)}
      />

      {/* Quote Details Modal */}
      {selectedQuote && (
        <QuoteModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
        />
      )}
    </>
  );
}
