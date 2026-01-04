import { Resend } from "resend";

/**
 * Resend Email Client
 * Used for sending transactional emails (inquiry responses, notifications)
 */

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Send an email via Resend
 */
export async function sendEmail(options: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@prism.jeffdev.io",
      ...options,
    });

    if (error) {
      console.error("[Resend] Error sending email:", error);
      return { success: false, error: error.message };
    }

    console.log("[Resend] Email sent:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("[Resend] Exception:", error);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * Send inquiry response email
 */
export async function sendInquiryResponse({
  to,
  subject,
  message,
  originalInquiry,
}: {
  to: string;
  subject: string;
  message: string;
  originalInquiry?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #050505; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; padding: 12px 16px; background: linear-gradient(135deg, #f59e0b20, #fb923c10); border: 1px solid #f59e0b30; border-radius: 8px;">
              <span style="font-size: 18px; font-weight: 600; color: #ffffff;">JeffDev Studio</span>
            </div>
          </div>
          
          <!-- Content -->
          <div style="background: #0a0a0a; border: 1px solid #ffffff10; border-radius: 12px; padding: 32px;">
            <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 24px 0;">Re: ${subject}</h1>
            <div style="color: #ffffffcc; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
          </div>
          
          ${originalInquiry ? `
          <!-- Original Message -->
          <div style="margin-top: 24px; padding: 16px; background: #ffffff05; border-radius: 8px; border-left: 2px solid #f59e0b;">
            <p style="color: #ffffff60; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Your original message:</p>
            <p style="color: #ffffff80; font-size: 13px; margin: 0; white-space: pre-wrap;">${originalInquiry}</p>
          </div>
          ` : ""}
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #ffffff10; text-align: center;">
            <p style="color: #ffffff40; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} JeffDev Studio. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Re: ${subject}`,
    html,
    text: message,
    replyTo: process.env.ADMIN_EMAIL || "admin@jeffdev.io",
    tags: [{ name: "type", value: "inquiry-response" }],
  });
}

/**
 * Send notification email to admin
 */
export async function sendAdminNotification({
  subject,
  message,
  type = "info",
}: {
  subject: string;
  message: string;
  type?: "info" | "warning" | "error";
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[Resend] No admin email configured");
    return { success: false, error: "No admin email configured" };
  }

  const typeColors = {
    info: "#06b6d4",
    warning: "#f59e0b",
    error: "#ef4444",
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 20px; background-color: #050505; font-family: monospace;">
        <div style="max-width: 500px; margin: 0 auto; padding: 24px; background: #0a0a0a; border: 1px solid ${typeColors[type]}30; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <span style="display: inline-block; width: 8px; height: 8px; background: ${typeColors[type]}; border-radius: 50%;"></span>
            <span style="color: ${typeColors[type]}; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">${type}</span>
          </div>
          <h2 style="color: #ffffff; font-size: 16px; margin: 0 0 12px 0;">${subject}</h2>
          <p style="color: #ffffff80; font-size: 14px; line-height: 1.5; margin: 0; white-space: pre-wrap;">${message}</p>
          <p style="color: #ffffff30; font-size: 10px; margin: 16px 0 0 0;">
            ${new Date().toISOString()}
          </p>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[Prism Admin] ${subject}`,
    html,
    text: message,
    tags: [
      { name: "type", value: "admin-notification" },
      { name: "level", value: type },
    ],
  });
}
