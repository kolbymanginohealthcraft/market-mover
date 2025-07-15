import styles from './HomeLayout.module.css';
import QuickLinksSidebar from './QuickLinksSidebar';
import ActivityPanel from './ActivityPanel';
import AnnouncementsPanel from './AnnouncementsPanel';
import TestimonialPanel from './TestimonialPanel';
import WelcomePanel from './WelcomePanel';
import ProgressPanel from './ProgressPanel';

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
  onSubmitTestimonial,
  testimonialLoading,
  userFirstName,
  quote
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
            <ProgressPanel
              progressLoading={progressLoading}
              streaks={streaks}
            />

            <AnnouncementsPanel
              announcements={announcements}
              announcementsLoading={announcementsLoading}
            />

            <TestimonialPanel
              onSubmitTestimonial={onSubmitTestimonial}
              loading={testimonialLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
} 