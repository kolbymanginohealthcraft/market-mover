import { useState, useEffect } from 'react';
import { supabase } from '../../app/supabaseClient';
import styles from './Feedback.module.css';

export default function Feedback() {
  const [featureRequests, setFeatureRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [newRequest, setNewRequest] = useState('');
  const [newRequestDescription, setNewRequestDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [consent, setConsent] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('feature-requests');
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  useEffect(() => {
    fetchFeatureRequests();
    fetchUserVotes();
  }, []);

  useEffect(() => {
    // Filter feature requests based on search term
    if (!searchTerm.trim()) {
      setFilteredRequests(featureRequests);
    } else {
      const filtered = featureRequests.filter(request =>
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.description && request.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRequests(filtered);
    }
  }, [searchTerm, featureRequests]);

  const fetchFeatureRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_requests')
        .select('*')
        .eq('status', 'approved')
        .order('votes', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching feature requests:', error);
        return;
      }

      setFeatureRequests(data || []);
    } catch (err) {
      console.error('Error fetching feature requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('feature_request_votes')
        .select('feature_request_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user votes:', error);
        return;
      }

      const votes = {};
      data.forEach(vote => {
        votes[vote.feature_request_id] = true;
      });
      setUserVotes(votes);
    } catch (err) {
      console.error('Error fetching user votes:', err);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!newRequest.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to submit a feature request');
        return;
      }

      const { data, error } = await supabase
        .from('feature_requests')
        .insert({
          title: newRequest.trim(),
          description: newRequestDescription.trim(),
          user_id: user.id,
          votes: 0,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting feature request:', error);
        alert('Failed to submit feature request');
        return;
      }

      setNewRequest('');
      setNewRequestDescription('');
      setShowSubmitForm(false);
      alert('Feature request submitted successfully! It will be reviewed by our team.');
    } catch (err) {
      console.error('Error submitting feature request:', err);
      alert('Failed to submit feature request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (requestId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to vote');
        return;
      }

      const hasVoted = userVotes[requestId];
      
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('feature_request_votes')
          .delete()
          .eq('feature_request_id', requestId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error removing vote:', error);
          return;
        }

        // Decrease vote count
        await supabase
          .from('feature_requests')
          .update({ votes: featureRequests.find(r => r.id === requestId).votes - 1 })
          .eq('id', requestId);

        setUserVotes(prev => {
          const newVotes = { ...prev };
          delete newVotes[requestId];
          return newVotes;
        });
      } else {
        // Add vote
        const { error } = await supabase
          .from('feature_request_votes')
          .insert({
            feature_request_id: requestId,
            user_id: user.id
          });

        if (error) {
          console.error('Error adding vote:', error);
          return;
        }

        // Increase vote count
        await supabase
          .from('feature_requests')
          .update({ votes: featureRequests.find(r => r.id === requestId).votes + 1 })
          .eq('id', requestId);

        setUserVotes(prev => ({
          ...prev,
          [requestId]: true
        }));
      }

      fetchFeatureRequests();
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleSubmitTestimonial = async () => {
    if (!testimonial.trim()) return;
    
    try {
      setTestimonialLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to submit a testimonial');
        return;
      }

      const { data, error } = await supabase
        .from('user_testimonials')
        .insert({
          user_id: user.id,
          content: testimonial.trim(),
          consent_to_feature: consent,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting testimonial:', error);
        alert('Failed to submit testimonial');
        return;
      }

      setTestimonialSubmitted(true);
      setTestimonial('');
      setConsent(false);
      
      // Reset success message after 3 seconds
      setTimeout(() => setTestimonialSubmitted(false), 3000);
    } catch (err) {
      console.error('Error submitting testimonial:', err);
      alert('Failed to submit testimonial');
    } finally {
      setTestimonialLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Feedback & Feature Requests</h1>
          <p>Help us improve Market Mover by suggesting features, voting on ideas, and sharing your experience.</p>
        </div>

        <div className={styles.content}>
          {/* Left Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.tabButton} ${activeTab === 'feature-requests' ? styles.active : ''}`}
                onClick={() => setActiveTab('feature-requests')}
              >
                <span className={styles.buttonIcon}>💡</span>
                <span className={styles.buttonText}>Feature Requests</span>
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'testimonials' ? styles.active : ''}`}
                onClick={() => setActiveTab('testimonials')}
              >
                <span className={styles.buttonIcon}>💬</span>
                <span className={styles.buttonText}>Share Experience</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={styles.mainContent}>
            {activeTab === 'feature-requests' && (
              <div className={styles.tabContent}>
                {/* Header with search and submit button */}
                <div className={styles.featureHeader}>
                  <div className={styles.searchSection}>
                    <input
                      type="text"
                      placeholder="Search feature requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                    />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className={styles.clearSearch}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <button
                    className={styles.submitNewButton}
                    onClick={() => setShowSubmitForm(!showSubmitForm)}
                  >
                    {showSubmitForm ? 'Cancel' : '+ Submit New Request'}
                  </button>
                </div>

                {/* Submit form (collapsible) */}
                {showSubmitForm && (
                  <div className={styles.submitSection}>
                    <h3>Submit a New Feature Request</h3>
                    <form onSubmit={handleSubmitRequest} className={styles.submitForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="title">Feature Title *</label>
                        <input
                          id="title"
                          type="text"
                          value={newRequest}
                          onChange={(e) => setNewRequest(e.target.value)}
                          placeholder="e.g., Dark mode support"
                          required
                          maxLength={100}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="description">Description (optional)</label>
                        <textarea
                          id="description"
                          value={newRequestDescription}
                          onChange={(e) => setNewRequestDescription(e.target.value)}
                          placeholder="Tell us more about this feature..."
                          rows={3}
                          maxLength={500}
                        />
                      </div>
                      <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={submitting || !newRequest.trim()}
                      >
                        {submitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Feature requests list */}
                <div className={styles.requestsSection}>
                  <h2>Feature Requests ({filteredRequests.length})</h2>
                  
                  {loading ? (
                    <div className={styles.loading}>Loading feature requests...</div>
                  ) : filteredRequests.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>
                        {searchTerm 
                          ? `No feature requests found for "${searchTerm}". Try a different search term.`
                          : 'No approved feature requests yet. Be the first to suggest something!'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className={styles.requestsList}>
                      {filteredRequests.map((request) => (
                        <div key={request.id} className={styles.requestCard}>
                          <div className={styles.requestHeader}>
                            <h3>{request.title}</h3>
                            <div className={styles.voteSection}>
                              <button
                                className={`${styles.voteButton} ${userVotes[request.id] ? styles.voted : ''}`}
                                onClick={() => handleVote(request.id)}
                              >
                                👍 {request.votes}
                              </button>
                            </div>
                          </div>
                          {request.description && (
                            <p className={styles.requestDescription}>{request.description}</p>
                          )}
                          <div className={styles.requestMeta}>
                            <span>Submitted {new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'testimonials' && (
              <div className={styles.tabContent}>
                <div className={styles.testimonialsSection}>
                  <h2>Share Your Experience</h2>
                  {testimonialSubmitted ? (
                    <div className={styles.successMessage}>
                      <p>Thanks for your feedback! Your testimonial will be reviewed by our team.</p>
                    </div>
                  ) : (
                    <div className={styles.testimonialForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="testimonial">Your Experience</label>
                        <textarea
                          id="testimonial"
                          value={testimonial}
                          onChange={(e) => setTestimonial(e.target.value)}
                          placeholder="Share how Market Mover has helped you..."
                          rows={6}
                          maxLength={500}
                        />
                      </div>
                      <div className={styles.consentGroup}>
                        <label className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                          />
                          You have my consent to feature this on your website.
                        </label>
                      </div>
                      <button 
                        className={styles.submitButton}
                        onClick={handleSubmitTestimonial}
                        disabled={testimonialLoading || !testimonial.trim()}
                      >
                        {testimonialLoading ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
} 