import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function removeReportExportActivities() {
  console.log('🗑️ Removing report generation and data export activities...');
  
  try {
    // 1. Update the activity_type constraint
    console.log('1. Updating activity_type constraint...');
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_activities 
        DROP CONSTRAINT IF EXISTS user_activities_activity_type_check;
        
        ALTER TABLE user_activities 
        ADD CONSTRAINT user_activities_activity_type_check 
        CHECK (activity_type = ANY (ARRAY[
          'search_providers'::text,
          'view_provider'::text, 
          'save_market'::text
        ]));
      `
    });
    
    if (constraintError) {
      console.error('❌ Error updating constraint:', constraintError);
    } else {
      console.log('✅ Activity type constraint updated');
    }

    // 2. Remove existing activities with removed types
    console.log('2. Removing existing report/export activities...');
    const { error: deleteError } = await supabase
      .from('user_activities')
      .delete()
      .in('activity_type', ['generate_report', 'export_data']);

    if (deleteError) {
      console.error('❌ Error deleting activities:', deleteError);
    } else {
      console.log('✅ Report/export activities removed');
    }

    // 3. Remove reports_generated from user_progress
    console.log('3. Removing reports_generated from user_progress...');
    const { error: progressError } = await supabase
      .from('user_progress')
      .delete()
      .eq('progress_type', 'reports_generated');

    if (progressError) {
      console.error('❌ Error removing progress:', progressError);
    } else {
      console.log('✅ Reports generated progress removed');
    }

    console.log('🎉 Successfully removed report generation and data export functionality!');
    console.log('\nYour recent activity will now only show:');
    console.log('- Provider searches');
    console.log('- Provider views');
    console.log('- Market saves');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

removeReportExportActivities(); 