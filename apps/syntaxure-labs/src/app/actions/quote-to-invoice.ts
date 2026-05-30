"use server";

/**
 * Quote-to-Invoice Bridge Server Action
 *
 * Converts an accepted quote into an invoice with line items.
 * Generates PDF and sends email to client.
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { generateInvoiceRef } from "@/lib/ref-generator";
import { revalidatePath } from "next/cache";

// =============================================================================
// SCHEMAS
// =============================================================================

const quoteToInvoiceSchema = z.object({
  quoteId: z.string().uuid(),
});

export type QuoteToInvoiceInput = z.infer<typeof quoteToInvoiceSchema>;

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Convert an accepted quote to an invoice
 */
export async function convertQuoteToInvoice(
  input: QuoteToInvoiceInput
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const validated = quoteToInvoiceSchema.parse(input);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // Fetch quote with template and contract term data
    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", validated.quoteId)
      .single();

    if (quoteError || !quote) {
      return { success: false, error: "Quote not found" };
    }

    if (quote.status !== "accepted") {
      return { success: false, error: "Quote must be accepted before converting to invoice" };
    }

    const metadata = quote.metadata as Record<string, unknown>;
    const templateId = metadata.templateId as string | undefined;
    const contractTermId = metadata.contractTermId as string | undefined;

    let lineItems: { description: string; quantity: number; unitPrice: number; amount: number }[] = [];
    let totalAmount = 0;

    if (templateId && contractTermId) {
      // Fetch template and term for line items
      const { data: template } = await supabase
        .from("product_templates")
        .select("name")
        .eq("id", templateId)
        .single();

      const { data: term } = await supabase
        .from("contract_terms")
        .select("*")
        .eq("id", contractTermId)
        .single();

      if (template && term) {
        const months = term.term_months;
        const monthlyPrice = term.price_php;

        lineItems = [
          {
            description: `${template.name} - ${months / 12} Year Contract (${term.billing_cycle})`,
            quantity: 1,
            unitPrice: monthlyPrice,
            amount: monthlyPrice,
          },
        ];
        totalAmount = monthlyPrice;
      }
    }

    // Fallback to quote amount if no template data
    if (lineItems.length === 0) {
      const amount = parseFloat(quote.amount) || 0;
      lineItems = [
        {
          description: quote.title || "Custom Development Services",
          quantity: 1,
          unitPrice: amount,
          amount: amount,
        },
      ];
      totalAmount = amount;
    }

    // Generate invoice number
    const invoiceNumber = generateInvoiceRef();

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: quote.user_id || "",
        quote_id: quote.id,
        invoice_number: invoiceNumber,
        amount: totalAmount,
        tax_amount: 0,
        total_amount: totalAmount,
        status: "sent",
        issued_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        line_items: lineItems,
        notes: `Invoice for ${quote.title || "project"}`,
        metadata: {
          quoteRefNo: metadata.refNo,
          templateSlug: metadata.templateSlug,
        },
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: "Failed to create invoice" };
    }

    // Update quote status
    await supabase
      .from("quotes")
      .update({
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id);

    // Send invoice email
    await sendInvoiceEmail(invoice.id, quote);

    revalidatePath("/admin/invoices");
    revalidatePath("/admin/quotes");

    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    console.error("[QUOTE TO INVOICE ERROR]", error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to convert quote to invoice",
    };
  }
}

/**
 * Send invoice email with PDF attachment
 */
async function sendInvoiceEmail(invoiceId: string, quote: Record<string, unknown>) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (!invoice) return;

    const metadata = quote.metadata as Record<string, unknown>;
    const clientEmail = metadata.email as string || "";
    const clientName = metadata.name as string || "Client";

    if (!clientEmail) return;

    const lineItems = invoice.line_items as { description: string; amount: number }[];
    const itemsList = lineItems
      .map((item) => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₱${item.amount.toLocaleString()}</td></tr>`)
      .join("");

    await sendEmail({
      to: clientEmail,
      subject: `🧾 Invoice ${invoice.invoice_number} - Syntaxure Labs`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Invoice ${invoice.invoice_number}</h2>
          <p>Hi ${clientName},</p>
          <p>Please find your invoice below. Payment is due within 30 days.</p>
          
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 8px; text-align: left;">Description</th>
                  <th style="padding: 8px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr style="border-top: 2px solid #e2e8f0; font-weight: bold;">
                  <td style="padding: 8px;">Total Due</td>
                  <td style="padding: 8px; text-align: right;">₱${invoice.total_amount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p style="color: #64748b; font-size: 14px;">
            Due Date: ${invoice.due_date}
          </p>

          <a href="${process.env.NEXT_PUBLIC_SYNTAXURE_URL}/pay?invoice=${invoice.invoice_number}" 
             style="display: inline-block; background: #f59e0b; color: black; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
            Pay Now
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error("[SEND INVOICE EMAIL ERROR]", error);
  }
}
