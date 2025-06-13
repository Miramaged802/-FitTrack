/*
  # Subscription System Database Schema

  1. New Tables
    - `subscription_plans` - Available subscription tiers and pricing
    - `user_subscriptions` - User subscription records
    - `payment_methods` - User payment information
    - `payment_history` - Transaction records
    - `subscription_features` - Feature access control
    - `user_profile_extended` - Extended profile information

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
    - Secure payment data handling
*/

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  features jsonb DEFAULT '{}',
  max_goals integer DEFAULT 5,
  max_workouts_per_month integer DEFAULT 50,
  ai_recommendations boolean DEFAULT false,
  advanced_analytics boolean DEFAULT false,
  priority_support boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status text CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')) DEFAULT 'trialing',
  billing_cycle text CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT (now() + interval '1 month'),
  trial_end timestamptz,
  cancelled_at timestamptz,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  auto_renew boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_method_id text UNIQUE NOT NULL,
  type text NOT NULL, -- card, bank_account, etc.
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment history table
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id),
  stripe_payment_intent_id text UNIQUE,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  status text CHECK (status IN ('succeeded', 'pending', 'failed', 'cancelled', 'refunded')),
  payment_method_id uuid REFERENCES payment_methods(id),
  description text,
  invoice_url text,
  receipt_url text,
  failure_reason text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create subscription features table for feature gating
CREATE TABLE IF NOT EXISTS subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  feature_name text NOT NULL,
  is_enabled boolean DEFAULT true,
  limit_value integer, -- for features with limits
  created_at timestamptz DEFAULT now()
);

-- Extend profiles table with subscription-related fields
DO $$
BEGIN
  -- Add subscription-related columns to profiles if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status text DEFAULT 'free';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_ends_at') THEN
    ALTER TABLE profiles ADD COLUMN trial_ends_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE profiles ADD COLUMN address jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
    ALTER TABLE profiles ADD COLUMN email_verified boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'marketing_emails') THEN
    ALTER TABLE profiles ADD COLUMN marketing_emails boolean DEFAULT true;
  END IF;
END $$;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, features, max_goals, max_workouts_per_month, ai_recommendations, advanced_analytics, priority_support, sort_order)
VALUES 
  (
    'free',
    'Free',
    'Perfect for getting started with basic fitness tracking',
    0.00,
    0.00,
    '{"basic_tracking": true, "limited_goals": true, "community_access": true}',
    3,
    10,
    false,
    false,
    false,
    1
  ),
  (
    'basic',
    'Basic',
    'Enhanced tracking with more goals and workout logging',
    9.99,
    99.99,
    '{"unlimited_tracking": true, "basic_analytics": true, "goal_templates": true, "export_data": true}',
    10,
    100,
    false,
    true,
    false,
    2
  ),
  (
    'premium',
    'Premium',
    'Advanced features with AI recommendations and priority support',
    19.99,
    199.99,
    '{"ai_recommendations": true, "advanced_analytics": true, "custom_workouts": true, "nutrition_planning": true, "priority_support": true}',
    -1, -- unlimited
    -1, -- unlimited
    true,
    true,
    true,
    3
  ),
  (
    'enterprise',
    'Enterprise',
    'Full-featured plan for fitness professionals and teams',
    49.99,
    499.99,
    '{"team_management": true, "white_label": true, "api_access": true, "custom_integrations": true, "dedicated_support": true}',
    -1, -- unlimited
    -1, -- unlimited
    true,
    true,
    true,
    4
  )
ON CONFLICT (name) DO NOTHING;

-- Insert subscription features
INSERT INTO subscription_features (plan_id, feature_key, feature_name, is_enabled, limit_value)
SELECT 
  sp.id,
  feature.key,
  feature.name,
  feature.enabled,
  feature.limit_val
FROM subscription_plans sp
CROSS JOIN (
  VALUES 
    ('basic_tracking', 'Basic Tracking', true, NULL),
    ('goal_setting', 'Goal Setting', true, 3),
    ('workout_logging', 'Workout Logging', true, 10),
    ('mood_tracking', 'Mood Tracking', true, NULL),
    ('sleep_tracking', 'Sleep Tracking', true, NULL),
    ('nutrition_logging', 'Nutrition Logging', true, 50),
    ('ai_recommendations', 'AI Workout Recommendations', false, NULL),
    ('advanced_analytics', 'Advanced Analytics', false, NULL),
    ('data_export', 'Data Export', false, NULL),
    ('priority_support', 'Priority Support', false, NULL),
    ('custom_workouts', 'Custom Workout Plans', false, NULL),
    ('team_features', 'Team Management', false, NULL)
) AS feature(key, name, enabled, limit_val)
WHERE sp.name = 'free'

UNION ALL

SELECT 
  sp.id,
  feature.key,
  feature.name,
  feature.enabled,
  feature.limit_val
