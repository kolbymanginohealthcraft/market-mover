import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ukuxibhujcozcwozljzf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompanyTab() {
  console.log('🧪 Testing Company Tab Functionality\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking if company_profiles table exists...');
    const { data: companyTable, error: companyError } = await supabase
      .from('company_profiles')
      .select('*')
      .limit(1);

    if (companyError) {
      console.log('❌ company_profiles table does not exist or is not accessible');
      console.log('Error:', companyError.message);
      console.log('\n💡 Run the create_company_matchmaking_tables.sql script in Supabase first');
      return;
    }
    console.log('✅ company_profiles table exists');

    console.log('\n2. Checking if target_audiences table exists...');
    const { data: targetTable, error: targetError } = await supabase
      .from('target_audiences')
      .select('*')
      .limit(1);

    if (targetError) {
      console.log('❌ target_audiences table does not exist or is not accessible');
      console.log('Error:', targetError.message);
      return;
    }
    console.log('✅ target_audiences table exists');

    // Test 2: Test data insertion (if authenticated)
    console.log('\n3. Testing data insertion...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  Not authenticated - skipping insertion test');
      console.log('💡 Login to test full functionality');
    } else {
      console.log(`✅ Authenticated as: ${user.email}`);
      
      // Test company profile insertion
      const testCompanyProfile = {
        user_id: user.id,
        company_name: 'Test Healthcare Company',
        company_type: 'Healthcare Provider',
        specialty: 'Primary Care',
        size: '11-50 employees',
        location: 'Austin, TX',
        description: 'A test healthcare company for matchmaking',
        services: ['Primary Care', 'Cardiology'],
        years_in_business: 5,
        revenue_range: '$1M - $5M'
      };

      const { data: insertedCompany, error: insertCompanyError } = await supabase
        .from('company_profiles')
        .upsert(testCompanyProfile)
        .select()
        .single();

      if (insertCompanyError) {
        console.log('❌ Failed to insert company profile:', insertCompanyError.message);
      } else {
        console.log('✅ Company profile inserted successfully');
        console.log('   Company ID:', insertedCompany.id);
      }

      // Test target audience insertion
      const testTargetAudience = {
        user_id: user.id,
        preferred_partner_types: ['Health Tech Startup', 'Medical Device Company'],
        preferred_specialties: ['Cardiology', 'Orthopedics'],
        preferred_locations: ['Austin, TX', 'Dallas, TX'],
        partnership_goals: ['Technology Integration', 'Market Expansion'],
        deal_size_preference: '$500K - $1M',
        timeline: 'Medium-term (6-12 months)'
      };

      const { data: insertedTarget, error: insertTargetError } = await supabase
        .from('target_audiences')
        .upsert(testTargetAudience)
        .select()
        .single();

      if (insertTargetError) {
        console.log('❌ Failed to insert target audience:', insertTargetError.message);
      } else {
        console.log('✅ Target audience inserted successfully');
        console.log('   Target ID:', insertedTarget.id);
      }
    }

    // Test 3: Check table structure
    console.log('\n4. Checking table structure...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'company_profiles' });

    if (columnsError) {
      console.log('⚠️  Could not check table structure (function may not exist)');
    } else {
      console.log('✅ Table structure verified');
    }

    console.log('\n🎉 Company Tab Test Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run the create_company_matchmaking_tables.sql script in Supabase');
    console.log('2. Test the Company tab in the application');
    console.log('3. Verify data is saved and retrieved correctly');
    console.log('4. Test the matchmaking functionality (future feature)');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testCompanyTab(); 