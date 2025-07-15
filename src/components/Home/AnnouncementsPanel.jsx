import styles from './AnnouncementsPanel.module.css';

export default function AnnouncementsPanel({ announcements, announcementsLoading }) {
  return (
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
  );
} 