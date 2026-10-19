import { describe, expect, it } from "vitest";
import { isRecurrence, nextOccurrenceDate } from "./recurrence";

describe("nextOccurrenceDate", () => {
  const now = new Date("2026-10-19T12:00:00Z");

  it("advances a future base date by the interval", () => {
    expect(nextOccurrenceDate("2026-10-25", "daily", now)).toBe("2026-10-26");
    expect(nextOccurrenceDate("2026-10-25", "weekly", now)).toBe("2026-11-01");
    expect(nextOccurrenceDate("2026-10-25", "monthly", now)).toBe("2026-11-25");
  });

  it("measures from now when the base date is in the past", () => {
    expect(nextOccurrenceDate("2026-10-01", "daily", now)).toBe("2026-10-20");
    expect(nextOccurrenceDate("2026-10-01", "weekly", now)).toBe("2026-10-26");
    expect(nextOccurrenceDate("2026-09-01", "monthly", now)).toBe("2026-11-19");
  });

  it("handles a missing due date (from now)", () => {
    expect(nextOccurrenceDate(null, "weekly", now)).toBe("2026-10-26");
    expect(nextOccurrenceDate(undefined, "daily", now)).toBe("2026-10-20");
  });

  it("handles month-end arithmetic", () => {
    // Jan 31 + 1 month rolls into March (JS Date semantics) — acceptable for v1
    expect(
      nextOccurrenceDate("2026-11-30", "monthly", new Date("2026-11-01")),
    ).toBe("2026-12-30");
  });
});

describe("isRecurrence", () => {
  it("accepts only the known values", () => {
    expect(isRecurrence("daily")).toBe(true);
    expect(isRecurrence("weekly")).toBe(true);
    expect(isRecurrence("monthly")).toBe(true);
    expect(isRecurrence("yearly")).toBe(false);
    expect(isRecurrence(null)).toBe(false);
  });
});
