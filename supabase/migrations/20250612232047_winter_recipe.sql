/*
  # Fix Missing Database Schema Components

  1. Missing Tables
    - `user_subscriptions` - User subscription management
    - `payment_history` - Payment transaction records

  2. Missing Columns
    - Add missing columns to `profiles` table

  3. Missing Functions
    - `get_feature_limit` - Function to check subscription feature limits

  4. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add missing columns to profiles table
DO $$
BEGIN
  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text DEFAULT '';
  END IF;

  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text DEFAULT '';
  END IF;

  -- Add marketing_emails column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'marketing_emails'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketing_emails boolean DEFAULT false;
  END IF;
END $$;

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id text NOT NULL,
  plan_id text NOT NULL,
  status text CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')) DEFAULT 'active',
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  payment_intent_id text NOT NULL,
  amount integer NOT NULL, -- amount in cents
  currency text DEFAULT 'usd',
  status text CHECK (status IN ('succeeded', 'pending', 'failed', 'canceled')) DEFAULT 'pending',
  description text,
  receipt_url text,
  invoice_url text,
  processed_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS Policies for payment_history
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment history"
  ON payment_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create subscription plans table for reference
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price integer NOT NULL, -- price in cents
  currency text DEFAULT 'usd',
  interval_type text CHECK (interval_type IN ('month', 'year')) DEFAULT 'month',
  features jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price, interval_type, features) VALUES
  ('free', 'Free Plan', 'Basic features with limited usage', 0, 'month', '{"goals": 3, "workouts": 10, "ai_recommendations": 2}'),
  ('premium', 'Premium Plan', 'Full access to all features', 999, 'month', '{"goals": -1, "workouts": -1, "ai_recommendations": -1}'),
  ('premium_yearly', 'Premium Yearly', 'Full access with yearly discount', 9999, 'year', '{"goals": -1, "workouts": -1, "ai_recommendations": -1}')
ON CONFLICT (id) DO NOTHING;

-- Create function to get feature limits
CREATE OR REPLACE FUNCTION get_feature_limit(feature_key_param text, user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan_features jsonb;
  feature_limit integer;
BEGIN
  -- Get the user's current subscription plan features
  SELECT sp.features INTO user_plan_features
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.user_id = user_uuid
    AND us.status IN ('active', 'trialing')
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- If no active subscription found, use free plan
  IF user_plan_features IS NULL THEN
    SELECT features INTO user_plan_features
    FROM subscription_plans
    WHERE id = 'free';
  END IF;

  -- Extract the specific feature limit
  feature_limit := (user_plan_features ->> feature_key_param)::integer;
  
  -- Return the limit (-1 means unlimited)
  RETURN COALESCE(feature_limit, 0);
END;
$$;

-- Create function to check if user has reached feature limit
CREATE OR REPLACE FUNCTION check_feature_usage(feature_key_param text, user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  feature_limit integer;
  current_usage integer := 0;
BEGIN
  -- Get the feature limit
  SELECT get_feature_limit(feature_key_param, user_uuid) INTO feature_limit;
  
  -- If unlimited (-1), always return true
  IF feature_limit = -1 THEN
    RETURN true;
  END IF;

  -- Count current usage based on feature type
  CASE feature_key_param
    WHEN 'goals' THEN
      SELECT COUNT(*) INTO current_usage
      FROM goals
      WHERE user_id = user_uuid AND status = 'active';
    WHEN 'workouts' THEN
      SELECT COUNT(*) INTO current_usage
      FROM workouts
      WHERE user_id = user_uuid 
        AND date >= date_trunc('month', CURRENT_DATE);
    WHEN 'ai_recommendations' THEN
      SELECT COUNT(*) INTO current_usage
      FROM ai_recommendations
      WHERE user_id = user_uuid 
        AND created_at >= date_trunc('month', CURRENT_DATE);
    ELSE
      current_usage := 0;
  END CASE;

  -- Return true if under limit
  RETURN current_usage < feature_limit;
END;
$$;

-- Add updated_at trigger for user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_processed_at ON payment_history(processed_at);

-- Insert a default free subscription for existing users
INSERT INTO user_subscriptions (user_id, subscription_id, plan_id, status, current_period_start, current_period_end)
SELECT 
  id as user_id,
  'free_' || id::text as subscription_id,
  'free' as plan_id,
  'active' as status,
  now() as current_period_start,
  now() + interval '1 year' as current_period_end
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_subscriptions)
ON CONFLICT DO NOTHING;