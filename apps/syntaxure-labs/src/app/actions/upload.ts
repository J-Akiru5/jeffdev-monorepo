"use server";

/**
 * Upload Server Actions
 * ---------------------
 * Mints pre-signed upload URLs for client-side direct uploads.
 *
 * Payment proofs (GCash flow) go to the private `payment-proofs` bucket:
 * - the browser PUTs the file straight to the signed URL
 * - `payments.proof_url` stores the bucket-relative path, not a public URL
 *   (proofs contain payer names and amounts; admins sign read URLs on demand)
 */

import { randomUUID } from "crypto";
import { getAdminClient } from "@/lib/supabase/admin";

const PAYMENT_PROOFS_BUCKET = "payment-proofs";
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_NAME_LENGTH = 80;

type SignedUploadResult =
  | { success: true; url: string; fileUrl: string }
  | { success: false; error: string };

function safeFileName(filename: string): string {
  const base = filename.split(/[\\/]/).pop() || "upload";
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_NAME_LENGTH);
  return cleaned || "upload";
}

export async function getSignedUploadUrl(
  filename: string,
  filetype: string,
): Promise<SignedUploadResult> {
  if (!ALLOWED_TYPES.has(filetype)) {
    return { success: false, error: "Only PNG, JPEG, or WebP images are accepted" };
  }
  if (!filename || typeof filename !== "string") {
    return { success: false, error: "A file name is required" };
  }

  try {
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const path = `${now.getUTCFullYear()}/${month}/${randomUUID()}-${safeFileName(filename)}`;

    const supabase = getAdminClient();
    const { data, error } = await supabase.storage
      .from(PAYMENT_PROOFS_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data?.signedUrl) {
      console.error("[UPLOAD] signed url failed", error);
      return { success: false, error: "Could not prepare the upload — try again" };
    }

    // The component stores `fileUrl` as payments.proof_url. For a private
    // bucket this is the bucket-relative path (`<year>/<month>/<uuid>-<name>`).
    return { success: true, url: data.signedUrl, fileUrl: path };
  } catch (error) {
    console.error("[UPLOAD] unexpected error", error);
    return { success: false, error: "Could not prepare the upload — try again" };
  }
}
