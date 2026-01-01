'use server';

/**
 * PayPal Server Actions
 * ----------------------
 * PayPal Checkout integration for invoice payments.
 */

import { z } from 'zod';
import { db } from '@/lib/firebase/admin';
import { recordPayment } from './invoice';
import type { Invoice } from '@/types/invoice';

// PayPal API URLs
const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal access token
 */
async function getPayPalAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('[PAYPAL] Missing credentials');
      return null;
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('[PAYPAL ACCESS TOKEN ERROR]', error);
    return null;
  }
}

/**
 * Create PayPal order for invoice payment
 */
export async function createPayPalOrder(invoiceRefNo: string, amount?: number) {
  try {
    // Get invoice
    const snapshot = await db
      .collection('invoices')
      .where('refNo', '==', invoiceRefNo)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, error: 'Invoice not found' };
    }

    const invoice = snapshot.docs[0].data() as Invoice;
    const paymentAmount = amount || invoice.balanceDue;

    if (paymentAmount <= 0) {
      return { success: false, error: 'Invalid payment amount' };
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      return { success: false, error: 'PayPal authentication failed' };
    }

    // Create order
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: invoice.refNo,
            description: `Invoice ${invoice.refNo} - ${invoice.clientName}`,
            amount: {
              currency_code: invoice.currency,
              value: paymentAmount.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'JD Studio',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pay/${invoice.refNo}/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pay/${invoice.refNo}`,
        },
      }),
    });

    const order = await response.json();

    if (order.id) {
      return {
        success: true,
        orderId: order.id,
        approvalUrl: order.links?.find((l: { rel: string }) => l.rel === 'approve')?.href,
      };
    }

    console.error('[PAYPAL CREATE ORDER ERROR]', order);
    return { success: false, error: 'Failed to create PayPal order' };
  } catch (error) {
    console.error('[PAYPAL CREATE ORDER ERROR]', error);
    return { success: false, error: 'Failed to create PayPal order' };
  }
}

/**
 * Capture PayPal order after approval
 */
export async function capturePayPalOrder(orderId: string, invoiceRefNo: string) {
  try {
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      return { success: false, error: 'PayPal authentication failed' };
    }

    // Capture the order
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const capture = await response.json();

    if (capture.status === 'COMPLETED') {
      // Get the captured amount
      const capturedAmount = parseFloat(
        capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0'
      );
      const transactionId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      // Get invoice ID
      const snapshot = await db
        .collection('invoices')
        .where('refNo', '==', invoiceRefNo)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return { success: false, error: 'Invoice not found' };
      }

      // Record the payment
      const result = await recordPayment(snapshot.docs[0].id, {
        amount: capturedAmount,
        method: 'paypal',
        transactionId,
      });

      if (result.success) {
        return {
          success: true,
          transactionId,
          amount: capturedAmount,
        };
      }

      return { success: false, error: 'Failed to record payment' };
    }

    console.error('[PAYPAL CAPTURE ERROR]', capture);
    return { success: false, error: 'Payment capture failed' };
  } catch (error) {
    console.error('[PAYPAL CAPTURE ERROR]', error);
    return { success: false, error: 'Failed to capture payment' };
  }
}

/**
 * Verify PayPal webhook (for future use)
 */
export async function verifyPayPalWebhook(
  webhookId: string,
  headers: Record<string, string>,
  body: string
) {
  try {
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      return { success: false, error: 'PayPal authentication failed' };
    }

    const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        webhook_id: webhookId,
        transmission_id: headers['paypal-transmission-id'],
        transmission_time: headers['paypal-transmission-time'],
        cert_url: headers['paypal-cert-url'],
        auth_algo: headers['paypal-auth-algo'],
        transmission_sig: headers['paypal-transmission-sig'],
        webhook_event: JSON.parse(body),
      }),
    });

    const result = await response.json();
    return {
      success: true,
      verified: result.verification_status === 'SUCCESS',
    };
  } catch (error) {
    console.error('[PAYPAL WEBHOOK VERIFY ERROR]', error);
    return { success: false, error: 'Webhook verification failed' };
  }
}
