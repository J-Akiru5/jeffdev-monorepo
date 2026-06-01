-- Phase 1C: Fix Transitive Dependencies
-- Problem: subscriptions.user_email is a transitive dependency.
--   user_email can be derived from user_profiles.email via the user_id FK.
-- Solution: Drop the redundant column.

-- =============================================================================
-- Drop subscriptions.user_email
-- (email is always available via user_profiles.email through the user_id FK)
-- =============================================================================
ALTER TABLE subscriptions DROP COLUMN IF EXISTS user_email;
