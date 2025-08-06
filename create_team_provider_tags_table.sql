-- Create team_provider_tags table for team-level provider tagging
-- This allows teams to tag providers globally across all markets

CREATE TABLE IF NOT EXISTS team_provider_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  provider_dhc BIGINT NOT NULL, -- BigQuery dhc value (integer)
  tag_type TEXT NOT NULL CHECK (tag_type IN ('me', 'partner', 'competitor', 'target')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, provider_dhc, tag_type)
);

-- Enable RLS
ALTER TABLE team_provider_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_provider_tags
CREATE POLICY "Team members can view their team's provider tags" ON team_provider_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_provider_tags.team_id 
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert provider tags for their team" ON team_provider_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_provider_tags.team_id 
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can update provider tags for their team" ON team_provider_tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_provider_tags.team_id 
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete provider tags for their team" ON team_provider_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_provider_tags.team_id 
      AND profiles.id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_provider_tags_team_id ON team_provider_tags(team_id);
CREATE INDEX IF NOT EXISTS idx_team_provider_tags_provider_dhc ON team_provider_tags(provider_dhc);
CREATE INDEX IF NOT EXISTS idx_team_provider_tags_tag_type ON team_provider_tags(tag_type);
CREATE INDEX IF NOT EXISTS idx_team_provider_tags_created_at ON team_provider_tags(created_at);

-- Add comments for documentation
COMMENT ON TABLE team_provider_tags IS 'Team-level provider tags for global tagging across all markets';
COMMENT ON COLUMN team_provider_tags.provider_dhc IS 'BigQuery dhc value for the tagged provider';
COMMENT ON COLUMN team_provider_tags.tag_type IS 'Tag type: me, partner, competitor, or target';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_provider_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_team_provider_tags_updated_at
  BEFORE UPDATE ON team_provider_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_team_provider_tags_updated_at();

-- Verify the table was created correctly
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_provider_tags'
ORDER BY ordinal_position;

-- Show the constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'team_provider_tags'
ORDER BY constraint_name; 