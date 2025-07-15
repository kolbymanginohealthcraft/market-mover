const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function debugHomePage() {
  console.log('🔍 Debugging Home Page Issues');
  console.log('================================\n');

  try {
    // 1. Check if user_activities table exists
    console.log('1. Checking user_activities table...');
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*')
      .limit(1);

    if (activitiesError) {
      console.log('❌ user_activities table error:', activitiesError.message);
    } else {
      console.log('✅ user_activities table exists');
    }

    // 2. Check if user_streaks table exists
    console.log('\n2. Checking user_streaks table...');
    const { data: streaks, error: streaksError } = await supabase
      .from('user_streaks')
      .select('*')
      .limit(1);

    if (streaksError) {
      console.log('❌ user_streaks table error:', streaksError.message);
    } else {
      console.log('✅ user_streaks table exists');
    }

    // 3. Check if user_progress table exists (should be missing)
    console.log('\n3. Checking user_progress table (should be missing)...');
    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1);

    if (progressError) {
      console.log('✅ user_progress table is missing (expected):', progressError.message);
    } else {
      console.log('⚠️ user_progress table still exists');
    }

    // 4. Check if user_roi table exists (should be missing)
    console.log('\n4. Checking user_roi table (should be missing)...');
    const { data: roi, error: roiError } = await supabase
      .from('user_roi')
      .select('*')
      .limit(1);

    if (roiError) {
      console.log('✅ user_roi table is missing (expected):', roiError.message);
    } else {
      console.log('⚠️ user_roi table still exists');
    }

    // 5. Check activity_type constraint
    console.log('\n5. Checking activity_type constraint...');
    const { data: constraint, error: constraintError } = await supabase
      .rpc('check_activity_constraint');

    if (constraintError) {
      console.log('❌ Could not check constraint:', constraintError.message);
    } else {
      console.log('✅ Activity constraint check passed');
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Run the SQL cleanup scripts if tables are missing');
    console.log('3. Check if user_streaks table needs to be created');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugHomePage(); 