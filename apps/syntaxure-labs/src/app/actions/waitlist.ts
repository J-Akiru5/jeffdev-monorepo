"use server";

/**
 * Waitlist Server Actions
 * -----------------------
 * Prism (/prism) waitlist capture:
 * 1. Validates the email (Zod)
 * 2. Records the signup in `waitlist_entries` (unique email — repeats are a
 *    success for the visitor and never re-send emails)
 * 3. Best-effort emails: confirmation to the visitor + notification to the team
 *
 * Email failures never fail the signup — the lead is captured first.
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { EMAIL_ADDRESSES, sendEmail } from "@/lib/email";
import {
  prismWaitlistConfirmation,
  prismWaitlistNotification,
} from "@/lib/emails/prism-emails";

const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Enter a valid email address")
    .max(254, "Enter a valid email address")
    .email("Enter a valid email address")
    .transform((value) => value.toLowerCase()),
  source: z.string().trim().max(64).optional(),
});

export interface JoinWaitlistResult {
  success: boolean;
  message: string;
  error?: string;
  /** True when the email was already on the list. */
  duplicate?: boolean;
}

export async function joinWaitlist(
  data: string | { email: string; source?: string },
): Promise<JoinWaitlistResult> {
  const parsed = waitlistSchema.safeParse(
    typeof data === "string" ? { email: data } : data,
  );
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address",
      message: "Enter a valid email address",
    };
  }

  const { email, source } = parsed.data;

  try {
    const supabase = getAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("waitlist_entries")
      .insert({ email, status: "pending" });

    if (error) {
      if (error.code === "23505") {
        // Already on the list — same outcome for the visitor, no re-send.
        return {
          success: true,
          duplicate: true,
          message: "You're already on the list. We'll signal you.",
        };
      }
      throw error;
    }

    // Best-effort emails (never fail the capture)
    try {
      await sendEmail({
        to: email,
        subject: "Transmission received — Prism Context Engine",
        html: prismWaitlistConfirmation,
        replyTo: EMAIL_ADDRESSES.contact,
      });
    } catch (error) {
      console.error("[WAITLIST] confirmation email failed", error);
    }

    try {
      await sendEmail({
        to: EMAIL_ADDRESSES.contact,
        subject: `New Prism waitlist signup: ${email}`,
        html: prismWaitlistNotification({ email, source: source || "prism" }),
      });
    } catch (error) {
      console.error("[WAITLIST] notification email failed", error);
    }

    return {
      success: true,
      message: "Transmission received. We will signal you.",
    };
  } catch (error) {
    console.error("[WAITLIST] signup failed", error);
    return {
      success: false,
      error: "Couldn't save your spot — please try again in a moment.",
      message: "Failed to join waitlist",
    };
  }
}
