import { supabase } from '../../../../app/supabaseClient';

export const saveMarket = async (marketData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: market, error: marketError } = await supabase
      .from('markets')
      .insert({
        user_id: user.id,
        name: marketData.name.trim(),
        city: marketData.city,
        state: marketData.state,
        latitude: marketData.latitude,
        longitude: marketData.longitude,
        radius_miles: marketData.radius_miles,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (marketError) {
      throw new Error(marketError.message);
    }

    return market;
  } catch (err) {
    console.error('Error creating market:', err);
    throw new Error(err.message || 'Failed to save market. Please try again.');
  }
}; 