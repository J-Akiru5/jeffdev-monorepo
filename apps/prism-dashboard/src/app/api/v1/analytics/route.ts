import { NextRequest } from 'next/server';
import { getCollection } from '@jeffdev/db/cosmos';
import { authenticate, errorResponse, successResponse } from '@/lib/api-auth';
import { TIER_LIMITS } from '@/lib/subscriptions';

function formatLimit(limit: number): number | string {
  return limit === -1 ? 'unlimited' : limit;
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const limits = TIER_LIMITS[auth.tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [projects, rules, components, generations] = await Promise.all([
    getCollection('projects'),
    getCollection('rules'),
    getCollection('components'),
    getCollection('generations'),
  ]);

  const [projectCount, ruleCount, componentCount, generationCount] = await Promise.all([
    projects.countDocuments({ userId: auth.userId }),
    rules.countDocuments({ createdBy: auth.userId }),
    components.countDocuments({ userId: auth.userId }),
    generations.countDocuments({ userId: auth.userId, createdAt: { $gte: monthStart.toISOString() } }),
  ]);

  const nextMonthStart = new Date();
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
  nextMonthStart.setDate(1);
  nextMonthStart.setHours(0, 0, 0, 0);

  return successResponse({
    tier: auth.tier,
    usage: {
      projects: { used: projectCount, limit: formatLimit(limits.projects) },
      rules: { used: ruleCount, limit: formatLimit(limits.rules) },
      components: { used: componentCount, limit: formatLimit(limits.components) },
      aiGenerations: { used: generationCount, limit: formatLimit(limits.aiGenerations) },
    },
    resetDate: nextMonthStart.toISOString(),
  });
}
