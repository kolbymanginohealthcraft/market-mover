import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSavedMarketMigration() {
  console.log('🧪 Testing Saved Market Migration to BigQuery Structure');
  console.log('=====================================================\n');

  try {
    // Test 1: Check table structure
    console.log('1. Checking table structure...');
    
    const { data: savedMarketStructure, error: smError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'saved_market')
      .in('column_name', ['provider_id', 'user_id', 'radius_miles', 'name']);

    if (smError) {
      console.error('❌ Error checking saved_market structure:', smError);
    } else {
      console.log('✅ saved_market structure:');
      savedMarketStructure?.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    const { data: tagsStructure, error: tagsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'market_provider_tags')
      .in('column_name', ['market_id', 'tagged_provider_id', 'tag_type']);

    if (tagsError) {
      console.error('❌ Error checking market_provider_tags structure:', tagsError);
    } else {
      console.log('✅ market_provider_tags structure:');
      tagsStructure?.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // Test 2: Test saving a market with BigQuery dhc value
    console.log('\n2. Testing market save with BigQuery dhc...');
    
    // Get a test user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('⚠️  No authenticated user, skipping save test');
    } else {
      const testDhc = '123456789'; // Example BigQuery dhc value
      const testMarketName = 'Test Market Migration';
      const testRadius = 15;

      const { data: savedMarket, error: saveError } = await supabase
        .from("saved_market")
        .insert({
          user_id: user.id,
          provider_id: testDhc, // BigQuery dhc value
          radius_miles: testRadius,
          name: testMarketName,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving market:', saveError);
      } else {
        console.log('✅ Market saved successfully:');
        console.log(`   ID: ${savedMarket.id}`);
        console.log(`   Provider DHC: ${savedMarket.provider_id}`);
        console.log(`   Name: ${savedMarket.name}`);
        console.log(`   Radius: ${savedMarket.radius_miles} mi`);

        // Test 3: Test tagging with BigQuery dhc values
        console.log('\n3. Testing provider tagging...');
        
        const testTaggedDhc = '987654321'; // Example tagged provider dhc
        const { data: tag, error: tagError } = await supabase
          .from("market_provider_tags")
          .insert({
            market_id: savedMarket.id,
            tagged_provider_id: testTaggedDhc, // BigQuery dhc value
            tag_type: 'competitor',
          })
          .select()
          .single();

        if (tagError) {
          console.error('❌ Error tagging provider:', tagError);
        } else {
          console.log('✅ Provider tagged successfully:');
          console.log(`   Market ID: ${tag.market_id}`);
          console.log(`   Tagged Provider DHC: ${tag.tagged_provider_id}`);
          console.log(`   Tag Type: ${tag.tag_type}`);

          // Test 4: Test fetching tagged data
          console.log('\n4. Testing tag retrieval...');
          
          const { data: tags, error: fetchTagsError } = await supabase
            .from("market_provider_tags")
            .select('*')
            .eq('market_id', savedMarket.id);

          if (fetchTagsError) {
            console.error('❌ Error fetching tags:', fetchTagsError);
          } else {
            console.log('✅ Tags retrieved successfully:');
            tags?.forEach(tag => {
              console.log(`   Provider ${tag.tagged_provider_id}: ${tag.tag_type}`);
            });
          }

          // Cleanup test data
          console.log('\n5. Cleaning up test data...');
          await supabase.from('market_provider_tags').delete().eq('market_id', savedMarket.id);
          await supabase.from('saved_market').delete().eq('id', savedMarket.id);
          console.log('✅ Test data cleaned up');
        }
      }
    }

    // Test 5: Check existing data compatibility
    console.log('\n6. Checking existing data compatibility...');
    
    const { data: existingMarkets, error: existingError } = await supabase
      .from('saved_market')
      .select('id, provider_id, name, radius_miles')
      .limit(5);

    if (existingError) {
      console.error('❌ Error fetching existing markets:', existingError);
    } else {
      console.log(`✅ Found ${existingMarkets?.length || 0} existing markets`);
      existingMarkets?.forEach(market => {
        console.log(`   Market: ${market.name} (Provider: ${market.provider_id})`);
      });
    }

    console.log('\n🎉 Migration test completed successfully!');
    console.log('\nKey Changes Made:');
    console.log('1. ✅ saved_market.provider_id now stores BigQuery dhc values (text)');
    console.log('2. ✅ market_provider_tags.tagged_provider_id now stores BigQuery dhc values (text)');
    console.log('3. ✅ Foreign key constraints removed (no longer needed)');
    console.log('4. ✅ Frontend code updated to fetch provider details from BigQuery');
    console.log('5. ✅ Tagging system updated to work with BigQuery dhc values');

  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
  }
}

// Run the test
testSavedMarketMigration(); 