/**
 * Cloudflare R2 Client (S3 Compatible)
 * ------------------------------------
 * Centralized S3 client configuration for file storage.
 * Uses AWS SDK v3.
 */

import { S3Client } from '@aws-sdk/client-s3';

// Validate environment variables
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
  // In development, we warn but allow build to pass.
  // In production, this should ideally be strict.
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ Cloudflare R2 credentials are missing!');
  }
}

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'jeffdev-assets';
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
