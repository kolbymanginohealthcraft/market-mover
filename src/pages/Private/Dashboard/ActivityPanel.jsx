import { Link } from 'react-router-dom';
import { Search, Building2, MapPin } from 'lucide-react';
import styles from './ActivityPanel.module.css';

export default function ActivityPanel({ 
  activities, 
  activitiesLoading, 
  onClearAll, 
  onClearActivity 
}) {
  // Helper function to get activity icon
  const getActivityIcon = (activityType) => {
    const icons = {
      'search_providers': <Search size={14} />,
      'view_provider': <Building2 size={14} />,
      'save_market': <MapPin size={14} />,
      'view_market': <MapPin size={14} />
    };
    
    return icons[activityType] || <Search size={14} />;
  };

  // Helper function to format activity text
  const getActivityText = (activity) => {
    const activityTexts = {
      'search_providers': `Searched for <strong>${activity.target_name}</strong> (${activity.metadata?.resultCount || 0} results)`,
      'view_provider': `Viewed provider <strong>${activity.target_name || 'Unknown Provider'}</strong>`,
      'save_market': `Saved market <strong>${activity.target_name}</strong> (${activity.metadata?.radius || 0} mile radius)`,
      'view_market': `Viewed market <strong>${activity.target_name}</strong> (${activity.metadata?.radius || 0} mile radius)`
    };
    
    return activityTexts[activity.activity_type] || `Action: ${activity.activity_type}`;
  };

  // Get the appropriate link for each activity type
  const getActivityLink = (activity) => {
    const links = {
      'search_providers': `/app/search?search=${encodeURIComponent(activity.target_name)}`,
      'view_provider': `/app/provider/${activity.target_id}?fromActivity=true`,
      'save_market': '#',
      'view_market': `/app/market/${activity.target_id}?fromActivity=true`
    };
    
    return links[activity.activity_type] || '#';
  };

  return (
    <div className={styles.content}>
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
                <span className={styles.activityIcon}>
                  {getActivityIcon(activity.activity_type)}
                </span>
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