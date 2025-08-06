import React from 'react';
import styles from './FeedbackTabs.module.css';

export const FeedbackTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'feature-requests', label: 'Feature Requests' }
  ];

  return (
    <div className={styles.tabsContainer}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}; 