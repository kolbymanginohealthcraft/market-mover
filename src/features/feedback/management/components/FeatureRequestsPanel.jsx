import React from 'react';
import { FeatureRequestCard } from './FeatureRequestCard';
import { StatusFilter } from './StatusFilter';
import styles from './FeatureRequestsPanel.module.css';

export const FeatureRequestsPanel = ({
  featureRequests,
  loading,
  processing,
  status,
  setStatus,
  onApprove,
  onReject,
  onMarkPending
}) => {
  if (loading) {
    return (
      <div className={styles.panel}>
        <div className={styles.loading}>
          <p>Loading feature requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Feature Requests</h2>
        <StatusFilter 
          status={status}
          setStatus={setStatus}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' }
          ]}
        />
      </div>

      <div className={styles.content}>
        {featureRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No feature requests found with status: {status}</p>
          </div>
        ) : (
          <div className={styles.featureRequestsList}>
            {featureRequests.map(request => (
              <FeatureRequestCard
                key={request.id}
                request={request}
                processing={processing}
                onApprove={() => onApprove(request.id)}
                onReject={() => onReject(request.id)}
                onMarkPending={() => onMarkPending(request.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 