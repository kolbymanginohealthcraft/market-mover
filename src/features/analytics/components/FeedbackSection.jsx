import React from 'react';
import { FeedbackCard } from './FeedbackCard';
import styles from './FeedbackSection.module.css';

export const FeedbackSection = ({ analytics, formatNumber }) => {
  return (
    <div className={styles.section}>
      <h2>💬 Feedback & Requests</h2>
      <div className={styles.feedbackGrid}>
        <FeedbackCard
          title="Testimonials"
          stats={analytics.feedback.testimonials}
        />
        <FeedbackCard
          title="Feature Requests"
          stats={analytics.feedback.featureRequests}
        />
      </div>
    </div>
  );
}; 