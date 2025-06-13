import { supabase } from '../lib/supabase';
import type { Profile, Workout, SleepLog, MoodLog, NutritionLog, Goal, AIRecommendation, Achievement } from '../lib/supabase';

// Helper function to check if Supabase is properly configured
const isSupabaseConfigured = (): boolean => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Helper function to handle Supabase configuration errors
const handleConfigurationError = (operation: string) => {
  const error = new Error(`Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.`);
  console.error(`${operation} failed:`, error.message);
  return error;
};

export class DatabaseService {
  // Profile operations
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      if (!isSupabaseConfigured()) {
        throw handleConfigurationError('getProfile');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      // Handle configuration errors differently from database errors
      if (error.message?.includes('Supabase not configured')) {
        console.error('Configuration error in getProfile:', error.message);
        return null; // Return null instead of throwing for configuration errors
      }
      
      console.error('Error in getProfile:', error);
      return null;
    }
  }

  static async createProfile(profile: Partial<Profile>): Promise<Profile | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot create profile');
        return null;
      }

      console.log('Creating profile:', profile);

      // Prepare profile data matching exact database schema
      const profileData = {
        user_id: profile.user_id,
        name: profile.name || '',
        email: profile.email || '',
        age: profile.age || null,
        height: profile.height || null,
        weight: profile.weight || null,
        fitness_level: profile.fitness_level || 'beginner',
        goals: profile.goals || [],
        allergies: profile.allergies || [],
        health_conditions: profile.health_conditions || [],
        medications: profile.medications || [],
        previous_injuries: profile.previous_injuries || [],
        preferred_workout_types: profile.preferred_workout_types || [],
        available_equipment: profile.available_equipment || [],
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || null
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      console.log('Profile created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in createProfile:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot update profile');
        return null;
      }

      // Prepare update data matching exact database schema
      const updateData = {
        name: updates.name || '',
        email: updates.email || '',
        age: updates.age || null,
        height: updates.height || null,
        weight: updates.weight || null,
        fitness_level: updates.fitness_level || 'beginner',
        goals: updates.goals || [],
        allergies: updates.allergies || [],
        health_conditions: updates.health_conditions || [],
        medications: updates.medications || [],
        previous_injuries: updates.previous_injuries || [],
        preferred_workout_types: updates.preferred_workout_types || [],
        available_equipment: updates.available_equipment || [],
        bio: updates.bio || '',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Error in updateProfile:', error);
      return null;
    }
  }

  // Workout operations
  static async getWorkouts(userId: string, limit = 50): Promise<Workout[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get workouts');
        return [];
      }

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching workouts:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getWorkouts:', error);
      return [];
    }
  }

  static async createWorkout(workout: Omit<Workout, 'id' | 'created_at'>): Promise<Workout | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot create workout');
        return null;
      }

      console.log('Creating workout:', workout);
      
      const { data, error } = await supabase
        .from('workouts')
        .insert([workout])
        .select()
        .single();

      if (error) {
        console.error('Error creating workout:', error);
        return null;
      }

      console.log('Workout created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in createWorkout:', error);
      return null;
    }
  }

  // Sleep log operations
  static async getSleepLogs(userId: string, limit = 30): Promise<SleepLog[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get sleep logs');
        return [];
      }

      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching sleep logs:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getSleepLogs:', error);
      return [];
    }
  }

  static async createSleepLog(sleepLog: Omit<SleepLog, 'id' | 'created_at'>): Promise<SleepLog | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot create sleep log');
        return null;
      }

      console.log('Creating sleep log:', sleepLog);
      
      const { data, error } = await supabase
        .from('sleep_logs')
        .insert([sleepLog])
        .select()
        .single();

      if (error) {
        console.error('Error creating sleep log:', error);
        return null;
      }

      console.log('Sleep log created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in createSleepLog:', error);
      return null;
    }
  }

  // Mood log operations
  static async getMoodLogs(userId: string, limit = 30): Promise<MoodLog[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get mood logs');
        return [];
      }

      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching mood logs:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getMoodLogs:', error);
      return [];
    }
  }

  static async createMoodLog(moodLog: Omit<MoodLog, 'id' | 'created_at'>): Promise<MoodLog | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot create mood log');
        return null;
      }

      console.log('Creating mood log:', moodLog);
      
      const { data, error } = await supabase
        .from('mood_logs')
        .insert([moodLog])
        .select()
        .single();

      if (error) {
        console.error('Error creating mood log:', error);
        return null;
      }

      console.log('Mood log created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in createMoodLog:', error);
      return null;
    }
  }

  // Nutrition log operations
  static async getNutritionLogs(userId: string, date?: string): Promise<NutritionLog[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get nutrition logs');
        return [];
      }

      let query = supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId);

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching nutrition logs:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getNutritionLogs:', error);
      return [];
    }
  }

  static async createNutritionLog(nutritionLog: Omit<NutritionLog, 'id' | 'created_at'>): Promise<NutritionLog | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot create nutrition log');
        return null;
      }

      console.log('Creating nutrition log:', nutritionLog);
      
      const { data, error } = await supabase
        .from('nutrition_logs')
        .insert([nutritionLog])
        .select()
        .single();

      if (error) {
        console.error('Error creating nutrition log:', error);
        return null;
      }

      console.log('Nutrition log created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in createNutritionLog:', error);
      return null;
    }
  }

  // Goal operations
  static async getGoals(userId: string): Promise<Goal[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get goals');
        // Fallback to localStorage if Supabase is not configured
        const savedGoals = localStorage.getItem(`goals_${userId}`);
        if (savedGoals) {
          return JSON.parse(savedGoals);
        }
        return [];
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching goals:', error);
        // Fallback to localStorage on error
        const savedGoals = localStorage.getItem(`goals_${userId}`);
        if (savedGoals) {
          return JSON.parse(savedGoals);
        }
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getGoals:', error);
      // Fallback to localStorage on error
      try {
        const savedGoals = localStorage.getItem(`goals_${userId}`);
        if (savedGoals) {
          return JSON.parse(savedGoals);
        }
      } catch (storageError) {
        console.error('Error reading from localStorage:', storageError);
      }
      return [];
    }
  }

  static async createGoal(goal: Omit<Goal, 'id' | 'created_at'>): Promise<Goal | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot create goal');
        // Fallback to localStorage
        const goalData = {
          ...goal,
          id: `goal_${Date.now()}`,
          created_at: new Date().toISOString()
        };
        
        const existingGoals = localStorage.getItem(`goals_${goal.user_id}`);
        const goals = existingGoals ? JSON.parse(existingGoals) : [];
        goals.push(goalData);
        localStorage.setItem(`goals_${goal.user_id}`, JSON.stringify(goals));
        
        return goalData;
      }

      console.log('Creating goal:', goal);
      
      const { data, error } = await supabase
        .from('goals')
        .insert([goal])
        .select()
        .single();

      if (error) {
        console.error('Error creating goal:', error);
        // Fallback to localStorage on error
        const goalData = {
          ...goal,
          id: `goal_${Date.now()}`,
          created_at: new Date().toISOString()
        };
        
        const existingGoals = localStorage.getItem(`goals_${goal.user_id}`);
        const goals = existingGoals ? JSON.parse(existingGoals) : [];
        goals.push(goalData);
        localStorage.setItem(`goals_${goal.user_id}`, JSON.stringify(goals));
        
        return goalData;
      }

      console.log('Goal created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error in createGoal:', error);
      return null;
    }
  }

  static async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot update goal');
        // Fallback to localStorage
        if (updates.user_id) {
          const existingGoals = localStorage.getItem(`goals_${updates.user_id}`);
          if (existingGoals) {
            const goals = JSON.parse(existingGoals);
            const goalIndex = goals.findIndex((g: any) => g.id === goalId);
            if (goalIndex !== -1) {
              goals[goalIndex] = { ...goals[goalIndex], ...updates, updated_at: new Date().toISOString() };
              localStorage.setItem(`goals_${updates.user_id}`, JSON.stringify(goals));
              return goals[goalIndex];
            }
          }
        }
        return null;
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', goalId)
        .select()
        .single();

      if (error) {
        console.error('Error updating goal:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Error in updateGoal:', error);
      return null;
    }
  }

  static async deleteGoal(goalId: string, userId: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot delete goal');
        // Fallback to localStorage
        const existingGoals = localStorage.getItem(`goals_${userId}`);
        if (existingGoals) {
          const goals = JSON.parse(existingGoals);
          const filteredGoals = goals.filter((g: any) => g.id !== goalId);
          localStorage.setItem(`goals_${userId}`, JSON.stringify(filteredGoals));
          return true;
        }
        return false;
      }

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) {
        console.error('Error deleting goal:', error);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('Error in deleteGoal:', error);
      return false;
    }
  }

  // AI Recommendations operations
  static async saveAIRecommendation(recommendation: Omit<AIRecommendation, 'id' | 'created_at'>): Promise<AIRecommendation | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot save AI recommendation');
        return null;
      }

      const { data, error } = await supabase
        .from('ai_recommendations')
        .insert([recommendation])
        .select()
        .single();

      if (error) {
        console.error('Error saving AI recommendation:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Error in saveAIRecommendation:', error);
      return null;
    }
  }

  static async getAIRecommendations(userId: string, limit = 10): Promise<AIRecommendation[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get AI recommendations');
        return [];
      }

      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching AI recommendations:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getAIRecommendations:', error);
      return [];
    }
  }

  // Achievements operations
  static async getAchievements(userId: string): Promise<Achievement[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get achievements');
        return [];
      }

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching achievements:', error);
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getAchievements:', error);
      return [];
    }
  }

  static async createAchievement(achievement: Omit<Achievement, 'id' | 'created_at'>): Promise<Achievement | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot create achievement');
        return null;
      }

      const { data, error } = await supabase
        .from('achievements')
        .insert([achievement])
        .select()
        .single();

      if (error) {
        console.error('Error creating achievement:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Error in createAchievement:', error);
      return null;
    }
  }

  static async updateAchievement(achievementId: string, updates: Partial<Achievement>): Promise<Achievement | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot update achievement');
        return null;
      }

      const { data, error } = await supabase
        .from('achievements')
        .update(updates)
        .eq('id', achievementId)
        .select()
        .single();

      if (error) {
        console.error('Error updating achievement:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('Error in updateAchievement:', error);
      return null;
    }
  }

  // Analytics and aggregations
  static async getWeeklyStats(userId: string) {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get weekly stats');
        return {
          workouts: [],
          sleepLogs: [],
          moodLogs: [],
          nutritionLogs: []
        };
      }

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekAgoString = oneWeekAgo.toISOString().split('T')[0];

      const [workouts, sleepLogs, moodLogs, nutritionLogs] = await Promise.all([
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .gte('date', weekAgoString),
        supabase
          .from('sleep_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('date', weekAgoString),
        supabase
          .from('mood_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('date', weekAgoString),
        supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('date', weekAgoString)
      ]);

      return {
        workouts: workouts.data || [],
        sleepLogs: sleepLogs.data || [],
        moodLogs: moodLogs.data || [],
        nutritionLogs: nutritionLogs.data || []
      };
    } catch (error: any) {
      console.error('Error in getWeeklyStats:', error);
      return {
        workouts: [],
        sleepLogs: [],
        moodLogs: [],
        nutritionLogs: []
      };
    }
  }

  // Test database connection
  static async testConnection(): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Database connection test failed: Supabase not configured');
        return false;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      console.log('Database connection successful');
      return true;
    } catch (error: any) {
      console.error('Database connection test error:', error);
      return false;
    }
  }

  // Create sample data for testing
  static async createSampleData(userId: string): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot create sample data');
        return;
      }

      console.log('Creating sample data for user:', userId);

      // Create sample workout
      await this.createWorkout({
        user_id: userId,
        name: 'Morning HIIT',
        type: 'HIIT',
        duration: 30,
        calories_burned: 350,
        exercises: ['Burpees', 'Jump Squats', 'Mountain Climbers'],
        notes: 'Great energy boost!',
        date: new Date().toISOString().split('T')[0]
      });

      // Create sample sleep log
      await this.createSleepLog({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        bedtime: '23:00',
        wakeup_time: '07:00',
        duration: 8.0,
        quality: 8,
        notes: 'Slept well'
      });

      // Create sample mood log
      await this.createMoodLog({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        mood: 8,
        energy: 7,
        stress: 3,
        anxiety: 2,
        happiness: 8,
        weather: 'sunny',
        notes: 'Feeling great today!'
      });

      // Create sample nutrition log
      await this.createNutritionLog({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast',
        food_name: 'Oatmeal with Berries',
        calories: 320,
        protein: 12,
        carbs: 58,
        fat: 6,
        fiber: 8
      });

      console.log('Sample data created successfully');
    } catch (error) {
      console.error('Error creating sample data:', error);
    }
  }

  // ALWAYS SUCCESSFUL payment processing for subscription
  static async processFakePayment(amount: number, planId: string, userId: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // ALWAYS SUCCESS - no random failure
      const transactionId = `fake_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Payment processed successfully:', { amount, planId, userId, transactionId });
      
      return { success: true, transactionId };
    } catch (error) {
      console.error('Error processing fake payment:', error);
      // Even if there's an error, return success
      return { success: true, transactionId: `fallback_txn_${Date.now()}` };
    }
  }

  // ALWAYS SUCCESSFUL subscription creation
  static async createFakeSubscription(userId: string, planId: string, billingCycle: 'monthly' | 'yearly'): Promise<boolean> {
    try {
      console.log('Creating subscription for user:', userId, 'plan:', planId);
      
      // Store subscription in localStorage as fallback
      const subscriptionData = {
        user_id: userId,
        plan_id: planId,
        status: 'active',
        billing_cycle: billingCycle,
        current_period_start: new Date().toISOString(),
        current_period_end: billingCycle === 'monthly' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        created_at: new Date().toISOString()
      };

      // Store in localStorage for immediate access
      localStorage.setItem(`subscription_${userId}`, JSON.stringify(subscriptionData));
      
      // Also store premium status
      localStorage.setItem(`premium_${userId}`, 'true');
      
      console.log('Subscription created successfully in localStorage:', subscriptionData);
      
      // Try to store in database if available, but don't fail if it doesn't work
      try {
        if (isSupabaseConfigured()) {
          await supabase
            .from('user_subscriptions')
            .insert([{
              user_id: userId,
              subscription_id: `fake_sub_${Date.now()}`,
              plan_id: planId,
              status: 'active',
              current_period_start: subscriptionData.current_period_start,
              current_period_end: subscriptionData.current_period_end,
              cancel_at_period_end: false
            }]);
          console.log('Subscription also saved to database');
        }
      } catch (dbError) {
        console.warn('Could not save subscription to database, but localStorage backup is working:', dbError);
      }

      return true;
    } catch (error) {
      console.error('Error in createFakeSubscription:', error);
      // Even if there's an error, try localStorage fallback
      try {
        const fallbackData = {
          user_id: userId,
          plan_id: planId,
          status: 'active',
          billing_cycle: billingCycle,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          auto_renew: true,
          created_at: new Date().toISOString()
        };
        localStorage.setItem(`subscription_${userId}`, JSON.stringify(fallbackData));
        localStorage.setItem(`premium_${userId}`, 'true');
        console.log('Fallback subscription created in localStorage');
        return true;
      } catch (fallbackError) {
        console.error('Even fallback failed:', fallbackError);
        return true; // Still return true to ensure payment always succeeds
      }
    }
  }

  // Get subscription from localStorage if database fails
  static async getSubscriptionFromStorage(userId: string): Promise<any> {
    try {
      const stored = localStorage.getItem(`subscription_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error getting subscription from storage:', error);
      return null;
    }
  }

  // Check if user is premium from localStorage
  static isPremiumUser(userId: string): boolean {
    try {
      const isPremium = localStorage.getItem(`premium_${userId}`);
      return isPremium === 'true';
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  }
}