/*
  # Fix profiles table to match application schema

  1. Missing Columns
    - Add all missing columns that the Profile component expects
    - Ensure proper data types and defaults
    - Handle address as text field (not jsonb)

  2. Schema Updates
    - Add phone, address, email_verified, marketing_emails
    - Add units, privacy_level, weekly_workout_frequency, preferred_workout_duration
    - Ensure all columns have proper defaults
*/

-- Add missing columns to profiles table to match the application schema
DO $$
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text DEFAULT '';
  END IF;

  -- Add address column as text (not jsonb) if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address text DEFAULT '';
  END IF;

  -- Add email_verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  -- Add marketing_emails column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'marketing_emails'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketing_emails boolean DEFAULT true;
  END IF;

  -- Add units column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'units'
  ) THEN
    ALTER TABLE profiles ADD COLUMN units text DEFAULT 'imperial';
  END IF;

  -- Add privacy_level column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'privacy_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN privacy_level text DEFAULT 'friends';
  END IF;

  -- Add weekly_workout_frequency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'weekly_workout_frequency'
  ) THEN
    ALTER TABLE profiles ADD COLUMN weekly_workout_frequency text DEFAULT '';
  END IF;

  -- Add preferred_workout_duration column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_workout_duration'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_workout_duration text DEFAULT '';
  END IF;

  -- If address exists as jsonb, convert it to text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'address' 
    AND data_type = 'jsonb'
  ) THEN
    -- Convert jsonb address to text
    ALTER TABLE profiles ALTER COLUMN address TYPE text USING address::text;
    ALTER TABLE profiles ALTER COLUMN address SET DEFAULT '';
  END IF;

END $$;

-- Ensure all text columns have proper defaults
UPDATE profiles SET phone = '' WHERE phone IS NULL;
UPDATE profiles SET address = '' WHERE address IS NULL;
UPDATE profiles SET units = 'imperial' WHERE units IS NULL;
UPDATE profiles SET privacy_level = 'friends' WHERE privacy_level IS NULL;
UPDATE profiles SET weekly_workout_frequency = '' WHERE weekly_workout_frequency IS NULL;
UPDATE profiles SET preferred_workout_duration = '' WHERE preferred_workout_duration IS NULL;

-- Set NOT NULL constraints where appropriate
ALTER TABLE profiles ALTER COLUMN phone SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN address SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN email_verified SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN marketing_emails SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN units SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN privacy_level SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN weekly_workout_frequency SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN preferred_workout_duration SET NOT NULL;

-- Add check constraints for enum-like fields
DO $$
BEGIN
  -- Units constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'profiles_units_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_units_check 
    CHECK (units IN ('imperial', 'metric'));
  END IF;

  -- Privacy level constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'profiles_privacy_level_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_privacy_level_check 
    CHECK (privacy_level IN ('public', 'friends', 'private'));
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_emails ON profiles(marketing_emails);
CREATE INDEX IF NOT EXISTS idx_profiles_units ON profiles(units);
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_level ON profiles(privacy_level);

-- Force schema refresh
COMMENT ON TABLE profiles IS 'User profiles with health information - updated ' || now()::text;