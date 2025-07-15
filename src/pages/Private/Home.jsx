import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import Banner from '../../components/Banner';
import Button from '../../components/Buttons/Button';
import { supabase } from '../../app/supabaseClient';
import useUserActivity from '../../hooks/useUserActivity';
import useUserProgress from '../../hooks/useUserProgress';
import useTestimonials from '../../hooks/useTestimonials';
// Remove login tracking - we don't want to track every login

export default function Home() {
  const userRole = 'analyst';
  const [greeting, setGreeting] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quote, setQuote] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  const [marketLinks, setMarketLinks] = useState({}); // Store market links

  // Custom hooks for data
  const { activities, loading: activitiesLoading, trackActivity, deleteActivity, deleteAllActivities } = useUserActivity();
  const { progress, streaks, roi, loading: progressLoading } = useUserProgress();
  const { announcements, submitTestimonial, loading: announcementsLoading } = useTestimonials();

  const motivationalQuotes = [
    "Every great decision starts with great data.",
    "Turn insight into action - every day.",
    "Grow smart. Win big.",
    "Use the data. Own the market.",
  ];

  const whatsNew = [
    { title: '🎉 New Scorecard Tool', description: 'Compare across 40+ metrics.', date: 'May 1' },
    { title: '📍 Market Data Updated', description: 'April 2025 CMS data now live.', date: 'Apr 29' },
    { title: '🧠 Smarter Suggestions', description: 'New guidance added to "Help Me Decide".', date: 'Apr 25' },
  ];

  const helpContent = {
    admin: [
      { label: 'Manage team access', to: '/app/profile' },
      { label: 'Set market permissions', to: '/app/markets' },
      { label: 'Review usage reports', to: '/app/charts' },
    ],
    analyst: [
      { label: 'Explore a market', to: '/app/markets' },
      { label: 'Understand performance trends', to: '/app/charts' },
      { label: 'Use scorecards to compare facilities', to: '/app/scorecard' },
    ],
    marketer: [
      { label: 'View referral opportunities', to: '/app/markets' },
      { label: 'Track provider growth', to: '/app/charts' },
      { label: 'Build a target list', to: '/app/search' },
    ],
  };

  const helpLinks = helpContent[userRole] || [];

  // Helper function to format activity text
  const getActivityText = (activity) => {
    const activityTexts = {
      'search_providers': `🔍 Searched for <strong>${activity.target_name}</strong> (${activity.metadata?.resultCount || 0} results)`,
      'view_provider': `👤 Viewed provider <strong>${activity.target_name || 'Unknown Provider'}</strong>`,
      'save_market': `📍 Saved market <strong>${activity.target_name}</strong> (${activity.metadata?.radius || 0} mile radius)`,
      'view_market': `📍 Viewed market <strong>${activity.target_name}</strong> (${activity.metadata?.radius || 0} mile radius)`
    };
    
    return activityTexts[activity.activity_type] || `Action: ${activity.activity_type}`;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Don't track login activity - too noisy

    const fetchUserProfile = async () => {
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
    
    setGreeting(greetingText);

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

  const handleSubmitTestimonial = async () => {
    if (!testimonial.trim()) return;
    
    try {
      await submitTestimonial(testimonial, consent);
      setSubmitted(true);
      setTestimonial('');
      setConsent(false);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      // You could add error handling UI here
    }
  };

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

  return (
    <div className={styles.page}>
      {/* Enhanced Banner - Early Adopter Excitement */}
      <Banner
        title="Welcome to your simple sales and marketing enhancer!"
        message="We're thrilled to support your business goals through innovative analytics! We are constantly evolving Market Mover’s capabilities, so keep an eye out for alerts on new features. Some exciting additions coming soon include real-time activity tracking and personalized insights to help you deepen your understanding of healthcare markets."
        icon="🚀"
        onClose={handleCloseBanner}
      />

      <header className={styles.heroBox}>
        <h1 className={styles.hero}>{greeting}</h1>
        <p className={styles.subtext}>{quote}</p>
      </header>

      <div className={styles.wrapper}>
        <aside className={styles.sidebar}>
          <h2 className={styles.columnTitle}>🛠️ Quick Links</h2>

          <div className={styles.sidebarSection}>
            <div className={styles.toolGrid}>
              <Link to="/app/search">
                <Button variant="blue" size="md" className={styles.quickLinkButton}>
                  <span className={styles.emoji}>🔍</span>
                  <span className={styles.buttonText}>Search Markets</span>
                </Button>
              </Link>
              <Link to="/app/markets">
                <Button variant="green" size="md" className={styles.quickLinkButton}>
                  <span className={styles.emoji}>📍</span>
                  <span className={styles.buttonText}>My Markets</span>
                </Button>
              </Link>
              <Link to="/app/profile">
                <Button variant="accent" size="md" className={styles.quickLinkButton}>
                  <span className={styles.emoji}>👤</span>
                  <span className={styles.buttonText}>My Profile</span>
                </Button>
              </Link>
            </div>
          </div>


        </aside>

        <main className={styles.main}>
          <h2 className={styles.columnTitle}>📊 Your Activity</h2>

          <div className={styles.panel}>
            <div className={styles.activityHeader}>
              <h3 className={styles.sectionTitle}>🕒 Recent Activity</h3>
              {activities.length > 0 && (
                <button 
                  onClick={clearAllActivities}
                  className={styles.clearButton}
                  title="Clear all activity history"
                >
                  🗑️ Clear All
                </button>
              )}
            </div>
            {activitiesLoading ? (
              <p>Loading activities...</p>
            ) : activities.length > 0 ? (
              <ul className={styles.activityList}>
                {activities.slice(0, 10).map((activity, index) => {
                  // Get the appropriate link for each activity type
                  const getActivityLink = (activity) => {
                    const links = {
                      'search_providers': `/app/search?search=${encodeURIComponent(activity.target_name)}`,
                      'view_provider': `/app/provider/${activity.target_id}`,
                      'save_market': marketLinks[activity.target_id] || `/app/markets`, // Use stored link or fallback
                      'view_market': marketLinks[activity.target_id] || `/app/markets` // Use stored link or fallback
                    };
                    
                    return links[activity.activity_type] || '#';
                  };

                  return (
                    <li key={activity.id} className={styles.activityItem}>
                      <Link 
                        to={getActivityLink(activity)}
                        className={styles.activityLink}
                      >
                        <span 
                          className={styles.activityText}
                          dangerouslySetInnerHTML={{ __html: getActivityText(activity) }}
                        />
                      </Link>
                      <button 
                        onClick={() => clearActivity(activity.id)}
                        className={styles.clearSingleButton}
                        title="Remove this activity"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>No recent activity. Start exploring to see your activity here!</p>
            )}
          </div>

          <div className={styles.panel}>
            <h3 className={styles.sectionSubtitle}>🔥 Your Streak</h3>
            {progressLoading ? (
              <div className={styles.innerBlock}>Loading streak data...</div>
            ) : (
              <div className={styles.innerBlock}>
                {streaks.daily_login?.current || 0}-Day Streak! Keep it going.
              </div>
            )}

            <h3 className={styles.sectionSubtitle}>📈 Progress</h3>
            {progressLoading ? (
              <div className={styles.innerBlock}>Loading progress...</div>
            ) : (
              <div className={styles.innerBlock}>
                <div className={styles.progressItem}>
                  <label>Profile Completion</label>
                  <div className={styles.progressBar}>
                    <div style={{ width: `${progress.profile_completion?.percentage || 0}%` }} className={styles.fill}></div>
                  </div>
                  <span>{progress.profile_completion?.percentage || 0}%</span>
                </div>
                <div className={styles.progressItem}>
                  <label>Tools Explored</label>
                  <div className={styles.progressBar}>
                    <div style={{ width: `${progress.tools_explored?.percentage || 0}%` }} className={styles.fillAlt}></div>
                  </div>
                  <span>{progress.tools_explored?.percentage || 0}%</span>
                </div>
              </div>
            )}

            <h3 className={styles.sectionSubtitle}>💰 ROI This Month</h3>
            {progressLoading ? (
              <div className={`${styles.innerBlock} ${styles.roiCard}`}>Loading ROI data...</div>
            ) : (
              <div className={`${styles.innerBlock} ${styles.roiCard}`}>
                {roi.hours_saved || 0} hours saved and ${(roi.value_unlocked || 0).toLocaleString()} in growth unlocked.
              </div>
            )}

            <h3 className={styles.sectionSubtitle}>🎯 Milestones</h3>
            {progressLoading ? (
              <div className={`${styles.innerBlock} ${styles.statsRow}`}>
                <div className={styles.statBox}>Loading...</div>
                <div className={styles.statBox}>Loading...</div>
                <div className={styles.statBox}>Loading...</div>
              </div>
            ) : (
              <div className={`${styles.innerBlock} ${styles.statsRow}`}>
                <div className={styles.statBox}>⏱️ {roi.hours_saved || 0}h Saved</div>
                <div className={styles.statBox}>📍 {roi.markets_explored || 0} Markets</div>
                <div className={styles.statBox}>📈 {roi.reports_generated || 0} Reports</div>
              </div>
            )}
          </div>
        </main>

        <section className={styles.rightColumn}>
          <h2 className={styles.columnTitle}>📣 From Healthcraft</h2>

          <div className={styles.panel}>
            <h3 className={styles.sectionTitle}>📢 What's New</h3>
            {announcementsLoading ? (
              <p>Loading announcements...</p>
            ) : announcements.length > 0 ? (
              <ul className={styles.updateList}>
                {announcements.map((announcement) => (
                  <li key={announcement.id} className={styles.updateItem}>
                    <div className={styles.updateTitle}>{announcement.title}</div>
                    <div className={styles.updateDescription}>{announcement.description}</div>
                    <div className={styles.updateDate}>
                      {new Date(announcement.announcement_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No new announcements at this time.</p>
            )}
          </div>

          <div className={styles.panel}>
            <h3 className={styles.sectionTitle}>💬 Leave a Comment</h3>
            {submitted ? (
              <p className={styles.thankYou}>Thanks for your feedback!</p>
            ) : (
              <>
                <textarea
                  className={styles.textarea}
                  placeholder="Share how Market Mover has helped you..."
                  value={testimonial}
                  onChange={(e) => setTestimonial(e.target.value)}
                />
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  You have my consent to feature this on your website.
                </label>
                <button className={styles.submitButton} onClick={handleSubmitTestimonial}>
                  Submit
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
