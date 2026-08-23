import { NextRequest } from "next/server";
import { getPrismDb, isValidId } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

const UpdateBrandSchema = z.object({
  companyName: z.string().min(2).max(100).optional(),
  tagline: z.string().max(200).optional(),
  industry: z
    .enum([
      "photography",
      "tech",
      "agency",
      "ecommerce",
      "saas",
      "healthcare",
      "finance",
      "education",
      "other",
    ])
    .optional(),
  colors: z
    .object({
      primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      textMuted: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    })
    .optional(),
  typography: z
    .object({
      headingFont: z.string().min(1),
      bodyFont: z.string().min(1),
      monoFont: z.string().optional(),
      scale: z.enum(["compact", "default", "spacious"]),
    })
    .optional(),
  voice: z
    .object({
      personality: z.enum(["minimal", "warm", "bold", "playful", "corporate"]),
      formality: z.enum(["casual", "balanced", "formal"]),
      keywords: z.array(z.string()),
    })
    .optional(),
  imagery: z
    .object({
      style: z.enum(["photography", "illustration", "3d", "mixed"]),
      mood: z.enum(["light", "dark", "moody", "vibrant"]),
    })
    .optional(),
  spacing: z
    .object({
      unit: z.number().int().min(2).max(8),
      borderRadius: z.enum(["none", "sm", "md", "lg", "full"]),
    })
    .optional(),
});

// Maps camelCase request fields to Postgres column names for the update payload.
function toColumns(data: z.infer<typeof UpdateBrandSchema>): Record<string, unknown> {
  const cols: Record<string, unknown> = {};
  if (data.companyName !== undefined) cols.company_name = data.companyName;
  if (data.tagline !== undefined) cols.tagline = data.tagline;
  if (data.industry !== undefined) cols.industry = data.industry;
  if (data.colors !== undefined) cols.colors = data.colors;
  if (data.typography !== undefined) cols.typography = data.typography;
  if (data.voice !== undefined) cols.voice = data.voice;
  if (data.imagery !== undefined) cols.imagery = data.imagery;
  if (data.spacing !== undefined) cols.spacing = data.spacing;
  return cols;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid brand ID", 400);

  const db = getPrismDb();
  const { data: brand } = await db
    .from("prism_brands")
    .select(
      "_id:id, slug, companyName:company_name, tagline, industry, colors, typography, voice, imagery, spacing, createdAt:created_at, updatedAt:updated_at",
    )
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!brand) return errorResponse("Brand not found", 404);

  return successResponse({
    id: brand._id.toString(),
    slug: brand.slug,
    companyName: brand.companyName,
    tagline: brand.tagline,
    industry: brand.industry,
    colors: brand.colors,
    typography: brand.typography,
    voice: brand.voice,
    imagery: brand.imagery,
    spacing: brand.spacing,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid brand ID", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = UpdateBrandSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const db = getPrismDb();
  const { data: existing } = await db
    .from("prism_brands")
    .select(
      "_id:id, slug, companyName:company_name, tagline, industry, colors, typography, voice, imagery, spacing, createdAt:created_at",
    )
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  if (!existing) return errorResponse("Brand not found", 404);

  const updatedAt = new Date().toISOString();
  await db
    .from("prism_brands")
    .update({ ...toColumns(parsed.data), updated_at: updatedAt })
    .eq("id", id);

  return successResponse({ id, ...existing, ...parsed.data, updatedAt });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!isValidId(id)) return errorResponse("Invalid brand ID", 400);

  const db = getPrismDb();
  const { data: deleted } = await db
    .from("prism_brands")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId)
    .select("id");
  if (!deleted || deleted.length === 0)
    return errorResponse("Brand not found", 404);

  return successResponse({ id, deleted: true });
}
