'use client';

/**
 * Invoice PDF Download Button
 * ----------------------------
 * Client component that renders a download button for invoice PDFs.
 * Uses dynamic import to avoid SSR issues with @react-pdf/renderer.
 */

import dynamic from 'next/dynamic';
import { Download, Loader2 } from 'lucide-react';
import { InvoicePDF } from './invoice-pdf';
import type { Invoice } from '@/types/invoice';

// Dynamic import PDFDownloadLink to avoid SSR issues
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { 
    ssr: false, 
    loading: () => (
      <button
        disabled
        className="flex items-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm text-white/50"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading PDF...
      </button>
    )
  }
);

interface InvoiceDownloadProps {
  invoice: Invoice;
  className?: string;
}

export function InvoiceDownload({ invoice, className }: InvoiceDownloadProps) {
  const fileName = `Invoice-${invoice.refNo}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} />}
      fileName={fileName}
      className={className}
    >
      {({ loading, error }) => {
        if (loading) {
          return (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </span>
          );
        }

        if (error) {
          return (
            <span className="text-red-400">Error generating PDF</span>
          );
        }

        return (
          <span className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </span>
        );
      }}
    </PDFDownloadLink>
  );
}
