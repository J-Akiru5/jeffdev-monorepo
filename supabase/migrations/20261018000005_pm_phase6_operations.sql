-- Migration: Phase 6 — COO Operations Hub + Business Model Canvas
--
-- Resumes apps/prism-manage/docs/coo-operations-bmc-plan.md with two
-- deliberate corrections:
--   - UUID PKs (consistent with every other table; not app-generated text ids)
--   - workspace-member RLS (the blueprint's "any authenticated user" policies
--     were looser than every other table in this project — app-level actions
--     still gate writes to CEO/COO)
-- Additive. Idempotent: safe to re-run.

-- =============================================================================
-- 1. milestones
-- =============================================================================

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_workspace ON milestones(workspace_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(workspace_id, status);

CREATE OR REPLACE FUNCTION update_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS milestones_updated_at ON milestones;
CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestones_updated_at();

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view milestones" ON milestones;
CREATE POLICY "Members can view milestones" ON milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = milestones.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create milestones" ON milestones;
CREATE POLICY "Members can create milestones" ON milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = milestones.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update milestones" ON milestones;
CREATE POLICY "Members can update milestones" ON milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = milestones.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can delete milestones" ON milestones;
CREATE POLICY "Members can delete milestones" ON milestones
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = milestones.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 2. bmc_sections (the 9 Osterwalder blocks)
-- =============================================================================

CREATE TABLE IF NOT EXISTS bmc_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  block TEXT NOT NULL CHECK (block IN (
    'key_partners', 'key_activities', 'key_resources',
    'value_propositions', 'customer_relationships',
    'channels', 'customer_segments',
    'cost_structure', 'revenue_streams'
  )),
  content TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, block)
);

CREATE INDEX IF NOT EXISTS idx_bmc_workspace ON bmc_sections(workspace_id);

CREATE OR REPLACE FUNCTION update_bmc_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bmc_sections_updated_at ON bmc_sections;
CREATE TRIGGER bmc_sections_updated_at
  BEFORE UPDATE ON bmc_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_bmc_sections_updated_at();

ALTER TABLE bmc_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view bmc sections" ON bmc_sections;
CREATE POLICY "Members can view bmc sections" ON bmc_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = bmc_sections.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create bmc sections" ON bmc_sections;
CREATE POLICY "Members can create bmc sections" ON bmc_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = bmc_sections.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update bmc sections" ON bmc_sections;
CREATE POLICY "Members can update bmc sections" ON bmc_sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = bmc_sections.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 3. infrastructure_costs
-- =============================================================================

CREATE TABLE IF NOT EXISTS infrastructure_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('hosting', 'database', 'ai_api', 'dev_tools', 'other')),
  monthly_budget NUMERIC(10,2) NOT NULL DEFAULT 0,
  actual_spend NUMERIC(10,2) NOT NULL DEFAULT 0,
  period TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_costs_workspace_period ON infrastructure_costs(workspace_id, period);

CREATE OR REPLACE FUNCTION update_infrastructure_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS infrastructure_costs_updated_at ON infrastructure_costs;
CREATE TRIGGER infrastructure_costs_updated_at
  BEFORE UPDATE ON infrastructure_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_infrastructure_costs_updated_at();

ALTER TABLE infrastructure_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view infrastructure costs" ON infrastructure_costs;
CREATE POLICY "Members can view infrastructure costs" ON infrastructure_costs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = infrastructure_costs.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can create infrastructure costs" ON infrastructure_costs;
CREATE POLICY "Members can create infrastructure costs" ON infrastructure_costs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = infrastructure_costs.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update infrastructure costs" ON infrastructure_costs;
CREATE POLICY "Members can update infrastructure costs" ON infrastructure_costs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = infrastructure_costs.workspace_id
      AND wm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can delete infrastructure costs" ON infrastructure_costs;
CREATE POLICY "Members can delete infrastructure costs" ON infrastructure_costs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = infrastructure_costs.workspace_id
      AND wm.user_id = auth.uid()
    )
  );
