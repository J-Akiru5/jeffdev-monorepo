import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Waitlist action tests
 * ---------------------
 * The Supabase admin client and the email sender are mocked: these tests pin
 * the contract (correct table, dedupe, best-effort emails, typed results)
 * without touching the live database or Resend.
 */

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  from: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: mocks.sendEmail,
  EMAIL_ADDRESSES: {
    contact: "contact@syntaxure.dev",
    hire: "hire@syntaxure.dev",
    noreply: "noreply@syntaxure.dev",
  },
}));

import { joinWaitlist } from "./waitlist";

beforeEach(() => {
  mocks.insert.mockReset();
  mocks.from.mockReset();
  mocks.sendEmail.mockReset();
  mocks.from.mockReturnValue({ insert: mocks.insert });
  mocks.insert.mockResolvedValue({ error: null });
  mocks.sendEmail.mockResolvedValue({ success: true });
});

describe("joinWaitlist", () => {
  it("rejects invalid emails without touching the database", async () => {
    const result = await joinWaitlist({ email: "not-an-email" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/valid email/i);
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("records a normalised signup and sends both emails", async () => {
    const result = await joinWaitlist({ email: "  Visitor@Example.COM  " });

    expect(result.success).toBe(true);
    expect(result.duplicate).toBeUndefined();

    expect(mocks.from).toHaveBeenCalledWith("waitlist_entries");
    expect(mocks.insert).toHaveBeenCalledWith({
      email: "visitor@example.com",
      status: "pending",
    });

    expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
    const confirmation = mocks.sendEmail.mock.calls[0]?.[0] as {
      to: string;
    };
    expect(confirmation.to).toBe("visitor@example.com");
    const notification = mocks.sendEmail.mock.calls[1]?.[0] as {
      to: string;
      subject: string;
    };
    expect(notification.to).toBe("contact@syntaxure.dev");
    expect(notification.subject).toContain("visitor@example.com");
  });

  it("treats a duplicate email as success without re-sending emails", async () => {
    mocks.insert.mockResolvedValue({
      error: { code: "23505", message: "duplicate key value" },
    });

    const result = await joinWaitlist({ email: "visitor@example.com" });

    expect(result.success).toBe(true);
    expect(result.duplicate).toBe(true);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("fails cleanly on an unexpected database error", async () => {
    mocks.insert.mockResolvedValue({
      error: { code: "42P01", message: "relation does not exist" },
    });

    const result = await joinWaitlist({ email: "visitor@example.com" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/try again/i);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it("still succeeds when email delivery fails", async () => {
    mocks.sendEmail.mockRejectedValue(new Error("resend down"));

    const result = await joinWaitlist({ email: "visitor@example.com" });

    expect(result.success).toBe(true);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("accepts the legacy string signature", async () => {
    const result = await joinWaitlist("visitor@example.com");

    expect(result.success).toBe(true);
    expect(mocks.insert).toHaveBeenCalledWith({
      email: "visitor@example.com",
      status: "pending",
    });
  });
});
