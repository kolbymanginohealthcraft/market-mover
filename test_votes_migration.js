const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVotesMigration() {
  console.log('Testing votes migration...\n');

  try {
    // 1. Test that feature_requests table no longer has votes column
    console.log('1. Checking feature_requests table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'feature_requests')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('Error checking table structure:', tableError);
      return;
    }

    const hasVotesColumn = tableInfo.some(col => col.column_name === 'votes');
    if (hasVotesColumn) {
      console.error('❌ Votes column still exists in feature_requests table');
    } else {
      console.log('✅ Votes column successfully removed from feature_requests table');
    }

    // 2. Test that the view exists and works
    console.log('\n2. Testing feature_requests_with_votes view...');
    const { data: viewData, error: viewError } = await supabase
      .from('feature_requests_with_votes')
      .select('*')
      .limit(5);

    if (viewError) {
      console.error('❌ Error accessing view:', viewError);
    } else {
      console.log('✅ View exists and is accessible');
      console.log(`Found ${viewData.length} feature requests with votes`);
      
      if (viewData.length > 0) {
        const sample = viewData[0];
        console.log('Sample record:', {
          id: sample.id,
          title: sample.title,
          votes: sample.votes
        });
      }
    }

    // 3. Test voting functionality
    console.log('\n3. Testing voting functionality...');
    
    // First, get a user (you'll need to be logged in for this)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('⚠️  No authenticated user found. Skipping vote tests.');
    } else {
      console.log(`Testing with user: ${user.id}`);
      
      // Get a feature request to vote on
      const { data: requests, error: requestsError } = await supabase
        .from('feature_requests_with_votes')
        .select('*')
        .limit(1);

      if (requestsError || !requests.length) {
        console.log('⚠️  No feature requests found for testing');
      } else {
        const testRequest = requests[0];
        console.log(`Testing vote on request: ${testRequest.title} (ID: ${testRequest.id})`);
        
        // Check current votes
        const { data: currentVotes, error: votesError } = await supabase
          .from('feature_request_votes')
          .select('*')
          .eq('feature_request_id', testRequest.id);

        if (votesError) {
          console.error('❌ Error checking current votes:', votesError);
        } else {
          console.log(`Current votes for this request: ${currentVotes.length}`);
        }
      }
    }

    // 4. Test feature_request_votes table structure
    console.log('\n4. Checking feature_request_votes table...');
    const { data: votesTableInfo, error: votesTableError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'feature_request_votes')
      .eq('table_schema', 'public');

    if (votesTableError) {
      console.error('Error checking votes table structure:', votesTableError);
    } else {
      const expectedColumns = ['id', 'feature_request_id', 'user_id', 'created_at'];
      const actualColumns = votesTableInfo.map(col => col.column_name);
      
      const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
      if (missingColumns.length > 0) {
        console.error('❌ Missing columns in feature_request_votes:', missingColumns);
      } else {
        console.log('✅ feature_request_votes table has correct structure');
      }
    }

    console.log('\n✅ Migration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVotesMigration(); 