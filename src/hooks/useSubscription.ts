import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { DatabaseService } from '../services/database';

interface UserSubscription {
  id: string;
  user_id: string;
  subscription_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval_type: 'month' | 'year';
  features: Record<string, any>;
  is_active: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription(null);
      setPlan(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // First check localStorage for immediate premium access
      const isPremium = DatabaseService.isPremiumUser(user.id);
      const storedSubscription = await DatabaseService.getSubscriptionFromStorage(user.id);
      
      if (isPremium && storedSubscription) {
        setSubscription(storedSubscription);
        setPlan({
          id: storedSubscription.plan_id,
          name: storedSubscription.plan_id,
          description: 'Premium Plan',
          price: storedSubscription.plan_id.includes('yearly') ? 9999 : 999,
          currency: 'usd',
          interval_type: storedSubscription.billing_cycle === 'yearly' ? 'year' : 'month',
          features: { unlimited: true },
          is_active: true
        });
        setLoading(false);
        return;
      }

      // If no localStorage data, set as free plan
      setPlan({
        id: 'free',
        name: 'free',
        description: 'Free Plan',
        price: 0,
        currency: 'usd',
        interval_type: 'month',
        features: { limited: true },
        is_active: true
      });
      
    } catch (err) {
      console.error('Error loading subscription:', err);
      setError('Failed to load subscription data');
      
      // Default to free plan on error
      setPlan({
        id: 'free',
        name: 'free',
        description: 'Free Plan',
        price: 0,
        currency: 'usd',
        interval_type: 'month',
        features: { limited: true },
        is_active: true
      });
    } finally {
      setLoading(false);
    }
  };

  const hasFeatureAccess = async (featureKey: string): Promise<boolean> => {
    if (!user) return false;
    
    // Check localStorage first for immediate access
    const isPremium = DatabaseService.isPremiumUser(user.id);
    
    // Premium users have access to everything
    if (isPremium) {
      return true;
    }
    
    // Free users have limited access
    const freeFeatures = ['basic_tracking', 'mood_tracking', 'sleep_tracking'];
    return freeFeatures.includes(featureKey);
  };

  const getFeatureLimit = async (featureKey: string): Promise<number> => {
    if (!user) return 0;
    
    // Check localStorage first for immediate access
    const isPremium = DatabaseService.isPremiumUser(user.id);
    
    // Premium users have unlimited access
    if (isPremium) {
      return -1; // -1 means unlimited
    }
    
    // Free user limits
    const freeLimits: Record<string, number> = {
      'workout_logging': 10,
      'nutrition_logging': 50,
      'ai_recommendations': 2,
      'goal_setting': 3
    };
    
    return freeLimits[featureKey] || 0;
  };

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing' || DatabaseService.isPremiumUser(user?.id || '');
  const isPremium = DatabaseService.isPremiumUser(user?.id || '') || (plan?.name !== 'free' && isActive);
  const planName = isPremium ? 'Premium' : 'Free';

  return {
    subscription,
    plan,
    loading,
    error,
    isActive,
    isPremium,
    planName,
    hasFeatureAccess,
    getFeatureLimit,
    refreshSubscription: loadSubscription
  };
}