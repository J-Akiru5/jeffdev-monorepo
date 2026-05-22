import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';

const SkillStepSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

const UpdateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  category: z.enum(['architecture', 'workflow', 'debugging', 'deployment', 'testing', 'other']).optional(),
  steps: z.array(SkillStepSchema).min(1).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse('Invalid skill ID', 400);

  const skills = await getCollection('skills');
  const skill = await skills.findOne({ _id: new ObjectId(id), createdBy: auth.userId });
  if (!skill) return errorResponse('Skill not found', 404);

  const response = successResponse({
    id: skill._id.toString(),
    projectId: skill.projectId || null,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    steps: skill.steps || [],
    tags: skill.tags || [],
    isActive: skill.isActive,
    source: skill.source || 'manual',
    createdBy: skill.createdBy || null,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  });

  response.headers.set("Cache-Control", "public, max-age=1800");
  response.headers.set("X-Cache-TTL", "1800");
  response.headers.set("Vary", "Authorization");
  return response;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse('Invalid skill ID', 400);

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse('Invalid JSON body', 400); }

  const parsed = UpdateSkillSchema.safeParse(body);
  if (!parsed.success) return errorResponse(parsed.error.issues.map(e => e.message).join(', '), 422);

  const skills = await getCollection('skills');
  const existing = await skills.findOne({ _id: new ObjectId(id), createdBy: auth.userId });
  if (!existing) return errorResponse('Skill not found', 404);

  const updates = { ...parsed.data, updatedAt: new Date().toISOString() };
  await skills.updateOne({ _id: new ObjectId(id) }, { $set: updates });

  return successResponse({ id, ...existing, ...updates });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { id } = await params;
  if (!ObjectId.isValid(id)) return errorResponse('Invalid skill ID', 400);

  const skills = await getCollection('skills');
  const result = await skills.deleteOne({ _id: new ObjectId(id), createdBy: auth.userId });
  if (result.deletedCount === 0) return errorResponse('Skill not found', 404);

  return successResponse({ id, deleted: true });
}
