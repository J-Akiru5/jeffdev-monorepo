-- Migration: Create Marketing Storage Bucket
--
-- Creates the 'marketing' storage bucket for marketing assets (hero videos,
-- posters, promo clips) shown on public pages like /community.
-- Publicly readable. Writes are restricted to the service role only —
-- this is admin-curated content, not user-generated, so there is no
-- "authenticated user" upload path (unlike avatars/community_posts).

-- =============================================================================
-- 1. Create the bucket (publicly readable)
--    Note: this bucket was also created live via the Storage API (service
--    role) on 2026-08-14 to get the marketing video up before this migration
--    was applied. The INSERT below is a no-op in that case (ON CONFLICT DO
--    NOTHING) — the RLS policies further down still need to be applied via
--    `supabase db push` since the Storage API can't create those.
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketing',
  'marketing',
  true,
  52428800, -- 50MB — matches this project's existing per-file cap
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. Drop any existing policies (idempotent re-run safety)
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view marketing assets" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage marketing assets" ON storage.objects;

-- =============================================================================
-- 3. RLS: Anyone can view marketing assets (public bucket)
-- =============================================================================
CREATE POLICY "Anyone can view marketing assets" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'marketing');

-- =============================================================================
-- 4. RLS: Only the service role can upload/update/delete marketing assets
-- =============================================================================
CREATE POLICY "Service role can manage marketing assets" ON storage.objects
  FOR ALL
  USING (bucket_id = 'marketing' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'marketing' AND auth.role() = 'service_role');
