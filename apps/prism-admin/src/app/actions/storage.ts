"use server";

/**
 * Storage Server Actions
 *
 * Handles file uploads to Supabase Storage buckets.
 */

import { getAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

type BucketName = "services" | "works_catalog" | "community_posts";

/**
 * Upload a file to a Supabase Storage bucket
 */
export async function uploadToStorage(
  file: File,
  bucket: BucketName,
  path?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: "Invalid file type. Allowed: JPEG, PNG, WebP, SVG" };
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "File too large. Maximum size: 50MB" };
    }

    const adminClient = getAdminClient();

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = path || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = adminClient.storage
      .from(bucket)
      .getPublicUrl(filename);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload file",
    };
  }
}

/**
 * Delete a file from a Supabase Storage bucket
 */
export async function deleteFromStorage(
  bucket: BucketName,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminClient = getAdminClient();

    const { error } = await adminClient.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete file",
    };
  }
}

/**
 * List files in a Supabase Storage bucket
 */
export async function listStorageFiles(
  bucket: BucketName,
  folder?: string
): Promise<{ success: boolean; files?: { name: string; url: string }[]; error?: string }> {
  try {
    const adminClient = getAdminClient();

    const { data, error } = await adminClient.storage
      .from(bucket)
      .list(folder || "");

    if (error) throw error;

    const files = (data || []).map((file) => {
      const path = folder ? `${folder}/${file.name}` : file.name;
      const { data: urlData } = adminClient.storage
        .from(bucket)
        .getPublicUrl(path);

      return {
        name: file.name,
        url: urlData.publicUrl,
      };
    });

    return { success: true, files };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list files",
    };
  }
}
