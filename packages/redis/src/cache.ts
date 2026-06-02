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
 * Returns null if the key does not exist or has expired.
 */
export async function getCachedResponse(key: string): Promise<string | null> {
  return await getRedis().get<string>(key);
}

/**
 * Store a string value with an optional TTL (default: 300 seconds / 5 minutes).
 */
export async function cacheResponse(
  key: string,
  value: string,
  ttlSeconds: number = 300,
): Promise<void> {
  await getRedis().set(key, value, { ex: ttlSeconds });
}
