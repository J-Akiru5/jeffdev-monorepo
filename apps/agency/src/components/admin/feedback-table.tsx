'use client';

/**
 * Feedback Table Component
 * ------------------------
 * DataTable for client testimonials with status management.
 */

import { type ColumnDef } from '@tanstack/react-table';
import { Star, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { FeedbackStatusSelector } from '@/components/admin/feedback-status-selector';
import { deleteFeedback } from '@/app/actions/feedback';
import { useRouter } from 'next/navigation';
import type { FeedbackStatus } from '@/types/firestore';

interface Feedback {
  id: string;
  clientName: string;
  clientEmail: string;
  company?: string;
  projectSlug?: string;
  rating: number;
  testimonial: string;
  status: FeedbackStatus;
  featured: boolean;
  createdAt: string;
}

interface FeedbackTableProps {
  feedback: Feedback[];
}

export function FeedbackTable({ feedback }: FeedbackTableProps) {
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    await deleteFeedback(id);
    router.refresh();
  };

  const columns: ColumnDef<Feedback>[] = [
    {
      accessorKey: 'clientName',
      header: 'Client',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-white">{row.original.clientName}</div>
          <div className="text-xs text-white/40">
            {row.original.company || row.original.clientEmail}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= row.original.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-white/20'
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'testimonial',
      header: 'Testimonial',
      cell: ({ row }) => (
        <p className="max-w-md truncate text-sm text-white/60">
          {row.original.testimonial}
        </p>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <FeedbackStatusSelector
          feedbackId={row.original.id}
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
          onClick={() => handleDelete(row.original.id)}
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={feedback}
      searchKey="clientName"
      searchPlaceholder="Search by client name..."
    />
  );
}
