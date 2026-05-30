-- Migration: Core Product Template Seeding
-- Replaces placeholder products with 3 curated Core templates
-- and updates customization services with realistic offerings

-- =============================================================================
-- CLEANUP: Remove placeholder products and their contract terms
-- =============================================================================
DELETE FROM contract_terms WHERE template_id IN (SELECT id FROM product_templates);
DELETE FROM product_templates;

-- =============================================================================
-- CORE 1: Full-Stack SaaS Boilerplate
-- =============================================================================
INSERT INTO product_templates (name, slug, category, tagline, description, short_description,
  base_price_monthly_php, base_price_monthly_usd, base_price_annual_php, base_price_annual_usd,
  features, tech_stack, demo_url, icon, highlighted, sort_order, status)
VALUES (
  'Full-Stack SaaS Boilerplate',
  'saas-boilerplate',
  'boilerplate',
  'Ship your SaaS in weeks, not months',
  'The complete plumbing every SaaS needs. Authentication, subscription billing, admin dashboard, and multi-tenancy — all wired up and ready to customize. Built with Next.js 16 and Supabase for modern, type-safe development.

Stop reinventing auth flows and billing integrations. This boilerplate gives you a production-ready foundation with email/password + OAuth authentication, role-based access control, PayPal and Stripe subscription billing, and a comprehensive admin panel.

Includes onboarding session, deployment to your hosting, team training, and 36 months of support with software updates.',
  'Complete SaaS starter with auth, billing, RBAC, and admin dashboard.',
  8500, 150, 85000, 1500,
  '[
    {"name":"Authentication System","description":"Email/password, Google, GitHub OAuth with session management","included":true},
    {"name":"Role-Based Access Control","description":"Admin, manager, employee, client roles with granular permissions","included":true},
    {"name":"Subscription Billing","description":"PayPal & Stripe integration with webhook handling","included":true},
    {"name":"Admin Dashboard","description":"User management, analytics, system settings","included":true},
    {"name":"Multi-Tenancy","description":"Workspace isolation and team management","included":true},
    {"name":"Email System","description":"Transactional emails with Resend integration","included":true},
    {"name":"API Layer","description":"RESTful API with rate limiting and documentation","included":true},
    {"name":"Custom Integrations","description":"Third-party API connections and webhooks","included":false}
  ]',
  '["Next.js 16","Supabase","TypeScript","Tailwind CSS","PayPal","Stripe"]',
  NULL,
  'Layers',
  true,
  1,
  'active'
);

-- =============================================================================
-- CORE 2: Smart Hotel & Property Management System
-- =============================================================================
INSERT INTO product_templates (name, slug, category, tagline, description, short_description,
  base_price_monthly_php, base_price_monthly_usd, base_price_annual_php, base_price_annual_usd,
  features, tech_stack, demo_url, icon, highlighted, sort_order, status)
VALUES (
  'Smart Hotel PMS',
  'hotel-pms',
  'template',
  'Modern property management, simplified',
  'A comprehensive Property Management System designed for hotels, resorts, and vacation rentals. Handle room allocation, booking management, housekeeping workflows, and guest billing from a single dashboard.

Features a real-time availability calendar, automated booking confirmations, multi-property support, and detailed reporting. Integrated with major OTAs and local payment gateways for seamless operations.

Built with modern web technologies for fast performance and mobile-responsive access. Includes onboarding, deployment, training, and 36 months of support.',
  'Complete PMS with room allocation, booking engine, and housekeeping tracking.',
  12000, 215, 120000, 2150,
  '[
    {"name":"Room Management","description":"Real-time availability, room types, pricing tiers","included":true},
    {"name":"Booking Engine","description":"Direct bookings with calendar integration","included":true},
    {"name":"Housekeeping Tracking","description":"Room status updates, cleaning schedules","included":true},
    {"name":"Guest Billing","description":"Automated invoicing, payment processing","included":true},
    {"name":"Multi-Property Support","description":"Manage multiple locations from one dashboard","included":true},
    {"name":"Reporting Dashboard","description":"Occupancy rates, revenue analytics, guest insights","included":true},
    {"name":"OTA Integration","description":"Booking.com, Agoda, Airbnb sync","included":false},
    {"name":"Channel Manager","description":"Real-time rate and availability sync across platforms","included":false}
  ]',
  '["Next.js 16","Supabase","PostgreSQL","React","TypeScript"]',
  NULL,
  'Building2',
  true,
  2,
  'active'
);

