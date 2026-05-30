-- Migration: Storage Buckets + Client Contracts
-- Creates Supabase storage buckets for product images and portfolio
-- Creates client_contracts table for tracking active subscriptions

-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Services bucket (for customization service promotional graphics)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'services',
  'services',
  true,
  52428800,  -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Works catalog bucket (for portfolio/past works images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'works_catalog',
  'works_catalog',
  true,
  52428800,  -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for 'services' bucket
DO $$ BEGIN
  CREATE POLICY "Public read access for services" ON storage.objects
    FOR SELECT USING (bucket_id = 'services');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage services" ON storage.objects
    FOR ALL USING (bucket_id = 'services' AND auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload to services" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'services' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete from services" ON storage.objects
    FOR DELETE USING (bucket_id = 'services' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for 'works_catalog' bucket
DO $$ BEGIN
  CREATE POLICY "Public read access for works_catalog" ON storage.objects
    FOR SELECT USING (bucket_id = 'works_catalog');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage works_catalog" ON storage.objects
    FOR ALL USING (bucket_id = 'works_catalog' AND auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload to works_catalog" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'works_catalog' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete from works_catalog" ON storage.objects
    FOR DELETE USING (bucket_id = 'works_catalog' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- CLIENT CONTRACTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS client_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES product_templates(id) ON DELETE RESTRICT,
  contract_term_id UUID NOT NULL REFERENCES contract_terms(id) ON DELETE RESTRICT,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  maya_subscription_id TEXT,
  maya_checkout_id TEXT,
  maya_customer_id TEXT,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'PHP',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for client_contracts
CREATE INDEX IF NOT EXISTS idx_client_contracts_status ON client_contracts(status);
CREATE INDEX IF NOT EXISTS idx_client_contracts_template ON client_contracts(template_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_client_email ON client_contracts(client_email);
CREATE INDEX IF NOT EXISTS idx_client_contracts_maya_sub ON client_contracts(maya_subscription_id);

-- RLS for client_contracts
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage client_contracts" ON client_contracts
    FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
