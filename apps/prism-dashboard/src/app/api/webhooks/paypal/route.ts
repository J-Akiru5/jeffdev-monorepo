/**
 * PayPal Webhook Handler
 * 
 * POST /api/webhooks/paypal
 * Handles PayPal subscription events
 */

import { NextRequest, NextResponse } from 'next/server';

// PayPal webhook event types we care about
type PayPalEvent = {
  event_type: string;
  resource: {
    id: string;
    status: string;
    custom_id?: string; // userId
    plan_id?: string;
    billing_info?: {
      next_billing_time: string;
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const body: PayPalEvent = await request.json();
    
    // TODO: Verify webhook signature
    // const isValid = await verifyPayPalWebhook(request, body);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }
    
    const { event_type, resource } = body;
    const userId = resource.custom_id;
    
    if (!userId) {
      console.error('No userId in webhook payload');
      return NextResponse.json({ received: true });
    }
    
    console.log(`PayPal webhook: ${event_type} for user ${userId}`);
    
    switch (event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(userId, resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(userId, resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(userId, resource);
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(userId, resource);
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(userId, resource);
        break;
        
      default:
        console.log(`Unhandled event type: ${event_type}`);
    }
    
    return NextResponse.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionActivated(
  userId: string,
  resource: PayPalEvent['resource']
) {
  const tier = getTierFromPlanId(resource.plan_id);
  const nextBilling = resource.billing_info?.next_billing_time;
  
  // TODO: Save to database
  console.log(`Activating ${tier} subscription for ${userId}`);
  console.log(`Next billing: ${nextBilling}`);
  
  // await db.subscriptions.upsert({
  //   userId,
  //   tier,
  //   status: 'active',
  //   paypalSubscriptionId: resource.id,
  //   currentPeriodEnd: new Date(nextBilling),
  // });
}

async function handleSubscriptionCancelled(
  userId: string,
  resource: PayPalEvent['resource']
) {
  console.log(`Cancelling subscription for ${userId}`);
  
  // await db.subscriptions.update({
  //   userId,
  //   status: 'cancelled',
  // });
}

async function handleSubscriptionSuspended(
  userId: string,
  resource: PayPalEvent['resource']
) {
  console.log(`Suspending subscription for ${userId}`);
  
  // await db.subscriptions.update({
  //   userId,
  //   status: 'past_due',
  // });
}

async function handlePaymentCompleted(
  userId: string,
  resource: PayPalEvent['resource']
) {
  console.log(`Payment completed for ${userId}`);
  
  // Reset usage counters for new billing period
  // await db.usage.reset({ userId });
}

async function handlePaymentFailed(
  userId: string,
  resource: PayPalEvent['resource']
) {
  console.log(`Payment failed for ${userId}`);
  
  // await db.subscriptions.update({
  //   userId,
  //   status: 'past_due',
  // });
  
  // TODO: Send email notification
}

function getTierFromPlanId(planId?: string): 'pro' | 'team' | 'enterprise' {
  if (!planId) return 'pro';
  
  // Match against env plan IDs
  if (planId === process.env.PAYPAL_PLAN_TEAM_MONTHLY || 
      planId === process.env.PAYPAL_PLAN_TEAM_ANNUAL) {
    return 'team';
  }
  
  return 'pro';
}
