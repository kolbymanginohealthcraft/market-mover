-- Add target partners fields to teams table
-- This allows teams to define their target partner preferences for matchmaking

-- Add target_organization_types field for multi-select organization types
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS target_organization_types TEXT[] DEFAULT '{}';

-- Add target_practitioner_specialties field for multi-select practitioner specialties
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS target_practitioner_specialties TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN teams.target_organization_types IS 'Array of target organization types for partnership matchmaking';
COMMENT ON COLUMN teams.target_practitioner_specialties IS 'Array of target practitioner specialties for partnership matchmaking';

-- Create indexes for better query performance (optional, but helpful for large datasets)
CREATE INDEX IF NOT EXISTS idx_teams_target_org_types ON teams USING GIN(target_organization_types);
CREATE INDEX IF NOT EXISTS idx_teams_target_specialties ON teams USING GIN(target_practitioner_specialties);

-- Add validation function to ensure arrays are not null
CREATE OR REPLACE FUNCTION validate_target_partners()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure arrays are never null
  IF NEW.target_organization_types IS NULL THEN
    NEW.target_organization_types := '{}';
  END IF;
  
  IF NEW.target_practitioner_specialties IS NULL THEN
    NEW.target_practitioner_specialties := '{}';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate target partners data
CREATE TRIGGER validate_target_partners_trigger
  BEFORE INSERT OR UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION validate_target_partners(); 