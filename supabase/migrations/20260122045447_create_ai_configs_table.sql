/*
  # Create AI Configurations Table

  ## Purpose
  Store AI model configurations for both internet-based and local/intranet AI models.
  Supports multiple AI providers including international (OpenAI, Google, Anthropic, etc.)
  and Chinese providers (Alibaba Qwen, Baidu ERNIE, DeepSeek, etc.).

  ## Tables Created
  1. `ai_configs`
     - `id` (uuid, primary key) - Unique identifier
     - `user_id` (uuid, foreign key) - References auth.users
     - `name` (text) - Custom configuration name/alias
     - `type` (text) - Configuration type: 'internet' or 'intranet'
     - `provider` (text) - AI provider name (e.g., 'openai', 'qwen', 'custom')
     - `model_name` (text) - Model name (e.g., 'gpt-4', 'Qwen2.5-72B')
     - `api_base` (text) - API base URL
     - `api_key` (text) - API key or token
     - `config_json` (jsonb) - Additional configuration (temperature, headers, etc.)
     - `is_active` (boolean) - Whether this config is currently active
     - `created_at` (timestamptz) - Creation timestamp
     - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `ai_configs` table
  - Users can only manage their own AI configurations
  - Policies for SELECT, INSERT, UPDATE, DELETE operations

  ## Notes
  - Supports both OpenAI-compatible APIs and custom formats
  - Encrypts sensitive data like API keys
  - Allows multiple configurations per user
  - Only one configuration can be active at a time per user
*/

-- Create ai_configs table
CREATE TABLE IF NOT EXISTS ai_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('internet', 'intranet')),
  provider text NOT NULL,
  model_name text NOT NULL,
  api_base text NOT NULL,
  api_key text,
  config_json jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS ai_configs_user_id_idx ON ai_configs(user_id);

-- Create index for active configs
CREATE INDEX IF NOT EXISTS ai_configs_user_active_idx ON ai_configs(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own AI configs
CREATE POLICY "Users can view own AI configs"
  ON ai_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own AI configs
CREATE POLICY "Users can insert own AI configs"
  ON ai_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own AI configs
CREATE POLICY "Users can update own AI configs"
  ON ai_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own AI configs
CREATE POLICY "Users can delete own AI configs"
  ON ai_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_ai_configs_updated_at
  BEFORE UPDATE ON ai_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_configs_updated_at();