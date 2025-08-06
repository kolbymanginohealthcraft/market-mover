import { useState, useEffect } from 'react';
import { supabase } from '../../app/supabaseClient';
import Banner from '../Banner';

export default function WelcomePanel({ userFirstName, progressLoading, streaks, quote, greetingText }) {
  const [dashboardStats, setDashboardStats] = useState({
    subscriptionTier: 'Free',
    savedMarkets: 0,
    taggedProviders: 0,
    todaysActivities: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityStreak, setActivityStreak] = useState({ current: 0, longest: 0 });

  const calculateActivityStreak = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user activities from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: activities, error } = await supabase
        .from('user_activities')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching activities for streak calculation:', error);
        return;
      }

      if (!activities || activities.length === 0) {
        setActivityStreak({ current: 0, longest: 0 });
        return;
      }

      // Group activities by date
      const activitiesByDate = {};
      activities.forEach(activity => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        if (!activitiesByDate[date]) {
          activitiesByDate[date] = [];
        }
        activitiesByDate[date].push(activity);
      });

      // Calculate current streak
      const today = new Date().toISOString().split('T')[0];
      const sortedDates = Object.keys(activitiesByDate).sort();
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Check if user was active today
      if (activitiesByDate[today]) {
        currentStreak = 1;
        tempStreak = 1;
      }

      // Calculate streaks by checking consecutive days
      for (let i = 1; i <= 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        if (activitiesByDate[dateStr]) {
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
        } else {
          // Break in streak
          if (currentStreak === 0 && tempStreak > 0) {
            currentStreak = tempStreak;
          }
          tempStreak = 0;
        }
      }

      // If we haven't found a current streak yet, use the temp streak
      if (currentStreak === 0) {
        currentStreak = tempStreak;
      }

      setActivityStreak({ current: currentStreak, longest: longestStreak });
    } catch (err) {
      console.error('Error calculating activity streak:', err);
      setActivityStreak({ current: 0, longest: 0 });
    }
  };

  const getStreakInfo = () => {
    // Use the calculated activity streak instead of the streaks from user_streaks
    return {
      current: activityStreak.current,
      longest: activityStreak.longest,
      type: 'activity'
    };
  };

  const fetchDashboardStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's team_id
      const { data: profileData } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      let subscriptionTier = 'Free';
      let taggedProvidersCount = 0;

      // Fetch subscription data (following TeamTab pattern)
      if (profileData?.team_id) {
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("plans(name)")
          .eq("team_id", profileData.team_id)
          .in("status", ["active", "trialing"])
          .order("renewed_at", { ascending: false })
          .limit(1)
          .single();

        if (subData?.plans?.name) {
          subscriptionTier = subData.plans.name;
        }
      }

      // Fetch tagged providers count (following useTaggedProviders pattern)
      if (profileData?.team_id) {
        const { data: tags } = await supabase
          .from('team_provider_tags')
          .select('provider_dhc')
          .eq('team_id', profileData.team_id);

        if (tags) {
          // Count unique providers (not total tags)
          const uniqueProviders = new Set(tags.map(tag => tag.provider_dhc));
          taggedProvidersCount = uniqueProviders.size;
        }
      }

      // Fetch saved markets count
      const { count: marketsCount } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch today's activities count
      const today = new Date().toISOString().split('T')[0];
      const { count: todaysActivitiesCount } = await supabase
        .from('user_activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      setDashboardStats({
        subscriptionTier: subscriptionTier,
        savedMarkets: marketsCount || 0,
        taggedProviders: taggedProvidersCount,
        todaysActivities: todaysActivitiesCount || 0
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    calculateActivityStreak(); // Calculate activity streak on mount
  }, []);

  const streakInfo = getStreakInfo();

  return (
    <Banner
      title={greetingText}
      subtitle={quote}
      gradient="green"
      cards={!progressLoading && !statsLoading ? [
        {
          value: `${streakInfo.current}`,
          label: 'Activity Streak',
          onClick: () => console.log('Streak clicked')
        },
        {
          value: `${dashboardStats.todaysActivities}`,
          label: "Today's Activities",
          onClick: () => console.log('Today clicked')
        },
        {
          value: `${dashboardStats.savedMarkets}`,
          label: 'Saved Markets',
          onClick: () => console.log('Markets clicked')
        },
        {
          value: `${dashboardStats.taggedProviders}`,
          label: 'Network',
          onClick: () => console.log('Providers clicked')
        }
      ] : []}
    />
  );
} 