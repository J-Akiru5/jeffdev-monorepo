import { describe, it, expect, beforeEach } from "vitest";
import {
  getCached,
  setCached,
  getCacheKey,
  invalidateCache,
  getCacheStats,
  resetCacheStats,
  loadDiskCacheIntoMemory,
  clearMemoryCache,
  hasInMemory,
} from "./cache.js";

describe("cache", () => {
  beforeEach(() => {
    resetCacheStats();
    invalidateCache();
  });

  describe("getCacheKey", () => {
    it("builds key from projectId and ruleIds", () => {
      const key = getCacheKey("proj-1", ["a", "b", "c"]);
      expect(key).toBe("proj-1_a,b,c");
    });

    it("sorts ruleIds for deterministic keys", () => {
      const key1 = getCacheKey("p", ["z", "a", "m"]);
      const key2 = getCacheKey("p", ["a", "m", "z"]);
      expect(key1).toBe(key2);
    });

    it("uses 'global' when projectId is undefined", () => {
      const key = getCacheKey(undefined, ["r1"]);
      expect(key).toBe("global_r1");
    });
  });

  describe("setCached / getCached", () => {
    it("stores and retrieves a value", () => {
      setCached("test-key", { foo: "bar" });
      const result = getCached<{ foo: string }>("test-key");
      expect(result).toEqual({ foo: "bar" });
    });

    it("returns null for missing key", () => {
      const result = getCached("nonexistent");
      expect(result).toBeNull();
    });

    it("respects custom TTL", async () => {
      setCached("ttl-key", "data", 10); // 10ms TTL
      expect(getCached("ttl-key")).toBe("data");
      await new Promise((r) => setTimeout(r, 20));
      expect(getCached("ttl-key")).toBeNull();
    });

    it("evicts oldest entries when exceeding MAX_ENTRIES", () => {
      // Fill the cache beyond default MAX_ENTRIES (200)
      // Use a batch to ensure eviction triggers
      for (let i = 0; i < 250; i++) {
        setCached(`evict-key-${i}`, i, 60000);
      }
      // Some entries should have been evicted
      const stats = getCacheStats();
      expect(stats.entries).toBeLessThanOrEqual(200);
    });

    it("tracks hit/miss stats correctly", () => {
      resetCacheStats();
      expect(getCacheStats().hits).toBe(0);
      expect(getCacheStats().misses).toBe(0);

      getCached("no-exist");
      expect(getCacheStats().misses).toBe(1);

      setCached("hit-test", "value");
      getCached("hit-test");
      expect(getCacheStats().hits).toBe(1);
    });
  });

  describe("invalidateCache", () => {
    it("removes entries with matching project prefix", () => {
      setCached("proj-a_key1", "val1");
      setCached("proj-b_key2", "val2");
      setCached("proj-a_key3", "val3");

      invalidateCache("proj-a");

      expect(getCached("proj-a_key1")).toBeNull();
      expect(getCached("proj-a_key3")).toBeNull();
      expect(getCached("proj-b_key2")).toBe("val2");
    });

    it("clears all entries when no project specified", () => {
      setCached("k1", "v1");
      setCached("k2", "v2");
      invalidateCache();

      expect(getCached("k1")).toBeNull();
      expect(getCached("k2")).toBeNull();
    });
  });

  describe("resetCacheStats", () => {
    it("resets hit/miss counters", () => {
      getCached("miss");

      resetCacheStats();
      const stats = getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe("loadDiskCacheIntoMemory", () => {
    it("loads valid entries from disk and skips expired", () => {
      setCached("disk-entry-1", "hello", 60000);
      setCached("disk-entry-2", "world", -1);

      clearMemoryCache();
      expect(hasInMemory("disk-entry-1")).toBe(false);

      const loaded = loadDiskCacheIntoMemory();
      expect(hasInMemory("disk-entry-1")).toBe(true);
      expect(hasInMemory("disk-entry-2")).toBe(false);
      expect(loaded).toBeGreaterThanOrEqual(1);
    });
  });
});
