-- Add company matchmaking fields to teams table
-- This allows each team to define their company profile for matchmaking

-- Add company_type field
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS company_type TEXT CHECK (company_type IN ('Provider', 'Supplier'));

-- Add industry_vertical field
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS industry_vertical TEXT;

-- Add constraint for industry_vertical based on company_type
-- First drop the constraint if it exists (to avoid errors)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_provider_verticals' 
    AND table_name = 'teams'
  ) THEN
    ALTER TABLE teams DROP CONSTRAINT check_provider_verticals;
  END IF;
END $$;

-- Now add the constraint
ALTER TABLE teams 
ADD CONSTRAINT check_provider_verticals 
CHECK (
  (company_type = 'Provider' AND industry_vertical IN (
    'Acute Care / Hospital',
    'Post-Acute Care (SNF, LTCH, IRF)',
    'Assisted Living / Senior Care',
    'Home Health and Hospice',
    'Outpatient Clinics',
    'Physician Practice'
  )) OR
  (company_type = 'Supplier' AND industry_vertical IN (
    'Technology (EMR, Analytics, Telehealth)',
    'Staffing / Management Services',
    'Consulting / Advisory',
    'Rehabilitation Therapy',
    'DME / Medical Equipment',
    'Pharmaceuticals / Lab',
    'Financial Services'
  )) OR
  (company_type IS NULL AND industry_vertical IS NULL)
);

-- Add comments for documentation
COMMENT ON COLUMN teams.company_type IS 'Company type for matchmaking: Provider or Supplier';
COMMENT ON COLUMN teams.industry_vertical IS 'Industry vertical based on company type for matchmaking';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_teams_company_type ON teams(company_type);
CREATE INDEX IF NOT EXISTS idx_teams_industry_vertical ON teams(industry_vertical);

-- Update RLS policies to allow team admins to update these fields
-- (assuming existing RLS policies already allow team admins to update teams)

-- Add a function to validate company data
CREATE OR REPLACE FUNCTION validate_company_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure company_type and industry_vertical are consistent
  IF NEW.company_type IS NOT NULL AND NEW.industry_vertical IS NULL THEN
    RAISE EXCEPTION 'Industry vertical must be set when company type is specified';
  END IF;
  
  IF NEW.company_type IS NULL AND NEW.industry_vertical IS NOT NULL THEN
    RAISE EXCEPTION 'Company type must be set when industry vertical is specified';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate company data
CREATE TRIGGER validate_company_data_trigger
  BEFORE INSERT OR UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION validate_company_data(); 