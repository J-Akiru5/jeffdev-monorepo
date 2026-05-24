-- Migration: Pricing Plans & FAQs
-- Replaces hardcoded pricing data in syntaxure-labs and prism-engine
-- with database-backed records editable via prism-admin

-- =============================================================================
-- PRICING PLANS
-- =============================================================================
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app TEXT NOT NULL CHECK (app IN ('prism-engine', 'syntaxure-labs')),
  plan_type TEXT NOT NULL DEFAULT 'tier' CHECK (plan_type IN ('tier', 'addon')),
  name TEXT NOT NULL,
  tier_slug TEXT NOT NULL,
  tagline TEXT,
  description TEXT,

  -- Pricing (numeric = fixed price, null = custom/contact)
  price_monthly_php NUMERIC,
  price_monthly_usd NUMERIC,
  price_annual_php NUMERIC,
  price_annual_usd NUMERIC,

  -- Original (pre-discount) pricing for limited deals
  price_original_php NUMERIC,
  price_original_usd NUMERIC,
  discount_label TEXT,
  monthly_addon TEXT,

  -- Features list (JSON array of {label, included, highlight?} or {label, starter, business, ...})
  features JSONB DEFAULT '[]'::jsonb,

  -- Comparison table values (JSON object per tier: {starter: "Up to 5", business: "Up to 15", ...})
  comparison_values JSONB DEFAULT '{}'::jsonb,

  -- CTA configuration
  cta_label TEXT DEFAULT 'Choose plan',
  cta_href TEXT,
  cta_variant TEXT DEFAULT 'secondary' CHECK (cta_variant IN ('primary', 'secondary', 'contact')),

  -- Display flags
  highlighted BOOLEAN DEFAULT false,
  limited_deal BOOLEAN DEFAULT false,

  -- Ordering (ascending)
  sort_order INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Only one plan per app per slug
  UNIQUE (app, tier_slug)
);

