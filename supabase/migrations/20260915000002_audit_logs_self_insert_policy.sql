-- Migration: allow authenticated users to insert their own audit events
--
-- The Manage app logs lightweight client-side audit events (for example the
-- Focus/Workspace mode toggle) through the browser Supabase client, but
-- audit_logs had no INSERT policy at all, so those writes were silently
-- rejected by RLS.
--
-- This adds the smallest possible policy: an authenticated user may insert
-- audit rows that are attributed to themselves (user_id = auth.uid()).
-- Reads remain restricted by the existing admin-only SELECT policy, and
-- privileged server-side audit writes continue to use the service role.

DROP POLICY IF EXISTS "Users can insert their own audit events" ON audit_logs;

CREATE POLICY "Users can insert their own audit events" ON audit_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );
