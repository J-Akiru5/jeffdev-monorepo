"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// =============================================================================
// PRODUCT TEMPLATES
// =============================================================================

const productTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  category: z.enum(["template", "boilerplate", "addon"]),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  short_description: z.string().nullable().optional(),
  base_price_monthly_php: z.number().nullable().optional(),
  base_price_monthly_usd: z.number().nullable().optional(),
  base_price_annual_php: z.number().nullable().optional(),
  base_price_annual_usd: z.number().nullable().optional(),
  features: z.array(z.object({
    name: z.string(),
    description: z.string(),
    included: z.boolean(),
  })).optional(),
  tech_stack: z.array(z.string()).optional(),
  demo_url: z.string().nullable().optional(),
  repo_url: z.string().nullable().optional(),
  documentation_url: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  highlighted: z.boolean().optional(),
  sort_order: z.number().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

export type ProductTemplateInput = z.infer<typeof productTemplateSchema>;

export async function getProductTemplates(
  filters?: { category?: string; status?: string }
): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const adminClient = getAdminClient();
    let query = adminClient
      .from("product_templates")
      .select("*")
      .order("sort_order", { ascending: true });

    if (filters?.category) {
      query = query.eq("category", filters.category as "template" | "boilerplate" | "addon");
    }
    if (filters?.status) {
      query = query.eq("status", filters.status as "draft" | "active" | "archived");
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch product templates",
    };
  }
}

export async function getProductTemplateById(
  id: string
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("product_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch product template",
    };
  }
}

export async function createProductTemplate(
  input: ProductTemplateInput
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const parsed = productTemplateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("product_templates")
      .insert({
        name: parsed.data.name,
        slug: parsed.data.slug,
        category: parsed.data.category,
        tagline: parsed.data.tagline ?? null,
        description: parsed.data.description ?? null,
        short_description: parsed.data.short_description ?? null,
        base_price_monthly_php: parsed.data.base_price_monthly_php ?? null,
        base_price_monthly_usd: parsed.data.base_price_monthly_usd ?? null,
        base_price_annual_php: parsed.data.base_price_annual_php ?? null,
        base_price_annual_usd: parsed.data.base_price_annual_usd ?? null,
        features: parsed.data.features ?? [],
        tech_stack: parsed.data.tech_stack ?? [],
        demo_url: parsed.data.demo_url ?? null,
        repo_url: parsed.data.repo_url ?? null,
        documentation_url: parsed.data.documentation_url ?? null,
        icon: parsed.data.icon ?? null,
        image_url: parsed.data.image_url ?? null,
        highlighted: parsed.data.highlighted ?? false,
        sort_order: parsed.data.sort_order ?? 0,
        status: parsed.data.status ?? "draft",
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product template",
    };
  }
}

export async function updateProductTemplate(
  id: string,
  input: Partial<ProductTemplateInput>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.slug !== undefined) updates.slug = input.slug;
    if (input.category !== undefined) updates.category = input.category;
    if (input.tagline !== undefined) updates.tagline = input.tagline;
    if (input.description !== undefined) updates.description = input.description;
    if (input.short_description !== undefined) updates.short_description = input.short_description;
    if (input.base_price_monthly_php !== undefined) updates.base_price_monthly_php = input.base_price_monthly_php;
    if (input.base_price_monthly_usd !== undefined) updates.base_price_monthly_usd = input.base_price_monthly_usd;
    if (input.base_price_annual_php !== undefined) updates.base_price_annual_php = input.base_price_annual_php;
    if (input.base_price_annual_usd !== undefined) updates.base_price_annual_usd = input.base_price_annual_usd;
    if (input.features !== undefined) updates.features = input.features;
    if (input.tech_stack !== undefined) updates.tech_stack = input.tech_stack;
    if (input.demo_url !== undefined) updates.demo_url = input.demo_url;
    if (input.repo_url !== undefined) updates.repo_url = input.repo_url;
    if (input.documentation_url !== undefined) updates.documentation_url = input.documentation_url;
    if (input.icon !== undefined) updates.icon = input.icon;
    if (input.image_url !== undefined) updates.image_url = input.image_url;
    if (input.highlighted !== undefined) updates.highlighted = input.highlighted;
    if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
    if (input.status !== undefined) updates.status = input.status;

    const { data, error } = await adminClient
      .from("product_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product template",
    };
  }
}

export async function deleteProductTemplate(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from("product_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product template",
    };
  }
}

// =============================================================================
// CONTRACT TERMS
// =============================================================================

const contractTermSchema = z.object({
  template_id: z.string().uuid("Valid template ID is required"),
  term_months: z.number().min(1, "Term months is required"),
  billing_cycle: z.enum(["monthly", "annual"]),
  price_php: z.number().min(0, "Price PHP is required"),
  price_usd: z.number().min(0, "Price USD is required"),
  discount_percent: z.number().min(0).max(100).optional(),
  includes: z.record(z.string(), z.unknown()).optional(),
  extension_enabled: z.boolean().optional(),
  extension_max_years: z.number().optional(),
  extension_rate_increase_percent: z.number().optional(),
  highlighted: z.boolean().optional(),
  sort_order: z.number().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type ContractTermInput = z.infer<typeof contractTermSchema>;

export async function getContractTerms(
  templateId: string
): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("contract_terms")
      .select("*")
      .eq("template_id", templateId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch contract terms",
    };
  }
}

