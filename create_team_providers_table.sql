-- Create team_providers table for team-level provider tagging
-- This allows teams to tag providers globally across all markets

CREATE TABLE IF NOT EXISTS team_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  provider_dhc TEXT NOT NULL, -- BigQuery dhc value
  provider_name TEXT,
  provider_type TEXT,
  provider_network TEXT,
  provider_city TEXT,
  provider_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, provider_dhc)
);

-- Enable RLS
ALTER TABLE team_providers ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_providers
CREATE POLICY "Team members can view their team's providers" ON team_providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_providers.team_id 
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert providers for their team" ON team_providers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_providers.team_id 
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can update providers for their team" ON team_providers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_providers.team_id 
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete providers for their team" ON team_providers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_providers.team_id 
      AND profiles.id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_providers_team_id ON team_providers(team_id);
CREATE INDEX IF NOT EXISTS idx_team_providers_provider_dhc ON team_providers(provider_dhc);
CREATE INDEX IF NOT EXISTS idx_team_providers_created_at ON team_providers(created_at);

-- Add comments for documentation
COMMENT ON TABLE team_providers IS 'Team-provider relationships for global provider tagging';
COMMENT ON COLUMN team_providers.provider_dhc IS 'BigQuery dhc value for the provider';
COMMENT ON COLUMN team_providers.provider_name IS 'Provider name for display purposes';
COMMENT ON COLUMN team_providers.provider_type IS 'Provider type for categorization';
COMMENT ON COLUMN team_providers.provider_network IS 'Provider network for reference';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_team_providers_updated_at
  BEFORE UPDATE ON team_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_team_providers_updated_at();

-- Verify the table was created correctly
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_providers'
ORDER BY ordinal_position;

-- Show the constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'team_providers'
ORDER BY constraint_name; 