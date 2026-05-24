-- Migration: Admin RLS Policies & Founder Access
--
-- Adds comprehensive admin-level RLS policies using a SECURITY DEFINER
-- helper function so that users with role = 'admin' can manage all records.
--
-- Also fixes the original "Admins can view all profiles" policy which had
-- recursive RLS issues (querying user_profiles while checking user_profiles).

-- =============================================================================
-- 1. SECURITY DEFINER helper to check admin role (avoids RLS recursion)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- =============================================================================
-- 2. Fix the original recursive admin policy on user_profiles
-- =============================================================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (public.is_admin());

-- =============================================================================
-- 3. Admin can manage ALL user_profiles
-- =============================================================================
CREATE POLICY "Admins can insert any profile" ON user_profiles
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any profile" ON user_profiles
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any profile" ON user_profiles
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 4. Admin full access on projects
-- =============================================================================
CREATE POLICY "Admins can view all projects" ON projects
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any project" ON projects
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any project" ON projects
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any project" ON projects
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 5. Admin full access on invoices
-- =============================================================================
CREATE POLICY "Admins can view all invoices" ON invoices
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any invoice" ON invoices
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any invoice" ON invoices
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any invoice" ON invoices
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 6. Admin full access on calendar_events
-- =============================================================================
CREATE POLICY "Admins can view all calendar events" ON calendar_events
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any calendar event" ON calendar_events
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any calendar event" ON calendar_events
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any calendar event" ON calendar_events
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 7. Admin full access on case_studies
-- =============================================================================
CREATE POLICY "Admins can view all case studies" ON case_studies
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any case study" ON case_studies
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any case study" ON case_studies
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any case study" ON case_studies
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 8. Admin full access on feedback
-- =============================================================================
CREATE POLICY "Admins can view all feedback" ON feedback
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update any feedback" ON feedback
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any feedback" ON feedback
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 9. Admin full access on subscriptions
-- =============================================================================
CREATE POLICY "Admins can view all subscriptions" ON subscriptions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any subscription" ON subscriptions
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any subscription" ON subscriptions
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any subscription" ON subscriptions
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 10. Admin full access on notifications
-- =============================================================================
CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any notification" ON notifications
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any notification" ON notifications
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any notification" ON notifications
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 11. Admin full access on invites
-- =============================================================================
CREATE POLICY "Admins can view all invites" ON invites
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any invite" ON invites
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any invite" ON invites
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any invite" ON invites
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 12. Admin full access on tasks
-- =============================================================================
CREATE POLICY "Admins can view all tasks" ON tasks
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any task" ON tasks
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any task" ON tasks
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any task" ON tasks
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 13. Admin full access on user_tokens
-- =============================================================================
CREATE POLICY "Admins can view all user tokens" ON user_tokens
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any user token" ON user_tokens
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any user token" ON user_tokens
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any user token" ON user_tokens
  FOR DELETE USING (public.is_admin());

-- =============================================================================
-- 14. Admin full access on messages
-- =============================================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can update any message" ON messages
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any message" ON messages
  FOR DELETE USING (public.is_admin());

-- Anyone can insert messages (contact form)
CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 15. Admin full access on support_tickets
-- =============================================================================
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all support tickets" ON support_tickets
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any support ticket" ON support_tickets
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any support ticket" ON support_tickets
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any support ticket" ON support_tickets
  FOR DELETE USING (public.is_admin());

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tickets
CREATE POLICY "Users can insert their own tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 16. Admin full access on services
-- =============================================================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (public.is_admin());

-- Anyone can view active services
CREATE POLICY "Anyone can view active services" ON services
  FOR SELECT USING (status = 'active');

-- =============================================================================
-- 17. Admin full access on milestones
-- =============================================================================
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all milestones" ON milestones
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any milestone" ON milestones
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any milestone" ON milestones
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any milestone" ON milestones
  FOR DELETE USING (public.is_admin());

-- Users can manage milestones on their projects
CREATE POLICY "Users can view project milestones" ON milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = milestones.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 18. Admin full access on quotes
-- =============================================================================
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all quotes" ON quotes
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert any quote" ON quotes
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update any quote" ON quotes
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete any quote" ON quotes
  FOR DELETE USING (public.is_admin());

-- Users can view their own quotes
CREATE POLICY "Users can view their own quotes" ON quotes
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- 19. Admin full access on waitlist_entries
-- =============================================================================
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage waitlist" ON waitlist_entries
  FOR ALL USING (public.is_admin());

-- Anyone can join waitlist
CREATE POLICY "Anyone can join waitlist" ON waitlist_entries
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 20. Admin full access on audit_logs
-- =============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (public.is_admin());
