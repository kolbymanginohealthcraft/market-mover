import React, { useState, useEffect } from 'react';
import { FeedbackTabs } from './components/FeedbackTabs';
import { TestimonialsPanel } from './components/TestimonialsPanel';
import { FeatureRequestsPanel } from './components/FeatureRequestsPanel';
import { useFeedbackManagement } from './hooks/useFeedbackManagement';
import { useAdminAuth } from './hooks/useAdminAuth';
import styles from './ManageFeedback.module.css';

export default function ManageFeedback() {
  const [activeTab, setActiveTab] = useState('testimonials');
  const [testimonialStatus, setTestimonialStatus] = useState('pending');
  const [featureRequestStatus, setFeatureRequestStatus] = useState('pending');

  // Custom hooks for different concerns
  const { user, isAdmin, loading: authLoading } = useAdminAuth();
  const {
    testimonials,
    featureRequests,
    loading,
    processing,
    successMessage,
    handleApprove,
    handleReject,
    handleMarkPending,
    fetchContent
  } = useFeedbackManagement(testimonialStatus, featureRequestStatus);

  useEffect(() => {
    if (isAdmin) {
      fetchContent();
    }
  }, [isAdmin, testimonialStatus, featureRequestStatus]);

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Feedback Management</h1>
        <p>Review and manage user testimonials and feature requests</p>
      </div>

      <FeedbackTabs 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className={styles.content}>
        {activeTab === 'testimonials' && (
          <TestimonialsPanel
            testimonials={testimonials}
            loading={loading}
            processing={processing}
            status={testimonialStatus}
            setStatus={setTestimonialStatus}
            onApprove={(id) => handleApprove('testimonial', id)}
            onReject={(id) => handleReject('testimonial', id)}
            onMarkPending={(id) => handleMarkPending('testimonial', id)}
          />
        )}

        {activeTab === 'feature-requests' && (
          <FeatureRequestsPanel
            featureRequests={featureRequests}
            loading={loading}
            processing={processing}
            status={featureRequestStatus}
            setStatus={setFeatureRequestStatus}
            onApprove={(id) => handleApprove('feature-request', id)}
            onReject={(id) => handleReject('feature-request', id)}
            onMarkPending={(id) => handleMarkPending('feature-request', id)}
          />
        )}
      </div>

      {successMessage && (
        <div className={styles.successMessage}>
          {successMessage}
        </div>
      )}
    </div>
  );
} 