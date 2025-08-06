-- Create user_providers table for global provider tagging
-- This allows users to tag providers as "My Providers" across all markets

CREATE TABLE IF NOT EXISTS user_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_dhc TEXT NOT NULL, -- BigQuery dhc value
  provider_name TEXT,
  provider_type TEXT,
  provider_network TEXT,
  provider_city TEXT,
  provider_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider_dhc)
);

-- Enable RLS
ALTER TABLE user_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_providers
CREATE POLICY "Users can view their own providers" ON user_providers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own providers" ON user_providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own providers" ON user_providers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own providers" ON user_providers
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_providers_user_id ON user_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_providers_provider_dhc ON user_providers(provider_dhc);
CREATE INDEX IF NOT EXISTS idx_user_providers_created_at ON user_providers(created_at);

-- Add comments for documentation
COMMENT ON TABLE user_providers IS 'User-provider relationships for global provider tagging';
COMMENT ON COLUMN user_providers.provider_dhc IS 'BigQuery dhc value for the provider';
COMMENT ON COLUMN user_providers.provider_name IS 'Provider name for display purposes';
COMMENT ON COLUMN user_providers.provider_type IS 'Provider type for categorization';
COMMENT ON COLUMN user_providers.provider_network IS 'Provider network for reference';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_providers_updated_at
  BEFORE UPDATE ON user_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_providers_updated_at();

-- Verify the table was created correctly
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_providers'
ORDER BY ordinal_position;

-- Show the constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_providers'
ORDER BY constraint_name; 