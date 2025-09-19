import React, { useState, useEffect } from 'react';
import { useUser } from '../../../components/Context/UserContext';
import styles from './SettingsNavbar.module.css';

export default function SettingsTabs({ activeTab, setActiveTab }) {
  const { user, profile, permissions, loading: userLoading } = useUser();

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  const canAccessPlatform = permissions.canAccessPlatform;
  const canAccessSubscription = true; // Remove team admin restriction
  const canAccessUsers = permissions.canAccessUsers;
  const canAccessTaggedProviders = profile !== null;
  const canAccessColors = permissions.canAccessUsers; // Require team admin or above for branding

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