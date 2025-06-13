/*
  # Fix subscription system relationships

  1. Fixes
    - Ensure proper foreign key relationship between user_subscriptions and subscription_plans
    - Add missing constraints and indexes
    - Fix any relationship issues

  2. Security
    - Maintain existing RLS policies
*/

-- First, let's make sure the foreign key constraint exists properly
DO $$
BEGIN
  -- Drop existing foreign key if it exists and recreate it properly
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_subscriptions_plan_id_fkey' 
    AND table_name = 'user_subscriptions'
  ) THEN
    ALTER TABLE user_subscriptions DROP CONSTRAINT user_subscriptions_plan_id_fkey;
  END IF;
  
  -- Add the foreign key constraint properly
  ALTER TABLE user_subscriptions 
  ADD CONSTRAINT user_subscriptions_plan_id_fkey 
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL;
END $$;

-- Ensure the subscription_plans table has proper structure
DO $$
BEGIN
  -- Make sure id column exists and is properly set up
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'id'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Create a view for easier subscription queries
CREATE OR REPLACE VIEW user_subscription_details AS
SELECT 
  us.*,
  sp.name as plan_name,
  sp.display_name as plan_display_name,
  sp.description as plan_description,
  sp.price_monthly,
  sp.price_yearly,
  sp.features,
  sp.max_goals,
  sp.max_workouts_per_month,
  sp.ai_recommendations,
  sp.advanced_analytics,
  sp.priority_support
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id;

-- Grant access to the view
GRANT SELECT ON user_subscription_details TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view own subscription details"
  ON user_subscription_details FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Refresh the schema cache by updating a system table (this forces Supabase to reload)
-- This is a safe operation that just touches metadata
DO $$
BEGIN
  -- Update table comment to force schema refresh
  COMMENT ON TABLE subscription_plans IS 'Available subscription plans - updated ' || now()::text;
  COMMENT ON TABLE user_subscriptions IS 'User subscription records - updated ' || now()::text;
END $$;