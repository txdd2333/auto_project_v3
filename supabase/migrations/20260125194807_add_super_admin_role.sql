/*
  # Add super_admin role to user_profiles

  1. Changes
    - Update role check constraint to include 'super_admin'
    - This allows super_admin role in user_profiles table
  
  2. Security
    - Maintains existing RLS policies
*/

-- Drop existing constraint
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add new constraint with super_admin
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role = ANY (ARRAY['super_admin'::text, 'admin'::text, 'read_write'::text, 'read_only'::text]));