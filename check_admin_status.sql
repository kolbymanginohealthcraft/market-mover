-- Check admin status and RLS policies

-- 1. Check if the profiles table has the is_system_admin column
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'is_system_admin';

-- 2. Check current admin users
SELECT 
    id,
    email,
    first_name,
    last_name,
    is_system_admin
FROM profiles 
WHERE is_system_admin = true;

-- 3. Check RLS status
SELECT 
    table_name,
    row_security
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('feature_requests', 'user_testimonials');

-- 4. Check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('feature_requests', 'user_testimonials')
ORDER BY tablename, policyname;

-- 5. Check if there are any pending feature requests
SELECT 
    id,
    title,
    description,
    status,
    user_id,
    created_at
FROM feature_requests 
WHERE status = 'pending'
ORDER BY created_at DESC; 