FROM subscription_plans sp
CROSS JOIN (
  VALUES 
    ('basic_tracking', 'Basic Tracking', true, NULL),
    ('goal_setting', 'Goal Setting', true, 10),
    ('workout_logging', 'Workout Logging', true, 100),
    ('mood_tracking', 'Mood Tracking', true, NULL),
    ('sleep_tracking', 'Sleep Tracking', true, NULL),
    ('nutrition_logging', 'Nutrition Logging', true, NULL),
    ('ai_recommendations', 'AI Workout Recommendations', false, NULL),
    ('advanced_analytics', 'Advanced Analytics', true, NULL),
    ('data_export', 'Data Export', true, NULL),
    ('priority_support', 'Priority Support', false, NULL),
    ('custom_workouts', 'Custom Workout Plans', false, NULL),
    ('team_features', 'Team Management', false, NULL)
) AS feature(key, name, enabled, limit_val)
WHERE sp.name = 'basic'

UNION ALL

SELECT 
  sp.id,
  feature.key,
  feature.name,
  feature.enabled,
  feature.limit_val
FROM subscription_plans sp
CROSS JOIN (
  VALUES 
    ('basic_tracking', 'Basic Tracking', true, NULL),
    ('goal_setting', 'Goal Setting', true, NULL),
    ('workout_logging', 'Workout Logging', true, NULL),
    ('mood_tracking', 'Mood Tracking', true, NULL),
    ('sleep_tracking', 'Sleep Tracking', true, NULL),
    ('nutrition_logging', 'Nutrition Logging', true, NULL),
    ('ai_recommendations', 'AI Workout Recommendations', true, NULL),
    ('advanced_analytics', 'Advanced Analytics', true, NULL),
    ('data_export', 'Data Export', true, NULL),
    ('priority_support', 'Priority Support', true, NULL),
    ('custom_workouts', 'Custom Workout Plans', true, NULL),
    ('team_features', 'Team Management', false, NULL)
) AS feature(key, name, enabled, limit_val)
WHERE sp.name = 'premium'

UNION ALL

SELECT 
  sp.id,
  feature.key,
  feature.name,
  feature.enabled,
  feature.limit_val
FROM subscription_plans sp
CROSS JOIN (
  VALUES 
    ('basic_tracking', 'Basic Tracking', true, NULL),
    ('goal_setting', 'Goal Setting', true, NULL),
    ('workout_logging', 'Workout Logging', true, NULL),
    ('mood_tracking', 'Mood Tracking', true, NULL),
    ('sleep_tracking', 'Sleep Tracking', true, NULL),
    ('nutrition_logging', 'Nutrition Logging', true, NULL),
    ('ai_recommendations', 'AI Workout Recommendations', true, NULL),
    ('advanced_analytics', 'Advanced Analytics', true, NULL),
    ('data_export', 'Data Export', true, NULL),
    ('priority_support', 'Priority Support', true, NULL),
    ('custom_workouts', 'Custom Workout Plans', true, NULL),
    ('team_features', 'Team Management', true, NULL)
) AS feature(key, name, enabled, limit_val)
WHERE sp.name = 'enterprise';

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Subscription plans are readable by everyone (for pricing page)
CREATE POLICY "Subscription plans are publicly readable"
  ON subscription_plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can manage their own payment methods
CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can view their own payment history
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment history"
  ON payment_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Subscription features are readable by authenticated users
CREATE POLICY "Subscription features are readable"
  ON subscription_features FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_subscription_features_plan_id ON subscription_features(plan_id);

-- Add updated_at triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get user's current subscription
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid uuid)
RETURNS TABLE (
  subscription_id uuid,
  plan_name text,
  plan_display_name text,
  status text,
  current_period_end timestamptz,
  auto_renew boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    sp.name,
    sp.display_name,
    us.status,
    us.current_period_end,
    us.auto_renew
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(user_uuid uuid, feature_key_param text)
RETURNS boolean AS $$
DECLARE
  user_plan_id uuid;
  feature_enabled boolean := false;
BEGIN
  -- Get user's current active subscription plan
  SELECT us.plan_id INTO user_plan_id
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
    AND us.status IN ('active', 'trialing')
    AND us.current_period_end > now()
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no active subscription, check free plan
  IF user_plan_id IS NULL THEN
    SELECT sp.id INTO user_plan_id
    FROM subscription_plans sp
    WHERE sp.name = 'free';
  END IF;
  
  -- Check if feature is enabled for this plan
  SELECT sf.is_enabled INTO feature_enabled
  FROM subscription_features sf
  WHERE sf.plan_id = user_plan_id
    AND sf.feature_key = feature_key_param;
  
  RETURN COALESCE(feature_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get feature limit
CREATE OR REPLACE FUNCTION get_feature_limit(user_uuid uuid, feature_key_param text)
RETURNS integer AS $$
DECLARE
  user_plan_id uuid;
  feature_limit integer := 0;
BEGIN
  -- Get user's current active subscription plan
  SELECT us.plan_id INTO user_plan_id
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
    AND us.status IN ('active', 'trialing')
    AND us.current_period_end > now()
  ORDER BY us.created_at DESC
  LIMIT 1;
  
  -- If no active subscription, check free plan
  IF user_plan_id IS NULL THEN
    SELECT sp.id INTO user_plan_id
    FROM subscription_plans sp
    WHERE sp.name = 'free';
  END IF;
  
  -- Get feature limit for this plan
  SELECT sf.limit_value INTO feature_limit
  FROM subscription_features sf
  WHERE sf.plan_id = user_plan_id
    AND sf.feature_key = feature_key_param;
  
  RETURN COALESCE(feature_limit, -1); -- -1 means unlimited
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;