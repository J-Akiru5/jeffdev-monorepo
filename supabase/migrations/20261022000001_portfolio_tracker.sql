-- Migration: Portfolio tracker (Phase 1 · Agent A)
-- ------------------------------------------------
-- Extends the existing agency `projects` table (the shared business-project
-- record) with portfolio fields, adds the partner register and the two
-- project junctions, and seeds the three ventures + two partners from the
-- approved plan (docs/portfolio-tracker-plan-2026-10-22.html).
--
-- Additive only:
--   * every new projects column is ADD COLUMN IF NOT EXISTS
--   * every new CHECK is added inside a DO block guarded by pg_constraint
--   * new tables / indexes / policies use IF NOT EXISTS or are guarded
--   * the seed is INSERT ... ON CONFLICT DO NOTHING
-- No existing column, constraint, policy or row is dropped or rewritten.
-- Idempotent: safe to re-run.

-- =============================================================================
-- 1. projects: portfolio columns
-- =============================================================================
-- `projects.status` keeps the public site's 4-state contract; the tracker
-- writes it from `portfolio_status` through one mapping (publicStatusFor).
-- `projects.user_id` remains the owner (NOT NULL) and is set by the actions.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'client',
  -- The approved status set is planning/in_progress/maintenance/completed/
  -- paused/archived. The plan text says DEFAULT 'active', but 'active' is not
  -- a member of that set: on a non-empty projects table the CHECK below would
  -- reject every pre-existing row. 'in_progress' is the nearest valid state
  -- (it maps to the public 'active' status) and keeps existing rows visible.
  ADD COLUMN IF NOT EXISTS portfolio_status TEXT NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS progress INTEGER,
  ADD COLUMN IF NOT EXISTS retainer_status TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS retainer_monthly_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS retainer_currency TEXT NOT NULL DEFAULT 'PHP',
  ADD COLUMN IF NOT EXISTS retainer_started_on DATE,
  ADD COLUMN IF NOT EXISTS retainer_renews_on DATE,
  ADD COLUMN IF NOT EXISTS pm_project_id UUID REFERENCES pm_projects(id) ON DELETE SET NULL;

-- Named CHECKs, added only when the same constraint name is missing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_kind_check'
      AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_kind_check
      CHECK (kind IN ('venture', 'client', 'internal'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_portfolio_status_check'
      AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_portfolio_status_check
      CHECK (portfolio_status IN (
        'planning', 'in_progress', 'maintenance', 'completed', 'paused', 'archived'
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_progress_check'
      AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_progress_check
      CHECK (progress BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'projects_retainer_status_check'
      AND conrelid = 'public.projects'::regclass
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_retainer_status_check
      CHECK (retainer_status IN ('none', 'active', 'paused', 'ended'));
  END IF;
END $$;

-- Backfill pre-existing rows: the new column defaults to 'in_progress'; align
-- rows whose public status already says completed/paused/archived. New rows
-- always receive an explicit portfolio_status from the actions, so this only
-- corrects rows that existed before this migration.
UPDATE public.projects
SET portfolio_status = CASE status
  WHEN 'completed' THEN 'completed'
  WHEN 'paused' THEN 'paused'
  WHEN 'archived' THEN 'archived'
  ELSE portfolio_status
END
WHERE status IN ('completed', 'paused', 'archived')
  AND portfolio_status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_projects_kind
  ON public.projects(kind);
CREATE INDEX IF NOT EXISTS idx_projects_portfolio_status
  ON public.projects(portfolio_status);
CREATE INDEX IF NOT EXISTS idx_projects_retainer_status
  ON public.projects(retainer_status);
CREATE INDEX IF NOT EXISTS idx_projects_pm_project_id
  ON public.projects(pm_project_id);

-- =============================================================================
-- 2. partners (the partner register)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'agency'
    CHECK (kind IN ('agency', 'product', 'events', 'infrastructure', 'other')),
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at trigger (same pattern as update_task_templates_updated_at)
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partners_updated_at ON public.partners;

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();

-- =============================================================================
-- 3. project_partners (projects <-> partners, with the role stated)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_partners (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  role TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_project_partners_partner_id
  ON public.project_partners(partner_id);

-- =============================================================================
-- 4. project_members (real users assigned per project, with a project role)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'contributor'
    CHECK (role IN ('lead', 'developer', 'designer', 'qa', 'marketing', 'support', 'contributor')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user_id
  ON public.project_members(user_id);

-- =============================================================================
-- 5. RLS (defense in depth)
-- =============================================================================
-- Read: any signed-in user (the approved RLS contract for this phase; writes
-- are gated by the server actions, not by a workspace read filter). Write:
-- deliberately NO insert/update/delete policies — every mutation goes through
-- the service-role admin client inside the `actions/portfolio.ts` server
-- actions, which enforce founder / assigned-member rules. With RLS enabled and
-- no write policy, a leaked anon/user key still cannot mutate these tables.
-- Existing `projects` RLS is untouched.

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Signed-in users can view partners" ON public.partners;
CREATE POLICY "Signed-in users can view partners" ON public.partners
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Signed-in users can view project partners" ON public.project_partners;
CREATE POLICY "Signed-in users can view project partners" ON public.project_partners
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Signed-in users can view project members" ON public.project_members;
CREATE POLICY "Signed-in users can view project members" ON public.project_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- 6. Seed: partners (idempotent by unique name)
-- =============================================================================

INSERT INTO public.partners (name, kind, status)
VALUES
  ('Zenlabs', 'product', 'active'),
  ('MDM Events Management', 'events', 'active')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 7. Seed: the three ventures
-- =============================================================================
-- `projects.user_id` is NOT NULL and references user_profiles, so the owner is
-- the earliest profile deterministically. With no profiles the SELECT returns
-- no rows: the seed no-ops instead of failing on a fresh database.

INSERT INTO public.projects (
  user_id,
  title,
  slug,
  description,
  status,
  kind,
  portfolio_status,
  metadata,
  published
)
SELECT
  owner.id,
  v.title,
  v.slug,
  v.description,
  'active',
  'venture',
  v.portfolio_status,
  jsonb_build_object('category', v.category),
  false
FROM (
  VALUES
    (
      'likaslens',
      'LikasLens',
      'in_progress',
      'AI environmental intelligence — national recognition (IPOPHIL SRT Innovation Contest).',
      'AI / Environmental Intelligence'
    ),
    (
      'riceconnect',
      'RiceConnect',
      'in_progress',
      'Agriculture supply-chain platform — Enactus Philippines Top 60.',
      'AgriTech'
    ),
    (
      'golf-management-system',
      'Golf Management System',
      'planning',
      'Golf club operations platform, co-developed with Zenlabs and MDM Events Management.',
      'SaaS / Sports Operations'
    )
) AS v(slug, title, portfolio_status, description, category)
CROSS JOIN (
  SELECT id
  FROM public.user_profiles
  ORDER BY created_at ASC, id ASC
  LIMIT 1
) AS owner
WHERE EXISTS (SELECT 1 FROM public.user_profiles)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- 8. Seed: golf project <-> partner links
-- =============================================================================

INSERT INTO public.project_partners (project_id, partner_id, role)
SELECT p.id, pt.id, v.role
FROM (
  VALUES
    ('golf-management-system', 'Zenlabs', 'co-development'),
    ('golf-management-system', 'MDM Events Management', 'events & venue partner')
) AS v(project_slug, partner_name, role)
JOIN public.projects p ON p.slug = v.project_slug
JOIN public.partners pt ON pt.name = v.partner_name
ON CONFLICT (project_id, partner_id) DO NOTHING;
