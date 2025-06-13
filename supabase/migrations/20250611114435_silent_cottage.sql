/*
  # Wellness Platform Database Schema

  1. New Tables
    - `profiles` - User profiles with health information
    - `workouts` - Workout logs and sessions
    - `sleep_logs` - Sleep tracking data
    - `mood_logs` - Mood and mental health tracking
    - `nutrition_logs` - Food and nutrition tracking
    - `goals` - User wellness goals
    - `ai_recommendations` - AI-generated workout recommendations
    - `achievements` - User achievements and badges

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text,
  age integer,
  height integer, -- in inches
  weight integer, -- in pounds
  fitness_level text CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  goals text[] DEFAULT '{}',
  allergies text[] DEFAULT '{}',
  health_conditions text[] DEFAULT '{}',
  medications text[] DEFAULT '{}',
  previous_injuries text[] DEFAULT '{}',
  preferred_workout_types text[] DEFAULT '{}',
  available_equipment text[] DEFAULT '{}',
  bio text DEFAULT '',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  duration integer NOT NULL, -- in minutes
  calories_burned integer DEFAULT 0,
  exercises text[] DEFAULT '{}',
  notes text DEFAULT '',
  difficulty text CHECK (difficulty IN ('easy', 'moderate', 'hard')),
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create sleep_logs table
CREATE TABLE IF NOT EXISTS sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  bedtime time NOT NULL,
  wakeup_time time NOT NULL,
  duration numeric(3,1) NOT NULL, -- in hours
  quality integer CHECK (quality >= 1 AND quality <= 10),
  deep_sleep numeric(3,1) DEFAULT 0,
  rem_sleep numeric(3,1) DEFAULT 0,
  light_sleep numeric(3,1) DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create mood_logs table
CREATE TABLE IF NOT EXISTS mood_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  mood integer CHECK (mood >= 1 AND mood <= 10),
  energy integer CHECK (energy >= 1 AND energy <= 10),
  stress integer CHECK (stress >= 1 AND stress <= 10),
  anxiety integer CHECK (anxiety >= 1 AND anxiety <= 10),
  happiness integer CHECK (happiness >= 1 AND happiness <= 10),
  weather text DEFAULT 'sunny',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create nutrition_logs table
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  meal_type text CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text NOT NULL,
  calories integer NOT NULL,
  protein numeric(5,1) DEFAULT 0,
  carbs numeric(5,1) DEFAULT 0,
  fat numeric(5,1) DEFAULT 0,
  fiber numeric(5,1) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  target_value numeric NOT NULL,
  current_value numeric DEFAULT 0,
  unit text NOT NULL,
  deadline date,
  status text CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text DEFAULT 'workout',
  name text NOT NULL,
  description text,
  content jsonb NOT NULL, -- stores the full recommendation data
  reasoning text,
  mood_score integer,
  energy_score integer,
  stress_score integer,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  icon text DEFAULT '🏆',
  earned boolean DEFAULT false,
  earned_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Workouts policies
CREATE POLICY "Users can manage own workouts"
  ON workouts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Sleep logs policies
CREATE POLICY "Users can manage own sleep logs"
  ON sleep_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Mood logs policies
CREATE POLICY "Users can manage own mood logs"
  ON mood_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Nutrition logs policies
CREATE POLICY "Users can manage own nutrition logs"
  ON nutrition_logs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- AI recommendations policies
CREATE POLICY "Users can manage own AI recommendations"
  ON ai_recommendations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can manage own achievements"
  ON achievements FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();