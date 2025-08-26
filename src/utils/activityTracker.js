import { supabase } from '../app/supabaseClient';

// Activity tracking utility
export const trackActivity = async (activityType, targetId = null, targetName = null, metadata = {}) => {
  try {
    console.log('🔍 Tracking activity:', { activityType, targetId, targetName, metadata });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user found');
      return null;
    }

    console.log('✅ User authenticated:', user.id);

    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        target_id: targetId,
        target_name: targetName,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error tracking activity:', error);
      return null;
    }

    console.log('✅ Activity tracked successfully:', data);
    return data;
  } catch (err) {
    console.error('❌ Error in activity tracker:', err);
    return null;
  }
};

// Predefined activity types
export const ACTIVITY_TYPES = {
  LOGIN: 'login',
  DASHBOARD_VISIT: 'login', // Using 'login' as fallback since 'dashboard_visit' not in DB constraint
  SEARCH_PROVIDERS: 'search_providers',
  VIEW_PROVIDER: 'view_provider',
  SAVE_MARKET: 'save_market',
  VIEW_MARKET: 'view_provider' // Using 'view_provider' as fallback
};

// Helper functions for common activities
export const trackProviderSearch = (searchTerm, resultCount) => {
  return trackActivity(ACTIVITY_TYPES.SEARCH_PROVIDERS, null, searchTerm, { resultCount });
};

export const trackProviderView = (providerDhc, providerName) => {
  return trackActivity(ACTIVITY_TYPES.VIEW_PROVIDER, providerDhc, providerName);
};

export const trackMarketSave = (marketId, marketName, radius) => {
  return trackActivity(ACTIVITY_TYPES.SAVE_MARKET, marketId, marketName, { radius });
};

export const trackMarketView = (marketId, marketName, radius) => {
  return trackActivity(ACTIVITY_TYPES.VIEW_MARKET, marketId, marketName, { radius });
};

export const trackDashboardVisit = () => {
  return trackActivity(ACTIVITY_TYPES.DASHBOARD_VISIT, null, 'Dashboard Visit');
}; 