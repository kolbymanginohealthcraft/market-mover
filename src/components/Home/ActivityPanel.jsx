import { Link } from 'react-router-dom';
import styles from './ActivityPanel.module.css';

export default function ActivityPanel({ 
  activities, 
  activitiesLoading, 
  marketLinks, 
  onClearAll, 
  onClearActivity 
}) {
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

  // Get the appropriate link for each activity type
  const getActivityLink = (activity) => {
    const links = {
      'search_providers': `/app/search?search=${encodeURIComponent(activity.target_name)}`,
      'view_provider': `/app/provider/${activity.target_id}`,
      'save_market': marketLinks[activity.target_id] || `/app/markets`,
      'view_market': marketLinks[activity.target_id] || `/app/markets`
    };
    
    return links[activity.activity_type] || '#';
  };

  return (
    <div className={styles.panel}>
      <div className={styles.activityHeader}>
        <h3 className={styles.sectionTitle}>🕒 Recent Activity</h3>
        {activities.length > 0 && (
          <button 
            onClick={onClearAll}
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
          {activities.slice(0, 10).map((activity, index) => (
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
                onClick={() => onClearActivity(activity.id)}
                className={styles.clearSingleButton}
                title="Remove this activity"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No recent activity. Start exploring to see your activity here!</p>
      )}
    </div>
  );
} 