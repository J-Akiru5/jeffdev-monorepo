import { describe, it, expect } from "vitest";
import { computeCountTrend, computeMonthlyTrend, computeValueTrend, splitByPeriod } from "./trends";

describe("computeCountTrend", () => {
  it("returns up direction when current has items and previous is empty", () => {
    const current: { created_at?: string }[] = [{}];
    const previous: { created_at?: string }[] = [];
    expect(computeCountTrend(current, previous)).toEqual({
      value: 100,
      direction: "up",
    });
  });

  it("returns neutral when both are empty", () => {
    expect(computeCountTrend([], [])).toEqual({
      value: 0,
      direction: "neutral",
    });
  });

  it("computes percent increase correctly", () => {
    const current = Array(10).fill({});
    const previous = Array(5).fill({});
    expect(computeCountTrend(current, previous)).toEqual({
      value: 100,
      direction: "up",
    });
  });

  it("computes percent decrease correctly", () => {
    const current = Array(5).fill({});
    const previous = Array(10).fill({});
    expect(computeCountTrend(current, previous)).toEqual({
      value: 50,
      direction: "down",
    });
  });

  it("returns neutral when counts are equal", () => {
    const current = Array(5).fill({});
    const previous = Array(5).fill({});
    expect(computeCountTrend(current, previous)).toEqual({
      value: 0,
      direction: "neutral",
    });
  });

  it("rounds to nearest integer", () => {
    const current = Array(3).fill({});
    const previous = Array(10).fill({}); // (3-10)/10 = -70%
    expect(computeCountTrend(current, previous)).toEqual({
      value: 70,
      direction: "down",
    });
  });
});

describe("splitByPeriod", () => {
  it("splits records into current and previous month buckets", () => {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 2)
      .toISOString();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15)
      .toISOString();
    const older = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      .toISOString();

    const records = [
      { created_at: currentStart },
      { created_at: lastMonth },
      { created_at: older },
      {}, // no created_at — should be skipped
    ];

    const { current, previous } = splitByPeriod(records);
    expect(current).toHaveLength(1);
    expect(previous).toHaveLength(1);
  });

  it("handles empty array", () => {
    const { current, previous } = splitByPeriod([]);
    expect(current).toHaveLength(0);
    expect(previous).toHaveLength(0);
  });

  it("skips records without created_at", () => {
    const records = [{}, { created_at: undefined }, { name: "test" }];
    const { current, previous } = splitByPeriod(records);
    expect(current).toHaveLength(0);
    expect(previous).toHaveLength(0);
  });
});

describe("computeMonthlyTrend", () => {
  it("returns up for records created this month", () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15)
      .toISOString();
    const records = [{ created_at: thisMonth }, { created_at: thisMonth }];
    const result = computeMonthlyTrend(records);
    expect(result.direction).toBe("up");
    expect(result.value).toBeGreaterThan(0);
  });

  it("returns neutral for empty records", () => {
    expect(computeMonthlyTrend([])).toEqual({
      value: 0,
      direction: "neutral",
    });
  });
});

describe("computeValueTrend", () => {
  it("returns up when current has value and previous is empty", () => {
    expect(computeValueTrend([{ amount: 100 }], [])).toEqual({
      value: 100,
      direction: "up",
    });
  });

  it("computes MRR growth correctly", () => {
    const current = [{ amount: 5000 }, { amount: 3000 }];
    const previous = [{ amount: 4000 }];
    expect(computeValueTrend(current, previous)).toEqual({
      value: 100,
      direction: "up",
    });
  });

  it("handles string amounts", () => {
    const current = [{ amount: "100" }];
    const previous = [{ amount: "50" }];
    expect(computeValueTrend(current, previous)).toEqual({
      value: 100,
      direction: "up",
    });
  });

  it("returns neutral when both sums are zero", () => {
    expect(computeValueTrend([{ amount: 0 }], [{ amount: 0 }])).toEqual({
      value: 0,
      direction: "neutral",
    });
  });
});
