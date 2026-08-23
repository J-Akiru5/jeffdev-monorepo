import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getCachedResponse, cacheResponse } from "./cache";

describe("cache — fail-open behavior", () => {
  const ENV_KEYS = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] as const;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    // Redis.fromEnv() throws when these are unset — simulate an outage
    // regardless of what's set in the ambient environment.
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    for (const k of ENV_KEYS) delete process.env[k];
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("getCachedResponse returns null instead of throwing", async () => {
    await expect(getCachedResponse("some:key")).resolves.toBeNull();
  });

  it("cacheResponse no-ops instead of throwing", async () => {
    await expect(cacheResponse("some:key", "value")).resolves.toBeUndefined();
  });
});
