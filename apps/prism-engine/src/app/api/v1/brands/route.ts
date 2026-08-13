import { NextRequest } from "next/server";
import { getPrismDb } from "@syntaxure-labs/db/prism";
import { z } from "zod";
import { authenticate, errorResponse, successResponse } from "@/lib/api-auth";

const INDUSTRIES = [
  "photography",
  "tech",
  "agency",
  "ecommerce",
  "saas",
  "healthcare",
  "finance",
  "education",
  "other",
] as const;
const PERSONALITIES = [
  "minimal",
  "warm",
  "bold",
  "playful",
  "corporate",
] as const;
const FORMALITIES = ["casual", "balanced", "formal"] as const;
const SCALES = ["compact", "default", "spacious"] as const;
const IMAGERY_STYLES = ["photography", "illustration", "3d", "mixed"] as const;
const MOODS = ["light", "dark", "moody", "vibrant"] as const;
const BORDER_RADII = ["none", "sm", "md", "lg", "full"] as const;

const ColorsSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textMuted: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const TypographySchema = z.object({
  headingFont: z.string().min(1),
  bodyFont: z.string().min(1),
  monoFont: z.string().optional(),
  scale: z.enum(SCALES),
});

const VoiceSchema = z.object({
  personality: z.enum(PERSONALITIES),
  formality: z.enum(FORMALITIES),
  keywords: z.array(z.string()).default([]),
});

const CreateBrandSchema = z.object({
  companyName: z.string().min(2).max(100),
  tagline: z.string().max(200).optional().default(""),
  industry: z.enum(INDUSTRIES),
  colors: ColorsSchema,
  typography: TypographySchema,
  voice: VoiceSchema,
  imagery: z.object({
    style: z.enum(IMAGERY_STYLES),
    mood: z.enum(MOODS),
  }),
  spacing: z.object({
    unit: z.number().int().min(2).max(8).default(4),
    borderRadius: z.enum(BORDER_RADII).default("sm"),
  }),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") || "20")),
  );
  const industry = searchParams.get("industry");
  const modifiedAfter = searchParams.get("modifiedAfter");

  const db = getPrismDb();
  let query = db
    .from("prism_brands")
    .select(
      "_id:id, slug, companyName:company_name, tagline, industry, colors, createdAt:created_at, updatedAt:updated_at",
      { count: "exact" },
    )
    .eq("user_id", auth.userId);
  if (industry && INDUSTRIES.includes(industry as (typeof INDUSTRIES)[number]))
    query = query.eq("industry", industry);
  if (modifiedAfter) query = query.gte("updated_at", modifiedAfter);

  const { data: itemsRaw, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);
  const items = itemsRaw ?? [];
  const total = count ?? 0;

  return successResponse(
    items.map((b) => ({
      id: b._id.toString(),
      slug: b.slug,
      companyName: b.companyName,
      tagline: b.tagline,
      industry: b.industry,
      colors: b.colors,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) },
  );
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = CreateBrandSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      parsed.error.issues.map((e) => e.message).join(", "),
      422,
    );

  const { companyName, ...rest } = parsed.data;
  const slug = slugify(companyName);

  const db = getPrismDb();
  const { data: existing } = await db
    .from("prism_brands")
    .select("id")
    .eq("user_id", auth.userId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing)
    return errorResponse("A brand with this name already exists", 409);

  const now = new Date().toISOString();
  const { data: inserted, error } = await db
    .from("prism_brands")
    .insert({
      user_id: auth.userId,
      slug,
      company_name: companyName,
      tagline: rest.tagline,
      industry: rest.industry,
      colors: rest.colors,
      typography: rest.typography,
      voice: rest.voice,
      imagery: rest.imagery,
      spacing: rest.spacing,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return errorResponse("Failed to create brand", 500);
  }

  return successResponse(
    {
      id: inserted.id,
      userId: auth.userId,
      slug,
      companyName,
      ...rest,
      createdAt: now,
      updatedAt: now,
    },
    { created: true },
  );
}
