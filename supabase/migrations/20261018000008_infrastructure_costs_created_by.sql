-- Migration: add created_by to infrastructure_costs
-- ------------------------------------------------
-- Drift fix surfaced by the typed clients (H4): saveCost() writes created_by
-- on insert, but the Phase 6 table never had the column — so the create path
-- failed at runtime (PostgREST rejects unknown columns). Provenance for ops
-- cost entries is genuinely useful, so the schema gains the column.

ALTER TABLE infrastructure_costs
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
