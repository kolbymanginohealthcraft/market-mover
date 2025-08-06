-- Create company_profiles table for storing company attributes
CREATE TABLE IF NOT EXISTS company_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    company_type TEXT,
    specialty TEXT,
    size TEXT,
    location TEXT,
    description TEXT,
    services TEXT[] DEFAULT '{}',
    certifications TEXT[] DEFAULT '{}',
    years_in_business INTEGER,
    revenue_range TEXT,
    technology_stack TEXT[] DEFAULT '{}',
    partnerships TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create target_audiences table for storing partnership preferences
CREATE TABLE IF NOT EXISTS target_audiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_partner_types TEXT[] DEFAULT '{}',
    preferred_specialties TEXT[] DEFAULT '{}',
    preferred_locations TEXT[] DEFAULT '{}',
    preferred_sizes TEXT[] DEFAULT '{}',
    preferred_technologies TEXT[] DEFAULT '{}',
    partnership_goals TEXT[] DEFAULT '{}',
    deal_size_preference TEXT,
    timeline TEXT,
    must_have_services TEXT[] DEFAULT '{}',
    nice_to_have_services TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_company_profiles_user_id ON company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_target_audiences_user_id ON target_audiences(user_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_company_type ON company_profiles(company_type);
CREATE INDEX IF NOT EXISTS idx_company_profiles_specialty ON company_profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_company_profiles_location ON company_profiles(location);

-- Enable Row Level Security (RLS)
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_audiences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for company_profiles
CREATE POLICY "Users can view their own company profile" ON company_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company profile" ON company_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company profile" ON company_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company profile" ON company_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for target_audiences
CREATE POLICY "Users can view their own target audience" ON target_audiences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own target audience" ON target_audiences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own target audience" ON target_audiences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own target audience" ON target_audiences
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_company_profiles_updated_at 
    BEFORE UPDATE ON company_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_target_audiences_updated_at 
    BEFORE UPDATE ON target_audiences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE company_profiles IS 'Stores company profile information for healthcare business matchmaking';
COMMENT ON TABLE target_audiences IS 'Stores target audience preferences for healthcare business matchmaking';
COMMENT ON COLUMN company_profiles.services IS 'Array of healthcare services offered by the company';
COMMENT ON COLUMN company_profiles.certifications IS 'Array of certifications and accreditations';
COMMENT ON COLUMN company_profiles.technology_stack IS 'Array of technologies and systems used';
COMMENT ON COLUMN target_audiences.preferred_partner_types IS 'Array of preferred partner company types';
COMMENT ON COLUMN target_audiences.partnership_goals IS 'Array of partnership objectives and goals'; 