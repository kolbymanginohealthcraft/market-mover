import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testViewMarketActivity() {
  try {
    console.log('🧪 Testing view_market activity tracking...');
    
    // Test tracking a view_market activity
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        activity_type: 'view_market',
        target_id: 'test_market_123',
        target_name: 'Test Market View',
        metadata: { radius: 25 }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error testing view_market activity:', error);
      return;
    }

    console.log('✅ view_market activity tracked successfully:', data);
    
    // Clean up test data
    await supabase
      .from('user_activities')
      .delete()
      .eq('target_id', 'test_market_123');
    
    console.log('✅ Test completed successfully');
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testViewMarketActivity(); 