/**
 * Subscription Types
 * ------------------
 * Type definitions for recurring service subscriptions.
 */

import { Timestamp } from 'firebase/firestore';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionTier = 'starter' | 'pro' | 'enterprise';

export interface Subscription {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  startDate: Timestamp;
  nextBillingDate: Timestamp;
  cancelledAt?: Timestamp;
  pausedAt?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SubscriptionCreateInput {
  clientId: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  amount: number;
  currency?: string;
  startDate: Date;
  notes?: string;
}

export interface SubscriptionUpdateInput {
  status?: SubscriptionStatus;
  tier?: SubscriptionTier;
  billingCycle?: BillingCycle;
  amount?: number;
  notes?: string;
  nextBillingDate?: Date;
}

// Status badge styling
export const statusBadgeStyles: Record<SubscriptionStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  expired: 'bg-white/5 text-white/40 border-white/10',
};

// Billing cycle labels
export const billingCycleLabels: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};
