import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { createHash } from 'crypto';

interface AuthResult {
  userId: string;
  tier: string;
  source: 'clerk' | 'api_key';
}

export async function authenticate(request: Request): Promise<AuthResult | NextResponse> {
  const apiKey = request.headers.get('x-api-key');

  if (apiKey) {
    const hash = createHash('sha256').update(apiKey).digest('hex');
    const apiKeysColl = await getCollection('apiKeys');
    const record = await apiKeysColl.findOne({ keyHash: hash, revokedAt: null });
    if (!record) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 }) as NextResponse;
    }
    await apiKeysColl.updateOne({ _id: record._id }, { $set: { lastUsedAt: new Date().toISOString() } });
    const subscriptions = await getCollection('subscriptions');
    const sub = await subscriptions.findOne({ userId: record.userId });
    return { userId: record.userId, tier: (sub?.tier as string) || 'free', source: 'api_key' };
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as NextResponse;
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const tier = (user.privateMetadata?.tier as string) || (user.publicMetadata?.tier as string) || 'free';

  return { userId, tier, source: 'clerk' };
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) });
}
