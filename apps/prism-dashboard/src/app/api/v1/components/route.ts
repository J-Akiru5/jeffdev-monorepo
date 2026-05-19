import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

  const components = await getCollection('components');
  const query = { userId: auth.userId };

  const total = await components.countDocuments(query);
  const items = await components
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray();

  return successResponse(items.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    designSystem: c.designSystem,
    stack: c.stack,
    createdAt: c.createdAt,
  })), { page, limit, total, totalPages: Math.ceil(total / limit) });
}
