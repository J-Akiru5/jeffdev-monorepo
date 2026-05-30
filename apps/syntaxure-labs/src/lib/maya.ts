/**
 * Maya (PayMaya) Payment Gateway Client
 *
 * Handles Maya Checkout (one-time) and Subscriptions (recurring) APIs.
 * Uses Basic Auth with MAYA_PUBLIC_KEY as username and empty password.
 */

import crypto from "crypto";

// =============================================================================
// TYPES
// =============================================================================

export interface MayaConfig {
  publicKey: string;
  secretKey: string;
  mode: "sandbox" | "production";
}

export interface MayaCheckoutRequest {
  amount: number;
  currency: string;
  description: string;
  referenceNo: string;
  metadata?: Record<string, string>;
  redirectUrl?: {
    success: string;
    cancel: string;
    failure: string;
  };
}

export interface MayaCheckoutResponse {
  checkoutId: string;
  paymentUrl: string;
  status: string;
}

export interface MayaSubscriptionRequest {
  amount: number;
  currency: string;
  description: string;
  referenceNo: string;
  customerEmail: string;
  customerName: string;
  interval: "monthly" | "annual";
  intervalCount: number;
  startDate?: string;
  metadata?: Record<string, string>;
}

export interface MayaSubscriptionResponse {
  subscriptionId: string;
  status: string;
  approvalUrl?: string;
}

export interface MayaWebhookPayload {
  resource: {
    id: string;
    type: string;
    status: string;
    referenceNo: string;
    amount: {
      value: number;
      currency: string;
    };
    metadata?: Record<string, string>;
  };
  eventType: string;
}

// =============================================================================
// CLIENT
// =============================================================================

const BASE_URLS = {
  sandbox: "https://testapi.maya.ph",
  production: "https://api.maya.ph",
};

function getBaseUrl(mode: "sandbox" | "production"): string {
  return BASE_URLS[mode];
}

function getAuthHeader(publicKey: string): string {
  // Maya uses Basic Auth: publicKey as username, empty password
  return `Basic ${Buffer.from(`${publicKey}:`).toString("base64")}`;
}

function getConfig(): MayaConfig {
  const publicKey = process.env.MAYA_PUBLIC_KEY;
  const secretKey = process.env.MAYA_SECRET_KEY;
  const mode = (process.env.MAYA_MODE as "sandbox" | "production") || "sandbox";

  if (!publicKey || !secretKey) {
    throw new Error("MAYA_PUBLIC_KEY and MAYA_SECRET_KEY must be set");
  }

  return { publicKey, secretKey, mode };
}

// =============================================================================
// CHECKOUT API (One-time payments)
// =============================================================================

/**
 * Create a Maya Checkout session for one-time payments (annual prepay)
 */
