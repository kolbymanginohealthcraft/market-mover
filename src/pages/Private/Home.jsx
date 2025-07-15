import { useEffect, useState } from 'react';
import styles from './Home.module.css';
import Banner from '../../components/Banner';
import HomeLayout from '../../components/Home/HomeLayout';
import { supabase } from '../../app/supabaseClient';
import useUserActivity from '../../hooks/useUserActivity';
import useUserProgress from '../../hooks/useUserProgress';
import useTestimonials from '../../hooks/useTestimonials';

export default function Home() {
  const [userFirstName, setUserFirstName] = useState('');
  const [quote, setQuote] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [marketLinks, setMarketLinks] = useState({});
  const [error, setError] = useState(null);

  // Custom hooks for data
  const { activities, loading: activitiesLoading, deleteActivity, deleteAllActivities } = useUserActivity();
  const { progress, streaks, roi, loading: progressLoading } = useUserProgress();
  const { announcements, loading: announcementsLoading } = useTestimonials();

  const motivationalQuotes = [
    "Every great decision starts with great data.",
    "Turn insight into action - every day.",
    "Grow smart. Win big.",
    "Use the data. Own the market.",
  ];

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .single();

        if (!profileError && profileData?.first_name) {
          setUserFirstName(profileData.first_name);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      }
    };

    fetchUserProfile();

    const hour = new Date().getHours();
    const greetingTime =
      hour < 12 ? 'Good morning' :
      hour < 18 ? 'Good afternoon' :
      'Good evening';
    
    const greetingText = userFirstName 
      ? `${greetingTime} ${userFirstName}, welcome to Market Mover 👋`
      : `${greetingTime}, welcome to Market Mover 👋`;
    
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, [userFirstName]);

  // Fetch market links for saved market activities
  useEffect(() => {
    const fetchMarketLinks = async () => {
      if (!activities.length) return;

      const savedMarketActivities = activities.filter(activity => 
        (activity.activity_type === 'save_market' || activity.activity_type === 'view_market') && activity.target_id
      );

      if (savedMarketActivities.length === 0) return;

      const marketIds = savedMarketActivities.map(activity => activity.target_id);
      
      try {
        const { data: marketData, error } = await supabase
          .from('saved_market')
          .select('id, provider_id, radius_miles')
          .in('id', marketIds);

        if (!error && marketData) {
          const links = {};
          marketData.forEach(market => {
            links[market.id] = `/app/provider/${market.provider_id}/overview?radius=${market.radius_miles}&marketId=${market.id}`;
          });
          setMarketLinks(links);
        }
      } catch (err) {
        console.error('Error fetching market links:', err);
      }
    };

    fetchMarketLinks();
  }, [activities]);

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  const clearAllActivities = async () => {
    try {
      console.log('Clearing all activities...');
      const success = await deleteAllActivities();
      if (success) {
        console.log('Successfully cleared all activities');
      } else {
        console.error('Failed to clear all activities');
      }
    } catch (err) {
      console.error('Error clearing activities:', err);
    }
  };

  const clearActivity = async (activityId) => {
    try {
      console.log('Clearing activity:', activityId);
      const success = await deleteActivity(activityId);
      if (success) {
        console.log('Successfully cleared activity:', activityId);
      } else {
        console.error('Failed to clear activity:', activityId);
      }
    } catch (err) {
      console.error('Error clearing activity:', err);
    }
  };

  // If there's an error, show a fallback
  if (error) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Banner
        title="Welcome to your simple sales and marketing enhancer!"
        message="We're thrilled to support your business goals through innovative analytics! We are constantly evolving Market Mover's capabilities, so keep an eye out for alerts on new features. Some exciting additions coming soon include real-time activity tracking and personalized insights to help you deepen your understanding of healthcare markets."
        icon="🚀"
        onClose={handleCloseBanner}
      />

      <HomeLayout
        activities={activities}
        activitiesLoading={activitiesLoading}
        marketLinks={marketLinks}
        onClearAllActivities={clearAllActivities}
        onClearActivity={clearActivity}
        progressLoading={progressLoading}
        streaks={streaks}
        announcements={announcements}
        announcementsLoading={announcementsLoading}
        userFirstName={userFirstName}
        quote={quote}
      />
    </div>
  );
}
