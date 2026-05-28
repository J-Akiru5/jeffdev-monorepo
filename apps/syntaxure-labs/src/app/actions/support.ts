"use server";

/**
 * Support Server Actions
 * ----------------------
 * Handles support requests and sends them to support email via Resend.
 */
import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { sendEmail, BRANDED_SENDER } from "@/lib/email";

const supportSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
});

interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Send a support request email
 */
export async function sendSupportRequest(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      subject: formData.get("subject") as string,
      message: formData.get("message") as string,
    };

    // Validate input
    const validated = supportSchema.parse(data);

    // Support email address
    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@syntaxure.dev";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // Create support ticket in database
    const { error: ticketError } = await supabase
      .from("support_tickets")
      .insert([
        {
          user_id: null,
          title: validated.subject,
          description: validated.message,
          priority: "medium" as const,
          status: "open" as const,
          assigned_to: null,
          tags: ["web_form"],
          metadata: {
            email: validated.email,
            name: validated.name,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (ticketError) {
      console.error("[SUPPORT TICKET CREATE ERROR]", ticketError);
      // Don't fail - still send email even if ticket creation fails
    }

    // Send email to support
    await sendEmail({
      to: SUPPORT_EMAIL,
      from: BRANDED_SENDER,
      subject: `Support Request: ${validated.subject}`,
      replyTo: validated.email,
      html: supportEmailTemplate(validated),
    });

    // Also send confirmation to user
    await sendEmail({
      to: validated.email,
      from: BRANDED_SENDER,
      subject: "We received your support request - Syntaxure Labs",
      html: supportConfirmationTemplate(validated),
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]!.message };
    }
    console.error("[SUPPORT REQUEST ERROR]", error);
    return {
      success: false,
      error: "Failed to send support request. Please try again.",
    };
  }
}

/**
 * Support email template (sent to support team)
 */
function supportEmailTemplate(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const dataName = data.name;
  const dataEmail = data.email;
  const dataSubject = data.subject;
  const dataMessage = data.message;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #e5e5e5;">
  <div style="background: linear-gradient(135deg, #06b6d420 0%, #1a1a1a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">New Support Request</h1>
  </div>

  <div style="background: #111111; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid rgba(255,255,255,0.1); border-top: none;">
    <div style="background: rgba(255,255,255,0.05); padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 5px 0; font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">From</p>
      <p style="margin: 0; font-size: 16px; color: white;">${dataName}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px; color: #06b6d4;">${dataEmail}</p>
    </div>

    <div style="background: rgba(255,255,255,0.05); padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 0 0 5px 0; font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Subject</p>
      <p style="margin: 0; font-size: 16px; color: white;">${dataSubject}</p>
    </div>

    <div style="background: rgba(255,255,255,0.05); padding: 15px 20px; border-radius: 8px;">
      <p style="margin: 0 0 10px 0; font-size: 12px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
      <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); white-space: pre-wrap;">${dataMessage}</p>
    </div>

    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;">

    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3); text-align: center;">
      Reply directly to this email to respond to the user.
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Confirmation email template (sent to user)
 */
function supportConfirmationTemplate(data: { name: string; subject: string }) {
  const dataName = data.name;
  const dataSubject = data.subject;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #e5e5e5;">
  <div style="background: linear-gradient(135deg, #10b98120 0%, #1a1a1a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Request Received</h1>
    <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.7);">We will get back to you soon</p>
  </div>

  <div style="background: #111111; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid rgba(255,255,255,0.1); border-top: none;">
    <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${dataName},</p>

    <p style="margin: 0 0 20px 0; font-size: 14px; color: rgba(255,255,255,0.7);">
      Thank you for reaching out. We have received your support request regarding:
    </p>

    <div style="background: rgba(255,255,255,0.05); padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
      <p style="margin: 0; font-size: 16px; color: white; font-weight: 500;">${dataSubject}</p>
    </div>

    <p style="margin: 0 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.7);">
      Our team typically responds within 24-48 hours. If this is urgent, please reply directly to this email.
    </p>

    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;">

    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3); text-align: center;">
      <strong>Syntaxure Labs</strong> • Enterprise Web Solutions<br>
      <a href="https://www.syntaxure.dev" style="color: #10b981; text-decoration: none;">syntaxure.dev</a>
    </p>
  </div>
</body>
</html>
  `;
}
