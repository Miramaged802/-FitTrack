import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DatabaseService } from '../services/database';
import toast from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Create profile when user signs up (only once)
      if (_event === 'SIGNED_UP' && session?.user) {
        await createUserProfile(session.user);
      }

      // Show welcome message for new sign ins (only once per session)
      if (_event === 'SIGNED_IN' && session?.user) {
        // Only show welcome message if this is a fresh sign in, not a page refresh
        const isNewSignIn = !sessionStorage.getItem('user_signed_in');
        if (isNewSignIn) {
          sessionStorage.setItem('user_signed_in', 'true');
          toast.success('Welcome back!');
        }
      }

      // Clear session storage on sign out
      if (_event === 'SIGNED_OUT') {
        sessionStorage.removeItem('user_signed_in');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUserProfile = async (user: User) => {
    try {
      const existingProfile = await DatabaseService.getProfile(user.id);
      
      if (!existingProfile) {
        const profile = await DatabaseService.createProfile({
          user_id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email,
          fitness_level: 'beginner',
          goals: [],
          allergies: [],
          health_conditions: [],
          medications: [],
          previous_injuries: [],
          preferred_workout_types: [],
          available_equipment: [],
          bio: '',
          phone: '',
          address: '',
          email_verified: false,
          marketing_emails: true,
          units: 'imperial',
          privacy_level: 'friends',
          weekly_workout_frequency: '',
          preferred_workout_duration: ''
        });

        if (profile) {
          console.log('User profile created successfully');
          toast.success('Profile created! Complete your health profile for better recommendations.');
        }
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
      // Don't show error toast for profile creation failures to avoid spam
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: error as any };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: error as any };
    }
  };

  const signOut = async () => {
    try {
      // Clear session storage before signing out
      sessionStorage.removeItem('user_signed_in');
      
      const { error } = await supabase.auth.signOut();
      if (!error) {
        toast.success('Signed out successfully');
      }
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as any };
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}