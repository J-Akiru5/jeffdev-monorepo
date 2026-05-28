-- Migration: Create Avatars Storage Bucket
--
-- Creates the 'avatars' storage bucket for user profile photos
-- and sets up RLS policies so users can upload/update/delete their own avatars.
--
-- Folder structure: {user_id}/avatar.{ext}
-- The existing avatar upload code (profile-section.tsx) uses upsert:true,
-- so UPDATE policies are needed alongside INSERT.

-- =============================================================================
-- 1. Create the avatars bucket (publicly readable)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. Drop any existing avatar policies (idempotent re-run safety)
--    Note: storage.objects RLS is already enabled by default in Supabase.
--    DO NOT add ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY here
--    because the table is owned by supabase_storage_admin and migrations
--    run as supabase_admin, causing "must be owner of table objects" error.
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;

-- =============================================================================
-- 4. RLS: Anyone can view avatars (public bucket)
-- =============================================================================
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- =============================================================================
-- 5. RLS: Authenticated users can upload avatars to their own folder
--    Folder path = {auth.uid()}/avatar.{ext}
-- =============================================================================
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- 6. RLS: Users can update their own avatars (needed for upsert)
-- =============================================================================
CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- 7. RLS: Users can delete their own avatars
-- =============================================================================
CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- 8. RLS: Admins can manage all avatars (using existing is_admin() helper)
-- =============================================================================
CREATE POLICY "Admins can manage all avatars" ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.is_admin()
  );
