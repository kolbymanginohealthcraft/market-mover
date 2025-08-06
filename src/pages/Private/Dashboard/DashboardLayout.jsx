import styles from './DashboardLayout.module.css';
import QuickLinksSidebar from './QuickActions';
import ActivityPanel from './ActivityPanel';
import AnnouncementsPanel from './AnnouncementsPanel';
import WelcomePanel from './WelcomePanel';

export default function DashboardLayout({
  activities,
  activitiesLoading,
  onClearAllActivities,
  onClearActivity,
  progressLoading,
  streaks,
  announcements,
  announcementsLoading,
  userFirstName,
  quote,
  greetingText
}) {
  return (
    <div className={styles.wrapper}>
      {/* Welcome Section - Full Width */}
      <section className={styles.welcomeSection}>
        <WelcomePanel 
          userFirstName={userFirstName}
          progressLoading={progressLoading}
          streaks={streaks}
          quote={quote}
          greetingText={greetingText}
        />
      </section>

      {/* Main Dashboard Grid */}
      <div className={styles.dashboardGrid}>
        {/* Quick Actions Section */}
        <section className={styles.quickActionsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <p className={styles.sectionSubtitle}>Access your most used tools</p>
          </div>
          <QuickLinksSidebar />
        </section>

        {/* Activity Section */}
        <section className={styles.activitySection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
              {activities.length > 0 && (
                <button 
                  onClick={onClearAllActivities}
                  className={styles.clearButton}
                  title="Clear all activity history"
                >
                  🗑️ Clear All
                </button>
              )}
            </div>
            <p className={styles.sectionSubtitle}>Your latest actions and searches</p>
          </div>
          <ActivityPanel
            activities={activities}
            activitiesLoading={activitiesLoading}
            onClearAll={onClearAllActivities}
            onClearActivity={onClearActivity}
          />
        </section>

        {/* Announcements Section */}
        <section className={styles.announcementsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What's New</h2>
            <p className={styles.sectionSubtitle}>Latest updates and announcements</p>
          </div>
          <AnnouncementsPanel
            announcements={announcements}
            announcementsLoading={announcementsLoading}
          />
        </section>
      </div>
    </div>
  );
} 