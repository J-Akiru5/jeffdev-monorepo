/**
 * Quote Form Server Action
 * -------------------------
 * Handles multi-step quote form submissions:
 * 1. Validates all steps with Zod
 * 2. Saves to Supabase
 * 3. Sends email notification to hire@jeffdev.studio
 */
"use server";

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail, quoteEmailTemplate, EMAIL_ADDRESSES } from "@/lib/email";
import { generateQuoteRef } from "@/lib/ref-generator";

const quoteSchema = z.object({
  // Step 1: Project Type
  projectType: z.enum(["web", "saas", "mobile", "ai", "other"], {
    message: "Please select a project type",
  }),

  // Step 2: Budget & Timeline
  budget: z.enum(["50k-100k", "100k-250k", "250k-500k", "500k+"], {
    message: "Please select a budget range",
  }),
  timeline: z.enum(["1-2-weeks", "1-month", "2-3-months", "flexible"], {
    message: "Please select a timeline",
  }),

  // Step 3: Contact Info
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  details: z
    .string()
    .min(20, "Please provide at least 20 characters of detail"),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

export async function submitQuoteForm(data: QuoteFormData) {
  try {
    // Validate input
    const validated = quoteSchema.parse(data);

    // Generate unique reference number
    const refNo = generateQuoteRef();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // Save to Supabase
    const { data: result, error } = await supabase
      .from("quotes")
      .insert([
        {
          user_id: "",
          project_id: null,
          title: validated.name,
          description: validated.details,
          amount: "0",
          status: "draft" as const,
          valid_until: null,
          line_items: [],
          metadata: {
            projectType: validated.projectType,
            budget: validated.budget,
            timeline: validated.timeline,
            company: validated.company,
            refNo,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id");

    if (error) throw error;

    // Send email notification
    await sendEmail({
      to: EMAIL_ADDRESSES.hire,
      subject: `🎯 New Quote Request: ${validated.projectType.toUpperCase()} - ${validated.budget}`,
      html: quoteEmailTemplate(validated),
      replyTo: validated.email,
    });

    return {
      success: true,
      message:
        "Quote request submitted! We'll respond within 24 hours with a custom quote.",
      id: result?.[0]?.id,
    };
  } catch (error) {
    console.error("[QUOTE FORM ERROR]", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.issues,
      };
    }

    return {
      success: false,
      message:
        "Failed to submit quote request. Please try again or contact us directly.",
    };
  }
}

/**
 * Update quote status (admin action)
 */
export async function updateQuoteStatus(
  quoteId: string,
  status: "draft" | "sent" | "accepted" | "rejected" | "expired",
) {
  try {
    const { logAuditEvent } = await import("@/lib/audit");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // Fetch current quote
    const { data: quotes, error: fetchError } = await supabase
      .from("quotes")
      .select("status")
      .eq("id", quoteId);

    if (fetchError || !quotes || quotes.length === 0) {
      return { success: false, error: "Quote not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quote = quotes[0] as any;
    const oldStatus = quote.status;

    // Update quote status
    const { error: updateError } = await supabase
      .from("quotes")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    if (updateError) throw updateError;

    await logAuditEvent({
      action: "STATUS_CHANGE",
      resource: "quotes",
      resourceId: quoteId,
      details: { oldStatus, newStatus: status },
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/quotes");

    return { success: true };
  } catch (error) {
    console.error("[UPDATE QUOTE STATUS ERROR]", error);
    return { success: false, error: "Failed to update status" };
  }
}
