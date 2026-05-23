import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';

const RULE_CATEGORIES = ['architecture', 'styling', 'security', 'performance', 'testing', 'documentation', 'custom'] as const;

const CreateRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  category: z.enum(RULE_CATEGORIES).default('custom'),
  content: z.string().min(1),
  priority: z.number().int().min(1).max(100).optional().default(50),
  tags: z.array(z.string()).optional().default([]),
  pattern: z.string().optional(),
  severity: z.enum(['error', 'warning', 'info']).optional().default('warning'),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse('Invalid project ID', 400);

  const projects = await getCollection('projects');
  const project = await projects.findOne({ _id: new ObjectId(id), userId: auth.userId });
  if (!project) return errorResponse('Project not found', 404);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
  const category = searchParams.get('category');

  const rules = await getCollection('rules');
  const projectId = project._id.toString();
  const query: Record<string, unknown> = { projectId, isActive: true };
  if (category && RULE_CATEGORIES.includes(category as typeof RULE_CATEGORIES[number])) query.category = category;

  const total = await rules.countDocuments(query);
  const items = await rules
    .find(query)
    .sort({ priority: 1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return successResponse(items.map(r => ({
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
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse('Invalid project ID', 400);

  const projects = await getCollection('projects');
  const project = await projects.findOne({ _id: new ObjectId(id), userId: auth.userId });
  if (!project) return errorResponse('Project not found', 404);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('Invalid JSON body', 400); }

  const parsed = CreateRuleSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(e => e.message).join(', '), 422);

  const rules = await getCollection('rules');
  const now = new Date().toISOString();
  const doc = {
    ...parsed.data,
    projectId: project._id.toString(),
    createdBy: auth.userId,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await rules.insertOne(doc);
  return successResponse({ id: result.insertedId.toString(), ...doc }, { created: true });
}
