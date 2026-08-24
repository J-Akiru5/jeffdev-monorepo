import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const captureException = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...a: unknown[]) => captureException(...a),
}));

import { logError } from "@/lib/log-error";

describe("logError", () => {
  const originalConsole = console.error;
  const ce = vi.fn();

  beforeEach(() => {
    captureException.mockClear();
    console.error = ce as unknown as typeof console.error;
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://test@sentry.example.com/1";
  });
  afterEach(() => {
    console.error = originalConsole;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });

  it("always writes to console with original args", () => {
    logError("generate", "Gemini API error:", new Error("boom"));
    expect(ce).toHaveBeenCalled();
    const args = ce.mock.calls[0] as unknown[];
    expect(args[0]).toBe("Gemini API error:");
  });

  it("captures Error objects to Sentry with scope tag", () => {
    const err = new Error("boom");
    logError("generate", "Gemini API error:", err);
    expect(captureException).toHaveBeenCalledWith(err, expect.objectContaining({ tags: { scope: "generate" } }));
  });

  it("wraps string-only failures into an Error for Sentry", () => {
    logError("paypal-webhook", "Signature verification failed");
    expect(captureException).toHaveBeenCalledTimes(1);
    const [ex] = captureException.mock.calls[0] as unknown[] as [Error];
    expect(ex.message).toContain("Signature verification failed");
  });

  it("passes plain objects through as extra context", () => {
    logError("x", "failed", { id: 7 });
    const call = captureException.mock.calls[0] as unknown[];
    expect((call[1] as { extra: { arg1: { id: number } } }).extra.arg1).toEqual({ id: 7 });
  });

  it("is a Sentry no-op when no DSN configured (local dev)", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    logError("x", new Error("local only"));
    expect(captureException).not.toHaveBeenCalled();
  });
});
