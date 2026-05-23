import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { z } from 'zod';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

const SKILL_CATEGORIES = ['architecture', 'workflow', 'debugging', 'deployment', 'testing', 'other'] as const;

const SkillStepSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const CreateSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  category: z.enum(SKILL_CATEGORIES).default('other'),
  steps: z.array(SkillStepSchema).min(1),
  tags: z.array(z.string()).optional().default([]),
  projectId: z.string().optional(),
  source: z.enum(['manual', 'ai-generated', 'video-extracted']).optional().default('manual'),
});

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = checkRateLimit(`skills:list:${auth.userId}`, auth.tier);
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
  const projectId = searchParams.get('projectId');

  const skills = await getCollection('skills');
  const query: Record<string, unknown> = { createdBy: auth.userId, isActive: active };
  if (category && (SKILL_CATEGORIES as readonly string[]).includes(category)) query.category = category;
  if (tag) query.tags = tag;
  if (projectId) query.projectId = projectId;
  if (search) query.name = { $regex: search, $options: 'i' };

  const total = await skills.countDocuments(query);
  const items = await skills
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  const response = successResponse(items.map((s) => ({
    id: s._id.toString(),
    name: s.name,
    description: s.description,
    category: s.category,
    stepCount: s.steps?.length || 0,
    tags: s.tags || [],
    source: s.source || 'manual',
    isActive: s.isActive,
    projectId: s.projectId || null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  })), { page, limit, total, totalPages: Math.ceil(total / limit) });

  Object.entries(getRateLimitHeaders(`skills:list:${auth.userId}`, auth.tier)).forEach(([k, v]) => response.headers.set(k, v));
  response.headers.set("Cache-Control", "public, max-age=1800");
  response.headers.set("X-Cache-TTL", "1800");
  response.headers.set("Vary", "Authorization");
  return response;
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const rl = checkRateLimit(`skills:create:${auth.userId}`, auth.tier);
  if (!rl.allowed) return errorResponse('Rate limit exceeded', 429);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('Invalid JSON body', 400); }

  const parsed = CreateSkillSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map((e) => e.message).join(', '), 422);

  const skills = await getCollection('skills');
  const now = new Date().toISOString();
  const doc = {
    ...parsed.data,
    source: parsed.data.source || 'manual',
    createdBy: auth.userId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await skills.insertOne(doc);
  const response = successResponse({ id: result.insertedId.toString(), ...doc }, { created: true });
  Object.entries(getRateLimitHeaders(`skills:create:${auth.userId}`, auth.tier)).forEach(([k, v]) => response.headers.set(k, v));
  return response;
}
