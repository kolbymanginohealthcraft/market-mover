import React from 'react';
import { TestimonialCard } from './TestimonialCard';
import { StatusFilter } from './StatusFilter';
import styles from './TestimonialsPanel.module.css';

export const TestimonialsPanel = ({
  testimonials,
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
          <p>Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Testimonials</h2>
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
        {testimonials.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No testimonials found with status: {status}</p>
          </div>
        ) : (
          <div className={styles.testimonialsList}>
            {testimonials.map(testimonial => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                processing={processing}
                onApprove={() => onApprove(testimonial.id)}
                onReject={() => onReject(testimonial.id)}
                onMarkPending={() => onMarkPending(testimonial.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 