import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';

const UpdateBrandSchema = z.object({
  companyName: z.string().min(2).max(100).optional(),
  tagline: z.string().max(200).optional(),
  industry: z.enum(['photography', 'tech', 'agency', 'ecommerce', 'saas', 'healthcare', 'finance', 'education', 'other']).optional(),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    surface: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    textMuted: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  typography: z.object({
    headingFont: z.string().min(1),
    bodyFont: z.string().min(1),
    monoFont: z.string().optional(),
    scale: z.enum(['compact', 'default', 'spacious']),
  }).optional(),
  voice: z.object({
    personality: z.enum(['minimal', 'warm', 'bold', 'playful', 'corporate']),
    formality: z.enum(['casual', 'balanced', 'formal']),
    keywords: z.array(z.string()),
  }).optional(),
  imagery: z.object({
    style: z.enum(['photography', 'illustration', '3d', 'mixed']),
    mood: z.enum(['light', 'dark', 'moody', 'vibrant']),
  }).optional(),
  spacing: z.object({
    unit: z.number().int().min(2).max(8),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']),
  }).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse('Invalid brand ID', 400);

  const brands = await getCollection('brands');
  const brand = await brands.findOne({ _id: new ObjectId(id), userId: auth.userId });
  if (!brand) return errorResponse('Brand not found', 404);

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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse('Invalid brand ID', 400);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('Invalid JSON body', 400); }

  const parsed = UpdateBrandSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(e => e.message).join(', '), 422);

  const brands = await getCollection('brands');
  const existing = await brands.findOne({ _id: new ObjectId(id), userId: auth.userId });
  if (!existing) return errorResponse('Brand not found', 404);

  const updates = { ...parsed.data, updatedAt: new Date().toISOString() };
  await brands.updateOne({ _id: new ObjectId(id) }, { $set: updates });

  return successResponse({ id, ...existing, ...updates });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse('Invalid brand ID', 400);

  const brands = await getCollection('brands');
  const result = await brands.deleteOne({ _id: new ObjectId(id), userId: auth.userId });
  if (result.deletedCount === 0) return errorResponse('Brand not found', 404);

  return successResponse({ id, deleted: true });
}
