import { supabase } from '../app/supabaseClient';
import { sanitizeProviderName } from './providerName';

// Activity tracking utility
export const trackActivity = async (activityType, targetId = null, targetName = null, metadata = {}) => {
  try {
    // Skip activity tracking if impersonating - prevents impersonator's activities
    // from being tracked on behalf of the impersonated user.
    // Note: If the actual user logs in separately (different session), their
    // activities will still be tracked normally since they won't have this flag set.
    const isImpersonating = localStorage.getItem('impersonation_original_user_id');
    if (isImpersonating) {
      console.log('⏭️ Skipping activity tracking (impersonation mode)');
      return null;
    }

    console.log('🔍 Tracking activity:', { activityType, targetId, targetName, metadata });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ No authenticated user found');
      return null;
    }

    console.log('✅ User authenticated:', user.id);

    const sanitizedTargetName = targetName ? sanitizeProviderName(targetName) : null;

    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: activityType,
        target_id: targetId,
        target_name: sanitizedTargetName,
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
  SEARCH_PROVIDERS: 'search_providers',
  VIEW_PROVIDER: 'view_provider',
  VIEW_MARKET: 'view_market'
};

// Helper functions for common activities
export const trackProviderSearch = (searchTerm, resultCount) => {
  return trackActivity(ACTIVITY_TYPES.SEARCH_PROVIDERS, null, searchTerm, { resultCount });
};

export const trackProviderView = (providerDhc, providerName) => {
  return trackActivity(ACTIVITY_TYPES.VIEW_PROVIDER, providerDhc, providerName);
};

 