"use server";

/**
 * Agency Settings Server Actions
 * --------------------------------
 * Read/update agency settings from `site_settings` or `user_profiles`.
 */

import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

interface ActionResult {
  success: boolean;
  error?: string;
}

export interface AgencySettings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  businessDescription: string;
  primaryColor: string;
  logoUrl: string;
  invoicePrefix: string;
  taxRate: string;
}

/**
 * Load agency settings from `site_settings` table (key-value store).
 */
export async function getAgencySettings(): Promise<{ success: boolean; data?: AgencySettings; error?: string }> {
  try {
    const supabase = getAdminClient();
    const keys = [
      "agency_business_name",
      "agency_business_email",
      "agency_business_phone",
      "agency_business_address",
      "agency_business_description",
      "agency_primary_color",
      "agency_logo_url",
      "agency_invoice_prefix",
      "agency_tax_rate",
    ];

    const { data: rows } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", keys);

    const map = new Map((rows || []).map((r: any) => [r.key, r.value]));

    return {
      success: true,
      data: {
        businessName: map.get("agency_business_name") || "",
        businessEmail: map.get("agency_business_email") || "",
        businessPhone: map.get("agency_business_phone") || "",
        businessAddress: map.get("agency_business_address") || "",
        businessDescription: map.get("agency_business_description") || "",
        primaryColor: map.get("agency_primary_color") || "#f59e0b",
        logoUrl: map.get("agency_logo_url") || "",
        invoicePrefix: map.get("agency_invoice_prefix") || "INV-",
        taxRate: map.get("agency_tax_rate") || "0",
      },
    };
  } catch (error) {
    console.error("[GET AGENCY SETTINGS ERROR]", error);
    return { success: false, error: "Failed to load settings" };
  }
}

/**
 * Upsert agency settings into `site_settings`.
 */
export async function saveAgencySettings(settings: AgencySettings): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();

    const rows = [
      { key: "agency_business_name", value: settings.businessName },
      { key: "agency_business_email", value: settings.businessEmail },
      { key: "agency_business_phone", value: settings.businessPhone },
      { key: "agency_business_address", value: settings.businessAddress },
      { key: "agency_business_description", value: settings.businessDescription },
      { key: "agency_primary_color", value: settings.primaryColor },
      { key: "agency_logo_url", value: settings.logoUrl },
      { key: "agency_invoice_prefix", value: settings.invoicePrefix },
      { key: "agency_tax_rate", value: settings.taxRate },
    ];

    const { error } = await supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) throw error;

    await logAuditEvent({ action: "UPDATE", resource: "site_settings", resourceId: "agency_settings", details: { keys: rows.map((r) => r.key) } });
    revalidatePath("/admin/agency/settings");
    return { success: true };
  } catch (error) {
    console.error("[SAVE AGENCY SETTINGS ERROR]", error);
    return { success: false, error: "Failed to save settings" };
  }
}
