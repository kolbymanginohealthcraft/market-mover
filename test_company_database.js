import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ukuxibhujcozcwozljzf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompanyDatabase() {
  console.log('🧪 Testing Company Database Integration\n');

  try {
    // Test 1: Check if new columns exist in teams table
    console.log('1. Checking if company_type and industry_vertical columns exist...');
    const { data: teamColumns, error: columnError } = await supabase
      .from('teams')
      .select('company_type, industry_vertical')
      .limit(1);

    if (columnError) {
      console.log('❌ New columns do not exist or are not accessible');
      console.log('Error:', columnError.message);
      console.log('\n💡 Run the add_company_fields_to_teams.sql script in Supabase first');
      return;
    }
    console.log('✅ New columns exist in teams table');

    // Test 2: Test data insertion (if authenticated)
    console.log('\n2. Testing data insertion...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  Not authenticated - skipping insertion test');
      console.log('💡 Login to test full functionality');
    } else {
      console.log(`✅ Authenticated as: ${user.email}`);
      
      // Get user's team
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.team_id) {
        console.log('⚠️  User is not part of a team - skipping insertion test');
        console.log('💡 Join a team to test company data functionality');
      } else {
        console.log(`✅ User is part of team: ${profile.team_id}`);
        
        // Test company data update
        const testCompanyData = {
          company_type: 'Provider',
          industry_vertical: 'Acute Care / Hospital'
        };

        const { data: updatedTeam, error: updateError } = await supabase
          .from('teams')
          .update(testCompanyData)
          .eq('id', profile.team_id)
          .select('name, company_type, industry_vertical')
          .single();

        if (updateError) {
          console.log('❌ Failed to update team company data:', updateError.message);
        } else {
          console.log('✅ Team company data updated successfully');
          console.log('   Team Name:', updatedTeam.name);
          console.log('   Company Type:', updatedTeam.company_type);
          console.log('   Industry Vertical:', updatedTeam.industry_vertical);
        }
      }
    }

    // Test 3: Check constraints
    console.log('\n3. Testing constraints...');
    
    // Try to insert invalid data (this should fail)
    const { error: constraintError } = await supabase
      .from('teams')
      .update({
        company_type: 'InvalidType',
        industry_vertical: 'Invalid Vertical'
      })
      .eq('id', 'test-id');

    if (constraintError) {
      console.log('✅ Constraints are working (expected error for invalid data)');
    } else {
      console.log('⚠️  Constraints may not be properly set');
    }

    console.log('\n🎉 Company Database Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the add_company_fields_to_teams.sql script in Supabase');
    console.log('2. Test the Company tab in the application');
    console.log('3. Verify data is saved and retrieved correctly');
    console.log('4. Test the matchmaking functionality (future feature)');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testCompanyDatabase(); 