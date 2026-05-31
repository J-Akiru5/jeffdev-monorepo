-- Migration: Create Projects & Additional Storage Buckets
-- Creates the 'projects' storage bucket for project cover images
-- and ensures all required buckets exist with proper RLS policies.
--
-- Existing buckets (created in previous migrations):
--   - services (20250531000004_storage_and_contracts.sql)
--   - works_catalog (20250531000004_storage_and_contracts.sql)
--   - avatars (20250701000001_create_avatars_bucket.sql)
--
-- New bucket:
--   - projects: Project cover images / portfolio screenshots

-- 1. Create the projects bucket (publicly readable)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('projects', 'projects', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies for projects bucket (idempotent re-run safety)
DROP POLICY IF EXISTS "Anyone can view projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own projects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON storage.objects;

-- 3. RLS is already enabled by default on storage.objects in Supabase

-- 4. RLS: Anyone can view projects (public bucket)
CREATE POLICY "Anyone can view projects" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'projects');

-- 5. RLS: Authenticated users can upload to projects
CREATE POLICY "Users can upload projects" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'projects' AND auth.role() = 'authenticated'
  );

-- 6. RLS: Users can update their own uploads
CREATE POLICY "Users can update own projects" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'projects' AND auth.uid() = owner
  );

-- 7. RLS: Users can delete their own uploads
CREATE POLICY "Users can delete own projects" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'projects' AND auth.uid() = owner
  );

-- 8. RLS: Admins can manage all project images (using existing is_admin() helper)
CREATE POLICY "Admins can manage all projects" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'projects' AND is_admin()
  );

-- 9. Ensure the services bucket has proper policies (re-apply for safety)
DROP POLICY IF EXISTS "Anyone can view services" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload services" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all services" ON storage.objects;

CREATE POLICY "Anyone can view services" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'services');

CREATE POLICY "Authenticated users can upload services" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'services' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Service role can manage all services" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'services' AND auth.role() = 'service_role'
  );
