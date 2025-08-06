// Test script for Team Providers functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTeamProviders() {
  console.log('🧪 Testing Team Providers functionality...');

  try {
    // Test 1: Check if team_providers table exists
    console.log('\n1. Checking team_providers table...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('team_providers')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check failed:', tableError);
      return;
    }
    console.log('✅ team_providers table exists');

    // Test 2: Test adding a provider
    console.log('\n2. Testing provider addition...');
    const testProvider = {
      provider_dhc: 'TEST123456',
      provider_name: 'Test Hospital',
      provider_type: 'Hospital',
      provider_network: 'Test Network',
      provider_city: 'Test City',
      provider_state: 'TX'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('team_providers')
      .insert(testProvider)
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    console.log('✅ Provider added successfully:', insertData[0]);

    // Test 3: Test fetching team providers
    console.log('\n3. Testing provider retrieval...');
    const { data: providers, error: fetchError } = await supabase
      .from('team_providers')
      .select('*')
      .eq('provider_dhc', 'TEST123456');

    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError);
      return;
    }
    console.log('✅ Providers retrieved:', providers.length);

    // Test 4: Test updating a provider
    console.log('\n4. Testing provider update...');
    const { error: updateError } = await supabase
      .from('team_providers')
      .update({ provider_name: 'Updated Test Hospital' })
      .eq('provider_dhc', 'TEST123456');

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return;
    }
    console.log('✅ Provider updated successfully');

    // Test 5: Test deleting a provider
    console.log('\n5. Testing provider deletion...');
    const { error: deleteError } = await supabase
      .from('team_providers')
      .delete()
      .eq('provider_dhc', 'TEST123456');

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      return;
    }
    console.log('✅ Provider deleted successfully');

    console.log('\n🎉 All tests passed! Team Providers functionality is working correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testTeamProviders(); 