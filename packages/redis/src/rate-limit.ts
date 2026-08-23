/**
 * Shared Upstash-backed rate limiter for the monorepo.
 *
 * Works in serverless (Vercel) and edge runtimes because it uses
 * Upstash Redis over HTTP — no persistent TCP connection required.
 *
 * Usage:
 *   import { checkRateLimit, getRateLimitHeaders } from "@syntaxure/redis";
 *   const result = await checkRateLimit("ip:1.2.3.4", "assistant");
 *   if (!result.allowed) return 429;
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Redis singleton
// ---------------------------------------------------------------------------

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        "Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
      );
    }
    redis = new Redis({ url, token });
  }
  return redis;
}

// ---------------------------------------------------------------------------
// Tier definitions  (all windows are 60 s)
// ---------------------------------------------------------------------------

export type RateLimitTier =
  | "free"
  | "default"
  | "strict"
  | "pro"
  | "team"
  | "enterprise";

export interface TierConfig {
  /** Maximum requests per window. */
  maxRequests: number;
  /** Window duration string (Upstash format). */
  window: `${number} ${"ms" | "s" | "m" | "h"}`;
}

const TIER_LIMITS: Record<RateLimitTier, TierConfig> = {
  free: { maxRequests: 20, window: "60 s" },
  default: { maxRequests: 60, window: "60 s" },
  strict: { maxRequests: 10, window: "60 s" },
  pro: { maxRequests: 120, window: "60 s" },
  team: { maxRequests: 300, window: "60 s" },
  enterprise: { maxRequests: 1000, window: "60 s" },
};

// ---------------------------------------------------------------------------
// Pre-configured rate limiters (one per context × tier combination)
// ---------------------------------------------------------------------------

type RatelimitKey = `${string}:${RateLimitTier}`;
const instances = new Map<string, Ratelimit>();

function getRatelimit(context: string, tier: RateLimitTier): Ratelimit {
  const key: RatelimitKey = `${context}:${tier}`;
  let instance = instances.get(key);
  if (!instance) {
    const cfg = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    instance = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(cfg.maxRequests, cfg.window),
      analytics: true,
      prefix: `rl:${context}:${tier}`,
    });
    instances.set(key, instance);
  }
  return instance;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  /** Whether the request is allowed. */
  allowed: boolean;
  /** Maximum requests in the current window. */
  limit: number;
  /** Requests remaining in the current window. */
  remaining: number;
  /** Unix-ms timestamp when the window resets. */
  reset: number;
  /**
   * Set when Redis was unreachable/unconfigured and the request was
   * allowed through as a fail-open fallback rather than actually checked.
   */
  degraded?: boolean;
}

/**
 * Check a rate limit for the given key within a named context.
 *
 * Fails open: if Upstash Redis is unconfigured or unreachable, the request
 * is allowed through (with `degraded: true`) instead of throwing. Burst
 * throttling is best-effort — quota enforcement (project/rule/generation
 * caps) lives in Postgres and is unaffected by a Redis outage.
 *
 * @param key     Unique identifier (IP address, user ID, etc.)
 * @param context Which rate-limit namespace to use ("assistant" | "api" | custom)
 * @param tier    User tier — determines the request cap (default: "free")
 */
export async function checkRateLimit(
  key: string,
  context: string,
  tier: RateLimitTier = "free",
): Promise<RateLimitResult> {
  try {
    const ratelimit = getRatelimit(context, tier);
    const { success, limit, remaining, reset } = await ratelimit.limit(key);
    return { allowed: success, limit, remaining, reset };
  } catch (error) {
    console.error(
      `[@syntaxure/redis] checkRateLimit failed for context="${context}" tier="${tier}" — failing open:`,
      error,
    );
    const cfg = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    return {
      allowed: true,
      limit: cfg.maxRequests,
      remaining: cfg.maxRequests,
      reset: Date.now() + 60_000,
      degraded: true,
    };
  }
}

/**
 * Build standard `X-RateLimit-*` response headers from a result.
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
}
