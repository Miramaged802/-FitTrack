import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: any;

// Better error handling for missing environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'Set' : 'Missing',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Set' : 'Missing'
  });
  
  // Create a mock client to prevent app crashes
  const mockClient = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }) }),
      delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }),
      order: () => ({ limit: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }) }),
      limit: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }),
      gte: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } })
    }),
    auth: {
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    }
  };
  
  supabase = mockClient;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Database types
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  age?: number;
  height?: number;
  weight?: number;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  allergies: string[];
  health_conditions: string[];
  medications: string[];
  previous_injuries: string[];
  preferred_workout_types: string[];
  available_equipment: string[];
  bio: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  type: string;
  duration: number;
  calories_burned: number;
  exercises: string[];
  notes: string;
  difficulty?: 'easy' | 'moderate' | 'hard';
  date: string;
  created_at: string;
}

export interface SleepLog {
  id: string;
  user_id: string;
  date: string;
  bedtime: string;
  wakeup_time: string;
  duration: number;
  quality: number;
  deep_sleep?: number;
  rem_sleep?: number;
  light_sleep?: number;
  notes: string;
  created_at: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  date: string;
  mood: number;
  energy: number;
  stress: number;
  anxiety: number;
  happiness: number;
  weather: string;
  notes: string;
  created_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface AIRecommendation {
  id: string;
  user_id: string;
  recommendation_type: string;
  name: string;
  description?: string;
  content: any;
  reasoning?: string;
  mood_score?: number;
  energy_score?: number;
  stress_score?: number;
  used: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  earned: boolean;
  earned_at?: string;
  created_at: string;
}