/**
 * Supabase Storage Client
 * -----------------------
 * Centralized Supabase storage client configuration for file uploads.
 * Bucket: 'assets' (private upload via signed URLs, public read via RLS)
 */

import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  // In development, we warn but allow build to pass.
  // In production, this should ideally be strict.
  if (process.env.NODE_ENV === "production") {
    console.warn("⚠️ Supabase credentials are missing!");
  }
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseServiceRoleKey || "",
);

export const STORAGE_BUCKET_NAME = "assets";
