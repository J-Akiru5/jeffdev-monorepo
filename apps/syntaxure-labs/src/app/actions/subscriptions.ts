"use server";

/**
 * Subscription Server Actions
 * ---------------------------
 * Server-side operations for managing service subscriptions.
 * Note: Uses actual Supabase database schema with plan, billing_cycle, etc.
 */
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const SUBSCRIPTIONS_TABLE = "subscriptions";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "cancelled" | "paused";
  billing_cycle: "monthly" | "annual";
  amount: string;
  currency: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  payment_method_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Get all subscriptions with optional status filter
 */
export async function getSubscriptions(
  status?: SubscriptionRow["status"],
): Promise<SubscriptionRow[]> {
  try {
    const supabase = getAdminClient();

    let query = supabase
      .from(SUBSCRIPTIONS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as SubscriptionRow[];
  } catch (error) {
    console.error("Failed to get subscriptions:", error);
    return [];
  }
}

/**
 * Get a single subscription by ID
 */
export async function getSubscription(
  id: string,
): Promise<SubscriptionRow | null> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from(SUBSCRIPTIONS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return data as SubscriptionRow;
  } catch (error) {
    console.error("Failed to get subscription:", error);
    return null;
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(input: {
  user_id: string;
  plan: "free" | "pro" | "enterprise";
  billing_cycle: "monthly" | "annual";
  amount: string;
  currency?: string;
  start_date: Date;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Calculate next billing period based on cycle
    const startDate = new Date(input.start_date);
    const endDate = new Date(startDate);

    if (input.billing_cycle === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: result, error } = await supabase
      .from(SUBSCRIPTIONS_TABLE)
      .insert([
        {
          user_id: input.user_id,
          plan: input.plan,
          status: "active",
          billing_cycle: input.billing_cycle,
          amount: input.amount,
          currency: input.currency || "USD",
          current_period_start: startDate.toISOString().split("T")[0]!,
          current_period_end: endDate.toISOString().split("T")[0]!,
          cancel_at_period_end: false,
          cancelled_at: null,
          payment_method_id: null,
          metadata: input.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select("id");

    if (error) throw error;

    revalidatePath("/admin/subscriptions");
    return { success: true, id: result?.[0]?.id };
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return { success: false, error: "Failed to create subscription" };
  }
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  id: string,
  input: Partial<Omit<SubscriptionRow, "id" | "created_at">>,
): Promise<{ success: boolean; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;
    const updateData: Record<string, unknown> = {};

    // Only add fields that are actually being updated
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.plan !== undefined) {
      updateData.plan = input.plan;
    }
    if (input.billing_cycle !== undefined) {
      updateData.billing_cycle = input.billing_cycle;
    }
    if (input.amount !== undefined) {
      updateData.amount = input.amount;
    }
    if (input.currency !== undefined) {
      updateData.currency = input.currency;
    }
    if (input.current_period_end !== undefined) {
      updateData.current_period_end = input.current_period_end;
    }
    if (input.current_period_start !== undefined) {
      updateData.current_period_start = input.current_period_start;
    }
    if (input.cancel_at_period_end !== undefined) {
      updateData.cancel_at_period_end = input.cancel_at_period_end;
    }
    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    // Handle status changes
    if (input.status === "cancelled" && !input.cancelled_at) {
      updateData.cancelled_at = new Date().toISOString();
    } else if (input.cancelled_at !== undefined) {
      updateData.cancelled_at = input.cancelled_at;
    }

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from(SUBSCRIPTIONS_TABLE)
      .update(updateData)
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/subscriptions");
    return { success: true };
  } catch (error) {
    console.error("Failed to update subscription:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  return updateSubscription(id, {
    status: "cancelled",
    cancelled_at: new Date().toISOString(),
  });
}

/**
 * Pause a subscription
 */
export async function pauseSubscription(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  return updateSubscription(id, {
    status: "paused",
  });
}

/**
 * Resume a suspended subscription
 */
export async function resumeSubscription(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  return updateSubscription(id, { status: "active" });
}

/**
 * Get subscription stats
 * Calculates MRR (Monthly Recurring Revenue) based on active subscriptions
 */
export async function getSubscriptionStats(): Promise<{
  total: number;
  active: number;
  mrr: number;
}> {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from(SUBSCRIPTIONS_TABLE)
      .select("*");

    if (error) throw error;

    let total = 0;
    let active = 0;
    let mrr = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data || []).forEach((subscription: any) => {
      total++;

      if (subscription.status === "active") {
        active++;

        // Calculate MRR based on billing cycle
        const amount = parseFloat(subscription.amount);
        if (subscription.billing_cycle === "monthly") {
          mrr += amount;
        } else if (subscription.billing_cycle === "annual") {
          mrr += amount / 12;
        }
      }
    });

    return { total, active, mrr: Math.round(mrr * 100) / 100 };
  } catch (error) {
    console.error("Failed to get subscription stats:", error);
    return { total: 0, active: 0, mrr: 0 };
  }
}
