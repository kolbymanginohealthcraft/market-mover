import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateSampleData() {
  console.log('🚀 Populating sample data...');

  try {
    // 1. Add sample system announcements
    console.log('📢 Adding sample announcements...');
    const announcements = [
      {
        title: '🎉 New Scorecard Tool',
        description: 'Compare across 40+ metrics with our enhanced scorecard feature.',
        announcement_date: '2024-05-01',
        priority: 1,
        is_active: true
      },
      {
        title: '📍 Market Data Updated',
        description: 'April 2025 CMS data now live across all markets.',
        announcement_date: '2024-04-29',
        priority: 1,
        is_active: true
      },
      {
        title: '🧠 Smarter Suggestions',
        description: 'New guidance added to "Help Me Decide" feature.',
        announcement_date: '2024-04-25',
        priority: 1,
        is_active: true
      }
    ];

    for (const announcement of announcements) {
      const { error } = await supabase
        .from('system_announcements')
        .insert(announcement);
      
      if (error) {
        console.error('Error inserting announcement:', error);
      }
    }

    // 2. Get all users to populate their data
    console.log('👥 Getting users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    for (const user of users.users) {
      console.log(`📊 Setting up data for user: ${user.email}`);
      
      // 3. Initialize user progress
      const progressTypes = [
        { type: 'profile_completion', current: 85, target: 100 },
        { type: 'tools_explored', current: 60, target: 100 },
        { type: 'markets_saved', current: 3, target: 10 }
      ];

      for (const progress of progressTypes) {
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            progress_type: progress.type,
            current_value: progress.current,
            target_value: progress.target
          });
        
        if (error) {
          console.error(`Error setting progress for ${progress.type}:`, error);
        }
      }

      // 4. Initialize user streaks
      const streakTypes = [
        { type: 'daily_login', current: 3, longest: 7 },
        { type: 'market_exploration', current: 2, longest: 5 },
        { type: 'report_generation', current: 1, longest: 3 }
      ];

      for (const streak of streakTypes) {
        const { error } = await supabase
          .from('user_streaks')
          .upsert({
            user_id: user.id,
            streak_type: streak.type,
            current_streak: streak.current,
            longest_streak: streak.longest,
            last_activity_date: new Date().toISOString().split('T')[0]
          });
        
        if (error) {
          console.error(`Error setting streak for ${streak.type}:`, error);
        }
      }

      // 5. Initialize ROI data for current month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { error: roiError } = await supabase
        .from('user_roi')
        .upsert({
          user_id: user.id,
          month_year: currentMonth,
          hours_saved: 12,
          value_unlocked: 50000,
          markets_explored: 8
        });
      
      if (roiError) {
        console.error('Error setting ROI data:', roiError);
      }

      // 6. Add sample activities
      const activities = [
        {
          activity_type: 'view_provider',
          target_id: '12345',
          target_name: 'Sunrise Rehab Center',
          metadata: { location: 'Chicago, IL' }
        },
        {
          activity_type: 'explore_market',
          target_id: 'market_001',
          target_name: 'Chicago Metro',
          metadata: { radius: 25 }
        },
        {
          activity_type: 'compare_scorecards',
          target_id: 'scorecard_001',
          target_name: 'Dallas-Fort Worth',
          metadata: { providers: 15 }
        },
        {
          activity_type: 'use_tool',
          target_id: null,
          target_name: 'Provider Search',
          metadata: { filters: ['type', 'location'] }
        },

      ];

      for (const activity of activities) {
        const { error } = await supabase
          .from('user_activities')
          .insert({
            user_id: user.id,
            ...activity,
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        
        if (error) {
          console.error('Error inserting activity:', error);
        }
      }
    }

    console.log('✅ Sample data populated successfully!');
    
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
  }
}

// Run the script
populateSampleData(); 