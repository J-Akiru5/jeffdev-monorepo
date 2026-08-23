-- =============================================================================
-- 20260823000003_prism_phase2_pricing_model.sql
--
-- Phase 2 (roadmap v1.0): implement the structural pricing fix.
--
--   Free · forever   ₱0      Unlimited local enforcement + local rules,
--                            CLI/TUI open source, 1 SYNCED project,
--                            25 AI generations/month
--   Pro · solo       ₱299    (~$8 intl) Unlimited synced projects, full
--                            Kitchen, AI rule/skill generation, sandbox
--                            preview, cross-machine sync. Annual = 10× mo.
--   Team             ₱249    per seat/mo (~$7), min 3 seats. Shared
--                    /seat   constitution, higher AI quota, audit trail.
--   Enterprise       Annual  on-prem zero egress, SSO, SLA
--
-- Rationale: enforcement is regex on the user's machine — zero marginal
-- cost, so it is never gated. What costs money (inference, hosting, sync)
-- is what gets priced. This migration only touches display data; the
-- enforced constants live in src/lib/subscriptions.ts and were updated in
-- the same change.
-- =============================================================================

-- Free ------------------------------------------------------------------------
UPDATE pricing_plans
SET
  tagline = 'Agent governance, free forever',
  description = 'Local enforcement on every agent write. No account required for the CLI; sync when you want it.',
  features = '["Unlimited local enforcement","Unlimited local rules","CLI + TUI (open source)","1 synced project","25 AI generations/month"]'::jsonb,
  comparison_values = '{"rules":"Unlimited","components":"Unlimited","projects":"1","ai":"25","ideSync":false,"teamMembers":"-","sharedLibrary":false,"sso":false,"auditLogs":false,"prioritySupport":false,"dedicatedSupport":false}'::jsonb
WHERE app = 'prism-engine' AND tier_slug = 'free';

-- Pro -------------------------------------------------------------------------
UPDATE pricing_plans
SET
  tagline = 'For solo developers shipping agent-first',
  description = 'Unlimited synced projects, full Kitchen dashboard, AI rule + skill generation, sandbox preview, cross-machine sync.',
  price_monthly_usd = 8,
  price_annual_usd = 80,
  price_monthly_php = 299,
  price_annual_php = 2990,
  features = '["Unlimited synced projects","Full Kitchen dashboard","AI rule & skill generation","Sandbox preview","Cross-machine sync","IDE auto-sync (MCP)","Priority support"]'::jsonb,
  comparison_values = '{"rules":"Unlimited","components":"Unlimited","projects":"Unlimited","ai":"500","ideSync":true,"teamMembers":"-","sharedLibrary":true,"sso":false,"auditLogs":false,"prioritySupport":true,"dedicatedSupport":false}'::jsonb
WHERE app = 'prism-engine' AND tier_slug = 'pro';

-- Team ------------------------------------------------------------------------
UPDATE pricing_plans
SET
  tagline = 'One constitution, every agent',
  description = '₱249 per seat/month (min 3 seats). Your whole team''s agents write your way — with an audit trail to prove it.',
  price_monthly_usd = 7,
  price_annual_usd = 70,
  price_monthly_php = 249,
  price_annual_php = 2490,
  features = '["Everything in Pro","Shared constitution","Team rule governance","2,000 AI generations/month (pooled)","Audit trail","Up to 10 seats"]'::jsonb,
  comparison_values = '{"rules":"Unlimited","components":"Unlimited","projects":"Unlimited","ai":"2,000","ideSync":true,"teamMembers":"10","sharedLibrary":true,"sso":false,"auditLogs":true,"prioritySupport":true,"dedicatedSupport":false}'::jsonb
WHERE app = 'prism-engine' AND tier_slug = 'team';

-- Enterprise ------------------------------------------------------------------
UPDATE pricing_plans
SET
  tagline = 'Zero egress. Zero trust issues.',
  description = 'On-prem deployment for BPOs and regulated buyers. SSO, support SLA, custom integrations.',
  features = '["On-prem deployment (zero egress)","SSO/SAML","Audit logs","Support SLA","Custom integrations","Dedicated support"]'::jsonb
WHERE app = 'prism-engine' AND tier_slug = 'enterprise';
