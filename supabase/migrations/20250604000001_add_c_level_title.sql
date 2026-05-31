-- Migration: add c_level_title to workspace_members
-- Allows founders to assign themselves a C-Level refinement (CEO, CTO, CPO, COO, CMO)
-- making their permissions department-scoped.

-- Idempotent: only add column if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspace_members' AND column_name = 'c_level_title'
  ) THEN
    ALTER TABLE workspace_members
      ADD COLUMN c_level_title text CHECK (
        c_level_title IS NULL OR
        c_level_title IN ('ceo', 'cto', 'cpo', 'coo', 'cmo')
      );
  END IF;
END $$;

-- Only founders can hold a C-level title; employees must have NULL.
CREATE OR REPLACE FUNCTION enforce_c_level_founder_only()
RETURNS trigger AS $$
BEGIN
  IF NEW.c_level_title IS NOT NULL AND NEW.role != 'founder' THEN
    RAISE EXCEPTION 'Only founders can hold a C-level title';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_c_level_founder_only ON workspace_members;
CREATE TRIGGER trg_enforce_c_level_founder_only
  BEFORE INSERT OR UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION enforce_c_level_founder_only();
