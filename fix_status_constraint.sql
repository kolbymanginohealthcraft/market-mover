-- Fix the status constraint to allow 'approved' and 'rejected' values

-- First, check the current constraint
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'feature_requests'::regclass 
AND contype = 'c';

-- Drop the existing constraint (replace 'feature_requests_status_check' with the actual constraint name from above)
-- ALTER TABLE feature_requests DROP CONSTRAINT feature_requests_status_check;

-- Create a new constraint that allows 'pending', 'approved', and 'rejected'
ALTER TABLE feature_requests DROP CONSTRAINT IF EXISTS feature_requests_status_check;
ALTER TABLE feature_requests ADD CONSTRAINT feature_requests_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- Also fix the user_testimonials table if it has the same issue
ALTER TABLE user_testimonials DROP CONSTRAINT IF EXISTS user_testimonials_status_check;
ALTER TABLE user_testimonials ADD CONSTRAINT user_testimonials_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- Verify the new constraint
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid IN ('feature_requests'::regclass, 'user_testimonials'::regclass)
AND contype = 'c'; 