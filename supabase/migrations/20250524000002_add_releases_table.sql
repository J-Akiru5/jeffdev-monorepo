-- Releases table (community changelog / release notes)
CREATE TYPE release_type AS ENUM ('tool', 'update', 'patch');

CREATE TABLE IF NOT EXISTS releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  version TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type release_type NOT NULL DEFAULT 'update',
  description TEXT NOT NULL,
  link TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_releases_date ON releases(date DESC);
CREATE INDEX idx_releases_type ON releases(type);
CREATE INDEX idx_releases_is_featured ON releases(is_featured) WHERE is_featured = TRUE;

-- RLS
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view releases)
CREATE POLICY "Anyone can view releases" ON releases
  FOR SELECT USING (true);

-- Authenticated users can insert releases
CREATE POLICY "Authenticated users can insert releases" ON releases
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update releases
CREATE POLICY "Authenticated users can update releases" ON releases
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Authenticated users can delete releases
CREATE POLICY "Authenticated users can delete releases" ON releases
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_releases_updated_at BEFORE UPDATE ON releases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: sample release data for development
INSERT INTO releases (title, version, date, type, description, link, tags, is_featured) VALUES
  (
    'Prism Context Engine',
    'v2.4.0',
    NOW() - INTERVAL '2 days',
    'tool',
    'Major update to the Prism Context Engine with enhanced memory persistence, improved token optimization, and a new CLI-based agent management system. This release introduces parallel agent execution and smarter context pruning.',
    'https://prism.jeffdev.studio',
    ARRAY['prism', 'cli', 'agents', 'memory'],
    TRUE
  ),
  (
    'Syntaxure Labs Website',
    'v1.2.0',
    NOW() - INTERVAL '7 days',
    'update',
    'Redesigned the services section with interactive pricing cards, added the Agentic Protocol showcase, and improved mobile navigation with smoother transitions.',
    NULL,
    ARRAY['frontend', 'design', 'performance'],
    TRUE
  ),
  (
    'Prism MCP Server',
    'v0.9.0',
    NOW() - INTERVAL '14 days',
    'update',
    'Beta release of the Model Context Protocol server. Supports stdio transport, tool discovery, and resource management for AI agent integration.',
    'https://prism.jeffdev.studio',
    ARRAY['mcp', 'ai', 'server'],
    FALSE
  ),
  (
    'Performance Optimization',
    'v1.1.0',
    NOW() - INTERVAL '21 days',
    'patch',
    'Reduced bundle sizes by 35%, implemented image lazy loading, and added Redis caching for API routes. Lighthouse scores now consistently above 95.',
    NULL,
    ARRAY['performance', 'optimization', 'infrastructure'],
    FALSE
  ),
  (
    'Prism Admin Dashboard',
    'v1.0.0',
    NOW() - INTERVAL '30 days',
    'tool',
    'Initial release of the Prism Admin dashboard — a mission-control interface for managing users, subscriptions, projects, invoices, and content. Built with Next.js 16 and Supabase.',
    NULL,
    ARRAY['admin', 'dashboard', 'release'],
    TRUE
  )
ON CONFLICT DO NOTHING;
