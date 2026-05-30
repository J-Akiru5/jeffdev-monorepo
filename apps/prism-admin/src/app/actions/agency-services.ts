"use server";

/**
 * Agency Services Server Actions
 * ------------------------------
 * CRUD operations for services in the admin catalog.
 */

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";

const serviceSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  description: z.string().max(2000).optional().default(""),
  priceMin: z.number().min(0).nullable().optional(),
  priceMax: z.number().min(0).nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  billingStructure: z.enum(["one-time", "recurring"]).default("one-time"),
  forcesCustomQuote: z.boolean().default(false),
  coverImage: z.string().nullable().optional(),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

interface ActionResult {
  success: boolean;
  error?: string;
}

// helper to serialize extra metadata inside description
export function serializeDescription(
  text: string,
  billingStructure: string,
  forcesCustomQuote: boolean,
  coverImage?: string | null
): string {
  return JSON.stringify({
    text,
    billingStructure,
    forcesCustomQuote,
    coverImage: coverImage || null,
  });
}

// helper to deserialize
export function deserializeDescription(descriptionStr: string | null): {
  text: string;
  billingStructure: "one-time" | "recurring";
  forcesCustomQuote: boolean;
  coverImage: string | null;
} {
  try {
    if (!descriptionStr) {
      return { text: "", billingStructure: "one-time", forcesCustomQuote: false, coverImage: null };
    }
    const data = JSON.parse(descriptionStr);
    if (data && typeof data === "object" && "text" in data) {
      return {
        text: data.text || "",
        billingStructure: data.billingStructure === "recurring" ? "recurring" : "one-time",
        forcesCustomQuote: !!data.forcesCustomQuote,
        coverImage: data.coverImage || null,
      };
    }
  } catch (e) {
    // fallback if it's plain text description
  }
  return {
    text: descriptionStr || "",
    billingStructure: "one-time",
    forcesCustomQuote: false,
    coverImage: null,
  };
}

export async function createAgencyService(data: ServiceFormData): Promise<ActionResult> {
  try {
    const validated = serviceSchema.parse(data);
    const supabase = getAdminClient();

    const serializedDesc = serializeDescription(
      validated.description,
      validated.billingStructure,
      validated.forcesCustomQuote,
      validated.coverImage
    );

    const { error } = await supabase.from("services").insert({
      name: validated.name,
      category: validated.category,
      description: serializedDesc,
      price_min: validated.priceMin,
      price_max: validated.priceMax,
      status: validated.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    await logAuditEvent({
      action: "CREATE",
      resource: "services",
      resourceId: validated.name,
      details: { name: validated.name },
    });

    revalidatePath("/admin/agency/services");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0]!.message };
    console.error("[CREATE AGENCY SERVICE ERROR]", error);
    return { success: false, error: "Failed to create service" };
  }
}

export async function updateAgencyService(id: string, data: ServiceFormData): Promise<ActionResult> {
  try {
    const validated = serviceSchema.parse(data);
    const supabase = getAdminClient();

    const serializedDesc = serializeDescription(
      validated.description,
      validated.billingStructure,
      validated.forcesCustomQuote,
      validated.coverImage
    );

    const { error } = await supabase
      .from("services")
      .update({
        name: validated.name,
        category: validated.category,
        description: serializedDesc,
        price_min: validated.priceMin,
        price_max: validated.priceMax,
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    await logAuditEvent({
      action: "UPDATE",
      resource: "services",
      resourceId: id,
      details: { name: validated.name },
    });

    revalidatePath("/admin/agency/services");
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0]!.message };
    console.error("[UPDATE AGENCY SERVICE ERROR]", error);
    return { success: false, error: "Failed to update service" };
  }
}

export async function deleteAgencyService(id: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw error;

    await logAuditEvent({
      action: "DELETE",
      resource: "services",
      resourceId: id,
    });

    revalidatePath("/admin/agency/services");
    return { success: true };
  } catch (error) {
    console.error("[DELETE AGENCY SERVICE ERROR]", error);
    return { success: false, error: "Failed to delete service" };
  }
}