-- =============================================================================
-- CORE 3: High-Performance E-Commerce Engine
-- =============================================================================
INSERT INTO product_templates (name, slug, category, tagline, description, short_description,
  base_price_monthly_php, base_price_monthly_usd, base_price_annual_php, base_price_annual_usd,
  features, tech_stack, demo_url, icon, highlighted, sort_order, status)
VALUES (
  'E-Commerce Engine',
  'ecommerce-engine',
  'template',
  'Philippine-ready online store',
  'A high-performance e-commerce platform built for the Philippine market. Features Cash on Delivery (COD), GCash and Maya payment integration, localized logistics with LBC and J&T, and optimized page load speeds under 2 seconds.

Includes product catalog management, shopping cart, checkout flow, order tracking, inventory management, and customer accounts. Designed for mobile-first shopping with PWA capabilities.

Comes with onboarding, deployment, training, and 36 months of support. Perfect for businesses ready to sell online with local payment preferences.',
  'E-commerce with COD, GCash/Maya, and localized Philippine logistics.',
  10000, 180, 100000, 1800,
  '[
    {"name":"Product Catalog","description":"Categories, variants, images, SEO optimization","included":true},
    {"name":"Shopping Cart & Checkout","description":"Streamlined checkout with guest option","included":true},
    {"name":"Cash on Delivery","description":"COD payment option for Philippine market","included":true},
    {"name":"GCash & Maya Integration","description":"Local e-wallet payment processing","included":true},
    {"name":"Order Management","description":"Order tracking, status updates, history","included":true},
    {"name":"Inventory Management","description":"Stock tracking, low inventory alerts","included":true},
    {"name":"Localized Logistics","description":"LBC, J&T, Grab Express integration","included":false},
    {"name":"Multi-Vendor Support","description":"Marketplace functionality for multiple sellers","included":false}
  ]',
  '["Next.js 16","Supabase","Tailwind CSS","TypeScript","Maya","PayPal"]',
  NULL,
  'ShoppingCart',
  true,
  3,
  'active'
);

-- =============================================================================
-- RE-SEED CONTRACT TERMS for Core 3 templates
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
FROM product_templates pt
WHERE pt.slug IN ('saas-boilerplate', 'hotel-pms', 'ecommerce-engine');

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
FROM product_templates pt
WHERE pt.slug IN ('saas-boilerplate', 'hotel-pms', 'ecommerce-engine');

-- =============================================================================
-- UPDATE CUSTOMIZATION SERVICES with realistic offerings
-- =============================================================================
DELETE FROM customization_services;

INSERT INTO customization_services (name, slug, description, pricing_model,
  estimated_range_min_php, estimated_range_max_php, estimated_range_min_usd, estimated_range_max_usd,
  turnaround_days, sort_order, status)
VALUES
('Branding & Visual Identity', 'branding-visual-identity',
  'Complete brand overhaul including logo design, color palette, typography system, and brand guidelines document. Perfect for businesses establishing their visual identity.',
  'fixed', 15000, 50000, 270, 890, 7, 1, 'active'),

('Feature Additions & Enhancements', 'feature-additions',
  'Custom features beyond the template scope. Includes requirements gathering, architecture planning, development, testing, and deployment. Scoped per feature.',
  'project', 50000, 300000, 890, 5340, 14, 2, 'active'),

('Third-Party Integrations', 'third-party-integrations',
  'Connect your platform to external services: payment gateways, CRM systems, ERP, SMS providers, email marketing, accounting software, and more.',
  'project', 25000, 150000, 445, 2670, 10, 3, 'active'),

('Full Rewrite & Rebuild', 'full-rewrite',
  'Significant architectural changes or complete rebuild from scratch. Includes migration planning, data transfer, and parallel running period.',
  'project', 200000, 1000000, 3560, 17780, 30, 4, 'active'),

('Custom Training & Workshops', 'custom-training',
  'On-site or virtual training sessions for your team. Covers platform usage, admin operations, content management, and best practices.',
  'fixed', 10000, 30000, 180, 530, 3, 5, 'active'),

('Priority Support & SLA', 'priority-support',
  'Dedicated support channel with guaranteed response times. Includes bug fixes, security patches, and priority feature requests.',
  'fixed', 5000, 15000, 90, 267, 1, 6, 'active');
