/**
 * Resend Email Helper
 * --------------------
 * Centralized email sending logic using Resend API.
 */

import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Brand sender names with display name for professional appearance
export const EMAIL_ADDRESSES = {
  contact: process.env.CONTACT_EMAIL || 'contact@jeffdev.studio',
  hire: process.env.HIRE_EMAIL || 'hire@jeffdev.studio',
  noreply: process.env.NOREPLY_EMAIL || 'noreply@jeffdev.studio',
} as const;

// Branded sender format for external emails
export const BRANDED_SENDER = `JD Studio <${EMAIL_ADDRESSES.noreply}>`;

// Base URL for assets in emails
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jeffdev.studio';
const LOGO_URL = `${BASE_URL}/favicon/icon1.png`;

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail({
  to,
  subject,
  html,
  from = EMAIL_ADDRESSES.noreply,
  replyTo,
  attachments,
}: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo,
      attachments,
    });

    if (error) {
      console.error('[RESEND ERROR]', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error('[EMAIL SEND ERROR]', error);
    throw error;
  }
}

/**
 * Email Templates
 */

export function contactEmailTemplate(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">New Contact Form Submission</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
    <div style="background: white; padding: 25px; border-radius: 6px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 18px; font-weight: 600;">Contact Information</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 100px; font-weight: 600; color: #666;">Name:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 100px; font-weight: 600; color: #666;">Email:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}" style="color: #667eea; text-decoration: none;">${data.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 100px; font-weight: 600; color: #666;">Subject:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.subject}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: white; padding: 25px; border-radius: 6px;">
      <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 600;">Message</h2>
      <p style="margin: 0; white-space: pre-wrap; color: #555;">${data.message}</p>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1565c0;">
        <strong>Quick Action:</strong> Reply directly to this email to respond to ${data.name}.
      </p>
    </div>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
    <p>JD Studio • Enterprise Web Solutions</p>
    <p>This is an automated notification from your contact form.</p>
  </div>
</body>
</html>
  `;
}

export function quoteEmailTemplate(data: {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  budget: string;
  timeline: string;
  details: string;
}) {
  const projectTypes: Record<string, string> = {
    web: 'Web Application',
    saas: 'SaaS Platform',
    mobile: 'Mobile App',
    ai: 'AI Integration',
    other: 'Other/Custom',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quote Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">🎯 New Quote Request</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
    <div style="background: white; padding: 25px; border-radius: 6px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 18px; font-weight: 600;">Client Information</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 120px; font-weight: 600; color: #666;">Name:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Email:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${data.email}" style="color: #f5576c; text-decoration: none;">${data.email}</a></td>
        </tr>
        ${
          data.company
            ? `<tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Company:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.company}</td>
        </tr>`
            : ''
        }
      </table>
    </div>
    
    <div style="background: white; padding: 25px; border-radius: 6px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 18px; font-weight: 600;">Project Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 120px; font-weight: 600; color: #666;">Type:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${
            projectTypes[data.projectType] || data.projectType
          }</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Budget:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.budget}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: 600; color: #666;">Timeline:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${data.timeline}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: white; padding: 25px; border-radius: 6px; margin-bottom: 20px;">
      <h2 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 600;">Project Description</h2>
      <p style="margin: 0; white-space: pre-wrap; color: #555;">${data.details}</p>
    </div>
    
    <div style="margin-top: 20px; padding: 15px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #e65100;">
        <strong>⏰ Action Required:</strong> Respond within 24 hours to maintain SLA.
      </p>
    </div>
  </div>
  
  <div style="margin-top: 20px; text-align: center; color: #888; font-size: 12px;">
    <p>JD Studio • Enterprise Web Solutions</p>
    <p>This is an automated notification from your quote form.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Invite Email Template
 * Sent when a team member is invited to join JD Studio
 */
export function inviteEmailTemplate(data: {
  email: string;
  role: string;
  inviteLink: string;
  inviterName?: string;
  projectName?: string;
  expiresAt: string;
}) {
  const roleColors: Record<string, string> = {
    admin: '#06b6d4',
    partner: '#10b981',
    employee: '#8b5cf6',
  };

  const roleColor = roleColors[data.role] || '#06b6d4';
  const expiresDate = new Date(data.expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join JD Studio</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e5e5e5; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a;">
  <div style="background: linear-gradient(135deg, ${roleColor}20 0%, #1a1a1a 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
    <img src="${LOGO_URL}" alt="JD Studio" style="width: 48px; height: 48px; margin-bottom: 20px; border-radius: 8px;" />
    <h1 style="margin: 0 0 10px 0; color: white; font-size: 28px; font-weight: 700;">You're Invited!</h1>
    <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 16px;">Join the JD Studio team</p>
  </div>
  
  <div style="background: #111111; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid rgba(255,255,255,0.1); border-top: none;">
    <p style="margin: 0 0 20px 0; font-size: 16px;">
      ${data.inviterName ? `<strong>${data.inviterName}</strong> has invited you` : 'You have been invited'} to join JD Studio as a <span style="color: ${roleColor}; font-weight: 600; text-transform: capitalize;">${data.role}</span>.
    </p>
    
    ${data.projectName ? `
    <div style="background: rgba(255,255,255,0.05); padding: 15px 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${roleColor};">
      <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.6);">You'll be working on:</p>
      <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600; color: white;">${data.projectName}</p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.inviteLink}" style="display: inline-block; background: ${roleColor}; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>
    
    <p style="margin: 30px 0 10px 0; font-size: 14px; color: rgba(255,255,255,0.5);">
      This invitation expires on <strong>${expiresDate}</strong>.
    </p>
    
    <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.4);">
      If you weren't expecting this email, you can safely ignore it.
    </p>
    
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
    
    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3); text-align: center;">
      <strong>JD Studio</strong> • Enterprise Web Solutions<br>
      <a href="https://jeffdev.studio" style="color: ${roleColor}; text-decoration: none;">jeffdev.studio</a>
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Invoice Email Template
 * Sent when an invoice is issued to a client
 */
