-- Migration: Add public SELECT policies for community_posts and community_members
--
-- Enables anonymous/public visitors to view published community posts
-- and their authors on the Syntaxure Labs community page.

-- =============================================================================
-- 1. Public SELECT on community_members (so we can display author info)
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view community members" ON community_members;

CREATE POLICY "Anyone can view community members" ON community_members
  FOR SELECT
  USING (true);

-- =============================================================================
-- 2. Public SELECT on community_posts (only published posts)
-- =============================================================================
DROP POLICY IF EXISTS "Anyone can view published community posts" ON community_posts;

CREATE POLICY "Anyone can view published community posts" ON community_posts
  FOR SELECT
  USING (is_published = true);
