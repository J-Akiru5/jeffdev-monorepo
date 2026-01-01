'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET_NAME } from '@/lib/r2';
import { randomUUID } from 'crypto';

/**
 * GENERATE PRESIGNED URL
 * ----------------------
 * Allows the client to upload files directly to Cloudflare R2
 * without passing the file through our server (Performance + Security).
 */
export async function getSignedUploadUrl(
  fileName: string,
  fileType: string
): Promise<{ url: string; fileUrl: string } | { error: string }> {
  try {
    // 1. Auth Check (TODO: Add when Auth is ready)
    // const session = await getSession();
    // if (!session) return { error: 'Unauthorized' };

    // 2. Validate File Type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(fileType)) {
      return { error: 'Invalid file type. Only images and PDFs are allowed.' };
    }

    // 3. Generate Unique Filename
    const ext = fileName.split('.').pop();
    const uniqueKey = `uploads/${randomUUID()}.${ext}`;

    // 4. Create Command
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: fileType,
    });

    // 5. Generate Signed URL (valid for 5 minutes)
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

    // 6. Return Data
    // Use the local proxy API to bypass CORS and keep bucket private
    const fileUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/file/${uniqueKey}`;

    return {
      url: signedUrl,
      fileUrl,
    };
  } catch (error) {
    console.error('R2 Presign Error:', error);
    return { error: 'Failed to generate upload URL.' };
  }
}

/**
 * SERVER-SIDE UPLOAD (CORS BYPASS)
 * --------------------------------
 * Handles file upload directly on the server for cases where
 * client-side CORS is not configured or blocked.
 */
export async function uploadFile(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    // Validate size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return { success: false, error: `File too large. Maximum size is ${MAX_SIZE / 1024 / 1024}MB.` };
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type' };
    }

    // Generate Key
    const ext = file.name.split('.').pop();
    const uniqueKey = `uploads/${randomUUID()}.${ext}`;

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2 (Server-side)
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: uniqueKey,
      Body: buffer,
      ContentType: file.type,
    });

    await r2.send(command);

    // Return Proxy URL
    const fileUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/file/${uniqueKey}`;

    return { success: true, url: fileUrl };
  } catch (error) {
    console.error('Server Upload Error:', error);
    return { success: false, error: 'Upload failed' };
  }
}
