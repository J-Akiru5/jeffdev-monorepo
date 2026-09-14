-- Migration: Align is_admin() with the Prism Admin role hierarchy
--
-- Background:
--   The application role hierarchy is:
--     founder (Super Admin) > admin > manager > employee/partner
--
--   The previous is_admin() helper only recognized role = 'admin', which
--   meant DB-level admin RLS policies did NOT apply to the founder — the
--   highest-privilege role. Prism Admin's central server-side authorization
--   (requireRole) treats founder as at least as privileged as admin, so the
--   database predicate must match.
--
-- What changes:
--   is_admin() now returns true for role IN ('founder', 'admin').
--
-- What does NOT change (deliberately):
--   - `manager` is intentionally NOT granted DB-level admin powers via RLS.
--     Managers remain app-level admins only (the /admin layout + requireRole
--     gates). This is the more restrictive option and does not broaden
--     ordinary-user access.
--   - `employee` and `partner` continue to have no admin powers.
--   - All existing per-table RLS policies are untouched; they simply call
--     is_admin() and now inherit the founder alignment.
--
-- Rollback:
--   CREATE OR REPLACE FUNCTION public.is_admin() ... role = 'admin' ...;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT role IN ('founder', 'admin')
    FROM public.user_profiles
    WHERE id = auth.uid()
  );
END;
$$;
