-- Temporarily disable the team invitation trigger to avoid database conflicts
-- We'll handle team assignment manually in the function instead
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
