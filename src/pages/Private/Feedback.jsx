import { useState, useEffect } from 'react';
import { supabase } from '../../app/supabaseClient';
import styles from './Feedback.module.css';
import SidePanel from '../../components/Overlays/SidePanel';

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
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState({ featureRequests: [], testimonials: [] });
  const [userSubmissionsLoading, setUserSubmissionsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'votes', direction: 'desc' });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchFeatureRequests();
    fetchUserVotes();
    fetchUserSubmissions();
  }, []);

  useEffect(() => {
    // Filter and sort feature requests
    let filtered = featureRequests;
    
    if (searchTerm.trim()) {
      filtered = featureRequests.filter(request =>
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.description && request.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Handle date sorting
      if (sortConfig.key === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      // Handle string sorting
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredRequests(sorted);
  }, [searchTerm, featureRequests, sortConfig]);

  const fetchFeatureRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_requests_with_votes')
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
      setShowSidePanel(false);
      setSubmitSuccess(true);
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('Error submitting feature request:', err);
      alert('Failed to submit feature request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
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

        // Vote count will be updated automatically via the view

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

        // Vote count will be updated automatically via the view

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

  const fetchUserSubmissions = async () => {
    setUserSubmissionsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's feature requests with vote counts
      const { data: userRequests, error: requestsError } = await supabase
        .from('feature_requests_with_votes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching user feature requests:', requestsError);
      }

      // Fetch user's testimonials
      const { data: userTestimonials, error: testimonialsError } = await supabase
        .from('user_testimonials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (testimonialsError) {
        console.error('Error fetching user testimonials:', testimonialsError);
      }

      setUserSubmissions({
        featureRequests: userRequests || [],
        testimonials: userTestimonials || []
      });
    } catch (err) {
      console.error('Error fetching user submissions:', err);
    } finally {
      setUserSubmissionsLoading(false);
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
              <button
                className={`${styles.tabButton} ${activeTab === 'my-submissions' ? styles.active : ''}`}
                onClick={() => setActiveTab('my-submissions')}
              >
                <span className={styles.buttonIcon}>📋</span>
                <span className={styles.buttonText}>My Submissions</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={styles.mainContent}>
            {activeTab === 'feature-requests' && (
              <div className={styles.tabContent}>



                {/* Success message */}
                {submitSuccess && (
                  <div className={styles.successMessage}>
                    <p>✅ Feature request submitted successfully! It will be reviewed by our team.</p>
                  </div>
                )}

                {/* Feature requests list */}
                <div className={styles.requestsSection}>
                  <div className={styles.requestsHeader}>
                    <h2>Feature Requests ({filteredRequests.length})</h2>
                    <div className={styles.requestsControls}>
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
                        onClick={() => setShowSidePanel(true)}
                      >
                        + Submit New Request
                      </button>
                    </div>
                  </div>
                  
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
                    <div className={styles.tableContainer}>
                      <table className={styles.dataTable}>
                        <thead>
                          <tr>
                            <th 
                              className={styles.sortableHeader}
                              onClick={() => handleSort('title')}
                            >
                              Title
                              {sortConfig.key === 'title' && (
                                <span className={styles.sortIndicator}>
                                  {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                                </span>
                              )}
                            </th>
                            <th 
                              className={styles.sortableHeader}
                              onClick={() => handleSort('description')}
                            >
                              Description
                              {sortConfig.key === 'description' && (
                                <span className={styles.sortIndicator}>
                                  {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                                </span>
                              )}
                            </th>
                            <th 
                              className={styles.sortableHeader}
                              onClick={() => handleSort('votes')}
                            >
                              Votes
                              {sortConfig.key === 'votes' && (
                                <span className={styles.sortIndicator}>
                                  {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                                </span>
                              )}
                            </th>
                            <th 
                              className={styles.sortableHeader}
                              onClick={() => handleSort('created_at')}
                            >
                              Submit Date
                              {sortConfig.key === 'created_at' && (
                                <span className={styles.sortIndicator}>
                                  {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                                </span>
                              )}
                            </th>

                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((request) => (
                            <tr key={request.id}>
                              <td className={styles.titleCell}>{request.title}</td>
                              <td className={styles.descriptionCell}>
                                <div className={styles.contentPreview}>
                                  {request.description && request.description.length > 100 
                                    ? `${request.description.substring(0, 100)}...` 
                                    : request.description || 'No description'}
                                </div>
                              </td>
                              <td className={styles.votesCell}>
                                <button
                                  className={`${styles.voteButton} ${userVotes[request.id] ? styles.voted : ''}`}
                                  onClick={() => handleVote(request.id)}
                                >
                                  👍 {request.votes}
                                </button>
                              </td>
                              <td className={styles.dateCell}>
                                {new Date(request.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

            {activeTab === 'my-submissions' && (
              <div className={styles.tabContent}>
                <div className={styles.userDashboardSection}>
                  <h2>My Submissions</h2>
                  
                  {userSubmissionsLoading ? (
                    <div className={styles.loading}>Loading your submissions...</div>
                  ) : (
                    <div className={styles.dashboardContent}>
                      {/* Feature Requests Section */}
                      <div className={styles.submissionsSection}>
                        <h3>My Feature Requests ({userSubmissions.featureRequests.length})</h3>
                        {userSubmissions.featureRequests.length === 0 ? (
                          <div className={styles.emptyState}>
                            <p>You haven't submitted any feature requests yet.</p>
                          </div>
                        ) : (
                          <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                              <thead>
                                <tr>
                                  <th>Title</th>
                                  <th>Description</th>
                                  <th>Status</th>
                                  <th>Votes</th>
                                  <th>Submitted</th>
                                </tr>
                              </thead>
                              <tbody>
                                {userSubmissions.featureRequests.map((request) => (
                                  <tr key={request.id}>
                                    <td className={styles.titleCell}>{request.title}</td>
                                    <td className={styles.descriptionCell}>
                                      <div className={styles.contentPreview}>
                                        {request.description && request.description.length > 100 
                                          ? `${request.description.substring(0, 100)}...` 
                                          : request.description || 'No description'}
                                      </div>
                                    </td>
                                    <td className={styles.statusCell}>
                                      <span className={`${styles.statusBadge} ${styles[`status${request.status}`]}`}>
                                        {request.status === 'pending' && '⏳ Pending'}
                                        {request.status === 'approved' && '✅ Approved'}
                                        {request.status === 'rejected' && '❌ Rejected'}
                                      </span>
                                    </td>
                                    <td className={styles.votesCell}>{request.votes}</td>
                                    <td className={styles.dateCell}>
                                      {new Date(request.created_at).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Testimonials Section */}
                      <div className={styles.submissionsSection}>
                        <h3>My Testimonials ({userSubmissions.testimonials.length})</h3>
                        {userSubmissions.testimonials.length === 0 ? (
                          <div className={styles.emptyState}>
                            <p>You haven't submitted any testimonials yet.</p>
                          </div>
                        ) : (
                          <div className={styles.tableContainer}>
                            <table className={styles.dataTable}>
                              <thead>
                                <tr>
                                  <th>Content</th>
                                  <th>Consent</th>
                                  <th>Status</th>
                                  <th>Submitted</th>
                                </tr>
                              </thead>
                              <tbody>
                                {userSubmissions.testimonials.map((testimonial) => (
                                  <tr key={testimonial.id}>
                                    <td className={styles.contentCell}>
                                      <div className={styles.contentPreview}>
                                        {testimonial.content.length > 100 
                                          ? `${testimonial.content.substring(0, 100)}...` 
                                          : testimonial.content}
                                      </div>
                                    </td>
                                    <td className={styles.consentCell}>
                                      {testimonial.consent_to_feature ? (
                                        <span className={styles.consentBadge}>✅ Yes</span>
                                      ) : (
                                        <span className={styles.noConsentBadge}>❌ No</span>
                                      )}
                                    </td>
                                    <td className={styles.statusCell}>
                                      <span className={`${styles.statusBadge} ${styles[`status${testimonial.status}`]}`}>
                                        {testimonial.status === 'pending' && '⏳ Pending'}
                                        {testimonial.status === 'approved' && '✅ Approved'}
                                        {testimonial.status === 'rejected' && '❌ Rejected'}
                                      </span>
                                    </td>
                                    <td className={styles.dateCell}>
                                      {new Date(testimonial.created_at).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Side Panel for submitting new feature requests */}
      <SidePanel
        isOpen={showSidePanel}
        onClose={() => setShowSidePanel(false)}
        title="Submit New Feature Request"
      >
        <form onSubmit={handleSubmitRequest} className={styles.submitForm}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Feature Title *</label>
            <input
              id="title"
              type="text"
              value={newRequest}
              onChange={(e) => setNewRequest(e.target.value)}
              placeholder="Enter feature title..."
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
      </SidePanel>
    </div>
  );
} 