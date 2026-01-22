-- =============================================
-- PRISM EXERCISE - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

-- Difficulty levels for exercises
CREATE TYPE difficulty AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ELITE');

-- Training methodologies
CREATE TYPE training_type AS ENUM ('CIRCUIT', 'HYPERTROPHY', 'ENDURANCE', 'SKILL');

-- Muscle group categories
CREATE TYPE muscle_group AS ENUM ('PUSH', 'PULL', 'LEGS', 'CORE');

-- =============================================
-- TABLES
-- =============================================

-- Exercise Library (Public, seeded by admin)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  difficulty difficulty NOT NULL,
  category training_type NOT NULL,
  muscles muscle_group[] NOT NULL,
  video_url TEXT,
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  google_fit_token JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Templates (User's saved workout programs)
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  exercise_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Logs (Historical record of workouts)
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INT,
  avg_heart_rate INT,
  mood INT CHECK (mood >= 1 AND mood <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Set Logs (Individual sets within a workout)
CREATE TABLE set_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  set_number INT NOT NULL,
  reps INT NOT NULL,
  weight_kg DECIMAL(5,2) DEFAULT 0,
  rpe INT CHECK (rpe >= 1 AND rpe <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;

-- Exercises: Public read access (everyone can browse the library)
CREATE POLICY "Exercises are public" ON exercises
  FOR SELECT USING (true);

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Workout Templates: Users can only CRUD their own templates
CREATE POLICY "Users can CRUD own templates" ON workout_templates
  FOR ALL USING (auth.uid() = user_id);

-- Workout Logs: Users can only CRUD their own logs
CREATE POLICY "Users can CRUD own logs" ON workout_logs
  FOR ALL USING (auth.uid() = user_id);

-- Set Logs: Access through workout_log ownership
CREATE POLICY "Users can CRUD own set logs" ON set_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_logs 
      WHERE workout_logs.id = set_logs.workout_log_id 
      AND workout_logs.user_id = auth.uid()
    )
  );

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DATA: Initial Exercises
-- =============================================

INSERT INTO exercises (name, difficulty, category, muscles, instructions) VALUES
  ('Strict Pull-Up', 'INTERMEDIATE', 'HYPERTROPHY', ARRAY['PULL']::muscle_group[], 
   'Dead hang to full pull, chin over bar. No kipping.'),
  
  ('Pseudo Planche Lean', 'ADVANCED', 'SKILL', ARRAY['PUSH', 'CORE']::muscle_group[], 
   'Protract scapula, lean forward with locked arms. Maintain hollow body.'),
  
  ('Parallette Push-Up', 'BEGINNER', 'ENDURANCE', ARRAY['PUSH']::muscle_group[], 
   'Full range of motion on parallettes, chest to floor level.'),
  
  ('Tuck Front Lever', 'ADVANCED', 'SKILL', ARRAY['PULL', 'CORE']::muscle_group[], 
   'Horizontal body with tucked knees, engage lats and maintain straight arms.'),
  
  ('Diamond Push-Up', 'BEGINNER', 'HYPERTROPHY', ARRAY['PUSH']::muscle_group[], 
   'Hands together forming diamond shape, full extension and controlled descent.'),
  
  ('L-Sit Hold', 'INTERMEDIATE', 'SKILL', ARRAY['CORE']::muscle_group[], 
   'Legs straight and parallel to ground, arms locked, shoulders depressed.'),
  
  ('Archer Push-Up', 'INTERMEDIATE', 'HYPERTROPHY', ARRAY['PUSH']::muscle_group[], 
   'Wide stance, shift weight to one arm while keeping the other straight.'),
  
  ('Australian Pull-Up', 'BEGINNER', 'HYPERTROPHY', ARRAY['PULL']::muscle_group[], 
   'Body at 45-degree angle, pull chest to bar with controlled movement.'),
  
  ('Pike Push-Up', 'INTERMEDIATE', 'HYPERTROPHY', ARRAY['PUSH']::muscle_group[], 
   'Hips high in pike position, head moves toward the floor between hands.'),
  
  ('Hanging Leg Raise', 'INTERMEDIATE', 'HYPERTROPHY', ARRAY['CORE']::muscle_group[], 
   'Dead hang, raise straight legs to 90 degrees. Control the descent.'),
  
  ('Bodyweight Squat', 'BEGINNER', 'ENDURANCE', ARRAY['LEGS']::muscle_group[], 
   'Feet shoulder-width, break at hips and knees, thighs parallel to floor.'),
  
  ('Bulgarian Split Squat', 'INTERMEDIATE', 'HYPERTROPHY', ARRAY['LEGS']::muscle_group[], 
   'Rear foot elevated, front knee tracks over toes, vertical torso.');

-- =============================================
-- INDEXES for performance
-- =============================================

CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(date);
CREATE INDEX idx_set_logs_workout ON set_logs(workout_log_id);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_category ON exercises(category);
