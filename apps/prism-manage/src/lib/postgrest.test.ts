import { describe, expect, it } from "vitest";
import { sanitizeIlikeTerm, toIlikePattern } from "./postgrest";

describe("sanitizeIlikeTerm", () => {
  it("strips PostgREST-reserved characters", () => {
    expect(sanitizeIlikeTerm('why "did" we, pick (supabase)* 100%_x\\y')).toBe(
      "why did we pick supabase 100 x y",
    );
  });

  it("collapses whitespace and trims", () => {
    expect(sanitizeIlikeTerm("  hello   world  ")).toBe("hello world");
  });

  it("caps the term length at 80 characters", () => {
    expect(sanitizeIlikeTerm("a".repeat(200)).length).toBe(80);
  });

  it("leaves ordinary text intact", () => {
    expect(sanitizeIlikeTerm("why did we pick Supabase?")).toBe(
      "why did we pick Supabase?",
    );
  });

  it("returns an empty string for purely reserved input", () => {
    expect(sanitizeIlikeTerm("%%%,")).toBe("");
  });
});

describe("toIlikePattern", () => {
  it("wraps the sanitized term in wildcards", () => {
    expect(toIlikePattern("hello world")).toBe("%hello world%");
    expect(toIlikePattern("hello, world")).toBe("%hello world%");
  });
});
