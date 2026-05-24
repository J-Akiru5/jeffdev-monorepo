CREATE TABLE marketing_phases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timeframe TEXT,
  description TEXT,
  color TEXT,
  "order" INTEGER DEFAULT 0
);

CREATE TABLE marketing_kpis (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC NOT NULL,
  unit TEXT DEFAULT ''
);

CREATE TABLE marketing_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  phase_id TEXT REFERENCES marketing_phases(id),
  owner_ids TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  platform TEXT,
  description TEXT,
  github_issue_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE marketing_team (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  initials TEXT,
  color TEXT,
  focus TEXT
);

ALTER TABLE marketing_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read marketing_phases"
  ON marketing_phases FOR SELECT USING (true);

CREATE POLICY "Anyone can read marketing_kpis"
  ON marketing_kpis FOR SELECT USING (true);

CREATE POLICY "Anyone can read marketing_team"
  ON marketing_team FOR SELECT USING (true);

CREATE POLICY "Anyone can read marketing_tasks"
  ON marketing_tasks FOR SELECT USING (true);

CREATE POLICY "Admins can insert marketing_kpis"
  ON marketing_kpis FOR INSERT USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can update marketing_kpis"
  ON marketing_kpis FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can manage marketing_tasks"
  ON marketing_tasks FOR ALL USING (
    auth.uid() IN (SELECT id FROM user_profiles WHERE role IN ('admin', 'manager'))
  );
