import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @syntaxure/redis before importing the module under test
vi.mock("@syntaxure/redis", () => {
  let counter = 0;

  return {
    checkRateLimit: vi.fn(async (key: string, _context: string, tier: string = "free") => {
      counter++;
      const limits: Record<string, number> = {
        free: 20,
        strict: 10,
        default: 60,
        pro: 120,
        team: 300,
        enterprise: 1000,
      };
      const max = limits[tier] ?? 20;
      const remaining = Math.max(0, max - counter);
      return {
        allowed: counter <= max,
        limit: max,
        remaining,
        reset: Date.now() + 60_000,
      };
    }),
    getRateLimitHeaders: vi.fn((result: { limit: number; remaining: number; reset: number }) => ({
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
    })),
  };
});

import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

describe("checkRateLimit (Upstash-backed)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows requests within limit", async () => {
    const result = await checkRateLimit("user_1", "free");
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(20);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it("returns proper structure", async () => {
    const result = await checkRateLimit("user_2", "pro");
    expect(result).toHaveProperty("allowed");
    expect(result).toHaveProperty("limit");
    expect(result).toHaveProperty("remaining");
    expect(result).toHaveProperty("reset");
    expect(result.limit).toBe(120);
  });

  it("defaults to free tier", async () => {
    const result = await checkRateLimit("user_3");
    expect(result.limit).toBe(20);
  });

  it("delegates to @syntaxure/redis checkRateLimit", async () => {
    const { checkRateLimit: mockCheck } = await import("@syntaxure/redis");
    await checkRateLimit("user_4", "team");
    expect(mockCheck).toHaveBeenCalledWith("user_4", "api", "team");
  });
});

describe("getRateLimitHeaders", () => {
  it("returns headers object", async () => {
    const result = await checkRateLimit("header_user", "free");
    const headers = getRateLimitHeaders(result);
    expect(headers).toHaveProperty("X-RateLimit-Limit");
    expect(headers).toHaveProperty("X-RateLimit-Remaining");
    expect(headers).toHaveProperty("X-RateLimit-Reset");
  });

  it("returns numeric header values", async () => {
    const result = await checkRateLimit("header_user_2", "pro");
    const headers = getRateLimitHeaders(result);
    expect(Number(headers["X-RateLimit-Limit"])).toBeGreaterThan(0);
    expect(Number(headers["X-RateLimit-Remaining"])).toBeGreaterThanOrEqual(0);
    expect(Number(headers["X-RateLimit-Reset"])).toBeGreaterThan(0);
  });
});
