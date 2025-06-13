/*
  # Fix profiles table address column

  1. Schema Updates
    - Ensure address column exists as jsonb type
    - Add missing columns with proper types
    - Update existing text address columns to jsonb

  2. Data Migration
    - Convert existing text address data to jsonb format
    - Handle null and empty values properly

  3. Security
    - Maintain existing RLS policies
*/

-- First, check if address column exists and what type it is
DO $$
BEGIN
  -- Drop address column if it exists as text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'address' 
    AND data_type = 'text'
  ) THEN
    -- Store existing text data temporarily
    ALTER TABLE profiles ADD COLUMN address_temp text;
    UPDATE profiles SET address_temp = address WHERE address IS NOT NULL;
    ALTER TABLE profiles DROP COLUMN address;
  END IF;

  -- Add address column as jsonb if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address jsonb DEFAULT '{}';
  END IF;

  -- Migrate text data to jsonb if temp column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'address_temp'
  ) THEN
    -- Try to parse existing text as JSON, fallback to empty object
    UPDATE profiles 
    SET address = CASE 
      WHEN address_temp IS NULL OR address_temp = '' THEN '{}'::jsonb
      WHEN address_temp::text ~ '^{.*}$' THEN 
        CASE 
          WHEN address_temp::jsonb IS NOT NULL THEN address_temp::jsonb
          ELSE '{}'::jsonb
        END
      ELSE jsonb_build_object('street', address_temp)
    END
    WHERE address_temp IS NOT NULL;
    
    -- Drop temporary column
    ALTER TABLE profiles DROP COLUMN address_temp;
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
    ALTER TABLE profiles ADD COLUMN marketing_emails boolean DEFAULT true;
  END IF;

  -- Add email_verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verified boolean DEFAULT false;
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

EXCEPTION
  WHEN OTHERS THEN
    -- If JSON parsing fails, just set to empty object
    UPDATE profiles SET address = '{}'::jsonb WHERE address IS NULL;
    RAISE NOTICE 'Some address data could not be migrated and was set to empty object';
END $$;

-- Ensure address column has proper default and constraints
ALTER TABLE profiles ALTER COLUMN address SET DEFAULT '{}';
ALTER TABLE profiles ALTER COLUMN address SET NOT NULL;

-- Update any null address values to empty JSON object
UPDATE profiles SET address = '{}' WHERE address IS NULL;

-- Add check constraint to ensure address is valid JSON
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'profiles_address_valid_json'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_address_valid_json 
    CHECK (jsonb_typeof(address) = 'object');
  END IF;
END $$;

-- Create index on address for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_address_gin ON profiles USING gin(address);

-- Refresh the schema cache by updating a system table
-- This forces PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';