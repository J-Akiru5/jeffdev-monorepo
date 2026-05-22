import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { z } from 'zod';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';

const INDUSTRIES = ['photography', 'tech', 'agency', 'ecommerce', 'saas', 'healthcare', 'finance', 'education', 'other'] as const;
const PERSONALITIES = ['minimal', 'warm', 'bold', 'playful', 'corporate'] as const;
const FORMALITIES = ['casual', 'balanced', 'formal'] as const;
const SCALES = ['compact', 'default', 'spacious'] as const;
const IMAGERY_STYLES = ['photography', 'illustration', '3d', 'mixed'] as const;
const MOODS = ['light', 'dark', 'moody', 'vibrant'] as const;
const BORDER_RADII = ['none', 'sm', 'md', 'lg', 'full'] as const;

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
  tagline: z.string().max(200).optional().default(''),
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
    borderRadius: z.enum(BORDER_RADII).default('sm'),
  }),
});

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const industry = searchParams.get('industry');
  const modifiedAfter = searchParams.get('modifiedAfter');

  const brands = await getCollection('brands');
  const query: Record<string, unknown> = { userId: auth.userId };
  if (industry && INDUSTRIES.includes(industry as typeof INDUSTRIES[number])) query.industry = industry;
  if (modifiedAfter) query.updatedAt = { $gte: modifiedAfter };

  const total = await brands.countDocuments(query);
  const items = await brands
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return successResponse(items.map(b => ({
    id: b._id.toString(),
    slug: b.slug,
    companyName: b.companyName,
    tagline: b.tagline,
    industry: b.industry,
    colors: b.colors,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  })), { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('Invalid JSON body', 400); }

  const parsed = CreateBrandSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(e => e.message).join(', '), 422);

  const { companyName, ...rest } = parsed.data;
  const slug = slugify(companyName);

  const brands = await getCollection('brands');
  const existing = await brands.findOne({ userId: auth.userId, slug });
  if (existing) return errorResponse('A brand with this name already exists', 409);

  const now = new Date().toISOString();
  const doc = {
    userId: auth.userId,
    slug,
    companyName,
    ...rest,
    createdAt: now,
    updatedAt: now,
  };

  const result = await brands.insertOne(doc);
  return successResponse({ id: result.insertedId.toString(), ...doc }, { created: true });
}
