import { useState, useEffect } from 'react';
import { supabase } from '../../../../app/supabaseClient';
import Button from '../../../../components/Buttons/Button';
import Spinner from '../../../../components/Buttons/Spinner';
import styles from './AnalyticsDashboard.module.css';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    userActivity: {},
    featureUsage: {},
    engagement: {},
    feedback: {},
    systemHealth: {}
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
      // Get unique users who performed each activity type
      const { data, error } = await supabase
        .from('user_activities')
        .select('user_id, activity_type')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const featureUsers = {};
      const totalUsers = new Set();

      data?.forEach(activity => {
        totalUsers.add(activity.user_id);
        if (!featureUsers[activity.activity_type]) {
          featureUsers[activity.activity_type] = new Set();
        }
        featureUsers[activity.activity_type].add(activity.user_id);
      });

      const featureUsage = {};
      Object.entries(featureUsers).forEach(([feature, users]) => {
        featureUsage[feature] = {
          uniqueUsers: users.size,
          percentage: Math.round((users.size / totalUsers.size) * 100)
        };
      });

      return {
        totalActiveUsers: totalUsers.size,
        featureUsage,
        topFeatures: Object.entries(featureUsage)
          .sort(([,a], [,b]) => b.uniqueUsers - a.uniqueUsers)
          .slice(0, 5)
      };
    } catch (err) {
      console.error('Error fetching feature usage:', err);
      return {};
    }
  };

  const fetchEngagement = async () => {
    try {
      // Get user streaks data
      const { data: streaks, error: streaksError } = await supabase
        .from('user_streaks')
        .select('*');

      if (streaksError) throw streaksError;

      const engagementData = {
        totalUsers: 0,
        activeStreaks: 0,
        averageStreak: 0,
        topStreak: 0
      };

      if (streaks?.length > 0) {
        const uniqueUsers = new Set(streaks.map(s => s.user_id));
        const currentStreaks = streaks.filter(s => s.current_streak > 0);
        const avgStreak = streaks.reduce((sum, s) => sum + s.current_streak, 0) / streaks.length;
        const maxStreak = Math.max(...streaks.map(s => s.longest_streak));

        engagementData.totalUsers = uniqueUsers.size;
        engagementData.activeStreaks = currentStreaks.length;
        engagementData.averageStreak = Math.round(avgStreak);
        engagementData.topStreak = maxStreak;
      }

      return engagementData;
    } catch (err) {
      console.error('Error fetching engagement:', err);
      return {};
    }
  };

  const fetchFeedback = async () => {
    try {
      // Get testimonials and feature requests
      const { data: testimonials, error: testimonialsError } = await supabase
        .from('user_testimonials')
        .select('*');

      const { data: featureRequests, error: featureRequestsError } = await supabase
        .from('feature_requests')
        .select('*');

      if (testimonialsError) throw testimonialsError;
      if (featureRequestsError) throw featureRequestsError;

      const pendingTestimonials = testimonials?.filter(t => t.status === 'pending')?.length || 0;
      const approvedTestimonials = testimonials?.filter(t => t.status === 'approved')?.length || 0;
      const pendingFeatures = featureRequests?.filter(f => f.status === 'pending')?.length || 0;
      const approvedFeatures = featureRequests?.filter(f => f.status === 'approved')?.length || 0;

      return {
        testimonials: {
          total: testimonials?.length || 0,
          pending: pendingTestimonials,
          approved: approvedTestimonials
        },
        featureRequests: {
          total: featureRequests?.length || 0,
          pending: pendingFeatures,
          approved: approvedFeatures
        }
      };
    } catch (err) {
      console.error('Error fetching feedback:', err);
      return {};
    }
  };

  const fetchSystemHealth = async () => {
    try {
      // Get recent system announcements
      const { data: announcements, error: announcementsError } = await supabase
        .from('system_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (announcementsError) throw announcementsError;

      return {
        activeAnnouncements: announcements?.filter(a => a.is_active)?.length || 0,
        totalAnnouncements: announcements?.length || 0,
        recentAnnouncements: announcements || []
      };
    } catch (err) {
      console.error('Error fetching system health:', err);
      return {};
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      'search_providers': '🔍',
      'view_provider': '👤',
      'save_market': '📍',
      'view_market': '🗺️'
    };
    return icons[activityType] || '📊';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spinner size="lg" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Error Loading Analytics</h2>
          <p>{error}</p>
          <Button onClick={fetchAnalytics} variant="accent">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📊 Analytics Dashboard</h1>
        <p className={styles.subtitle}>
          Platform usage insights and user engagement metrics
        </p>
        <div className={styles.actions}>
          <Button onClick={fetchAnalytics} variant="accent" size="sm">
            🔄 Refresh Data
          </Button>
          <Button variant="blue" size="sm">
            📈 View Supabase Analytics
          </Button>
        </div>
      </div>

      <div className={styles.analyticsGrid}>
        {/* User Activity Overview */}
        <div className={styles.section}>
          <h2>👥 User Activity (Last 30 Days)</h2>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>
                {formatNumber(analytics.userActivity.totalActivities || 0)}
              </div>
              <div className={styles.metricLabel}>Total Activities</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>
                {formatNumber(analytics.featureUsage.totalActiveUsers || 0)}
              </div>
              <div className={styles.metricLabel}>Active Users</div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>
                {analytics.engagement.averageStreak || 0}
              </div>
              <div className={styles.metricLabel}>Avg. Streak</div>
            </div>
          </div>

          {analytics.userActivity.topActivities?.length > 0 && (
            <div className={styles.activityBreakdown}>
              <h3>Top Activities</h3>
              <div className={styles.activityList}>
                {analytics.userActivity.topActivities.map(([activity, count]) => (
                  <div key={activity} className={styles.activityItem}>
                    <span className={styles.activityIcon}>
                      {getActivityIcon(activity)}
                    </span>
                    <span className={styles.activityName}>
                      {activity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className={styles.activityCount}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feature Usage */}
        <div className={styles.section}>
          <h2>🔧 Feature Usage</h2>
          <div className={styles.featureUsage}>
            {analytics.featureUsage.topFeatures?.map(([feature, data]) => (
              <div key={feature} className={styles.featureCard}>
                <div className={styles.featureHeader}>
                  <span className={styles.featureName}>
                    {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className={styles.featurePercentage}>{data.percentage}%</span>
                </div>
                <div className={styles.featureBar}>
                  <div 
                    className={styles.featureBarFill}
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
                <div className={styles.featureUsers}>
                  {data.uniqueUsers} users
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className={styles.section}>
          <h2>📈 Engagement</h2>
          <div className={styles.engagementGrid}>
            <div className={styles.engagementCard}>
              <div className={styles.engagementValue}>
                {analytics.engagement.activeStreaks || 0}
              </div>
              <div className={styles.engagementLabel}>Active Streaks</div>
            </div>
            <div className={styles.engagementCard}>
              <div className={styles.engagementValue}>
                {analytics.engagement.topStreak || 0}
              </div>
              <div className={styles.engagementLabel}>Longest Streak</div>
            </div>
          </div>
        </div>

        {/* Feedback & Requests */}
        <div className={styles.section}>
          <h2>💬 Feedback & Requests</h2>
          <div className={styles.feedbackGrid}>
            <div className={styles.feedbackCard}>
              <h3>Testimonials</h3>
              <div className={styles.feedbackStats}>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.testimonials?.total || 0}
                  </span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.testimonials?.pending || 0}
                  </span>
                  <span className={styles.statLabel}>Pending</span>
                </div>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.testimonials?.approved || 0}
                  </span>
                  <span className={styles.statLabel}>Approved</span>
                </div>
              </div>
            </div>

            <div className={styles.feedbackCard}>
              <h3>Feature Requests</h3>
              <div className={styles.feedbackStats}>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.featureRequests?.total || 0}
                  </span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.featureRequests?.pending || 0}
                  </span>
                  <span className={styles.statLabel}>Pending</span>
                </div>
                <div className={styles.feedbackStat}>
                  <span className={styles.statValue}>
                    {analytics.feedback.featureRequests?.approved || 0}
                  </span>
                  <span className={styles.statLabel}>Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className={styles.section}>
          <h2>⚙️ System Health</h2>
          <div className={styles.systemHealth}>
            <div className={styles.healthCard}>
              <div className={styles.healthValue}>
                {analytics.systemHealth.activeAnnouncements || 0}
              </div>
              <div className={styles.healthLabel}>Active Announcements</div>
            </div>
            <div className={styles.healthCard}>
              <div className={styles.healthValue}>
                {analytics.systemHealth.totalAnnouncements || 0}
              </div>
              <div className={styles.healthLabel}>Total Announcements</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.note}>
          <h3>📊 Technical Metrics</h3>
          <p>
            For detailed technical analytics including login trends, session duration, 
            database performance, and API usage, visit the{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
              Supabase Dashboard
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
} 