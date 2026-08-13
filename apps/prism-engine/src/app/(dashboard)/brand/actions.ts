"use server";

import { createClient } from "@/lib/supabase/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Brand creation state for form handling
 */
export type BrandFormState = {
  error?: Record<string, string[]>;
  success?: boolean;
} | null;

/**
 * Step 1: Identity Schema
 */
const IdentitySchema = z.object({
  companyName: z.string().min(2, "Company name required").max(100),
  tagline: z.string().max(200).optional(),
  industry: z.enum([
    "photography",
    "tech",
    "agency",
    "ecommerce",
    "saas",
    "healthcare",
    "finance",
    "education",
    "other",
  ]),
});

/**
 * Step 2: Colors Schema
 */
const ColorsSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  textMuted: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
});

/**
 * Step 3: Typography Schema
 */
const TypographySchema = z.object({
  headingFont: z.string().min(1, "Heading font required"),
  bodyFont: z.string().min(1, "Body font required"),
  monoFont: z.string().optional(),
  scale: z.enum(["compact", "default", "spacious"]),
});

/**
 * Step 4: Voice Schema
 */
const VoiceSchema = z.object({
  personality: z.enum(["minimal", "warm", "bold", "playful", "corporate"]),
  formality: z.enum(["casual", "balanced", "formal"]),
  keywords: z.string().transform((s) =>
    s
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
  ),
});

/**
 * Complete Brand Schema
 */
const CompleteBrandSchema = z.object({
  ...IdentitySchema.shape,
  colors: ColorsSchema,
  typography: TypographySchema,
  voice: VoiceSchema,
  imagery: z.object({
    style: z.enum(["photography", "illustration", "3d", "mixed"]),
    mood: z.enum(["light", "dark", "moody", "vibrant"]),
  }),
  spacing: z.object({
    unit: z.coerce.number().min(2).max(8).default(4),
    borderRadius: z.enum(["none", "sm", "md", "lg", "full"]),
  }),
});

/**
 * Create a new brand profile
 */
export async function createBrand(
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  // Parse all form data
  const rawData = {
    companyName: formData.get("companyName"),
    tagline: formData.get("tagline") || undefined,
    industry: formData.get("industry"),
    colors: {
      primary: formData.get("colors.primary"),
      secondary: formData.get("colors.secondary"),
      accent: formData.get("colors.accent"),
      background: formData.get("colors.background"),
      surface: formData.get("colors.surface"),
      text: formData.get("colors.text"),
      textMuted: formData.get("colors.textMuted"),
    },
    typography: {
      headingFont: formData.get("typography.headingFont"),
      bodyFont: formData.get("typography.bodyFont"),
      monoFont: formData.get("typography.monoFont") || undefined,
      scale: formData.get("typography.scale"),
    },
    voice: {
      personality: formData.get("voice.personality"),
      formality: formData.get("voice.formality"),
      keywords: formData.get("voice.keywords") || "",
    },
    imagery: {
      style: formData.get("imagery.style"),
      mood: formData.get("imagery.mood"),
    },
    spacing: {
      unit: formData.get("spacing.unit"),
      borderRadius: formData.get("spacing.borderRadius"),
    },
  };

  // Validate
  const parsed = CompleteBrandSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  // Generate slug from company name
  const slug = data.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const db = getPrismDb();
  const { error } = await db.from("prism_brands").insert({
    user_id: userId,
    slug,
    company_name: data.companyName,
    tagline: data.tagline,
    industry: data.industry,
    colors: data.colors,
    typography: data.typography,
    voice: {
      personality: data.voice.personality,
      formality: data.voice.formality,
      keywords: data.voice.keywords,
    },
    imagery: data.imagery,
    spacing: data.spacing,
  });

  if (error) {
    return { error: { general: ["Failed to create brand"] } };
  }

  // Revalidate and redirect
  revalidatePath("/brand");
  redirect(`/brand/${slug}`);
}

/**
 * Get user's brands
 */
export async function getUserBrands(): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const userId = user.id;

  const db = getPrismDb();
  const { data } = await db
    .from("prism_brands")
    .select(
      "_id:id, userId:user_id, slug, companyName:company_name, tagline, industry, colors, typography, voice, imagery, spacing, createdAt:created_at, updatedAt:updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return data ?? [];
}

/**
 * Get a single brand by slug
 */
export async function getBrand(
  slug: string,
): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const userId = user.id;

  const db = getPrismDb();
  const { data } = await db
    .from("prism_brands")
    .select(
      "_id:id, userId:user_id, slug, companyName:company_name, tagline, industry, colors, typography, voice, imagery, spacing, createdAt:created_at, updatedAt:updated_at",
    )
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  return data;
}

/**
 * Update an existing brand
 */
export async function updateBrand(
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const slug = String(formData.get("slug") || "");

  // Parse all form data
  const rawData = {
    companyName: formData.get("companyName"),
    tagline: formData.get("tagline") || undefined,
    industry: formData.get("industry"),
    colors: {
      primary: formData.get("colors.primary"),
      secondary: formData.get("colors.secondary"),
      accent: formData.get("colors.accent"),
      background: formData.get("colors.background"),
      surface: formData.get("colors.surface"),
      text: formData.get("colors.text"),
      textMuted: formData.get("colors.textMuted"),
    },
    typography: {
      headingFont: formData.get("typography.headingFont"),
      bodyFont: formData.get("typography.bodyFont"),
      monoFont: formData.get("typography.monoFont") || undefined,
      scale: formData.get("typography.scale"),
    },
    voice: {
      personality: formData.get("voice.personality"),
      formality: formData.get("voice.formality"),
      keywords: formData.get("voice.keywords") || "",
    },
    imagery: {
      style: formData.get("imagery.style"),
      mood: formData.get("imagery.mood"),
    },
    spacing: {
      unit: formData.get("spacing.unit"),
      borderRadius: formData.get("spacing.borderRadius"),
    },
  };

  // Validate
  const parsed = CompleteBrandSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  const db = getPrismDb();

  // Update brand
  await db
    .from("prism_brands")
    .update({
      company_name: data.companyName,
      tagline: data.tagline,
      industry: data.industry,
      colors: data.colors,
      typography: data.typography,
      voice: {
        personality: data.voice.personality,
        formality: data.voice.formality,
        keywords: data.voice.keywords,
      },
      imagery: data.imagery,
      spacing: data.spacing,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("slug", slug);

  // Revalidate and redirect
  revalidatePath("/brand");
  revalidatePath(`/brand/${slug}`);
  redirect(`/brand/${slug}`);
}

/**
 * Delete a brand
 */
export async function deleteBrand(slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const userId = user.id;

  const db = getPrismDb();
  await db.from("prism_brands").delete().eq("user_id", userId).eq("slug", slug);

  revalidatePath("/brand");
  redirect("/brand");
}
