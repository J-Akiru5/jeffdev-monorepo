import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

// Use unique keys per test to avoid shared state between tests
let testCounter = 0;
function uniqueKey(): string {
  testCounter++;
  return `test_user_${testCounter}`;
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("allows requests within limit", () => {
    const key = uniqueKey();
    const result = checkRateLimit(key, "free");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19); // free = 20 max - 1 used
  });

  it("tracks remaining quota correctly", () => {
    const key = uniqueKey();
    const limit = 20; // free tier maxRequests

    // Use all but one
    for (let i = 0; i < limit - 1; i++) {
      checkRateLimit(key, "free");
    }

    const result = checkRateLimit(key, "free");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("blocks requests when limit exceeded", () => {
    const key = uniqueKey();
    const limit = 20; // free tier maxRequests

    // Use all requests
    for (let i = 0; i < limit; i++) {
      checkRateLimit(key, "free");
    }

    const result = checkRateLimit(key, "free");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("refreshes after the time window", () => {
    const key = uniqueKey();
    const limit = 20;

    // Exhaust quota
    for (let i = 0; i < limit; i++) {
      checkRateLimit(key, "free");
    }

    // Advance time beyond 60s window
    vi.advanceTimersByTime(60_001);

    const result = checkRateLimit(key, "free");
    expect(result.allowed).toBe(true);
  });

  it("returns proper remaining count", () => {
    const key = uniqueKey();
    // Use 10 requests
    for (let i = 0; i < 10; i++) {
      checkRateLimit(key, "free");
    }

    const result = checkRateLimit(key, "free");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9); // 20 - 10 - 1 = 9
  });

  it("strict tier has lower limit than default", () => {
    const strictKey = uniqueKey();
    const defaultKey = uniqueKey();

    for (let i = 0; i < 10; i++) {
      checkRateLimit(strictKey, "strict");
      checkRateLimit(defaultKey, "default");
    }

    const strictResult = checkRateLimit(strictKey, "strict");
    const defaultResult = checkRateLimit(defaultKey, "default");

    // strict has 10 max, default has 60 max
    expect(strictResult.remaining).toBeLessThan(defaultResult.remaining);
  });
});

describe("getRateLimitHeaders", () => {
  it("returns headers object", () => {
    const headers = getRateLimitHeaders("test_user", "free");
    expect(headers).toHaveProperty("X-RateLimit-Limit");
    expect(headers).toHaveProperty("X-RateLimit-Remaining");
    expect(headers).toHaveProperty("X-RateLimit-Reset");
  });

  it("returns numeric header values", () => {
    const headers = getRateLimitHeaders("test_user", "pro");
    expect(Number(headers["X-RateLimit-Limit"])).toBeGreaterThan(0);
    expect(Number(headers["X-RateLimit-Remaining"])).toBeGreaterThanOrEqual(0);
    expect(Number(headers["X-RateLimit-Reset"])).toBeGreaterThan(0);
  });
});
