-- Availability slots table (quarter-based slot tracking for agency availability)
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quarter_label TEXT UNIQUE NOT NULL,
  total_slots INTEGER NOT NULL DEFAULT 0,
  filled_slots INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_availability_slots_active ON availability_slots(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view availability)
CREATE POLICY "Anyone can view availability slots" ON availability_slots
  FOR SELECT USING (true);

-- Authenticated users can manage availability slots
CREATE POLICY "Authenticated users can insert availability slots" ON availability_slots
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update availability slots" ON availability_slots
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete availability slots" ON availability_slots
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed: default active quarter
INSERT INTO availability_slots (quarter_label, total_slots, filled_slots, is_active) VALUES
  ('Q2 2026', 2, 0, true)
ON CONFLICT (quarter_label) DO NOTHING;