export async function createContractTerm(
  input: ContractTermInput
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const parsed = contractTermSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("contract_terms")
      .insert({
        template_id: parsed.data.template_id,
        term_months: parsed.data.term_months,
        billing_cycle: parsed.data.billing_cycle,
        price_php: parsed.data.price_php,
        price_usd: parsed.data.price_usd,
        discount_percent: parsed.data.discount_percent ?? 0,
        includes: parsed.data.includes ?? {},
        extension_enabled: parsed.data.extension_enabled ?? true,
        extension_max_years: parsed.data.extension_max_years ?? 5,
        extension_rate_increase_percent: parsed.data.extension_rate_increase_percent ?? 10,
        highlighted: parsed.data.highlighted ?? false,
        sort_order: parsed.data.sort_order ?? 0,
        status: parsed.data.status ?? "active",
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create contract term",
    };
  }
}

export async function updateContractTerm(
  id: string,
  input: Partial<ContractTermInput>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.template_id !== undefined) updates.template_id = input.template_id;
    if (input.term_months !== undefined) updates.term_months = input.term_months;
    if (input.billing_cycle !== undefined) updates.billing_cycle = input.billing_cycle;
    if (input.price_php !== undefined) updates.price_php = input.price_php;
    if (input.price_usd !== undefined) updates.price_usd = input.price_usd;
    if (input.discount_percent !== undefined) updates.discount_percent = input.discount_percent;
    if (input.includes !== undefined) updates.includes = input.includes;
    if (input.extension_enabled !== undefined) updates.extension_enabled = input.extension_enabled;
    if (input.extension_max_years !== undefined) updates.extension_max_years = input.extension_max_years;
    if (input.extension_rate_increase_percent !== undefined) updates.extension_rate_increase_percent = input.extension_rate_increase_percent;
    if (input.highlighted !== undefined) updates.highlighted = input.highlighted;
    if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
    if (input.status !== undefined) updates.status = input.status;

    const { data, error } = await adminClient
      .from("contract_terms")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update contract term",
    };
  }
}

export async function deleteContractTerm(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from("contract_terms")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete contract term",
    };
  }
}

// =============================================================================
// CUSTOMIZATION SERVICES
// =============================================================================

const customizationServiceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable().optional(),
  pricing_model: z.enum(["fixed", "hourly", "project"]),
  estimated_range_min_php: z.number().nullable().optional(),
  estimated_range_max_php: z.number().nullable().optional(),
  estimated_range_min_usd: z.number().nullable().optional(),
  estimated_range_max_usd: z.number().nullable().optional(),
  turnaround_days: z.number().nullable().optional(),
  sort_order: z.number().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type CustomizationServiceInput = z.infer<typeof customizationServiceSchema>;

export async function getCustomizationServices(): Promise<{
  success: boolean;
  data?: unknown[];
  error?: string;
}> {
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("customization_services")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch customization services",
    };
  }
}

export async function createCustomizationService(
  input: CustomizationServiceInput
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const parsed = customizationServiceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("customization_services")
      .insert({
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description ?? null,
        pricing_model: parsed.data.pricing_model,
        estimated_range_min_php: parsed.data.estimated_range_min_php ?? null,
        estimated_range_max_php: parsed.data.estimated_range_max_php ?? null,
        estimated_range_min_usd: parsed.data.estimated_range_min_usd ?? null,
        estimated_range_max_usd: parsed.data.estimated_range_max_usd ?? null,
        turnaround_days: parsed.data.turnaround_days ?? null,
        sort_order: parsed.data.sort_order ?? 0,
        status: parsed.data.status ?? "active",
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/customization-services");
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create customization service",
    };
  }
}

export async function updateCustomizationService(
  id: string,
  input: Partial<CustomizationServiceInput>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.slug !== undefined) updates.slug = input.slug;
    if (input.description !== undefined) updates.description = input.description;
    if (input.pricing_model !== undefined) updates.pricing_model = input.pricing_model;
    if (input.estimated_range_min_php !== undefined) updates.estimated_range_min_php = input.estimated_range_min_php;
    if (input.estimated_range_max_php !== undefined) updates.estimated_range_max_php = input.estimated_range_max_php;
    if (input.estimated_range_min_usd !== undefined) updates.estimated_range_min_usd = input.estimated_range_min_usd;
    if (input.estimated_range_max_usd !== undefined) updates.estimated_range_max_usd = input.estimated_range_max_usd;
    if (input.turnaround_days !== undefined) updates.turnaround_days = input.turnaround_days;
    if (input.sort_order !== undefined) updates.sort_order = input.sort_order;
    if (input.status !== undefined) updates.status = input.status;

    const { data, error } = await adminClient
      .from("customization_services")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/admin/customization-services");
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update customization service",
    };
  }
}

export async function deleteCustomizationService(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from("customization_services")
      .delete()
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/customization-services");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete customization service",
    };
  }
}
