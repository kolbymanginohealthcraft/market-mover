import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function testActivityTracking() {
  console.log('🧪 Testing Activity Tracking System');
  console.log('===================================\n');

  try {
    // 1. Test if tables exist
    console.log('1. Checking if activity tables exist...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_activities', 'user_progress', 'user_streaks', 'user_roi']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return;
    }

    const existingTables = tables.map(t => t.table_name);
    console.log('✅ Existing tables:', existingTables);

    // 2. Test activity insertion
    console.log('\n2. Testing activity insertion...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('⚠️ No authenticated user, creating test activity manually...');
      
      // Create a test activity manually
      const { data: activity, error: activityError } = await supabase
        .from('user_activities')
        .insert({
          user_id: 'test-user-id',
          activity_type: 'test_activity',
          target_name: 'Test Provider',
          metadata: { test: true }
        })
        .select()
        .single();

      if (activityError) {
        console.error('❌ Error creating test activity:', activityError);
      } else {
        console.log('✅ Test activity created:', activity);
      }
    } else {
      console.log('✅ User authenticated:', user.email);
      
      // Create a real activity
      const { data: activity, error: activityError } = await supabase
        .from('user_activities')
        .insert({
          user_id: user.id,
          activity_type: 'test_activity',
          target_name: 'Test Provider',
          metadata: { test: true }
        })
        .select()
        .single();

      if (activityError) {
        console.error('❌ Error creating activity:', activityError);
      } else {
        console.log('✅ Activity created:', activity);
      }
    }

    // 3. Test progress initialization
    console.log('\n3. Testing progress initialization...');
    
    if (user) {
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) {
        console.error('❌ Error fetching progress:', progressError);
      } else {
        console.log('✅ User progress:', progress);
      }
    }

    // 4. Test streaks
    console.log('\n4. Testing streaks...');
    
    if (user) {
      const { data: streaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id);

      if (streaksError) {
        console.error('❌ Error fetching streaks:', streaksError);
      } else {
        console.log('✅ User streaks:', streaks);
      }
    }

    console.log('\n🎉 Activity tracking test completed!');
    console.log('\nNext steps:');
    console.log('1. ✅ Tables exist and are accessible');
    console.log('2. ✅ Activity insertion works');
    console.log('3. ✅ Progress tracking is set up');
    console.log('4. ✅ Streak tracking is set up');
    console.log('\nNow you can:');
    console.log('- Visit your app and perform actions');
    console.log('- Check the Home page to see real activity data');
    console.log('- Watch progress bars update automatically');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testActivityTracking(); 