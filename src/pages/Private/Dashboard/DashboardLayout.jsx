import styles from './DashboardLayout.module.css';
import { Trash2, Activity, Clock, Bell } from 'lucide-react';
import ActivityStatsPanel from './ActivityStatsPanel';
import ActivityPanel from './ActivityPanel';
import AnnouncementsPanel from './AnnouncementsPanel';
import WelcomePanel from './WelcomePanel';
import SectionHeader from '../../../components/Layouts/SectionHeader';

export default function DashboardLayout({
  activities,
  activitiesLoading,
  onClearAllActivities,
  onClearActivity,
  announcements,
  announcementsLoading,
  userFirstName,
  quote,
  greetingText
}) {
  return (
    <>
      {/* Welcome Section - Full Width */}
      <section className={styles.welcomeSection}>
        <WelcomePanel 
          userFirstName={userFirstName}
          quote={quote}
          greetingText={greetingText}
        />
      </section>

      {/* Main Dashboard Grid */}
      <div className={styles.dashboardGrid}>
        {/* Activity Stats Section */}
        <div className={styles.section}>
          <SectionHeader 
            title="Your Usage" 
            icon={Activity}
            showActionButton={false}
          />
          <div className={styles.content}>
            <ActivityStatsPanel />
          </div>
        </div>

        {/* Activity Section */}
        <div className={styles.section}>
          <SectionHeader 
            title="Recent Activity" 
            icon={Clock}
            showActionButton={activities.length > 0}
            actionButton={activities.length > 0 ? {
              type: 'clear',
              text: 'Clear All',
              onClick: onClearAllActivities
            } : undefined}
          />
          <div className={styles.content}>
            <ActivityPanel
              activities={activities}
              activitiesLoading={activitiesLoading}
              onClearAll={onClearAllActivities}
              onClearActivity={onClearActivity}
            />
          </div>
        </div>

        {/* Announcements Section */}
        <div className={styles.section}>
          <SectionHeader 
            title="What's New" 
            icon={Bell}
            showActionButton={false}
          />
          <div className={styles.content}>
            <AnnouncementsPanel
              announcements={announcements}
              announcementsLoading={announcementsLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
} 