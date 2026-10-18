import { afterEach, describe, expect, it, vi } from "vitest";
import { logger, timed } from "./log";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("writes one JSON line with level, service, msg and fields", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("task.created", { taskId: "t1" });

    expect(spy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(parsed.level).toBe("info");
    expect(parsed.service).toBe("prism-manage");
    expect(parsed.msg).toBe("task.created");
    expect(parsed.taskId).toBe("t1");
    expect(typeof parsed.ts).toBe("string");
  });

  it("routes warn and error to the right console methods", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.warn("something.odd");
    logger.error("something.broken");

    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
  });
});

describe("timed", () => {
  it("logs outcome + duration and returns the result", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await timed("op", { k: 1 }, async () => 42);

    expect(result).toBe(42);
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(parsed.outcome).toBe("ok");
    expect(parsed.k).toBe(1);
    expect(typeof parsed.durationMs).toBe("number");
  });

  it("logs failures and re-throws", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      timed("op", {}, async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    const parsed = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(parsed.outcome).toBe("error");
    expect(parsed.error).toBe("boom");
  });
});
