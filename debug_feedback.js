const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugFeedback() {
  console.log('🔍 Debugging Feedback System...\n');

  try {
    // 1. Check if tables exist
    console.log('1. Checking tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_testimonials', 'feature_requests']);

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    } else {
      console.log('✅ Tables found:', tables.map(t => t.table_name));
    }

    // 2. Check all testimonials
    console.log('\n2. Checking all testimonials...');
    const { data: testimonials, error: testimonialsError } = await supabase
      .from('user_testimonials')
      .select('*');

    if (testimonialsError) {
      console.error('Error fetching testimonials:', testimonialsError);
    } else {
      console.log(`✅ Found ${testimonials.length} testimonials:`);
      testimonials.forEach(t => {
        console.log(`   - ID: ${t.id}, Status: ${t.status}, Content: ${t.content.substring(0, 50)}...`);
      });
    }

    // 3. Check all feature requests
    console.log('\n3. Checking all feature requests...');
    const { data: requests, error: requestsError } = await supabase
      .from('feature_requests')
      .select('*');

    if (requestsError) {
      console.error('Error fetching feature requests:', requestsError);
    } else {
      console.log(`✅ Found ${requests.length} feature requests:`);
      requests.forEach(r => {
        console.log(`   - ID: ${r.id}, Status: ${r.status}, Title: ${r.title}`);
      });
    }

    // 4. Check pending testimonials specifically
    console.log('\n4. Checking pending testimonials...');
    const { data: pendingTestimonials, error: pendingTestimonialsError } = await supabase
      .from('user_testimonials')
      .select('*')
      .eq('status', 'pending');

    if (pendingTestimonialsError) {
      console.error('Error fetching pending testimonials:', pendingTestimonialsError);
    } else {
      console.log(`✅ Found ${pendingTestimonials.length} pending testimonials`);
    }

    // 5. Check pending feature requests specifically
    console.log('\n5. Checking pending feature requests...');
    const { data: pendingRequests, error: pendingRequestsError } = await supabase
      .from('feature_requests')
      .select('*')
      .eq('status', 'pending');

    if (pendingRequestsError) {
      console.error('Error fetching pending feature requests:', pendingRequestsError);
    } else {
      console.log(`✅ Found ${pendingRequests.length} pending feature requests`);
    }

    // 6. Check RLS policies
    console.log('\n6. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .in('table_name', ['user_testimonials', 'feature_requests']);

    if (policiesError) {
      console.error('Error checking policies:', policiesError);
    } else {
      console.log('✅ RLS policies found:', policies.map(p => `${p.table_name}: ${p.policy_name}`));
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugFeedback(); 