export async function createMayaCheckout(
  request: MayaCheckoutRequest
): Promise<MayaCheckoutResponse> {
  const config = getConfig();
  const baseUrl = getBaseUrl(config.mode);

  const body = {
    totalAmount: {
      value: request.amount,
      currency: request.currency,
    },
    buyer: {
      firstName: request.metadata?.buyerName || "Customer",
      email: request.metadata?.buyerEmail || "",
    },
    items: [
      {
        name: request.description,
        quantity: 1,
        totalAmount: {
          value: request.amount,
          currency: request.currency,
        },
      },
    ],
    requestReferenceNumber: request.referenceNo,
    metadata: request.metadata || {},
    redirectUrl: request.redirectUrl || {
      success: `${process.env.NEXT_PUBLIC_SYNTAXURE_URL || "https://syntaxure.dev"}/pay/maya/success?ref=${request.referenceNo}`,
      cancel: `${process.env.NEXT_PUBLIC_SYNTAXURE_URL || "https://syntaxure.dev"}/pay/maya/cancel?ref=${request.referenceNo}`,
      failure: `${process.env.NEXT_PUBLIC_SYNTAXURE_URL || "https://syntaxure.dev"}/pay/maya/cancel?ref=${request.referenceNo}`,
    },
  };

  const response = await fetch(`${baseUrl}/v1/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": getAuthHeader(config.publicKey),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create Maya checkout");
  }

  return {
    checkoutId: data.checkoutId,
    paymentUrl: data.redirectUrl,
    status: data.status,
  };
}

/**
 * Get Maya Checkout status
 */
export async function getMayaCheckoutStatus(
  checkoutId: string
): Promise<{ status: string; amount: number; currency: string }> {
  const config = getConfig();
  const baseUrl = getBaseUrl(config.mode);

  const response = await fetch(`${baseUrl}/v1/checkout/${checkoutId}`, {
    headers: {
      "Authorization": getAuthHeader(config.publicKey),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get checkout status");
  }

  return {
    status: data.status,
    amount: data.totalAmount?.value || 0,
    currency: data.totalAmount?.currency || "PHP",
  };
}

// =============================================================================
// SUBSCRIPTIONS API (Recurring payments)
// =============================================================================

/**
 * Create a Maya Subscription for recurring monthly payments
 */
export async function createMayaSubscription(
  request: MayaSubscriptionRequest
): Promise<MayaSubscriptionResponse> {
  const config = getConfig();
  const baseUrl = getBaseUrl(config.mode);

  const body = {
    name: request.description,
    description: request.description,
    amount: request.amount,
    currency: request.currency,
    interval: request.interval,
    intervalCount: request.intervalCount,
    startDate: request.startDate || new Date().toISOString(),
    requestReferenceNumber: request.referenceNo,
    metadata: request.metadata || {},
    buyer: {
      firstName: request.customerName,
      email: request.customerEmail,
    },
    successRedirectUrl: `${process.env.NEXT_PUBLIC_SYNTAXURE_URL || "https://syntaxure.dev"}/pay/maya/success?ref=${request.referenceNo}`,
    cancelRedirectUrl: `${process.env.NEXT_PUBLIC_SYNTAXURE_URL || "https://syntaxure.dev"}/pay/maya/cancel?ref=${request.referenceNo}`,
  };

  const response = await fetch(`${baseUrl}/v1/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": getAuthHeader(config.publicKey),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create Maya subscription");
  }

  return {
    subscriptionId: data.subscriptionId,
    status: data.status,
    approvalUrl: data.redirectUrl,
  };
}

/**
 * Get Maya Subscription status
 */
export async function getMayaSubscriptionStatus(
  subscriptionId: string
): Promise<{ status: string; amount: number; currency: string }> {
  const config = getConfig();
  const baseUrl = getBaseUrl(config.mode);

  const response = await fetch(`${baseUrl}/v1/subscriptions/${subscriptionId}`, {
    headers: {
      "Authorization": getAuthHeader(config.publicKey),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get subscription status");
  }

  return {
    status: data.status,
    amount: data.amount || 0,
    currency: data.currency || "PHP",
  };
}

/**
 * Cancel a Maya Subscription
 */
export async function cancelMayaSubscription(
  subscriptionId: string
): Promise<{ success: boolean }> {
  const config = getConfig();
  const baseUrl = getBaseUrl(config.mode);

  const response = await fetch(`${baseUrl}/v1/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    headers: {
      "Authorization": getAuthHeader(config.publicKey),
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to cancel subscription");
  }

  return { success: true };
}

// =============================================================================
// WEBHOOK VERIFICATION
// =============================================================================

/**
 * Verify Maya webhook signature using HMAC-SHA256
 */
export function verifyMayaWebhook(
  payload: string,
  signature: string
): boolean {
  const webhookSecret = process.env.MAYA_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("MAYA_WEBHOOK_SECRET not set, skipping verification");
    return true;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}

/**
 * Parse Maya webhook payload
 */
export function parseMayaWebhook(payload: string): MayaWebhookPayload {
  return JSON.parse(payload);
}
