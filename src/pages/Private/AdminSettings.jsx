import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../app/supabaseClient';
import Button from '../../components/Buttons/Button';
import styles from './AdminSettings.module.css';
import { isPlatformAdmin, hasPlatformAccess } from '../../utils/roleHelpers';

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) return;

      // Check if user has platform admin access from profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return;
      }

      setProfile(profileData);
      setIsAdmin(hasPlatformAccess(profileData?.role));
    };

    checkUser();
  }, []);

  if (!user) {
    return (
      <div className={styles.container}>
        <h1>Access Denied</h1>
        <p>You must be logged in to access admin settings.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access admin settings.</p>
        <p>Your current role: {profile?.role || 'Unknown'}</p>
        <p>Required role: Platform Admin or Platform Support</p>
        <p>Contact your administrator if you believe this is an error.</p>
      </div>
    );
  }

  const adminTools = [
    {
      title: '📢 System Announcements',
      description: 'Manage system-wide announcements that appear on user home pages',
      link: '/app/manage-announcements',
      icon: '📢'
    },
    {
      title: '💬 Feedback Approvals',
      description: 'Review and approve testimonials and feature requests',
      link: '/app/manage-feedback',
      icon: '💬'
    },
    {
      title: '👥 User Management',
      description: 'Manage user accounts, roles, and permissions',
      link: '/app/manage-users',
      icon: '👥'
    },
    {
      title: '📊 Analytics Dashboard',
      description: 'View platform usage analytics and user engagement metrics',
      link: '/app/analytics-dashboard',
      icon: '📊'
    },
    {
      title: '⚙️ System Settings',
      description: 'Configure system-wide settings and preferences',
      link: '/app/system-settings',
      icon: '⚙️'
    },
    {
      title: '🔧 Database Tools',
      description: 'Database management and maintenance tools',
      link: '/app/database-tools',
      icon: '🔧'
    },
    {
      title: '📝 Content Management',
      description: 'Manage static content, help text, and documentation',
      link: '/app/content-management',
      icon: '📝'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🔧 Admin Settings</h1>
        <p className={styles.subtitle}>
          Administrative tools and system management
        </p>
      </div>

      <div className={styles.adminInfo}>
        <div className={styles.userInfo}>
          <strong>Logged in as:</strong> {user.email}
        </div>
        <div className={styles.roleInfo}>
          <strong>Role:</strong> Administrator
        </div>
      </div>

      <div className={styles.toolsGrid}>
        {adminTools.map((tool, index) => (
          <div key={index} className={styles.toolCard}>
            <div className={styles.toolIcon}>{tool.icon}</div>
            <div className={styles.toolContent}>
              <h3 className={styles.toolTitle}>{tool.title}</h3>
              <p className={styles.toolDescription}>{tool.description}</p>
              <Link to={tool.link}>
                <Button variant="accent" size="sm">
                  Access Tool
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionButtons}>
          <Button variant="blue" size="md">
            📊 View System Status
          </Button>
          <Button variant="gold" size="md">
            🔄 Refresh Cache
          </Button>
          <Button variant="teal" size="md">
            📧 Send System Email
          </Button>
        </div>
      </div>

      <div className={styles.systemInfo}>
        <h2>System Information</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>Environment:</label>
            <span>{import.meta.env.MODE}</span>
          </div>
          <div className={styles.infoItem}>
            <label>Version:</label>
            <span>1.0.0</span>
          </div>
          <div className={styles.infoItem}>
            <label>Last Updated:</label>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 