"use server";

import { supabase, STORAGE_BUCKET_NAME } from "@/lib/supabase-storage";
import { randomUUID } from "crypto";
import { requireAuth } from "@/lib/access";

/**
 * GENERATE PRESIGNED URL
 * ----------------------
 * Allows the client to upload files directly to Supabase Storage
 * without passing the file through our server (Performance + Security).
 */
export async function getSignedUploadUrl(
  fileName: string,
  fileType: string,
): Promise<{ url: string; fileUrl: string } | { error: string }> {
  try {
    const user = await requireAuth();
    if (!user) return { error: "Unauthorized" };

    // Validate File Type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(fileType)) {
      return { error: "Invalid file type. Only images and PDFs are allowed." };
    }

    // Generate Unique Filename
    const ext = fileName.split(".").pop();
    const uniqueKey = `uploads/${randomUUID()}.${ext}`;

    // Generate Signed URL (valid for 5 minutes)
    const { data, error: signError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .createSignedUrl(uniqueKey, 300); // 300 seconds = 5 minutes

    if (signError || !data) {
      console.error("Supabase Presign Error:", signError);
      return { error: "Failed to generate upload URL." };
    }

    // Supabase Storage URLs are public by default with RLS policy
    // Create a direct public URL for accessing the file
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(uniqueKey);

    const fileUrl = publicUrlData.publicUrl;

    return {
      url: data.signedUrl,
      fileUrl,
    };
  } catch (error) {
    console.error("Supabase Presign Error:", error);
    return { error: "Failed to generate upload URL." };
  }
}

/**
 * SERVER-SIDE UPLOAD
 * ------------------
 * Handles file upload directly on the server.
 */
export async function uploadFile(
  formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No file provided" };

    // Validate size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return {
        success: false,
        error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.`,
      };
    }

    // Validate type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type" };
    }

    // Generate Key
    const ext = file.name.split(".").pop();
    const uniqueKey = `uploads/${randomUUID()}.${ext}`;

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (Server-side)
    const { data, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(uniqueKey, buffer, {
        contentType: file.type,
      });

    if (uploadError || !data) {
      console.error("Server Upload Error:", uploadError);
      return { success: false, error: "Upload failed" };
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(uniqueKey);

    const fileUrl = publicUrlData.publicUrl;

    return { success: true, url: fileUrl };
  } catch (error) {
    console.error("Server Upload Error:", error);
    return { success: false, error: "Upload failed" };
  }
}
