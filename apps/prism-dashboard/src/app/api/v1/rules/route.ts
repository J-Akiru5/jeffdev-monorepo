import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { z } from 'zod';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

const RULE_CATEGORIES = ['architecture', 'styling', 'security', 'performance', 'testing', 'documentation', 'custom'] as const;

const CreateRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  category: z.enum(RULE_CATEGORIES).default('custom'),
  content: z.string().min(1),
  priority: z.number().int().min(1).max(100).optional().default(50),
  tags: z.array(z.string()).optional().default([]),
  projectId: z.string().optional(),
  pattern: z.string().optional(),
  severity: z.enum(['error', 'warning', 'info']).optional().default('warning'),
});

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = checkRateLimit(`rules:list:${auth.userId}`, auth.tier);
  if (!rl.allowed) {
    return errorResponse('Rate limit exceeded', 429);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');
  const active = searchParams.get('active') !== 'false';
  const search = searchParams.get('q');

  const rules = await getCollection('rules');
  const query: Record<string, unknown> = { createdBy: auth.userId, isActive: active };
  if (category && RULE_CATEGORIES.includes(category as any)) query.category = category;
  if (tag) query.tags = tag;
  if (search) query.name = { $regex: search, $options: 'i' } as any;

  const total = await rules.countDocuments(query);
  const items = await rules
    .find(query)
    .sort({ priority: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  const response = successResponse(items.map((r) => ({
    id: r._id.toString(),
    name: r.name,
    description: r.description,
    category: r.category,
    content: r.content,
    priority: r.priority,
    tags: r.tags || [],
    pattern: r.pattern,
    severity: r.severity,
    isActive: r.isActive,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })), { page, limit, total, totalPages: Math.ceil(total / limit) });

  Object.entries(getRateLimitHeaders(`rules:list:${auth.userId}`, auth.tier)).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = checkRateLimit(`rules:create:${auth.userId}`, auth.tier);
  if (!rl.allowed) return errorResponse('Rate limit exceeded', 429);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('Invalid JSON body', 400); }

  const parsed = CreateRuleSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map((e) => e.message).join(', '), 422);

  const rules = await getCollection('rules');
  const now = new Date().toISOString();
  const doc = {
    ...parsed.data,
    createdBy: auth.userId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await rules.insertOne(doc);
  const response = successResponse({ id: result.insertedId.toString(), ...doc }, { created: true });
  Object.entries(getRateLimitHeaders(`rules:create:${auth.userId}`, auth.tier)).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
