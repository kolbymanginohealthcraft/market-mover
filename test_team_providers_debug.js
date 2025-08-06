// Debug script to check team providers
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTeamProviders() {
  console.log('🔍 Debugging Team Providers');
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ User not authenticated');
      return;
    }
    console.log('✅ User authenticated:', user.id);

    // Get user's team_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.team_id) {
      console.log('❌ User not part of a team');
      return;
    }
    console.log('✅ User team_id:', profile.team_id);

    // Check team providers
    const { data: teamProviders, error: providersError } = await supabase
      .from('team_providers')
      .select('*')
      .eq('team_id', profile.team_id)
      .order('created_at', { ascending: false });

    if (providersError) {
      console.log('❌ Error fetching team providers:', providersError);
      return;
    }

    console.log('✅ Team providers found:', teamProviders.length);
    if (teamProviders.length > 0) {
      console.log('📋 Sample team providers:');
      teamProviders.slice(0, 3).forEach(tp => {
        console.log(`   - ${tp.provider_name} (${tp.provider_dhc})`);
      });
    } else {
      console.log('⚠️ No team providers found');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

debugTeamProviders(); 