-- =============================================================================
-- PRICING FAQS
-- =============================================================================
CREATE TABLE IF NOT EXISTS pricing_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app TEXT NOT NULL CHECK (app IN ('prism-engine', 'syntaxure-labs')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_pricing_plans_app ON pricing_plans(app);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_sort ON pricing_plans(app, sort_order);
CREATE INDEX IF NOT EXISTS idx_pricing_faqs_app ON pricing_faqs(app);

-- =============================================================================
-- RLS (bypassed by service_role, safe for public-read if needed later)
-- =============================================================================
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage pricing_plans" ON pricing_plans
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage pricing_faqs" ON pricing_faqs
  FOR ALL USING (auth.role() = 'service_role');

-- Public read access (for app consumption)
CREATE POLICY "Anyone can read pricing_plans" ON pricing_plans
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read pricing_faqs" ON pricing_faqs
  FOR SELECT USING (true);

-- =============================================================================
-- SEED DATA: Syntaxure Labs Agency Pricing Tiers
-- =============================================================================
INSERT INTO pricing_plans (app, plan_type, name, tier_slug, tagline, description,
  price_monthly_php, price_monthly_usd, price_original_php, price_original_usd,
  discount_label, monthly_addon, features, comparison_values,
  cta_label, cta_href, cta_variant, highlighted, limited_deal, sort_order)
VALUES

-- Starter
('syntaxure-labs', 'tier', 'Starter', 'starter',
  'Best for solo entrepreneurs',
  'A lightweight, professional website to establish your online presence.',
  25000, 450, 45000, 800,
  '44% OFF', NULL,
  '[{"label":"Up to 5 pages","included":true},{"label":"Static Next.js + Tailwind","included":true},{"label":"Mobile responsive design","included":true},{"label":"Basic SEO setup","included":true},{"label":"Contact form integration","included":true},{"label":"CMS integration","included":false},{"label":"Custom features","included":false},{"label":"E-commerce functionality","included":false}]',
  '{"pages":"Up to 5","domain":true,"ssl":true,"responsive":true,"seo":"Basic","cms":false,"blog":false,"auth":false,"admin":false,"payments":false,"api":false,"database":false,"carePlan":"12 months","support":"48 hours","ownership":true}',
  'Choose plan', '/quote?tier=starter', 'secondary', false, false, 1),

-- Business
('syntaxure-labs', 'tier', 'Business', 'business',
  'Everything you need to grow',
  'A fully-featured website with CMS, blog, and advanced SEO to grow your business.',
  65000, 1150, 100000, 1800,
  '35% OFF', '+3 mo. free Care Plan',
  '[{"label":"Up to 15 pages","included":true},{"label":"Next.js + CMS (Sanity/Payload)","included":true,"highlight":true},{"label":"Mobile responsive design","included":true},{"label":"Advanced SEO optimization","included":true,"highlight":true},{"label":"Blog/News system","included":true},{"label":"Analytics integration","included":true},{"label":"Custom contact forms","included":true},{"label":"E-commerce functionality","included":false}]',
  '{"pages":"Up to 15","domain":true,"ssl":true,"responsive":true,"seo":"Advanced","cms":true,"blog":true,"auth":false,"admin":false,"payments":false,"api":false,"database":false,"carePlan":"15 months","support":"24 hours","ownership":true}',
  'Choose plan', '/quote?tier=business', 'primary', true, true, 2),

-- Custom (SaaS)
('syntaxure-labs', 'tier', 'Custom', 'custom',
  'Full-stack SaaS solutions',
  'Custom web applications with authentication, payments, and databases.',
  180000, 3200, 300000, 5400,
  '40% OFF', '+6 mo. free Care Plan',
  '[{"label":"Unlimited pages","included":true},{"label":"Full-stack Next.js + Database","included":true,"highlight":true},{"label":"User authentication system","included":true,"highlight":true},{"label":"Admin dashboard","included":true},{"label":"Payment gateway integration","included":true,"highlight":true},{"label":"API development","included":true},{"label":"E-commerce / Booking system","included":true},{"label":"Priority support","included":true}]',
  '{"pages":"Unlimited","domain":true,"ssl":true,"responsive":true,"seo":"Advanced","cms":true,"blog":true,"auth":true,"admin":true,"payments":true,"api":true,"database":true,"carePlan":"18 months","support":"12 hours","ownership":true}',
  'Choose plan', '/quote?tier=custom', 'primary', false, true, 3),

-- Enterprise
('syntaxure-labs', 'tier', 'Enterprise', 'enterprise',
  'Dedicated team for complex needs',
  'A dedicated team for large-scale, multi-platform solutions with enterprise-grade security.',
  NULL, NULL, NULL, NULL,
  NULL, NULL,
  '[{"label":"Dedicated development team","included":true,"highlight":true},{"label":"Custom architecture design","included":true},{"label":"Multi-platform solutions","included":true},{"label":"Enterprise security audit","included":true,"highlight":true},{"label":"SLA & uptime guarantee","included":true},{"label":"24/7 priority support","included":true},{"label":"On-demand scaling","included":true},{"label":"Custom integrations","included":true}]',
  '{"pages":"Unlimited","domain":true,"ssl":true,"responsive":true,"seo":"Custom","cms":true,"blog":true,"auth":true,"admin":true,"payments":true,"api":true,"database":true,"carePlan":"Custom","support":"1 hour","ownership":true}',
  'Contact us', '/contact?subject=enterprise', 'contact', false, false, 4),

-- Care Plan (addon)
('syntaxure-labs', 'addon', 'Care Plan', 'care-plan',
  'Protect your investment',
  'For the price of one nice dinner, your business stays online and secure forever. All projects include our mandatory Care Plan for the first 12 months.',
  3500, 60, NULL, NULL,
  NULL, NULL,
  '["Managed cloud hosting","SSL & security patches","Daily automated backups","Monthly health reports","Priority email support","Minor updates & bug fixes"]',
  '{"minPhp":2000,"maxPhp":5000,"minUsd":35,"maxUsd":90}',
  NULL, NULL, 'secondary', false, false, 5);

-- =============================================================================
-- SEED DATA: Prism Engine SaaS Pricing Tiers
-- =============================================================================
INSERT INTO pricing_plans (app, plan_type, name, tier_slug, tagline, description,
  price_monthly_usd, price_annual_usd, price_monthly_php, price_annual_php,
  features, comparison_values,
  cta_label, cta_href, cta_variant, highlighted, sort_order)
VALUES

-- Free
('prism-engine', 'tier', 'Free', 'free',
  'Get started with the basics',
  'Start free, upgrade when you need more power.',
  0, 0, 0, 0,
  '["5 rules","3 components","1 project","10 AI generations/month","Export as Markdown"]',
  '{"rules":"5","components":"3","projects":"1","ai":"10","ideSync":false,"teamMembers":"—","sharedLibrary":false,"sso":false,"auditLogs":false,"prioritySupport":false,"dedicatedSupport":false}',
  'Get Started', '/sign-up', 'secondary', false, 1),

-- Pro
('prism-engine', 'tier', 'Pro', 'pro',
  'For serious developers',
  'Unlimited rules, IDE auto-sync, and 500 AI generations per month.',
  18, 180, 990, 9900,
  '["Unlimited rules","Unlimited components","10 projects","500 AI generations/month","IDE auto-sync","All design systems","All stack templates","Priority support"]',
  '{"rules":"Unlimited","components":"Unlimited","projects":"10","ai":"500","ideSync":true,"teamMembers":"—","sharedLibrary":false,"sso":false,"auditLogs":false,"prioritySupport":true,"dedicatedSupport":false}',
  'Start Free Trial', '/sign-up', 'primary', true, 2),

-- Team
('prism-engine', 'tier', 'Team', 'team',
  'Collaborate with your team',
  'Everything in Pro plus unlimited projects and up to 10 team members.',
  54, 540, 2990, 29900,
  '["Everything in Pro","Unlimited projects","2,000 AI generations/month","Up to 10 team members","Shared component library","Team rule management","Admin dashboard"]',
  '{"rules":"Unlimited","components":"Unlimited","projects":"Unlimited","ai":"2,000","ideSync":true,"teamMembers":"10","sharedLibrary":true,"sso":false,"auditLogs":false,"prioritySupport":true,"dedicatedSupport":false}',
  'Start Free Trial', '/sign-up', 'primary', false, 3),

-- Enterprise
('prism-engine', 'tier', 'Enterprise', 'enterprise',
  'Custom solutions for scale',
  'SSO/SAML, audit logs, dedicated support, and unlimited everything.',
  NULL, NULL, NULL, NULL,
  '["Everything in Team","Unlimited team members","Unlimited AI generations","SSO/SAML","Audit logs","Dedicated support","Custom integrations"]',
  '{"rules":"Unlimited","components":"Unlimited","projects":"Unlimited","ai":"Unlimited","ideSync":true,"teamMembers":"Unlimited","sharedLibrary":true,"sso":true,"auditLogs":true,"prioritySupport":true,"dedicatedSupport":true}',
  'Contact Sales', 'https://jeffdev.studio/contact', 'secondary', false, 4);

-- =============================================================================
-- SEED DATA: FAQs
-- =============================================================================
INSERT INTO pricing_faqs (app, question, answer, sort_order) VALUES

-- Syntaxure Labs FAQs
('syntaxure-labs',
  'What is the Care Plan?',
  'The Care Plan is our mandatory maintenance retainer that ensures your website stays secure, fast, and up-to-date. It includes managed hosting, security patches, daily backups, and priority support. Think of it as insurance for your digital investment.',
  1),

('syntaxure-labs',
  'Can I pay in installments?',
  'Yes! We offer flexible payment terms. Typically, we require 50% upfront to start the project and the remaining 50% upon completion. For larger projects, we can arrange milestone-based payments.',
  2),

('syntaxure-labs',
  'What happens after the included Care Plan period?',
  'After the included period, you can continue the Care Plan at our standard monthly rate (₱2,000-₱5,000/month depending on your tier). If you choose not to continue, your site remains yours, but you''ll be responsible for hosting and maintenance.',
  3),

('syntaxure-labs',
  'Do I own the source code?',
  'Absolutely. Once the project is paid in full, you own 100% of the source code. We believe in full transparency and ownership for our clients.',
  4),

('syntaxure-labs',
  'What''s the typical project timeline?',
  'Starter projects take 2-3 weeks. Business projects take 4-6 weeks. Custom/SaaS projects take 8-16 weeks depending on complexity. Enterprise timelines are determined during the scoping phase.',
  5),

('syntaxure-labs',
  'Can I upgrade my plan later?',
  'Yes! Your website can grow with your business. We can add features, integrate new systems, or completely rebuild as needed. Existing clients receive priority scheduling and discounted rates for upgrades.',
  6),

-- Prism Engine FAQs
('prism-engine',
  'Can I cancel anytime?',
  'Yes! You can cancel your subscription at any time. You''ll retain access until the end of your billing period.',
  1),

('prism-engine',
  'What payment methods do you accept?',
  'We accept PayPal, which supports credit cards, debit cards, and PayPal balance.',
  2),

('prism-engine',
  'Can I upgrade or downgrade later?',
  'Absolutely. You can change your plan at any time. Upgrades take effect immediately, and downgrades apply at the next billing cycle.',
  3),

('prism-engine',
  'What happens to my data if I cancel?',
  'Your rules and components remain accessible in read-only mode for 30 days. You can always export them or resubscribe to regain full access.',
  4),

('prism-engine',
  'Do you offer refunds?',
  'We offer a 14-day money-back guarantee for annual subscriptions. Monthly subscriptions can be cancelled anytime but are non-refundable for the current period.',
  5),

('prism-engine',
  'Is there a free trial?',
  'Yes! Pro and Team plans include a 7-day free trial. No credit card required to start.',
  6);
