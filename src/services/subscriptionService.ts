import { supabase } from '../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, any>;
  max_goals: number;
  max_workouts_per_month: number;
  ai_recommendations: boolean;
  advanced_analytics: boolean;
  priority_support: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  trial_end?: string;
  cancelled_at?: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  auto_renew: boolean;
  plan?: SubscriptionPlan;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  type: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  is_default: boolean;
  is_active: boolean;
}

export interface PaymentHistory {
  id: string;
  user_id: string;
  subscription_id: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'cancelled' | 'refunded';
  payment_method_id?: string;
  description?: string;
  invoice_url?: string;
  receipt_url?: string;
  failure_reason?: string;
  processed_at: string;
}

// Helper function to check if Supabase is properly configured
const isSupabaseConfigured = (): boolean => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

export class SubscriptionService {
  // Get all available subscription plans
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get subscription plans');
        return [];
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching subscription plans:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSubscriptionPlans:', error);
      return [];
    }
  }

  // Get user's current subscription - using a simpler approach
  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get user subscription');
        return null;
      }

      // First get the subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching user subscription:', subError);
        return null;
      }

      if (!subscription) {
        return null;
      }

      // Then get the plan details separately
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', subscription.plan_id)
        .single();

      if (planError) {
        console.error('Error fetching subscription plan:', planError);
        // Return subscription without plan details
        return subscription;
      }

      // Combine the data
      return {
        ...subscription,
        plan: plan
      };
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      return null;
    }
  }

  // Check if user has access to a specific feature
  static async hasFeatureAccess(userId: string, featureKey: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot check feature access');
        return false;
      }

      const { data, error } = await supabase
        .rpc('has_feature_access', {
          user_uuid: userId,
          feature_key_param: featureKey
        });

      if (error) {
        console.error('Error checking feature access:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error in hasFeatureAccess:', error);
      return false;
    }
  }

  // Get feature limit for user
  static async getFeatureLimit(userId: string, featureKey: string): Promise<number> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get feature limit');
        return 0;
      }

      const { data, error } = await supabase
        .rpc('get_feature_limit', {
          user_uuid: userId,
          feature_key_param: featureKey
        });

      if (error) {
        console.error('Error getting feature limit:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in getFeatureLimit:', error);
      return 0;
    }
  }

  // Create Stripe checkout session
  static async createCheckoutSession(
    planId: string,
    billingCycle: 'monthly' | 'yearly',
    userId: string
  ): Promise<{ url: string } | null> {
    try {
      // This would typically call your backend API
      // For now, we'll simulate the response
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  }

  // Create subscription record in database
  static async createSubscription(subscriptionData: Partial<UserSubscription>): Promise<UserSubscription | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot create subscription');
        return null;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert([subscriptionData])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating subscription:', error);
        return null;
      }

      // Get the plan details separately
      if (data.plan_id) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', data.plan_id)
          .single();
        
        if (plan) {
          data.plan = plan;
        }
      }

      return data;
    } catch (error) {
      console.error('Error in createSubscription:', error);
      return null;
    }
  }

  // Update subscription
  static async updateSubscription(
    subscriptionId: string,
    updates: Partial<UserSubscription>
  ): Promise<UserSubscription | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot update subscription');
        return null;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        return null;
      }

      // Get the plan details separately
      if (data.plan_id) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', data.plan_id)
          .single();
        
        if (plan) {
          data.plan = plan;
        }
      }

      return data;
    } catch (error) {
      console.error('Error in updateSubscription:', error);
      return null;
    }
  }

  // Cancel subscription
  static async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot cancel subscription');
        return false;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          auto_renew: false
        })
        .eq('id', subscriptionId);

      if (error) {
        console.error('Error cancelling subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      return false;
    }
  }

  // Get user's payment methods
  static async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get payment methods');
        return [];
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPaymentMethods:', error);
      return [];
    }
  }

  // Add payment method
  static async addPaymentMethod(paymentMethodData: Partial<PaymentMethod>): Promise<PaymentMethod | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot add payment method');
        return null;
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .insert([paymentMethodData])
        .select()
        .single();

      if (error) {
        console.error('Error adding payment method:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addPaymentMethod:', error);
      return null;
    }
  }

  // Set default payment method
  static async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot set default payment method');
        return false;
      }

      // First, unset all other default payment methods
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Then set the new default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error setting default payment method:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setDefaultPaymentMethod:', error);
      return false;
    }
  }

  // Get payment history
  static async getPaymentHistory(userId: string, limit = 50): Promise<PaymentHistory[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get payment history');
        return [];
      }

      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('processed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      return [];
    }
  }

  // Record payment
  static async recordPayment(paymentData: Partial<PaymentHistory>): Promise<PaymentHistory | null> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot record payment');
        return null;
      }

      const { data, error } = await supabase
        .from('payment_history')
        .insert([paymentData])
        .select()
        .single();

      if (error) {
        console.error('Error recording payment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in recordPayment:', error);
      return null;
    }
  }

  // Check subscription status and update if needed
  static async syncSubscriptionStatus(userId: string): Promise<void> {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot sync subscription status');
        return;
      }

      // This would typically sync with Stripe to get the latest status
      // For now, we'll just check if subscription has expired
      const subscription = await this.getUserSubscription(userId);
      
      if (subscription && new Date(subscription.current_period_end) < new Date()) {
        await this.updateSubscription(subscription.id, {
          status: 'expired'
        });
      }
    } catch (error) {
      console.error('Error syncing subscription status:', error);
    }
  }

  // Get subscription analytics for user
  static async getSubscriptionAnalytics(userId: string) {
    try {
      if (!isSupabaseConfigured()) {
        console.error('Supabase not configured - cannot get subscription analytics');
        return null;
      }

      const [subscription, paymentHistory] = await Promise.all([
        this.getUserSubscription(userId),
        this.getPaymentHistory(userId)
      ]);

      const totalSpent = paymentHistory
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount, 0);

      const subscriptionLength = subscription 
        ? Math.ceil((new Date().getTime() - new Date(subscription.current_period_start).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        currentPlan: subscription?.plan?.display_name || 'Free',
        status: subscription?.status || 'free',
        totalSpent,
        subscriptionLength,
        nextBilling: subscription?.current_period_end,
        autoRenew: subscription?.auto_renew || false
      };
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      return null;
    }
  }
}