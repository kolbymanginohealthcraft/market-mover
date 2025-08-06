import React from 'react';
import styles from './AdminTabs.module.css';

export const AdminTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === "team" ? styles.active : ""}`}
        onClick={() => setActiveTab("team")}
      >
        👥 Team Management
      </button>
      <button
        className={`${styles.tab} ${activeTab === "colors" ? styles.active : ""}`}
        onClick={() => setActiveTab("colors")}
      >
        🎨 Team Colors
      </button>
      <button
        className={`${styles.tab} ${activeTab === "subscription" ? styles.active : ""}`}
        onClick={() => setActiveTab("subscription")}
      >
        💳 Subscription
      </button>
    </div>
  );
}; 