import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './Dashboard.module.css';
import Banner from '../../../components/Buttons/Banner';
import DashboardLayout from './DashboardLayout';
import PageLayout from '../../../components/Layouts/PageLayout';
import { supabase } from '../../../app/supabaseClient';
import { useUser } from '../../../components/Context/UserContext';
import useUserActivity from '../../../hooks/useUserActivity';

import useTestimonials from '../../../hooks/useTestimonials';
import { useFirstTimeLogin } from '../../../hooks/useFirstTimeLogin';
import { trackActivity, ACTIVITY_TYPES } from '../../../utils/activityTracker';

export default function Home() {
  const { user, profile, loading } = useUser();
  const [userFirstName, setUserFirstName] = useState('');
  const [quote, setQuote] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [error, setError] = useState(null);
  const [greetingText, setGreetingText] = useState('Hello, Welcome to Market Mover');


  // Custom hooks for data
  const { activities, loading: activitiesLoading, deleteActivity, deleteAllActivities } = useUserActivity();

  const { announcements, loading: announcementsLoading } = useTestimonials();
  const { isChecking, needsOnboarding } = useFirstTimeLogin();

  const motivationalQuotes = [
    // "Every great decision starts with great data.",
    // "Turn insight into action - every day.",
    // "Grow smart. Win big.",
    // "Use the data. Own the market.",
    "Simply smarter healthcare sales and marketing strategies."
  ];

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchUserProfile = async () => {
      try {
        if (!user) return;

        // Use profile data from UserContext instead of fetching again
        if (profile?.first_name) {
          setUserFirstName(profile.first_name);
          setGreetingText(`Hello, ${profile.first_name}`);
        }
      } catch (err) {
        console.error('Error setting user profile:', err);
        setError("Failed to load user profile");
      }
    };

    // Set a random motivational quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);

    fetchUserProfile();
  }, [user, profile]);

  // Update greeting text when userFirstName changes
  useEffect(() => {
    if (userFirstName) {
      setGreetingText(`Hello ${userFirstName}, Welcome to Market Mover`);
    } else {
      setGreetingText('Hello, Welcome to Market Mover');
    }
  }, [userFirstName]);

  const handleCloseBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  const clearAllActivities = useCallback(async () => {
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
  }, [deleteAllActivities]);

  const clearActivity = useCallback(async (activityId) => {
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
  }, [deleteActivity]);

  // If checking first time login or UserContext is loading, show loading
  if (loading || isChecking) {
    return (
      <PageLayout>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </PageLayout>
    );
  }


  // If there's an error, show a fallback
  if (error) {
    return (
      <PageLayout>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <DashboardLayout
         activities={activities}
         activitiesLoading={activitiesLoading}
         onClearAllActivities={clearAllActivities}
         onClearActivity={clearActivity}
         announcements={announcements}
         announcementsLoading={announcementsLoading}
         userFirstName={userFirstName}
         quote={quote}
         greetingText={greetingText}
       />
    </PageLayout>
  );
}
