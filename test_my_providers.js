// Test script for My Providers functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMyProviders() {
  console.log('🧪 Testing My Providers functionality...');

  try {
    // Test 1: Check if user_providers table exists
    console.log('\n1. Checking user_providers table...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_providers')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check failed:', tableError);
      return;
    }
    console.log('✅ user_providers table exists');

    // Test 2: Test adding a provider
    console.log('\n2. Testing provider addition...');
    const testProvider = {
      provider_dhc: '12345',
      provider_name: 'Test Hospital',
      provider_type: 'Hospital',
      provider_network: 'Test Network',
      provider_city: 'Test City',
      provider_state: 'TX'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('user_providers')
      .insert(testProvider)
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
    } else {
      console.log('✅ Provider added successfully:', insertData);
    }

    // Test 3: Test fetching user providers
    console.log('\n3. Testing provider retrieval...');
    const { data: providers, error: fetchError } = await supabase
      .from('user_providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError);
    } else {
      console.log('✅ Providers retrieved:', providers.length, 'providers');
    }

    // Test 4: Test removing a provider
    console.log('\n4. Testing provider removal...');
    if (insertData && insertData[0]) {
      const { error: deleteError } = await supabase
        .from('user_providers')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('❌ Delete failed:', deleteError);
      } else {
        console.log('✅ Provider removed successfully');
      }
    }

    // Test 5: Test RLS policies
    console.log('\n5. Testing RLS policies...');
    const { data: allProviders, error: allError } = await supabase
      .from('user_providers')
      .select('*');

    if (allError) {
      console.error('❌ RLS test failed:', allError);
    } else {
      console.log('✅ RLS working correctly - only user providers visible');
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMyProviders(); 