import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { Flame, BarChart3 } from 'lucide-react';
import styles from './ActivityStatsPanel.module.css';
import {
  getSegmentationIcon,
  getSegmentationIconProps
} from '../../../utils/segmentationIcons';

export default function ActivityStatsPanel() {
  const defaultIconProps = { size: 16 };
  const [dashboardStats, setDashboardStats] = useState({
    subscriptionTier: 'Free',
    savedMarkets: 0,
    taggedProviders: 0,
    todaysActivities: 0,
    procedures: 0,
    diagnoses: 0,
    taxonomies: 0,
    metrics: 0
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

             // Calculate current streak by checking consecutive days from today backwards
       const today = new Date().toISOString().split('T')[0];
       let currentStreak = 0;
       let longestStreak = 0;
       let tempStreak = 0;

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
         } else {
           // Break in streak - if this is the first break, set current streak
           if (currentStreak === 0) {
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
      let procedureTagsCount = 0;
      let diagnosisTagsCount = 0;
      let taxonomyTagsCount = 0;
      let metricTagsCount = 0;

             // Fetch subscription data (temporarily disabled due to 406 errors)
       // if (profileData?.team_id) {
       //   const { data: subData } = await supabase
       //     .from("subscriptions")
       //     .select("*")
       //     .eq("team_id", profileData.team_id)
       //     .in("status", ["active"])
       //     .order("renewed_at", { ascending: false })
       //     .limit(1)
       //     .single();

       //   if (subData?.plan_id) {
       //     subscriptionTier = "Active Plan"; // Simplified for now
       //   }
       // }

      // Fetch tagged providers count
      if (profileData?.team_id) {
        const { data: tags } = await supabase
          .from('team_provider_tags')
          .select('provider_dhc')
          .eq('team_id', profileData.team_id);

        if (tags) {
          const uniqueProviders = new Set(tags.map(tag => tag.provider_dhc));
          taggedProvidersCount = uniqueProviders.size;
        }

        const { count: proceduresCount, error: proceduresError } = await supabase
          .from('team_procedure_tags')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', profileData.team_id);

        if (proceduresError) {
          console.error('Error fetching procedure tags count:', proceduresError);
        } else {
          procedureTagsCount = proceduresCount || 0;
        }

        const { count: diagnosesCount, error: diagnosesError } = await supabase
          .from('team_diagnosis_tags')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', profileData.team_id);

        if (diagnosesError) {
          console.error('Error fetching diagnosis tags count:', diagnosesError);
        } else {
          diagnosisTagsCount = diagnosesCount || 0;
        }

        const { count: taxonomiesCount, error: taxonomiesError } = await supabase
          .from('team_taxonomy_tags')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', profileData.team_id);

        if (taxonomiesError) {
          console.error('Error fetching taxonomy tags count:', taxonomiesError);
        } else {
          taxonomyTagsCount = taxonomiesCount || 0;
        }

        const { count: metricsCount, error: metricsError } = await supabase
          .from('team_kpi_tags')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', profileData.team_id);

        if (metricsError) {
          console.error('Error fetching metric tags count:', metricsError);
        } else {
          metricTagsCount = metricsCount || 0;
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
        todaysActivities: todaysActivitiesCount || 0,
        procedures: procedureTagsCount,
        diagnoses: diagnosisTagsCount,
        taxonomies: taxonomyTagsCount,
        metrics: metricTagsCount
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

  const activityCards = [
    {
      key: 'streak',
      icon: Flame,
      value: activityStreak.current,
      label: 'Daily Streak',
      subtext: `Longest: ${activityStreak.longest} days`
    },
    {
      key: 'todaysActivities',
      icon: BarChart3,
      value: dashboardStats.todaysActivities,
      label: "Today's Activities",
      subtext: 'Actions completed today'
    }
  ];

  const segmentationCards = [
    {
      key: 'savedMarkets',
      iconKey: 'savedMarkets',
      value: dashboardStats.savedMarkets,
      label: 'Saved Markets',
      subtext: 'Your market research'
    },
    {
      key: 'network',
      iconKey: 'network',
      value: dashboardStats.taggedProviders,
      label: 'My Network',
      subtext: 'Tagged providers'
    },
    {
      key: 'procedures',
      iconKey: 'procedures',
      value: dashboardStats.procedures,
      label: 'My Procedures',
      subtext: 'Tagged procedures'
    },
    {
      key: 'diagnoses',
      iconKey: 'diagnoses',
      value: dashboardStats.diagnoses,
      label: 'My Diagnoses',
      subtext: 'Tagged diagnoses'
    },
    {
      key: 'taxonomies',
      iconKey: 'taxonomies',
      value: dashboardStats.taxonomies,
      label: 'My Taxonomies',
      subtext: 'Tagged taxonomies'
    },
    {
      key: 'metrics',
      iconKey: 'metrics',
      value: dashboardStats.metrics,
      label: 'My Metrics',
      subtext: 'Tagged metrics'
    }
  ];

  const renderCards = (cards) => (
    <div className={styles.statsGrid}>
      {cards.map(({ key, icon: Icon, iconKey, value, label, subtext }) => {
        const IconComponent = iconKey ? getSegmentationIcon(iconKey) : Icon;
        const iconProps = iconKey
          ? getSegmentationIconProps({ size: 16 })
          : defaultIconProps;

        return (
          <div key={key} className={styles.statCard}>
            <div className={styles.statIcon}>
              {IconComponent && <IconComponent {...iconProps} />}
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{value}</div>
              <div className={styles.statLabel}>{label}</div>
              {subtext && <div className={styles.statSubtext}>{subtext}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSkeletons = (count) => (
    <div className={styles.statsGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`stat-skeleton-${index}`} className={styles.statCard}>
          <div className={styles.loadingPlaceholder}></div>
        </div>
      ))}
    </div>
  );

  if (statsLoading) {
    return (
      <>
        <section className={styles.sectionGroup}>
          <header className={styles.groupHeader}>
            <h3 className={styles.groupTitle}>Logins & Activity</h3>
            <p className={styles.groupDescription}>Usage signals from your account.</p>
          </header>
          {renderSkeletons(activityCards.length)}
        </section>
        <section className={styles.sectionGroup}>
          <header className={styles.groupHeader}>
            <h3 className={styles.groupTitle}>Segmentation Workbench</h3>
            <p className={styles.groupDescription}>Counts of tagged assets.</p>
          </header>
          {renderSkeletons(segmentationCards.length)}
        </section>
      </>
    );
  }

  return (
    <>
      <section className={styles.sectionGroup}>
        <header className={styles.groupHeader}>
          <h3 className={styles.groupTitle}>Logins & Activity</h3>
          <p className={styles.groupDescription}>Usage signals from your account.</p>
        </header>
        {renderCards(activityCards)}
      </section>

      <section className={styles.sectionGroup}>
        <header className={styles.groupHeader}>
          <h3 className={styles.groupTitle}>Segmentation Workbench</h3>
          <p className={styles.groupDescription}>Counts of tagged assets.</p>
        </header>
        {renderCards(segmentationCards)}
      </section>
    </>
  );
}
