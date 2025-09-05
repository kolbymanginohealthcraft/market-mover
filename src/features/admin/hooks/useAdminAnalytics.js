import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { 
  Target, 
  Users, 
  Building, 
  BarChart3, 
  UserCheck, 
  Activity 
} from 'lucide-react';

export const useAdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    userMetrics: {},
    loginHistory: {},
    teamAnalytics: {},
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

      const [
        userMetrics,
        loginHistory,
        teamAnalytics,
        userActivity,
        featureUsage,
        engagement,
        feedback,
        systemHealth
      ] = await Promise.all([
        fetchUserMetrics(),
        fetchLoginHistory(),
        fetchTeamAnalytics(),
        fetchUserActivity(),
        fetchFeatureUsage(),
        fetchEngagement(),
        fetchFeedback(),
        fetchSystemHealth()
      ]);

      setAnalytics({
        userMetrics,
        loginHistory,
        teamAnalytics,
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

  const fetchUserMetrics = async () => {
    try {
      // Get total users
      const { count: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get monthly active users (users with activity in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentActivities, error: activityError } = await supabase
        .from('user_activities')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (activityError) throw activityError;

      const monthlyActiveUsers = new Set(recentActivities?.map(a => a.user_id) || []).size;

      // Get users by role
      const { data: usersByRole, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .not('role', 'is', null);

      if (roleError) throw roleError;

      const roleCounts = {};
      usersByRole?.forEach(user => {
        const role = user.role || 'No Role';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      // Get users by team
      const { data: usersByTeam, error: teamError } = await supabase
        .from('profiles')
        .select('team_id, teams(name)')
        .not('team_id', 'is', null);

      if (teamError) throw teamError;

      const teamCounts = {};
      usersByTeam?.forEach(user => {
        const teamName = user.teams?.name || 'Unknown Team';
        teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
      });

      return {
        totalUsers: totalUsers || 0,
        monthlyActiveUsers,
        roleCounts,
        teamCounts,
        activeUserPercentage: totalUsers > 0 ? Math.round((monthlyActiveUsers / totalUsers) * 100) : 0
      };
    } catch (err) {
      console.error('Error fetching user metrics:', err);
      return {};
    }
  };

  const fetchLoginHistory = async () => {
    try {
      // Get login activities from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: loginActivities, error } = await supabase
        .from('user_activities')
        .select('user_id, created_at, profiles(first_name, last_name, email)')
        .eq('activity_type', 'login')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by date
      const loginByDate = {};
      loginActivities?.forEach(activity => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        if (!loginByDate[date]) {
          loginByDate[date] = [];
        }
        loginByDate[date].push({
          userId: activity.user_id,
          timestamp: activity.created_at,
          user: activity.profiles
        });
      });

      // Get unique users who logged in
      const uniqueLogins = new Set(loginActivities?.map(a => a.user_id) || []).size;

      return {
        totalLogins: loginActivities?.length || 0,
        uniqueLogins,
        loginByDate,
        recentLogins: loginActivities?.slice(0, 10) || []
      };
    } catch (err) {
      console.error('Error fetching login history:', err);
      return {};
    }
  };

  const fetchTeamAnalytics = async () => {
    try {
      // Get all teams with their member counts
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          max_users,
          created_at,
          profiles(count)
        `);

      if (teamsError) throw teamsError;

      // Get team activity
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: teamActivities, error: activityError } = await supabase
        .from('user_activities')
        .select(`
          user_id,
          activity_type,
          created_at,
          profiles(team_id)
        `)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (activityError) throw activityError;

      // Calculate team activity
      const teamActivityCounts = {};
      teamActivities?.forEach(activity => {
        const teamId = activity.profiles?.team_id;
        if (teamId) {
          if (!teamActivityCounts[teamId]) {
            teamActivityCounts[teamId] = 0;
          }
          teamActivityCounts[teamId]++;
        }
      });

      const teamAnalytics = teams?.map(team => ({
        id: team.id,
        name: team.name,
        maxUsers: team.max_users,
        currentUsers: team.profiles?.[0]?.count || 0,
        createdAt: team.created_at,
        activityCount: teamActivityCounts[team.id] || 0,
        utilizationRate: team.max_users > 0 ? Math.round((team.profiles?.[0]?.count / team.max_users) * 100) : 0
      })) || [];

      return {
        totalTeams: teamAnalytics.length,
        teamAnalytics: teamAnalytics.sort((a, b) => b.activityCount - a.activityCount)
      };
    } catch (err) {
      console.error('Error fetching team analytics:', err);
      return {};
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

  // Helper functions
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (activityType) => {
    const icons = {
      'search_providers': <Target size={14} />,
      'view_provider': <Users size={14} />,
      'save_market': <Building size={14} />,
      'view_market': <BarChart3 size={14} />,
      'login': <UserCheck size={14} />
    };
    return icons[activityType] || <Activity size={14} />;
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
    formatNumber,
    formatDate,
    getActivityIcon
  };
};
