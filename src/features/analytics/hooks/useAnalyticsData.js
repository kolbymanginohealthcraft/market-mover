import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';

export const useAnalyticsData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    userActivity: {},
    featureUsage: {},
    engagement: {},
    feedback: {},
    systemHealth: {}
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all analytics data in parallel
      const [
        userActivity,
        featureUsage,
        engagement,
        feedback,
        systemHealth
      ] = await Promise.all([
        fetchUserActivity(),
        fetchFeatureUsage(),
        fetchEngagement(),
        fetchFeedback(),
        fetchSystemHealth()
      ]);

      setAnalytics({
        userActivity,
        featureUsage,
        engagement,
        feedback,
        systemHealth
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      // Get activity counts by type for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('user_activities')
        .select('activity_type, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const activityCounts = {};
      const dailyActivity = {};

      data?.forEach(activity => {
        const date = new Date(activity.created_at).toDateString();
        const type = activity.activity_type;

        // Count by type
        activityCounts[type] = (activityCounts[type] || 0) + 1;

        // Count by date
        if (!dailyActivity[date]) dailyActivity[date] = {};
        dailyActivity[date][type] = (dailyActivity[date][type] || 0) + 1;
      });

      return {
        totalActivities: data?.length || 0,
        activityCounts,
        dailyActivity,
        topActivities: Object.entries(activityCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      };
    } catch (err) {
      console.error('Error fetching user activity:', err);
      return {};
    }
  };

  const fetchFeatureUsage = async () => {
    try {
      // Get feature usage data
      const { data, error } = await supabase
        .from('user_activities')
        .select('activity_type, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const featureCounts = {};
      const totalActivities = data?.length || 0;

      data?.forEach(activity => {
        const feature = activity.activity_type;
        featureCounts[feature] = (featureCounts[feature] || 0) + 1;
      });

      const topFeatures = Object.entries(featureCounts)
        .map(([feature, count]) => ({
          feature,
          count,
          percentage: totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalActiveUsers: Object.keys(featureCounts).length,
        topFeatures: topFeatures.map(({ feature, percentage }) => [feature, { percentage }])
      };
    } catch (err) {
      console.error('Error fetching feature usage:', err);
      return {};
    }
  };

  const fetchEngagement = async () => {
    try {
      // Get engagement metrics
      const { data, error } = await supabase
        .from('user_activities')
        .select('user_id, created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const userActivity = {};
      data?.forEach(activity => {
        const userId = activity.user_id;
        if (!userActivity[userId]) userActivity[userId] = [];
        userActivity[userId].push(new Date(activity.created_at));
      });

      // Calculate streaks and engagement
      let totalStreak = 0;
      let topStreak = 0;
      let activeUsers = 0;

      Object.values(userActivity).forEach(dates => {
        if (dates.length > 0) {
          activeUsers++;
          // Simple streak calculation
          const sortedDates = dates.sort((a, b) => a - b);
          let currentStreak = 1;
          let maxStreak = 1;

          for (let i = 1; i < sortedDates.length; i++) {
            const dayDiff = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
            if (dayDiff <= 1) {
              currentStreak++;
              maxStreak = Math.max(maxStreak, currentStreak);
            } else {
              currentStreak = 1;
            }
          }

          totalStreak += maxStreak;
          topStreak = Math.max(topStreak, maxStreak);
        }
      });

      return {
        activeUsers,
        averageStreak: activeUsers > 0 ? Math.round(totalStreak / activeUsers) : 0,
        topStreak
      };
    } catch (err) {
      console.error('Error fetching engagement:', err);
      return {};
    }
  };

  const fetchFeedback = async () => {
    try {
      // Get feedback data
      const [testimonialsResult, featureRequestsResult] = await Promise.all([
        supabase.from('testimonials').select('status'),
        supabase.from('feature_requests').select('status')
      ]);

      const testimonials = {
        total: testimonialsResult.data?.length || 0,
        pending: testimonialsResult.data?.filter(t => t.status === 'pending').length || 0,
        approved: testimonialsResult.data?.filter(t => t.status === 'approved').length || 0
      };

      const featureRequests = {
        total: featureRequestsResult.data?.length || 0,
        pending: featureRequestsResult.data?.filter(f => f.status === 'pending').length || 0,
        approved: featureRequestsResult.data?.filter(f => f.status === 'approved').length || 0
      };

      return {
        testimonials,
        featureRequests
      };
    } catch (err) {
      console.error('Error fetching feedback:', err);
      return {};
    }
  };

  const fetchSystemHealth = async () => {
    try {
      // Get system health data
      const { data, error } = await supabase
        .from('announcements')
        .select('is_active');

      if (error) throw error;

      return {
        totalAnnouncements: data?.length || 0,
        activeAnnouncements: data?.filter(a => a.is_active).length || 0
      };
    } catch (err) {
      console.error('Error fetching system health:', err);
      return {};
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics
  };
}; 