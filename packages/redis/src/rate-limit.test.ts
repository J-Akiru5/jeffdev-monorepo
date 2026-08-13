import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "./rate-limit.js";

describe("checkRateLimit — fail-open behavior", () => {
  const ENV_KEYS = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] as const;
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    // Force getRedis() to throw by making Upstash look unconfigured,
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

  it("allows the request through when Redis is unconfigured", async () => {
    const result = await checkRateLimit("user_1", "test-fail-open", "free");
    expect(result.allowed).toBe(true);
    expect(result.degraded).toBe(true);
  });

  it("reports the tier's own limit as the header values, not a checked count", async () => {
    const result = await checkRateLimit("user_2", "test-fail-open", "pro");
    expect(result.allowed).toBe(true);
    expect(result.degraded).toBe(true);
    expect(result.limit).toBe(120);
    expect(result.remaining).toBe(120);
  });

  it("does not throw even when called repeatedly", async () => {
    await expect(checkRateLimit("user_3", "test-fail-open")).resolves.not.toThrow();
    await expect(checkRateLimit("user_3", "test-fail-open")).resolves.not.toThrow();
  });
});
