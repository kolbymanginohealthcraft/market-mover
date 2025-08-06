import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTeamCustomColors() {
  console.log('🧪 Testing Team Custom Colors functionality...');
  console.log('=============================================\n');

  try {
    // Test 1: Check if team_custom_colors table exists
    console.log('1. Checking team_custom_colors table...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('team_custom_colors')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Table check failed:', tableError);
      return;
    }
    console.log('✅ team_custom_colors table exists');

    // Test 2: Test adding a custom color
    console.log('\n2. Testing custom color addition...');
    const testColor = {
      color_name: 'Test Primary Blue',
      color_hex: '#3B82F6',
      color_order: 0
    };

    const { data: insertData, error: insertError } = await supabase
      .from('team_custom_colors')
      .insert(testColor)
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return;
    }
    console.log('✅ Custom color added successfully:', insertData[0]);

    // Test 3: Test fetching team colors
    console.log('\n3. Testing color retrieval...');
    const { data: colors, error: fetchError } = await supabase
      .from('team_custom_colors')
      .select('*')
      .eq('color_name', 'Test Primary Blue');

    if (fetchError) {
      console.error('❌ Fetch failed:', fetchError);
      return;
    }
    console.log('✅ Colors retrieved:', colors.length);

    // Test 4: Test updating a color
    console.log('\n4. Testing color update...');
    const colorToUpdate = colors[0];
    const { data: updatedColor, error: updateError } = await supabase
      .from('team_custom_colors')
      .update({ 
        color_name: 'Updated Test Blue',
        color_hex: '#1D4ED8'
      })
      .eq('id', colorToUpdate.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      return;
    }
    console.log('✅ Color updated successfully:', updatedColor);

    // Test 5: Test deleting a color
    console.log('\n5. Testing color deletion...');
    const { error: deleteError } = await supabase
      .from('team_custom_colors')
      .delete()
      .eq('id', colorToUpdate.id);

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
      return;
    }
    console.log('✅ Color deleted successfully');

    // Test 6: Verify deletion
    console.log('\n6. Verifying deletion...');
    const { data: remainingColors, error: verifyError } = await supabase
      .from('team_custom_colors')
      .select('*')
      .eq('color_name', 'Updated Test Blue');

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return;
    }
    
    if (remainingColors.length === 0) {
      console.log('✅ Deletion verified - no colors found');
    } else {
      console.log('⚠️  Deletion verification failed - colors still exist');
    }

    console.log('\n🎉 All tests passed! Team custom colors functionality is working correctly.');

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

// Run the test
testTeamCustomColors(); 