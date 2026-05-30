-- Migration: Product Templates & Contract Terms
-- Adds product catalog for SaaS templates sold as 3-year contracts
-- Any customization triggers a separate quotation

-- =============================================================================
-- PRODUCT TEMPLATES
-- =============================================================================
CREATE TABLE IF NOT EXISTS product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('template', 'boilerplate', 'addon')),
  tagline TEXT,
  description TEXT,
  short_description TEXT,

  -- Pricing (base monthly/annual for 3-year contract)
  base_price_monthly_php NUMERIC,
  base_price_monthly_usd NUMERIC,
  base_price_annual_php NUMERIC,
  base_price_annual_usd NUMERIC,

  -- Rich features: [{name, description, included: boolean}]
  features JSONB DEFAULT '[]'::jsonb,

  -- Tech stack: ["Next.js", "Supabase", "TypeScript"]
  tech_stack JSONB DEFAULT '[]'::jsonb,

  -- External links
  demo_url TEXT,
  repo_url TEXT,
  documentation_url TEXT,

  -- Display
  icon TEXT,
  image_url TEXT,
  highlighted BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- CONTRACT TERMS
-- =============================================================================
CREATE TABLE IF NOT EXISTS contract_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,

  -- Term config
  term_months INTEGER NOT NULL DEFAULT 36,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),

  -- Pricing for this term
  price_php NUMERIC NOT NULL,
  price_usd NUMERIC NOT NULL,

  -- Annual prepay discount
  discount_percent NUMERIC DEFAULT 0,

  -- What's included in the contract
  includes JSONB DEFAULT '{}'::jsonb,
  -- {onboarding: true, deployment: true, training_session: true,
  --  support_months: 36, updates: true, hosting: false}

  -- Extension rules (auto-calculated from 3yr base)
  extension_enabled BOOLEAN DEFAULT true,
  extension_max_years INTEGER DEFAULT 5,
  extension_rate_increase_percent NUMERIC DEFAULT 10,

  -- Display
  highlighted BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(template_id, term_months, billing_cycle)
);

