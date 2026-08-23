-- =============================================================================
-- 20260823000001_prism_pricing_reconcile.sql
--
-- Phase 1 correctness debt: make displayed pricing/features match what the
-- engine ACTUALLY enforces (src/lib/subscriptions.ts TIER_LIMITS + TIER_PRICES).
--
-- Contradictions fixed (copy -> enforced):
--   Free: 5 rules -> 10; 3 components -> 5; "10 AI generations" -> 0 (dropped)
--   Pro:   $18/₱990 -> $12/₱660 (annual 180/9900 -> 120/6600)
--          Unlimited rules -> 100; Unlimited components -> 50;
--          10 projects -> 5
--   Team:  $54/₱2990 -> $36/₱1980 (annual 540/29900 -> 360/19800)
--
-- These are UPDATEs (not edits to the applied 20250528 seed) so they take
-- effect on the live database when applied through Supabase migrations.
-- Phase 2 will replace this model wholesale (roadmap v1.0: Free unlimited
-- local, Pro ₱299/~$8); until then the pitch must equal the product.
-- =============================================================================

-- Free -------------------------------------------------------------------
UPDATE pricing_plans
SET
  features = '["10 rules","5 components","1 project","Local enforcement on every agent write","Export as Markdown"]'::jsonb,
  comparison_values = '{"rules":"10","components":"5","projects":"1","ai":"0","ideSync":false,"teamMembers":"-","sharedLibrary":false,"sso":false,"auditLogs":false,"prioritySupport":false,"dedicatedSupport":false}'::jsonb
WHERE app = 'prism-engine' AND tier_slug = 'free';

-- Pro --------------------------------------------------------------------
UPDATE pricing_plans
SET
  price_monthly_usd = 12,
  price_annual_usd = 120,
  price_monthly_php = 660,
  price_annual_php = 6600,
  description = '100 rules, IDE auto-sync (MCP), and 500 AI generations per month.',
  features = '["100 rules","50 components","5 projects","500 AI generations/month","IDE auto-sync (MCP)","All design systems","All stack templates","Priority support"]'::jsonb,
  comparison_values = '{"rules":"100","components":"50","projects":"5","ai":"500","ideSync":true,"teamMembers":"-","sharedLibrary":false,"sso":false,"auditLogs":false,"prioritySupport":true,"dedicatedSupport":false}'::jsonb
WHERE app = 'prism-engine' AND tier_slug = 'pro';

-- Team -------------------------------------------------------------------
UPDATE pricing_plans
SET
  price_monthly_usd = 36,
  price_annual_usd = 360,
  price_monthly_php = 1980,
  price_annual_php = 19800
WHERE app = 'prism-engine' AND tier_slug = 'team';
