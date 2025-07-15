import styles from './HomeLayout.module.css';
import QuickLinksSidebar from './QuickLinksSidebar';
import ActivityPanel from './ActivityPanel';
import AnnouncementsPanel from './AnnouncementsPanel';
import WelcomePanel from './WelcomePanel';

export default function HomeLayout({
  activities,
  activitiesLoading,
  marketLinks,
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
      {/* Left Sidebar - Sticky */}
      <aside className={styles.sidebar}>
        <QuickLinksSidebar />
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <WelcomePanel 
          userFirstName={userFirstName}
          progressLoading={progressLoading}
          streaks={streaks}
          quote={quote}
          greetingText={greetingText}
        />

        <div className={styles.contentGrid}>
          <ActivityPanel
            activities={activities}
            activitiesLoading={activitiesLoading}
            marketLinks={marketLinks}
            onClearAll={onClearAllActivities}
            onClearActivity={onClearActivity}
          />

          <div className={styles.rightColumn}>
            <AnnouncementsPanel
              announcements={announcements}
              announcementsLoading={announcementsLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
} 