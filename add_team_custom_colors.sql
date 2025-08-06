-- Create team_custom_colors table for team-level custom color management
-- This allows teams to save multiple custom colors for their visualizations

CREATE TABLE IF NOT EXISTS team_custom_colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_hex TEXT NOT NULL CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  color_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, color_name)
);

-- Enable RLS
ALTER TABLE team_custom_colors ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_custom_colors
CREATE POLICY "Team members can view their team's custom colors" ON team_custom_colors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_custom_colors.team_id 
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert custom colors for their team" ON team_custom_colors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_custom_colors.team_id 
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can update custom colors for their team" ON team_custom_colors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_custom_colors.team_id 
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Team members can delete custom colors for their team" ON team_custom_colors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.team_id = team_custom_colors.team_id 
      AND profiles.id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_custom_colors_team_id ON team_custom_colors(team_id);
CREATE INDEX IF NOT EXISTS idx_team_custom_colors_order ON team_custom_colors(team_id, color_order);

-- Add comments for documentation
COMMENT ON TABLE team_custom_colors IS 'Team custom colors for chart and visualization customization';
COMMENT ON COLUMN team_custom_colors.color_name IS 'User-friendly name for the color (e.g., "Primary Blue", "Accent Red")';
COMMENT ON COLUMN team_custom_colors.color_hex IS 'Hex color code (e.g., #3B82F6)';
COMMENT ON COLUMN team_custom_colors.color_order IS 'Display order for the color in the team palette';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_custom_colors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_team_custom_colors_updated_at
  BEFORE UPDATE ON team_custom_colors
  FOR EACH ROW
  EXECUTE FUNCTION update_team_custom_colors_updated_at();

-- Verify the table was created correctly
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'team_custom_colors'
ORDER BY ordinal_position;

-- Show the constraints
SELECT 
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'team_custom_colors'
ORDER BY constraint_name; 