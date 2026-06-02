/**
 * Rate limiting for Prism Engine API routes.
 *
 * Delegates to the shared Upstash-backed rate limiter in @syntaxure/ui.
 * Supports tier-based limits: free, default, strict, pro, team, enterprise.
 */

import {
  checkRateLimit as checkUpstashRateLimit,
  getRateLimitHeaders as getUpstashHeaders,
  type RateLimitTier,
  type RateLimitResult,
} from "@syntaxure/redis";

export type { RateLimitTier as Tier, RateLimitResult };

const API_CONTEXT = "api";

/**
 * Check a rate limit for the given key and tier.
 *
 * @param key  Unique identifier (e.g. `${userId}:${endpoint}`)
 * @param tier User tier — determines the request cap (default: "free")
 */
export async function checkRateLimit(
  key: string,
  tier: string = "free",
): Promise<RateLimitResult> {
  return checkUpstashRateLimit(key, API_CONTEXT, tier as RateLimitTier);
}

/**
 * Build standard `X-RateLimit-*` response headers from a result.
 */
export function getRateLimitHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return getUpstashHeaders(result);
}
