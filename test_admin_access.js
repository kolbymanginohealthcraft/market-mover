const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test script to run in browser console
// Copy and paste this into your browser console while logged in as admin

async function testAdminApproval() {
  console.log('🔍 Testing admin approval...');
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.id);
  
  if (!user) {
    console.log('❌ No user logged in');
    return;
  }
  
  // Check admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_system_admin')
    .eq('id', user.id)
    .single();
    
  console.log('Admin status:', profile?.is_system_admin);
  
  // Get pending feature requests
  const { data: pendingRequests, error: requestsError } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('status', 'pending');
    
  console.log('Pending requests:', pendingRequests?.length || 0);
  
  if (pendingRequests?.length > 0) {
    const testRequest = pendingRequests[0];
    console.log('Testing approval on:', testRequest.id);
    
    // Try to approve
    const { data: updateData, error: updateError } = await supabase
      .from('feature_requests')
      .update({ status: 'approved' })
      .eq('id', testRequest.id)
      .select();
      
    if (updateError) {
      console.error('❌ Approval failed:', updateError);
    } else {
      console.log('✅ Approval succeeded:', updateData);
    }
  }
}

// Run the test
testAdminApproval(); 