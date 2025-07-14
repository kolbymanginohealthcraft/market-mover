import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use the same environment variables as your app
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Debugging Activity Tables');
console.log('============================');
console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Supabase Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTables() {
  try {
    console.log('\n1. Testing database connection...');
    
    // Test basic connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth status:', user ? '✅ Authenticated' : '⚠️ Not authenticated');
    if (authError) console.log('Auth error:', authError.message);

    // Check if tables exist
    console.log('\n2. Checking if activity tables exist...');
    
    const tablesToCheck = [
      'user_activities',
      'user_progress', 
      'user_streaks',
      'user_roi',
      'user_milestones',
      'user_testimonials',
      'system_announcements',
      'user_tool_usage'
    ];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: Table exists`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }

    // Test inserting a sample activity
    console.log('\n3. Testing activity insertion...');
    
    if (user) {
      const { data: activity, error: insertError } = await supabase
        .from('user_activities')
        .insert({
          activity_type: 'debug_test',
          target_name: 'Debug Test',
          metadata: { test: true, timestamp: new Date().toISOString() }
        })
        .select()
        .single();

      if (insertError) {
        console.log('❌ Activity insertion failed:', insertError.message);
      } else {
        console.log('✅ Activity inserted successfully:', activity.id);
        
        // Clean up test data
        await supabase
          .from('user_activities')
          .delete()
          .eq('id', activity.id);
        console.log('🧹 Test activity cleaned up');
      }
    } else {
      console.log('⚠️ Skipping activity insertion - no authenticated user');
    }

    console.log('\n🎉 Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugTables(); 