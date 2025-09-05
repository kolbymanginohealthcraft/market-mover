import React, { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import { hasPlatformAccess, isTeamAdmin } from '../../../utils/roleHelpers';
import styles from './SettingsNavbar.module.css';

export default function SettingsTabs({ activeTab, setActiveTab }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(profile?.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const canAccessPlatform = hasPlatformAccess(userRole);
  const canAccessSubscription = true; // Remove team admin restriction
  const canAccessUsers = isTeamAdmin(userRole);
  const canAccessTaggedProviders = userRole !== null;
  const canAccessColors = userRole !== null;

  // Remove loading spinner for better UX - user role fetch is very fast

  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === "profile" ? styles.active : ""}`}
        onClick={() => handleTabClick("profile")}
      >
        👤 Profile
      </button>

      {canAccessUsers && (
        <button
          className={`${styles.tab} ${activeTab === "company" ? styles.active : ""}`}
          onClick={() => handleTabClick("company")}
        >
          🏢 Company
        </button>
      )}
      
      {canAccessUsers && (
        <button
          className={`${styles.tab} ${activeTab === "users" ? styles.active : ""}`}
          onClick={() => handleTabClick("users")}
        >
          👥 Users
        </button>
      )}
      
      {canAccessColors && (
        <button
          className={`${styles.tab} ${activeTab === "branding" ? styles.active : ""}`}
          onClick={() => handleTabClick("branding")}
        >
          🎨 Branding
        </button>
      )}
      
      {canAccessSubscription && (
        <button
          className={`${styles.tab} ${activeTab === "subscription" ? styles.active : ""}`}
          onClick={() => handleTabClick("subscription")}
        >
          💳 Subscription
        </button>
      )}

      {canAccessPlatform && (
        <button
          className={`${styles.tab} ${activeTab === "platform" ? styles.active : ""}`}
          onClick={() => handleTabClick("platform")}
        >
          ⚙️ Platform
        </button>
      )}
    </div>
  );
} 