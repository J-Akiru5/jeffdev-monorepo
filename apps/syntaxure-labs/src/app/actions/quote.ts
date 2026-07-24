/**
 * Quote Form Server Action
 * -------------------------
 * Handles quote form submissions for custom development projects:
 * 1. Validates with Zod
 * 2. Saves to Supabase
 * 3. Sends email notification to hire@syntaxure.dev
 */
"use server";

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail, quoteEmailTemplate, EMAIL_ADDRESSES } from "@/lib/email";
import { generateQuoteRef } from "@/lib/ref-generator";

const quoteSchema = z.object({
  // Project type
  projectType: z.string().min(1, "Please select a project type"),
  projectTypeLabel: z.string().min(1, "Project type label is required"),

  // Scope
  projectScope: z.enum(["template", "redesign", "features", "full"], {
    message: "Please select a project scope",
  }),

  // Budget (optional)
  budgetRange: z.string().optional(),

  // Timeline
  timeline: z.string().optional(),

  // Contact
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  phone: z.string().optional(),
  requirements: z
    .string()
    .min(20, "Please provide at least 20 characters of detail"),
});

export type QuoteFormData = z.infer<typeof quoteSchema>;

const scopeLabels: Record<string, string> = {
  template: "MVP / Initial Launch",
  redesign: "Redesign / Revamp",
  features: "Add New Features",
  full: "100% Custom Build",
};

const budgetLabels: Record<string, string> = {
  "50-100k": "₱50K - ₱100K",
  "100-250k": "₱100K - ₱250K",
  "250-500k": "₱250K - ₱500K",
  "500k-plus": "₱500K+",
  "not-sure": "Not sure yet",
};

const timelineLabels: Record<string, string> = {
  asap: "ASAP (1-2 weeks)",
  "1-3months": "1-3 months",
  "3-6months": "3-6 months",
  flexible: "Flexible",
};

export async function submitQuoteForm(data: QuoteFormData) {
  try {
    // Validate input
    const validated = quoteSchema.parse(data);

    // Generate unique reference number
    const refNo = generateQuoteRef();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // Build title and project summary
    const title = `${validated.name} - ${validated.projectTypeLabel}`;
    const scopeLabel = scopeLabels[validated.projectScope] || validated.projectScope;
    const budgetLabel = validated.budgetRange
      ? budgetLabels[validated.budgetRange] || validated.budgetRange
      : "Not specified";
    const timelineLabel = validated.timeline
      ? timelineLabels[validated.timeline] || validated.timeline
      : "Not specified";

    // Save to Supabase (store new fields in metadata JSON column)
    const { data: result, error } = await supabase
      .from("quotes")
      .insert([
        {
          user_id: null,
          project_id: null,
          title,
          description: validated.requirements,
          amount: 0,
          status: "draft",
          valid_until: null,
          line_items: [],
          quote_type: "custom",
          metadata: {
            refNo,
            name: validated.name,
            email: validated.email,
            company: validated.company || null,
            phone: validated.phone || null,
            projectType: validated.projectType,
            projectTypeLabel: validated.projectTypeLabel,
            projectScope: validated.projectScope,
            scopeLabel,
            budgetRange: validated.budgetRange || null,
            budgetLabel,
            timeline: validated.timeline || null,
            timelineLabel,
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
      subject: `🎯 New Quote Request: ${validated.projectTypeLabel} - ${scopeLabel}`,
      html: quoteEmailTemplate({
        name: validated.name,
        email: validated.email,
        company: validated.company,
        projectType: validated.projectTypeLabel,
        projectScope: scopeLabel,
        budgetRange: budgetLabel,
        timeline: timelineLabel,
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
