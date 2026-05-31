-- Migration: Create Community Posts Storage Bucket
--
-- Creates the 'community_posts' storage bucket for community post cover images.
-- Publicly readable, admin-managed via service role.

-- =============================================================================
-- 1. Create the bucket (publicly readable)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('community_posts', 'community_posts', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. Drop any existing policies (idempotent re-run safety)
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view community post images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload community post images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete community post images" ON storage.objects;

-- =============================================================================
-- 3. RLS: Anyone can view community post images (public bucket)
-- =============================================================================
CREATE POLICY "Anyone can view community post images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'community_posts');

-- =============================================================================
-- 4. RLS: Authenticated users can upload community post images
-- =============================================================================
CREATE POLICY "Authenticated users can upload community post images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'community_posts');

-- =============================================================================
-- 5. RLS: Authenticated users can delete community post images
-- =============================================================================
CREATE POLICY "Authenticated users can delete community post images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'community_posts');
