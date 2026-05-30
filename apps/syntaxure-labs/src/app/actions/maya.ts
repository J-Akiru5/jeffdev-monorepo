"use server";

/**
 * Maya Payment Server Actions
 *
 * Handles initiating Maya payments for product purchases.
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { createMayaCheckout, createMayaSubscription } from "@/lib/maya";
import { generateQuoteRef } from "@/lib/ref-generator";
import { revalidatePath } from "next/cache";

// =============================================================================
// SCHEMAS
// =============================================================================

const initiatePaymentSchema = z.object({
  templateId: z.string().uuid(),
  contractTermId: z.string().uuid(),
  clientEmail: z.string().email(),
  clientName: z.string().min(2),
  billingCycle: z.enum(["monthly", "annual"]),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

// =============================================================================
// ACTIONS
// =============================================================================

/**
 * Initiate Maya payment for a product purchase
 * Returns the payment URL to redirect the user to
 */
export async function initiateMayaPayment(
  input: InitiatePaymentInput
): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  try {
    const validated = initiatePaymentSchema.parse(input);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    // Fetch template and contract term
    const { data: template, error: templateError } = await supabase
      .from("product_templates")
      .select("*")
      .eq("id", validated.templateId)
      .single();

    if (templateError || !template) {
      return { success: false, error: "Product template not found" };
    }

    const { data: term, error: termError } = await supabase
      .from("contract_terms")
      .select("*")
      .eq("id", validated.contractTermId)
      .single();

    if (termError || !term) {
      return { success: false, error: "Contract term not found" };
    }

    // Generate reference number
    const refNo = generateQuoteRef();

    // Create client contract record
    const { data: contract, error: contractError } = await supabase
      .from("client_contracts")
      .insert({
        template_id: validated.templateId,
        contract_term_id: validated.contractTermId,
        client_email: validated.clientEmail,
        client_name: validated.clientName,
        status: "pending",
        billing_cycle: validated.billingCycle,
        amount: term.price_php,
        currency: "PHP",
        metadata: { referenceNo: refNo },
      })
      .select("id")
      .single();

    if (contractError || !contract) {
      return { success: false, error: "Failed to create contract record" };
    }

    let paymentUrl: string;

    if (validated.billingCycle === "monthly") {
      // Monthly: Use Maya Subscriptions API
      const subscription = await createMayaSubscription({
        amount: term.price_php,
        currency: "PHP",
        description: `${template.name} - 3 Year Contract`,
        referenceNo: refNo,
        customerEmail: validated.clientEmail,
        customerName: validated.clientName,
        interval: "monthly",
        intervalCount: 1,
        metadata: {
          contractId: contract.id,
          templateSlug: template.slug,
        },
      });

      paymentUrl = subscription.approvalUrl || "";

      // Update contract with subscription ID
      await supabase
        .from("client_contracts")
        .update({ maya_subscription_id: subscription.subscriptionId })
        .eq("id", contract.id);
    } else {
      // Annual: Use Maya Checkout API (one-time payment)
      const checkout = await createMayaCheckout({
        amount: term.price_php,
        currency: "PHP",
        description: `${template.name} - 3 Year Contract (Annual)`,
        referenceNo: refNo,
        metadata: {
          contractId: contract.id,
          templateSlug: template.slug,
          buyerEmail: validated.clientEmail,
          buyerName: validated.clientName,
        },
      });

      paymentUrl = checkout.paymentUrl;

      // Update contract with checkout ID
      await supabase
        .from("client_contracts")
        .update({ maya_checkout_id: checkout.checkoutId })
        .eq("id", contract.id);
    }

    revalidatePath("/products");
    revalidatePath("/admin/products");

    return { success: true, paymentUrl };
  } catch (error) {
    console.error("[MAYA PAYMENT ERROR]", error);

    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initiate payment",
    };
  }
}

/**
 * Get payment status for a contract
 */
export async function getPaymentStatus(
  contractId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getAdminClient() as any;

    const { data: contract, error } = await supabase
      .from("client_contracts")
      .select("status, maya_subscription_id, maya_checkout_id")
      .eq("id", contractId)
      .single();

    if (error || !contract) {
      return { success: false, error: "Contract not found" };
    }

    return { success: true, status: contract.status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get status",
    };
  }
}
