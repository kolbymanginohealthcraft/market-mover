-- Check the status constraint on feature_requests table

-- Check the constraint definition
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'feature_requests'::regclass 
AND contype = 'c';

-- Check the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'feature_requests' 
AND column_name = 'status';

-- Check what values are currently in the status column
SELECT DISTINCT status, COUNT(*) as count
FROM feature_requests 
GROUP BY status;

-- Check if there are any pending requests
SELECT 
    id,
    title,
    status,
    created_at
FROM feature_requests 
WHERE status = 'pending'
ORDER BY created_at DESC; 