-- =============================================================================
-- CUSTOMIZATION SERVICES
-- =============================================================================
CREATE TABLE IF NOT EXISTS customization_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Pricing model
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('fixed', 'hourly', 'project')),
  estimated_range_min_php NUMERIC,
  estimated_range_max_php NUMERIC,
  estimated_range_min_usd NUMERIC,
  estimated_range_max_usd NUMERIC,

  turnaround_days INTEGER,

  -- Display
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- EXTEND QUOTES TABLE
-- =============================================================================
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_type TEXT DEFAULT 'project'
  CHECK (quote_type IN ('project', 'customization'));
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES product_templates(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customization_service_ids UUID[] DEFAULT '{}';

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_product_templates_category ON product_templates(category);
CREATE INDEX IF NOT EXISTS idx_product_templates_status ON product_templates(status);
CREATE INDEX IF NOT EXISTS idx_product_templates_sort ON product_templates(sort_order);
CREATE INDEX IF NOT EXISTS idx_contract_terms_template ON contract_terms(template_id);
CREATE INDEX IF NOT EXISTS idx_customization_services_status ON customization_services(status);
CREATE INDEX IF NOT EXISTS idx_quotes_type ON quotes(quote_type);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage product_templates" ON product_templates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage contract_terms" ON contract_terms
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage customization_services" ON customization_services
  FOR ALL USING (auth.role() = 'service_role');

-- Public read access (for app consumption)
CREATE POLICY "Anyone can read product_templates" ON product_templates
  FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can read contract_terms" ON contract_terms
  FOR SELECT USING (status = 'active');

CREATE POLICY "Anyone can read customization_services" ON customization_services
  FOR SELECT USING (status = 'active');

-- =============================================================================
-- SEED DATA: Product Templates
-- =============================================================================
INSERT INTO product_templates (name, slug, category, tagline, description, short_description,
  base_price_monthly_php, base_price_monthly_usd, base_price_annual_php, base_price_annual_usd,
  features, tech_stack, icon, highlighted, sort_order, status)
VALUES

-- Website Templates
('Website Starter', 'website-starter', 'template',
  'Professional websites in weeks, not months',
  'Pre-built website templates for businesses, portfolios, and landing pages. Fully responsive, SEO-optimized, and easy to customize.',
  'Professional website templates for businesses and portfolios.',
  2500, 45, 25000, 450,
  '[{"name":"Responsive Design","description":"Mobile-first design that works on all devices","included":true},{"name":"SEO Optimization","description":"Meta tags, sitemap, and structured data","included":true},{"name":"Contact Forms","description":"Built-in contact form with email notifications","included":true},{"name":"CMS Integration","description":"Content management system for easy updates","included":true},{"name":"Analytics","description":"Google Analytics integration","included":false},{"name":"E-commerce","description":"Online store functionality","included":false}]',
  '["Next.js","Tailwind CSS","TypeScript"]',
  'Globe', true, 1, 'active'),

-- SaaS Platform Templates
('SaaS Platform', 'saas-platform', 'template',
  'Full-stack SaaS ready to deploy',
  'Complete SaaS boilerplate with authentication, billing, admin dashboard, and multi-tenancy. Launch your SaaS in days.',
  'Complete SaaS boilerplate with auth, billing, and admin.',
  8500, 150, 85000, 1500,
  '[{"name":"User Authentication","description":"Email/password, Google, GitHub OAuth","included":true},{"name":"Subscription Billing","description":"PayPal & Stripe integration with webhooks","included":true},{"name":"Admin Dashboard","description":"User management, analytics, and settings","included":true},{"name":"Multi-tenancy","description":"Workspace isolation and team management","included":true},{"name":"API Layer","description":"RESTful API with rate limiting","included":true},{"name":"Email System","description":"Transactional emails with Resend","included":false}]',
  '["Next.js","Supabase","TypeScript","PayPal"]',
  'Layers', true, 2, 'active'),

-- Mobile App Templates
('Mobile App Starter', 'mobile-app-starter', 'template',
  'Cross-platform mobile apps',
  'React Native templates for iOS and Android. Includes navigation, state management, and API integration patterns.',
  'React Native templates for iOS and Android apps.',
  6500, 115, 65000, 1150,
  '[{"name":"Cross-platform","description":"Single codebase for iOS and Android","included":true},{"name":"Navigation","description":"React Navigation with deep linking","included":true},{"name":"State Management","description":"Zustand or Redux toolkit","included":true},{"name":"API Integration","description":"HTTP client with caching and retry","included":true},{"name":"Push Notifications","description":"Firebase Cloud Messaging","included":false},{"name":"Offline Support","description":"Local storage and sync","included":false}]',
  '["React Native","TypeScript","Expo"]',
  'Smartphone', false, 3, 'active'),

-- Custom Software Templates
('Custom Software', 'custom-software', 'template',
  'Domain-specific solutions',
  'Tailored software for clinics, inventory, HR, and other domain-specific needs. Modular architecture for easy extension.',
  'Domain-specific software templates for clinics, inventory, HR.',
  12000, 215, 120000, 2150,
  '[{"name":"Domain Models","description":"Pre-built data models for your industry","included":true},{"name":"Workflow Automation","description":"Custom business logic and automation","included":true},{"name":"Reporting","description":"Dashboards and exportable reports","included":true},{"name":"User Roles","description":"Role-based access control","included":true},{"name":"Integrations","description":"Third-party API connections","included":false},{"name":"Mobile App","description":"Companion mobile application","included":false}]',
  '["Next.js","Supabase","TypeScript","PostgreSQL"]',
  'Code', false, 4, 'active'),

-- Admin/Operations Dashboard
('Admin Dashboard', 'admin-dashboard', 'template',
  'Robust backend management',
  'Comprehensive admin dashboard for managing users, reports, data visualization, and system settings.',
  'Backend dashboard for user management, reports, and data.',
  5500, 98, 55000, 980,
  '[{"name":"User Management","description":"CRUD operations with role-based access","included":true},{"name":"Analytics Dashboard","description":"Charts, metrics, and KPI tracking","included":true},{"name":"Data Tables","description":"Sortable, filterable, exportable tables","included":true},{"name":"Settings Panel","description":"System configuration and preferences","included":true},{"name":"Audit Logs","description":"Track all system changes","included":false},{"name":"Custom Reports","description":"Drag-and-drop report builder","included":false}]',
  '["Next.js","Recharts","Tailwind CSS","TypeScript"]',
  'LayoutDashboard', false, 5, 'active'),

-- SaaS Boilerplate (Auth/Billing)
('SaaS Boilerplate', 'saas-boilerplate', 'boilerplate',
  'The plumbing every project needs',
  'Authentication, billing, and user management starter kit. Skip the setup and focus on your product.',
  'Auth, billing, and user management starter kit.',
  3500, 63, 35000, 630,
  '[{"name":"Auth System","description":"Email/password, OAuth, MFA support","included":true},{"name":"Billing Integration","description":"PayPal & Stripe with subscription mgmt","included":true},{"name":"User Dashboard","description":"Profile, settings, and billing portal","included":true},{"name":"Admin Panel","description":"User management and analytics","included":true},{"name":"Email Templates","description":"Transactional email templates","included":true},{"name":"API Keys","description":"Developer API key management","included":false}]',
  '["Next.js","Supabase","Clerk","TypeScript"]',
  'Wrench', true, 6, 'active'),

-- AI Feature Add-ons
('AI Integration Pack', 'ai-integration-pack', 'addon',
  'Modular AI plug-ins',
  'Pre-built AI features: chatbots, auto-tagging, content generation, and prediction models. Plug into any template.',
  'AI plug-ins: chatbots, auto-tagging, content generation.',
  4500, 80, 45000, 800,
  '[{"name":"AI Chatbot","description":"Customer support chatbot with knowledge base","included":true},{"name":"Auto-Tagging","description":"Automatic content classification","included":true},{"name":"Content Generation","description":"AI-powered content creation","included":true},{"name":"Prediction Models","description":"Forecasting and analytics","included":false},{"name":"Custom Training","description":"Fine-tune models on your data","included":false}]',
  '["OpenAI","LangChain","Python","FastAPI"]',
  'Brain', false, 7, 'active'),

-- Integration Templates
('Integration Connectors', 'integration-connectors', 'addon',
  'Pre-built third-party connectors',
  'Ready-to-use connectors for SMS, payment gateways, Google Calendar, and more. Save weeks of integration work.',
  'Connectors for SMS, payments, calendars, and more.',
  2500, 45, 25000, 450,
  '[{"name":"Payment Gateways","description":"PayPal, Stripe, GCash integration","included":true},{"name":"SMS Alerts","description":"Twilio SMS notifications","included":true},{"name":"Calendar Sync","description":"Google Calendar two-way sync","included":true},{"name":"Email Marketing","description":"Mailchimp, SendGrid integration","included":false},{"name":"CRM Connectors","description":"HubSpot, Salesforce sync","included":false}]',
  '["REST API","Webhooks","TypeScript"]',
  'Plug', false, 8, 'active');

-- =============================================================================
-- SEED DATA: Contract Terms (3-year base)
-- =============================================================================
INSERT INTO contract_terms (template_id, term_months, billing_cycle, price_php, price_usd,
  discount_percent, includes, extension_enabled, extension_max_years, extension_rate_increase_percent,
  highlighted, sort_order, status)
SELECT
  pt.id,
  36,
  'monthly',
  pt.base_price_monthly_php,
  pt.base_price_monthly_usd,
  0,
  '{"onboarding": true, "deployment": true, "training_session": true, "support_months": 36, "updates": true, "hosting": false}',
  true,
  5,
  10,
  true,
  1,
  'active'
FROM product_templates pt;

INSERT INTO contract_terms (template_id, term_months, billing_cycle, price_php, price_usd,
  discount_percent, includes, extension_enabled, extension_max_years, extension_rate_increase_percent,
  highlighted, sort_order, status)
SELECT
  pt.id,
  36,
  'annual',
  pt.base_price_annual_php,
  pt.base_price_annual_usd,
  10,
  '{"onboarding": true, "deployment": true, "training_session": true, "support_months": 36, "updates": true, "hosting": false}',
  true,
  5,
  10,
  false,
  2,
  'active'
FROM product_templates pt;

-- =============================================================================
-- SEED DATA: Customization Services
-- =============================================================================
INSERT INTO customization_services (name, slug, description, pricing_model,
  estimated_range_min_php, estimated_range_max_php, estimated_range_min_usd, estimated_range_max_usd,
  turnaround_days, sort_order, status)
VALUES
('Branding & Design', 'branding-design',
  'Logo, color scheme, typography, and visual identity customization.',
  'fixed', 15000, 50000, 270, 890, 7, 1, 'active'),

('Feature Additions', 'feature-additions',
  'New features beyond the template scope. Includes planning, development, and testing.',
  'project', 50000, 300000, 890, 5340, 14, 2, 'active'),

('Third-Party Integrations', 'third-party-integrations',
  'Connect external services: payment gateways, CRM, ERP, SMS, email marketing.',
  'project', 25000, 150000, 445, 2670, 10, 3, 'active'),

('Full Rewrite', 'full-rewrite',
  'Significant architectural changes or complete rebuild from scratch.',
  'project', 200000, 1000000, 3560, 17780, 30, 4, 'active'),

('Custom Training', 'custom-training',
  'On-site or virtual training sessions for your team.',
  'fixed', 10000, 30000, 180, 530, 3, 5, 'active'),

('Priority Support', 'priority-support',
  'Dedicated support channel with faster response times.',
  'fixed', 5000, 15000, 90, 267, 1, 6, 'active');
