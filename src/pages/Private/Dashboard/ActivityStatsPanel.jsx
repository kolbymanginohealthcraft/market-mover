import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Flame, BarChart3, MapPin, Users } from 'lucide-react';
import styles from './ActivityStatsPanel.module.css';

export default function ActivityStatsPanel() {
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

      console.log('Activities by date:', activitiesByDate);

      // Calculate current streak by checking consecutive days from today backwards
      const today = new Date().toISOString().split('T')[0];
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      console.log('Today:', today);

      // Check consecutive days starting from today
      for (let i = 0; i <= 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];

        if (activitiesByDate[dateStr]) {
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          console.log(`Day ${i}: ${dateStr} - Activity found, tempStreak: ${tempStreak}`);
        } else {
          // Break in streak - if this is the first break, set current streak
          if (currentStreak === 0) {
            currentStreak = tempStreak;
          }
          console.log(`Day ${i}: ${dateStr} - No activity, break in streak. currentStreak: ${currentStreak}, tempStreak: ${tempStreak}`);
          tempStreak = 0;
        }
      }

      // If we haven't found a current streak yet, use the temp streak
      if (currentStreak === 0) {
        currentStreak = tempStreak;
      }

      console.log('Final streak calculation:', { current: currentStreak, longest: longestStreak });
      setActivityStreak({ current: currentStreak, longest: longestStreak });
    } catch (err) {
      console.error('Error calculating activity streak:', err);
      setActivityStreak({ current: 0, longest: 0 });
    }
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

      // Fetch subscription data
      if (profileData?.team_id) {
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("plan_id")
          .eq("team_id", profileData.team_id)
          .in("status", ["active", "trialing"])
          .order("renewed_at", { ascending: false })
          .limit(1)
          .single();

        if (subData?.plan_id) {
          subscriptionTier = "Active Plan"; // Simplified for now
        }
      }

      // Fetch tagged providers count
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
    calculateActivityStreak();
  }, []);

  if (statsLoading) {
    return (
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.loadingPlaceholder}></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.loadingPlaceholder}></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.loadingPlaceholder}></div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.loadingPlaceholder}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <Flame size={16} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>{activityStreak.current}</div>
          <div className={styles.statLabel}>Daily Streak</div>
          <div className={styles.statSubtext}>Longest: {activityStreak.longest} days</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <BarChart3 size={16} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>{dashboardStats.todaysActivities}</div>
          <div className={styles.statLabel}>Today's Activities</div>
          <div className={styles.statSubtext}>Actions completed today</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <MapPin size={16} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>{dashboardStats.savedMarkets}</div>
          <div className={styles.statLabel}>Saved Markets</div>
          <div className={styles.statSubtext}>Your market research</div>
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statIcon}>
          <Users size={16} />
        </div>
        <div className={styles.statContent}>
          <div className={styles.statValue}>{dashboardStats.taggedProviders}</div>
          <div className={styles.statLabel}>My Network</div>
          <div className={styles.statSubtext}>Tagged providers</div>
        </div>
      </div>
    </div>
  );
}
