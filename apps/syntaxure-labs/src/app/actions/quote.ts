/**
 * Quote Form Server Action
 * -------------------------
 * Handles multi-step quote form submissions for SaaS template customization:
 * 1. Validates all steps with Zod
 * 2. Saves to Supabase
 * 3. Sends email notification to hire@syntaxure.dev
 */
"use server";

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail, quoteEmailTemplate, EMAIL_ADDRESSES } from "@/lib/email";
import { generateQuoteRef } from "@/lib/ref-generator";

const quoteSchema = z.object({
  // Step 1: Template Selection
  templateSelected: z.string().min(1, "Please select a template"),
  templateName: z.string().min(1, "Template name is required"),

  // Step 2: Customization Scope
  customizationScope: z.enum(["brand", "api", "features", "full"], {
    message: "Please select a customization scope",
  }),

  // Step 3: Contact Info & Requirements
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
  requirements: z
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
    // NOTE: name/email/company/phone are stored in metadata (no dedicated columns in quotes table)
    // user_id is NULL for public (unauthenticated) quote requests
    // status starts as 'draft' (the only valid values: draft/sent/accepted/rejected/expired)
    const { data: result, error } = await supabase
      .from("quotes")
      .insert([
        {
          user_id: null,
          project_id: null,
          title: `${validated.name} - ${validated.templateName}`,
          description: validated.requirements,
          amount: 0,
          status: "draft",
          valid_until: null,
          line_items: [],
          quote_type: "template",
          metadata: {
            refNo,
            name: validated.name,
            email: validated.email,
            company: validated.company || null,
            phone: validated.phone || null,
            templateId: validated.templateSelected,
            templateName: validated.templateName,
            scope: validated.customizationScope,
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
      subject: `🎯 New Quote Request: ${validated.templateName} - ${validated.customizationScope}`,
      html: quoteEmailTemplate({
        name: validated.name,
        email: validated.email,
        company: validated.company,
        templateName: validated.templateName,
        scope: validated.customizationScope,
        requirements: validated.requirements,
      }),
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
