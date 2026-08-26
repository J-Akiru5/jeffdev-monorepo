import { describe, it, expect } from "vitest";
import { aggregateStatus } from "../engine-health";

describe("aggregateStatus", () => {
  it("ok when supabase fine and redis fine", () => {
    expect(aggregateStatus(true, true, true)).toBe("ok");
  });
  it("ok when redis unconfigured (feature absent)", () => {
    expect(aggregateStatus(true, false, false)).toBe("ok");
  });
  it("degraded when supabase down regardless of redis", () => {
    expect(aggregateStatus(false, true, true)).toBe("degraded");
    expect(aggregateStatus(false, false, false)).toBe("degraded");
  });
  it("degraded when redis configured but unreachable", () => {
    expect(aggregateStatus(true, true, false)).toBe("degraded");
  });
});
