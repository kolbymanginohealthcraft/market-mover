import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import Banner from '../../components/Banner';
import DashboardLayout from '../../components/Home/DashboardLayout';
import { supabase } from '../../app/supabaseClient';
import useUserActivity from '../../hooks/useUserActivity';
import useUserProgress from '../../hooks/useUserProgress';
import useTestimonials from '../../hooks/useTestimonials';

export default function Home() {
  const [userFirstName, setUserFirstName] = useState('');
  const [quote, setQuote] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [error, setError] = useState(null);
  const [greetingText, setGreetingText] = useState('Hello, welcome to Market Mover 👋');

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

    const newGreetingText = userFirstName 
      ? `Hello ${userFirstName}, welcome to Market Mover`
      : 'Hello, welcome to Market Mover';
    
    setGreetingText(newGreetingText);
    setQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
  }, [userFirstName]);



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
      <DashboardLayout
        activities={activities}
        activitiesLoading={activitiesLoading}
        onClearAllActivities={clearAllActivities}
        onClearActivity={clearActivity}
        progressLoading={progressLoading}
        streaks={streaks}
        announcements={announcements}
        announcementsLoading={announcementsLoading}
        userFirstName={userFirstName}
        quote={quote}
        greetingText={greetingText}
      />
    </div>
  );
}
