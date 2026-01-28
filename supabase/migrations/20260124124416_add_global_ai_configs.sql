/*
  # Add Global AI Configuration Support

  ## Overview
  Enable global AI configurations that administrators can create and all users can access.

  ## Changes Made
  
  1. **Schema Updates**
     - Make `user_id` nullable in `ai_configs` table (NULL means global config)
     - Add `is_global` boolean field (default false)
     - Add `created_by` field to track who created the config
  
  2. **Security Updates**
     - Update RLS policies to allow:
       - All authenticated users can view global configs (is_global = true)
       - Users can view their own configs (user_id = auth.uid())
       - Only admins (role = 'admin' or 'super_admin') can create/update/delete global configs
       - Users can manage their own personal configs
  
  ## Notes
  - Global configs (is_global = true) are visible to all authenticated users
  - Personal configs (is_global = false, user_id set) are only visible to their owner
  - Only administrators can create global configurations
*/

-- Add new columns
ALTER TABLE ai_configs 
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE ai_configs 
  ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Create index for global configs
CREATE INDEX IF NOT EXISTS ai_configs_is_global_idx ON ai_configs(is_global) WHERE is_global = true;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own AI configs" ON ai_configs;
DROP POLICY IF EXISTS "Users can insert own AI configs" ON ai_configs;
DROP POLICY IF EXISTS "Users can update own AI configs" ON ai_configs;
DROP POLICY IF EXISTS "Users can delete own AI configs" ON ai_configs;

-- New RLS policy for SELECT: Users can view global configs OR their own configs
CREATE POLICY "Users can view global or own AI configs"
  ON ai_configs FOR SELECT
  TO authenticated
  USING (
    is_global = true OR 
    user_id = auth.uid()
  );

-- New RLS policy for INSERT: Admins can create global configs, users can create personal configs
CREATE POLICY "Users and admins can insert AI configs"
  ON ai_configs FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admins can create global configs
    (is_global = true AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin')
    ))
    OR
    -- Users can create their own personal configs
    (is_global = false AND user_id = auth.uid())
  );

-- New RLS policy for UPDATE: Admins can update global configs, users can update their own
CREATE POLICY "Users and admins can update AI configs"
  ON ai_configs FOR UPDATE
  TO authenticated
  USING (
    -- Admins can update global configs
    (is_global = true AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin')
    ))
    OR
    -- Users can update their own configs
    (is_global = false AND user_id = auth.uid())
  )
  WITH CHECK (
    -- Admins can update global configs
    (is_global = true AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin')
    ))
    OR
    -- Users can update their own configs
    (is_global = false AND user_id = auth.uid())
  );

-- New RLS policy for DELETE: Admins can delete global configs, users can delete their own
CREATE POLICY "Users and admins can delete AI configs"
  ON ai_configs FOR DELETE
  TO authenticated
  USING (
    -- Admins can delete global configs
    (is_global = true AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin')
    ))
    OR
    -- Users can delete their own configs
    (is_global = false AND user_id = auth.uid())
  );

-- Update existing configs to set created_by and is_global
UPDATE ai_configs 
SET created_by = user_id, 
    is_global = false 
WHERE created_by IS NULL;
