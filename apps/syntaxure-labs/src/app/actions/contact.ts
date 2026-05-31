/**
 * Contact Form Server Action
 * ---------------------------
 * Handles contact form submissions:
 * 1. Validates input with Zod
 * 2. Rate limits (1 submission per email per 5 minutes)
 * 3. Saves to Supabase
 * 4. Sends email notification to contact@syntaxure.dev
 */

"use server";

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail, contactEmailTemplate, EMAIL_ADDRESSES } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// Simple in-memory rate limiter: 1 submission per email per 5 minutes
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const lastSubmission = rateLimitMap.get(email);
  if (lastSubmission && now - lastSubmission < RATE_LIMIT_MS) {
    return true;
  }
  rateLimitMap.set(email, now);
  return false;
}

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > RATE_LIMIT_MS * 2) {
      rateLimitMap.delete(email);
    }
  }
}, 10 * 60 * 1000);

export async function submitContactForm(data: ContactFormData) {
  try {
    // Validate input
    const validated = contactSchema.parse(data);

    // Rate limit check
    if (isRateLimited(validated.email)) {
      return {
        success: false,
        message: "Too many submissions. Please wait 5 minutes before trying again.",
      };
    }

    // Save to Supabase
    const supabase = getAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error } = await (supabase as any)
      .from("messages")
      .insert({
        ...validated,
        status: "new",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Send email notification
    await sendEmail({
      to: EMAIL_ADDRESSES.contact,
      subject: `New Contact: ${validated.subject}`,
      html: contactEmailTemplate(validated),
      replyTo: validated.email,
    });

    return {
      success: true,
      message:
        "Message sent successfully! We'll get back to you within 24 hours.",
      id: result?.id,
    };
  } catch (error) {
    console.error("[CONTACT FORM ERROR]", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Validation error",
        errors: error.issues,
      };
    }

    return {
      success: false,
      message: "Failed to send message. Please try again or email us directly.",
    };
  }
}

/**
 * Update message status (admin action)
 */
export async function updateMessageStatus(
  messageId: string,
  status: "new" | "read" | "responded",
) {
  try {
    const { logAuditEvent } = await import("@/lib/audit");

    const supabase = getAdminClient();

    // Get current message for audit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current, error: fetchError } = await (supabase as any)
      .from("messages")
      .select("status")
      .eq("id", messageId)
      .single();

    if (fetchError || !current) {
      return { success: false, error: "Message not found" };
    }

    const oldStatus = current.status;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("messages")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) throw error;

    await logAuditEvent({
      action: "STATUS_CHANGE",
      resource: "messages",
      resourceId: messageId,
      details: { oldStatus, newStatus: status },
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath("/admin/messages");

    return { success: true };
  } catch (error) {
    console.error("[UPDATE MESSAGE STATUS ERROR]", error);
    return { success: false, error: "Failed to update status" };
  }
}
