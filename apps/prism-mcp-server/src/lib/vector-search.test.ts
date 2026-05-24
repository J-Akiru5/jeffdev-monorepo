import { describe, it, expect } from "vitest";
import {
  cosineSimilarity,
  findTopKSimilar,
  extractRelevantSnippet,
} from "./vector-search.js";

describe("cosineSimilarity", () => {
  it("should return 1 for identical vectors", () => {
    const vec = [1, 2, 3, 4, 5];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
  });

  it("should return 0 for perpendicular vectors", () => {
    const vecA = [1, 0];
    const vecB = [0, 1];
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(0, 5);
  });

  it("should return -1 for opposite vectors", () => {
    const vecA = [1, 2, 3];
    const vecB = [-1, -2, -3];
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(-1, 5);
  });

  it("should return positive value for similar vectors", () => {
    const vecA = [1, 2, 3, 4, 5];
    const vecB = [1, 2, 3, 4, 6];
    const sim = cosineSimilarity(vecA, vecB);
    expect(sim).toBeGreaterThan(0.9);
    expect(sim).toBeLessThan(1);
  });

  it("should throw for mismatched lengths", () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow("same length");
  });

  it("should return 0 when magnitude is 0", () => {
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
  });

  it("should handle single-element vectors", () => {
    expect(cosineSimilarity([5], [5])).toBeCloseTo(1, 5);
    expect(cosineSimilarity([5], [-5])).toBeCloseTo(-1, 5);
  });
});

describe("findTopKSimilar", () => {
  const items = [
    { id: "a", embedding: [1, 0, 0], name: "exact-match" },
    { id: "b", embedding: [0.9, 0.1, 0], name: "close-match" },
    { id: "c", embedding: [0, 1, 0], name: "perpendicular" },
    { id: "d", embedding: [-1, 0, 0], name: "opposite" },
    { id: "e", embedding: undefined, name: "no-embedding" },
  ];

  const query = [1, 0, 0];

  it("should return top K similar items sorted by similarity", () => {
    const results = findTopKSimilar(query, items, 3);
    expect(results).toHaveLength(3);
    expect(results[0]!.similarity).toBeGreaterThan(results[1]!.similarity);
    expect(results[1]!.similarity).toBeGreaterThan(results[2]!.similarity);
  });

  it("should filter out items without embeddings", () => {
    const results = findTopKSimilar(query, items, 10);
    const hasNoEmbedding = results.some((r) => r.id === "e");
    expect(hasNoEmbedding).toBe(false);
  });

  it("should return exact match first", () => {
    const results = findTopKSimilar(query, items, 5);
    expect(results[0]!.id).toBe("a");
    expect(results[0]!.similarity).toBeCloseTo(1, 5);
  });

  it("should return empty array for empty items", () => {
    const results = findTopKSimilar(query, [], 5);
    expect(results).toHaveLength(0);
  });

  it("should respect k limit", () => {
    const results = findTopKSimilar(query, items, 1);
    expect(results).toHaveLength(1);
  });
});

describe("extractRelevantSnippet", () => {
  it("should return full text when shorter than maxLength", () => {
    const text = "Short text.";
    expect(extractRelevantSnippet(text, 200)).toBe(text);
  });

  it("should truncate at sentence boundary when possible", () => {
    const text =
      "This is the first sentence. This is the second sentence. This is the third sentence that goes on and on.";
    const result = extractRelevantSnippet(text, 50);
    expect(result).toContain("first sentence");
    expect(result.endsWith(".")).toBe(true);
  });

  it("should truncate at word boundary when no period found", () => {
    const text = "a".repeat(30) + " " + "b".repeat(30) + " " + "c".repeat(30);
    const result = extractRelevantSnippet(text, 40);
    expect(result.length).toBeLessThanOrEqual(43); // 40 + '...'
    expect(result.endsWith("...")).toBe(true);
  });

  it("should handle empty text", () => {
    expect(extractRelevantSnippet("", 100)).toBe("");
  });

  it("should handle text exactly at maxLength", () => {
    const text = "x".repeat(100);
    expect(extractRelevantSnippet(text, 100)).toBe(text);
  });
});
