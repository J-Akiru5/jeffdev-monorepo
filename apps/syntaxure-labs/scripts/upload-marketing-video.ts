/**
 * Upload Marketing Video
 * -----------------------
 * One-off script to push a local video file into the `marketing` Supabase
 * Storage bucket and print back its public URL.
 *
 * Run this yourself, locally, with your own Supabase credentials loaded
 * (e.g. `doppler run -- npx tsx scripts/upload-marketing-video.ts ...`,
 * or with a local .env exporting NEXT_PUBLIC_SUPABASE_URL /
 * SUPABASE_SERVICE_ROLE_KEY). It requires the service role key, which is
 * never checked into this repo.
 *
 * Usage:
 *   npx tsx scripts/upload-marketing-video.ts <path-to-video> [dest-filename]
 *
 * Example:
 *   npx tsx scripts/upload-marketing-video.ts ~/Desktop/promo.mp4 community-hero.mp4
 *
 * After it finishes, copy the printed public URL into
 * NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_URL (locally in .env.local and in the
 * Vercel project settings), then redeploy.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { basename, extname } from "node:path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run this via `doppler run -- npx tsx scripts/upload-marketing-video.ts ...`\n" +
      "or export both env vars in your shell first.",
  );
  process.exit(1);
}

const [, , inputPath, destFilenameArg] = process.argv;

if (!inputPath) {
  console.error(
    "Usage: npx tsx scripts/upload-marketing-video.ts <path-to-video> [dest-filename]",
  );
  process.exit(1);
}

if (!existsSync(inputPath)) {
  console.error(`File not found: ${inputPath}`);
  process.exit(1);
}

const BUCKET = "marketing";

const MIME_BY_EXT: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

async function main() {
  const ext = extname(inputPath).toLowerCase();
  const contentType = MIME_BY_EXT[ext];

  if (!contentType) {
    console.error(
      `Unsupported extension "${ext}". Allowed: ${Object.keys(MIME_BY_EXT).join(", ")}`,
    );
    process.exit(1);
  }

  const destFilename = destFilenameArg || basename(inputPath);
  const fileBuffer = readFileSync(inputPath);
  const sizeMb = (fileBuffer.byteLength / (1024 * 1024)).toFixed(1);

  console.log(`Uploading ${inputPath} (${sizeMb}MB) -> ${BUCKET}/${destFilename} ...`);

  const supabase = createClient(supabaseUrl!, serviceKey!);

  // Ensure the bucket exists (idempotent — the SQL migration in
  // supabase/migrations/ is the source of truth once it's been applied via
  // `supabase db push`; this covers the case where it hasn't been yet).
  const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 52428800, // 50MB — matches this project's existing per-file cap
    allowedMimeTypes: [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
  });
  if (bucketError && !/already exists/i.test(bucketError.message)) {
    console.error("Failed to ensure bucket exists:", bucketError.message);
    process.exit(1);
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(destFilename, fileBuffer, {
      contentType,
      upsert: true,
      cacheControl: "31536000", // 1 year — filenames are versioned by content when replaced
    });

  if (error) {
    console.error("Upload failed:", error.message);
    process.exit(1);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(destFilename);

  console.log("\n✅ Uploaded successfully. Public URL:\n");
  console.log(publicUrlData.publicUrl);
  console.log(
    "\nSet this as NEXT_PUBLIC_COMMUNITY_HERO_VIDEO_URL in .env.local and in Vercel, then redeploy.",
  );
}

main();
