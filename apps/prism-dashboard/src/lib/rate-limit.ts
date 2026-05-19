const requestCounts = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60_000, maxRequests: 60 },
  strict: { windowMs: 60_000, maxRequests: 10 },
  free: { windowMs: 60_000, maxRequests: 20 },
};

export function checkRateLimit(key: string, tier: string = 'free'): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const config = LIMITS[tier] || LIMITS.free;
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getRateLimitHeaders(key: string, tier: string = 'free'): Record<string, string> {
  const result = checkRateLimit(key, tier);
  return {
    'X-RateLimit-Limit': String(LIMITS[tier]?.maxRequests || LIMITS.free.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
