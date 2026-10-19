import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Upload action tests
 * -------------------
 * The storage client is mocked: these pin the contract (private bucket,
 * signed upload URL, sanitised paths, mime rejection) without touching
 * Supabase Storage.
 */

const mocks = vi.hoisted(() => ({
  createSignedUploadUrl: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => ({ storage: { from: mocks.from } }),
}));

import { getSignedUploadUrl } from "./upload";

beforeEach(() => {
  mocks.createSignedUploadUrl.mockReset();
  mocks.from.mockReset();
  mocks.from.mockReturnValue({
    createSignedUploadUrl: mocks.createSignedUploadUrl,
  });
  mocks.createSignedUploadUrl.mockResolvedValue({
    data: {
      signedUrl: "https://storage.example.com/object/upload/sign/payment-proofs/x?token=t",
      token: "t",
      path: "ignored",
    },
    error: null,
  });
});

describe("getSignedUploadUrl", () => {
  it("rejects non-image content types without touching storage", async () => {
    const result = await getSignedUploadUrl("proof.pdf", "application/pdf");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/png, jpeg, or webp/i);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("mints a signed upload URL in the private payment-proofs bucket", async () => {
    const result = await getSignedUploadUrl("receipt.png", "image/png");

    expect(mocks.from).toHaveBeenCalledWith("payment-proofs");

    const path = mocks.createSignedUploadUrl.mock.calls[0]?.[0] as string;
    expect(path).toMatch(/^\d{4}\/\d{2}\/[0-9a-f-]{36}-receipt\.png$/);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.url).toContain("storage.example.com");
      expect(result.fileUrl).toBe(path);
    }
  });

  it("sanitises messy file names and strips path traversal", async () => {
    await getSignedUploadUrl("../../etc/My Receipt (1)!!.PNG", "image/jpeg");

    const path = mocks.createSignedUploadUrl.mock.calls[0]?.[0] as string;
    expect(path).not.toContain("..");
    expect(path).not.toContain(" ");
    expect(path).toMatch(/-my-receipt-1-\.png$/);
  });

  it("returns a clean failure when storage rejects the request", async () => {
    mocks.createSignedUploadUrl.mockResolvedValue({
      data: null,
      error: { message: "bucket not found" },
    });

    const result = await getSignedUploadUrl("receipt.png", "image/png");

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/try again/i);
    // The failure shape must not leak storage internals or a URL.
    expect(result).not.toHaveProperty("url");
  });
});
