import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugFeedbackApproval() {
  console.log('🔍 Debugging feedback approval...');

  // 1. Check current user and admin status
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('❌ Error getting user:', userError);
    return;
  }
  console.log('✅ Current user:', user?.id);

  if (!user) {
    console.log('❌ No user logged in');
    return;
  }

  // 2. Check admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_system_admin')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('❌ Error checking admin status:', profileError);
    return;
  }

  console.log('✅ Admin status:', profile?.is_system_admin);

  // 3. Check pending feature requests
  console.log('\n📋 Checking pending feature requests...');
  const { data: pendingRequests, error: requestsError } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('status', 'pending');

  if (requestsError) {
    console.error('❌ Error fetching pending requests:', requestsError);
    return;
  }

  console.log(`✅ Found ${pendingRequests?.length || 0} pending feature requests`);

  if (pendingRequests?.length > 0) {
    const testRequest = pendingRequests[0];
    console.log('🧪 Testing approval on request:', testRequest.id);

    // 4. Try to approve the first pending request
    const { data: updateData, error: updateError } = await supabase
      .from('feature_requests')
      .update({ status: 'approved' })
      .eq('id', testRequest.id)
      .select();

    if (updateError) {
      console.error('❌ Error approving request:', updateError);
      console.error('Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
    } else {
      console.log('✅ Successfully approved request:', testRequest.id);
      console.log('Updated data:', updateData);
    }
  }

  // 5. Check RLS policies
  console.log('\n🔒 Checking RLS policies...');
  const { data: policies, error: policiesError } = await supabase
    .rpc('get_policies', { table_name: 'feature_requests' })
    .catch(() => {
      console.log('⚠️  Could not check policies via RPC, trying direct query...');
      return { data: null, error: null };
    });

  if (policiesError) {
    console.log('⚠️  Could not check policies, but continuing...');
  } else if (policies) {
    console.log('✅ RLS policies:', policies);
  }

  // 6. Test direct update with service role (if available)
  console.log('\n🔧 Testing with service role...');
  const serviceSupabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
  );

  if (pendingRequests?.length > 0) {
    const testRequest = pendingRequests[0];
    const { data: serviceUpdateData, error: serviceUpdateError } = await serviceSupabase
      .from('feature_requests')
      .update({ status: 'approved' })
      .eq('id', testRequest.id)
      .select();

    if (serviceUpdateError) {
      console.error('❌ Service role also failed:', serviceUpdateError);
    } else {
      console.log('✅ Service role succeeded:', serviceUpdateData);
    }
  }
}

debugFeedbackApproval().catch(console.error); 