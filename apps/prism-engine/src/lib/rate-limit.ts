const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup to prevent unbounded memory growth
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupExpired(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt) {
      requestCounts.delete(key);
    }
  }
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60_000, maxRequests: 60 },
  strict: { windowMs: 60_000, maxRequests: 10 },
  free: { windowMs: 60_000, maxRequests: 20 },
  pro: { windowMs: 60_000, maxRequests: 120 },
  team: { windowMs: 60_000, maxRequests: 300 },
  enterprise: { windowMs: 60_000, maxRequests: 1000 },
};

export function checkRateLimit(
  key: string,
  tier: string = "free",
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupExpired();
  const now = Date.now();
  const config = (LIMITS[tier] || LIMITS.free)!;
  const entry = requestCounts.get(key);

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getRateLimitHeaders(
  key: string,
  tier: string = "free",
): Record<string, string> {
  const result = checkRateLimit(key, tier);
  return {
    "X-RateLimit-Limit": String(
      LIMITS[tier]?.maxRequests || LIMITS.free!.maxRequests,
    ),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}
