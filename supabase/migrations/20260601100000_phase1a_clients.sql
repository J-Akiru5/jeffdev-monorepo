-- Phase 1A: Extract Clients Table
-- Problem: client_name/client_email duplicated in projects and client_contracts.
-- Solution: Create a single clients table as the source of truth.

-- =============================================================================
-- STEP 1: Create clients table
-- =============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- STEP 2: Populate clients from existing projects (deduplicated)
-- =============================================================================
INSERT INTO clients (name, email)
SELECT DISTINCT ON (LOWER(TRIM(client_name)), LOWER(TRIM(COALESCE(client_email, ''))))
  TRIM(client_name),
  NULLIF(TRIM(client_email), '')
FROM projects
WHERE client_name IS NOT NULL AND TRIM(client_name) != ''
ORDER BY LOWER(TRIM(client_name)), LOWER(TRIM(COALESCE(client_email, '')))
ON CONFLICT DO NOTHING;

-- Also populate from client_contracts (may have clients not in projects)
INSERT INTO clients (name, email)
SELECT DISTINCT ON (LOWER(TRIM(client_name)), LOWER(TRIM(COALESCE(client_email, ''))))
  TRIM(client_name),
  NULLIF(TRIM(client_email), '')
FROM client_contracts
WHERE client_name IS NOT NULL AND TRIM(client_name) != ''
  AND NOT EXISTS (
    SELECT 1 FROM clients c
    WHERE LOWER(c.name) = LOWER(TRIM(client_contracts.client_name))
      AND LOWER(COALESCE(c.email, '')) = LOWER(TRIM(COALESCE(client_contracts.client_email, '')))
  )
ORDER BY LOWER(TRIM(client_name)), LOWER(TRIM(COALESCE(client_email, '')))
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 3: Add client_id FK to projects (nullable initially)
-- =============================================================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 4: Backfill projects.client_id
-- =============================================================================
UPDATE projects p
SET client_id = c.id
FROM clients c
WHERE LOWER(TRIM(p.client_name)) = LOWER(c.name)
  AND LOWER(TRIM(COALESCE(p.client_email, ''))) = LOWER(COALESCE(c.email, ''))
  AND p.client_id IS NULL;

-- =============================================================================
-- STEP 5: Add client_id FK to client_contracts (nullable initially)
-- =============================================================================
ALTER TABLE client_contracts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 6: Backfill client_contracts.client_id
-- =============================================================================
UPDATE client_contracts cc
SET client_id = c.id
FROM clients c
WHERE LOWER(TRIM(cc.client_name)) = LOWER(c.name)
  AND LOWER(TRIM(COALESCE(cc.client_email, ''))) = LOWER(COALESCE(c.email, ''))
  AND cc.client_id IS NULL;

-- =============================================================================
-- STEP 7: Indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_client_id ON client_contracts(client_id);

-- =============================================================================
-- STEP 8: RLS for clients
-- =============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view clients" ON clients FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role can manage clients" ON clients FOR ALL USING (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- STEP 9: Trigger for updated_at
-- =============================================================================
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 10: Drop denormalized columns
-- (client_name/client_email are replaced by client_id FK)
-- =============================================================================
ALTER TABLE projects DROP COLUMN IF EXISTS client_name;
ALTER TABLE projects DROP COLUMN IF EXISTS client_email;
ALTER TABLE client_contracts DROP COLUMN IF EXISTS client_name;
ALTER TABLE client_contracts DROP COLUMN IF EXISTS client_email;