export function invoiceEmailTemplate(data: {
  clientName: string;
  refNo: string;
  total: number;
  currency: 'USD' | 'PHP';
  dueDate: string;
  paymentLink: string;
  projectTitle?: string;
  items: { description: string; amount: number }[];
}) {
  const currencySymbol = data.currency === 'PHP' ? '₱' : '$';
  const formattedTotal = `${currencySymbol}${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formattedDueDate = new Date(data.dueDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const accentColor = '#06b6d4'; // cyan-500

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${data.refNo} from JD Studio</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e5e5e5; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a;">
  <div style="background: linear-gradient(135deg, ${accentColor}20 0%, #1a1a1a 100%); padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
    <img src="${LOGO_URL}" alt="JD Studio" style="width: 48px; height: 48px; margin-bottom: 20px; border-radius: 8px;" />
    <h1 style="margin: 0 0 10px 0; color: white; font-size: 28px; font-weight: 700;">Invoice</h1>
    <p style="margin: 0; color: ${accentColor}; font-family: monospace; font-size: 16px; letter-spacing: 1px;">${data.refNo}</p>
  </div>
  
  <div style="background: #111111; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid rgba(255,255,255,0.1); border-top: none;">
    <p style="margin: 0 0 20px 0; font-size: 16px;">
      Hi <strong>${data.clientName}</strong>,
    </p>
    
    <p style="margin: 0 0 25px 0; font-size: 15px; color: rgba(255,255,255,0.7);">
      Please find attached your invoice for ${data.projectTitle ? `<strong>${data.projectTitle}</strong>` : 'services rendered'}.
    </p>
    
    <!-- Invoice Summary Box -->
    <div style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <span style="color: rgba(255,255,255,0.5); font-size: 13px;">AMOUNT DUE</span>
      </div>
      <div style="font-size: 32px; font-weight: 700; color: ${accentColor}; margin-bottom: 15px;">
        ${formattedTotal}
      </div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.5);">
        Due by <strong style="color: white;">${formattedDueDate}</strong>
      </div>
    </div>
    
    <!-- Line Items Preview -->
    <div style="margin-bottom: 25px;">
      <p style="margin: 0 0 12px 0; font-size: 12px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px;">Services</p>
      ${data.items.slice(0, 3).map(item => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <span style="color: rgba(255,255,255,0.8); font-size: 14px;">${item.description}</span>
          <span style="color: rgba(255,255,255,0.6); font-size: 14px;">${currencySymbol}${item.amount.toLocaleString()}</span>
        </div>
      `).join('')}
      ${data.items.length > 3 ? `
        <p style="margin: 10px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.4);">
          + ${data.items.length - 3} more items (see PDF attachment)
        </p>
      ` : ''}
    </div>
    
    <!-- Pay Now Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.paymentLink}" style="display: inline-block; background: ${accentColor}; color: #000; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Pay Now
      </a>
    </div>
    
    <p style="margin: 20px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.4); text-align: center;">
      <strong>📎 PDF Invoice Attached</strong> — Save it for your records.
    </p>
    
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
    
    <!-- Payment Methods -->
    <div style="background: rgba(6,182,212,0.1); padding: 20px; border-radius: 8px; border-left: 4px solid ${accentColor};">
      <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: ${accentColor};">PAYMENT OPTIONS</p>
      <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.6);">
        <strong>Bank Transfer:</strong> Landbank • 1936-2091-96 • Jeff Edrick Martinez<br>
        <strong>GCash:</strong> +63 951 916 7103<br>
        <strong>PayPal:</strong> contact@jeffdev.studio
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 30px 0;">
    
    <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3); text-align: center;">
      <strong>JD Studio</strong> • Enterprise Web Solutions<br>
      DTI No: VLLP979818395984<br>
      <a href="https://jeffdev.studio" style="color: ${accentColor}; text-decoration: none;">jeffdev.studio</a>
    </p>
  </div>
</body>
</html>
  `;
}

