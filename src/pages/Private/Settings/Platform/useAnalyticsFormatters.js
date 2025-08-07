import { useMemo } from 'react';

export const useAnalyticsFormatters = () => {
  const formatNumber = useMemo(() => {
    return (num) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toString();
    };
  }, []);

  const getActivityIcon = useMemo(() => {
    return (activityType) => {
      const iconMap = {
        'provider_search': '🔍',
        'market_saved': '💾',
        'provider_viewed': '👁️',
        'census_data_viewed': '📊',
        'quality_measures_viewed': '📈',
        'claims_data_viewed': '💰',
        'cms_enrollment_viewed': '🏥',
        'feedback_submitted': '💬',
        'team_provider_added': '➕',
        'team_provider_removed': '➖',
        'default': '📝'
      };
      
      return iconMap[activityType] || iconMap.default;
    };
  }, []);

  return {
    formatNumber,
    getActivityIcon
  };
}; 