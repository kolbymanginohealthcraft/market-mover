import { useState } from 'react';
import styles from './TestimonialPanel.module.css';

export default function TestimonialPanel({ onSubmitTestimonial, loading }) {
  const [testimonial, setTestimonial] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!testimonial.trim()) return;
    
    try {
      await onSubmitTestimonial(testimonial, consent);
      setSubmitted(true);
      setTestimonial('');
      setConsent(false);
    } catch (error) {
      console.error('Error submitting testimonial:', error);
    }
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.sectionTitle}>💬 Leave a Comment</h3>
      {submitted ? (
        <p className={styles.thankYou}>Thanks for your feedback!</p>
      ) : (
        <>
          <textarea
            className={styles.textarea}
            placeholder="Share how Market Mover has helped you..."
            value={testimonial}
            onChange={(e) => setTestimonial(e.target.value)}
          />
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            You have my consent to feature this on your website.
          </label>
          <button 
            className={styles.submitButton} 
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </>
      )}
    </div>
  );
} 