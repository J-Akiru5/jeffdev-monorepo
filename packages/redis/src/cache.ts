/**
 * Shared Upstash-backed response cache for the monorepo.
 *
 * Provides persistent, distributed caching for AI assistant responses
 * across serverless instances. Unlike in-memory Map() caches, this
 * survives cold starts and is shared across all lambda instances.
 *
 * Usage:
 *   import { getCachedResponse, cacheResponse } from "@syntaxure/redis";
 *   const cached = await getCachedResponse("assistant:engine:hello");
 *   if (cached) return cached;
 *   const response = await generateResponse();
 *   await cacheResponse("assistant:engine:hello", response, 300);
 */

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

/**
 * Retrieve a cached string value by key.
 * Returns null if the key does not exist, has expired, or Redis is
 * unconfigured/unreachable — a cache miss must never be fatal.
 */
export async function getCachedResponse(key: string): Promise<string | null> {
  try {
    return await getRedis().get<string>(key);
  } catch (error) {
    console.error(`[@syntaxure/redis] getCachedResponse failed for key="${key}" — treating as cache miss:`, error);
    return null;
  }
}

/**
 * Store a string value with an optional TTL (default: 300 seconds / 5 minutes).
 * No-ops (instead of throwing) if Redis is unconfigured/unreachable.
 */
export async function cacheResponse(
  key: string,
  value: string,
  ttlSeconds: number = 300,
): Promise<void> {
  try {
    await getRedis().set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error(`[@syntaxure/redis] cacheResponse failed for key="${key}" — skipping cache write:`, error);
  }
}
