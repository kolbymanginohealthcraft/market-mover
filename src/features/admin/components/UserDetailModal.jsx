import React, { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { X, UserCheck } from 'lucide-react';
import Button from '../../../components/Buttons/Button';
import Spinner from '../../../components/Buttons/Spinner';
import { useUser } from '../../../components/Context/UserContext';
import { apiUrl } from '../../../utils/api';
import styles from './UserDetailModal.module.css';

export default function UserDetailModal({ user, isOpen, onClose }) {
  const { startImpersonation, isImpersonating } = useUser();
  const [userDetails, setUserDetails] = useState(null);
  const [authEvents, setAuthEvents] = useState([]);
  const [loginHistory, setLoginHistory] = useState(null);
  const [eventFilter, setEventFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails();
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const fetchUserDetails = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch detailed user info from auth and login history
      const authResponse = await fetch(apiUrl(`/api/users/${user.id}/login-history`), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      let authData = null;
      if (authResponse.ok) {
        authData = await authResponse.json();
        setLoginHistory(authData);
      }

      // Fetch recent activities
      const activitiesResponse = await fetch(apiUrl('/api/users/activity-counts'), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      let activityCount = 0;
      if (activitiesResponse.ok) {
        const counts = await activitiesResponse.json();
        activityCount = counts[user.id] || 0;
      }

      // Fetch authentication events (logins, failures, password resets, etc.)
      const authEventsResponse = await fetch(apiUrl(`/api/users/${user.id}/auth-events`), {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (authEventsResponse.ok) {
        const authEventsData = await authEventsResponse.json();
        setAuthEvents(authEventsData.events || []);
      }

      setUserDetails({
        ...user,
        authData,
        activityCount
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async () => {
    if (!window.confirm(`Are you sure you want to impersonate ${user.first_name} ${user.last_name}?`)) {
      return;
    }

    setImpersonating(true);
    const result = await startImpersonation(user.id);
    if (result) {
      onClose();
      window.location.reload();
    }
    setImpersonating(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const formatEventType = (eventType) => {
    if (!eventType) return 'Unknown Event';
    
    // Map common Supabase auth event types to readable names
    const eventTypeMap = {
      'login': 'Successful Login',
      'logout': 'Logout',
      'signup': 'Account Created',
      'token_refreshed': 'Token Refreshed',
      'identity_sign_in': 'Identity Sign In',
      'identity_created': 'Identity Created',
      'identity_updated': 'Identity Updated',
      'password_reset_requested': 'Password Reset Requested',
      'password_reset_confirmed': 'Password Reset Confirmed',
      'password_changed': 'Password Changed',
      'email_changed': 'Email Changed',
      'email_confirmed': 'Email Confirmed',
      'user_updated': 'User Updated',
      'user_deleted': 'User Deleted',
      'user_invited': 'User Invited',
      'login_failed': 'Login Failed',
      'token_refresh_failed': 'Token Refresh Failed'
    };

    return eventTypeMap[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isOpen || !user) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2>{user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.email}</h2>
            {(user.first_name || user.last_name) && user.email && (
              <p className={styles.subtitle}>{user.email}</p>
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <Spinner />
            <p>Loading user details...</p>
          </div>
        ) : (
          <div className={styles.content}>
            {loginHistory && (
              <div className={styles.section}>
                <h3>Account Information</h3>
                <table className={styles.compactTable}>
                  <tbody>
                    <tr>
                      <td className={styles.tableLabel}>Last Sign In</td>
                      <td className={styles.tableValue}>{formatDateTime(loginHistory.lastSignIn) || 'Never'}</td>
                    </tr>
                    <tr>
                      <td className={styles.tableLabel}>Created At</td>
                      <td className={styles.tableValue}>{formatDateTime(loginHistory.createdAt) || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className={styles.tableLabel}>Updated At</td>
                      <td className={styles.tableValue}>{formatDateTime(loginHistory.updatedAt) || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className={styles.tableLabel}>Confirmed At</td>
                      <td className={styles.tableValue}>{formatDateTime(loginHistory.confirmedAt) || 'Never'}</td>
                    </tr>
                    {loginHistory.recentLogins && loginHistory.recentLogins.length > 0 && (
                      <tr>
                        <td className={styles.tableLabel}>Total Login Records</td>
                        <td className={styles.tableValue}>{loginHistory.loginCount || 0}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {authEvents.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3>Authentication Events</h3>
                  <div className={styles.filterGroup}>
                    <label>Filter:</label>
                    <select 
                      value={eventFilter} 
                      onChange={(e) => setEventFilter(e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="all">All Events</option>
                      {[...new Set(authEvents.map(e => e.eventType))].sort().map(eventType => (
                        <option key={eventType} value={eventType}>
                          {formatEventType(eventType)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.compactTable}>
                    <thead>
                      <tr>
                        <th className={styles.tableHeader}>Event</th>
                        <th className={styles.tableHeader}>Date/Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {authEvents
                        .filter(event => eventFilter === 'all' || event.eventType === eventFilter)
                        .map((event, index) => (
                        <tr key={event.id || index}>
                          <td className={styles.tableValue}>
                            {formatEventType(event.eventType)}
                          </td>
                          <td className={styles.tableValue}>
                            {formatDateTime(event.timestamp)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              {!isImpersonating && (
                <Button
                  variant="gray"
                  outline
                  onClick={handleImpersonate}
                  disabled={impersonating}
                >
                  <UserCheck size={16} style={{ marginRight: '8px' }} />
                  {impersonating ? 'Impersonating...' : 'Impersonate User'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

