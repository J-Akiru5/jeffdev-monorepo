import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InvoiceForm } from "@/components/agency/invoice-form";

/**
 * New Agency Invoice Page
 * ------------------------
 * Create a new invoice for clients.
 */

export default function NewAgencyInvoicePage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/agency/invoices"
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Invoices
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">New Invoice</h1>
        <p className="mt-1 text-sm text-white/50">Create and send an invoice to a client</p>
      </div>

      <InvoiceForm mode="create" />
    </div>
  );
}
