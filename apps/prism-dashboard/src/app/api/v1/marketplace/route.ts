import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { z } from 'zod';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';

const PublishSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  rules: z.array(z.string()).min(1),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const search = searchParams.get('q');

  const ruleSets = await getCollection('ruleSets');
  const query: Record<string, unknown> = { isPublic: true };
  if (search) query.name = { $regex: search, $options: 'i' } as any;

  const total = await ruleSets.countDocuments(query);
  const items = await ruleSets
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return successResponse(items.map((rs) => ({
    id: rs._id.toString(),
    name: rs.name,
    description: rs.description,
    ruleCount: rs.rules?.length || 0,
    createdBy: rs.createdBy,
    createdAt: rs.createdAt,
  })), { page, limit, total, totalPages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('Invalid JSON body', 400); }

  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(e => e.message).join(', '), 422);

  const rules = await getCollection('rules');
  const existingRules = await rules.find({ _id: { $in: parsed.data.rules.map((id) => ({ $oid: id } as any)) }, createdBy: auth.userId }).toArray();
  if (existingRules.length !== parsed.data.rules.length) {
    return errorResponse('One or more rule IDs are invalid or do not belong to you', 422);
  }

  const ruleSets = await getCollection('ruleSets');
  const now = new Date().toISOString();
  const doc = {
    name: parsed.data.name,
    description: parsed.data.description || '',
    rules: parsed.data.rules,
    isPublic: true,
    createdBy: auth.userId,
    createdAt: now,
  };

  const result = await ruleSets.insertOne(doc);
  return successResponse({ id: result.insertedId.toString(), ...doc }, { created: true });
}
