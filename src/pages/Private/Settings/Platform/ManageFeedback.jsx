import { useState, useEffect } from 'react';
import { supabase } from '../../../../app/supabaseClient';
import Button from '../../../../components/Buttons/Button';
import styles from './ManageFeedback.module.css';
import { useUser } from '../../../../components/Context/UserContext';

export default function ManageFeedback() {
  const { user, profile, permissions, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState('testimonials');
  const [testimonials, setTestimonials] = useState([]);
  const [featureRequests, setFeatureRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [testimonialStatus, setTestimonialStatus] = useState('pending');
  const [featureRequestStatus, setFeatureRequestStatus] = useState('pending');

  const isAdmin = permissions.canAccessPlatform;

  useEffect(() => {
    if (isAdmin) {
      fetchContent();
    }
  }, [isAdmin, testimonialStatus, featureRequestStatus]);

  const fetchContent = async () => {
    setLoading(true);
    console.log(`Fetching content with testimonial status: ${testimonialStatus}, feature request status: ${featureRequestStatus}`);
    
    try {
      // Fetch feature requests with selected status
      console.log('Fetching feature requests...');
      const { data: requestsData, error: requestsError } = await supabase
        .from('feature_requests')
        .select('*')
        .eq('status', featureRequestStatus);

      if (requestsError) {
        console.error('Error fetching feature requests:', requestsError);
        setFeatureRequests([]);
      } else {
        console.log('Feature requests found:', requestsData?.length || 0);
        console.log('Sample request data:', requestsData?.[0]);
        
        // Now fetch user profiles for these requests
        if (requestsData && requestsData.length > 0) {
          const userIds = requestsData.map(r => r.user_id).filter(id => id);
          console.log('User IDs for feature requests:', userIds);
          
          if (userIds.length > 0) {
            const { data: userProfiles, error: profileError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .in('id', userIds);

            if (profileError) {
              console.error('Error fetching user profiles:', profileError);
            } else {
              console.log('User profiles found:', userProfiles?.length || 0);
              
              // Create a map of user profiles
              const profilesMap = {};
              userProfiles?.forEach(profile => {
                profilesMap[profile.id] = profile;
              });

              // Combine feature requests with user profiles
              const requestsWithProfiles = requestsData.map(request => ({
                ...request,
                profiles: profilesMap[request.user_id] || null
              }));

              console.log('Combined feature requests:', requestsWithProfiles);
              setFeatureRequests(requestsWithProfiles);
            }
          } else {
            setFeatureRequests(requestsData);
          }
        } else {
          setFeatureRequests(requestsData || []);
        }
      }

      // Fetch testimonials with selected status
      console.log('Fetching testimonials...');
      const { data: testimonialsData, error: testimonialsError } = await supabase
        .from('user_testimonials')
        .select('*')
        .eq('status', testimonialStatus);

      if (testimonialsError) {
        console.error('Error fetching testimonials:', testimonialsError);
        setTestimonials([]);
      } else {
        console.log('Testimonials found:', testimonialsData?.length || 0);
        console.log('Sample testimonial data:', testimonialsData?.[0]);
        
        // Now fetch user profiles for these testimonials
        if (testimonialsData && testimonialsData.length > 0) {
          const userIds = testimonialsData.map(t => t.user_id).filter(id => id);
          console.log('User IDs for testimonials:', userIds);
          
          if (userIds.length > 0) {
            const { data: userProfiles, error: profileError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .in('id', userIds);

            if (profileError) {
              console.error('Error fetching user profiles:', profileError);
            } else {
              console.log('User profiles found:', userProfiles?.length || 0);
              
              // Create a map of user profiles
              const profilesMap = {};
              userProfiles?.forEach(profile => {
                profilesMap[profile.id] = profile;
              });

              // Combine testimonials with user profiles
              const testimonialsWithProfiles = testimonialsData.map(testimonial => ({
                ...testimonial,
                profiles: profilesMap[testimonial.user_id] || null
              }));

              console.log('Combined testimonials:', testimonialsWithProfiles);
              setTestimonials(testimonialsWithProfiles);
            }
          } else {
            setTestimonials(testimonialsData);
          }
        } else {
          setTestimonials(testimonialsData || []);
        }
      }

    } catch (err) {
      console.error('Error fetching pending content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (type, id) => {
    setProcessing(true);
    try {
      const table = type === 'testimonial' ? 'user_testimonials' : 'feature_requests';
      console.log(`Attempting to approve ${type} with ID ${id} in table ${table}`);
      
      // First check if we're an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user logged in');
        alert('You must be logged in to approve content');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_system_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        alert('Error checking admin status');
        return;
      }

      if (!profile?.is_system_admin) {
        console.error('User is not an admin');
        alert('You must be an admin to approve content');
        return;
      }

      console.log('User is admin, proceeding with approval...');
      
      const { data, error } = await supabase
        .from(table)
        .update({ status: 'approved' })
        .eq('id', id)
        .select();

      if (error) {
        console.error(`Error approving ${type}:`, error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Failed to approve ${type}: ${error.message}`);
        return;
      }

      console.log(`Successfully approved ${type}:`, data);
      setSuccessMessage(`${type} approved successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh the data
      fetchContent();
    } catch (err) {
      console.error(`Error approving ${type}:`, err);
      alert(`Failed to approve ${type}: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (type, id) => {
    setProcessing(true);
    try {
      const table = type === 'testimonial' ? 'user_testimonials' : 'feature_requests';
      console.log(`Attempting to reject ${type} with ID ${id} in table ${table}`);
      
      // First check if we're an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user logged in');
        alert('You must be logged in to reject content');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_system_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        alert('Error checking admin status');
        return;
      }

      if (!profile?.is_system_admin) {
        console.error('User is not an admin');
        alert('You must be an admin to reject content');
        return;
      }

      console.log('User is admin, proceeding with rejection...');
      
      const { data, error } = await supabase
        .from(table)
        .update({ status: 'rejected' })
        .eq('id', id)
        .select();

      if (error) {
        console.error(`Error rejecting ${type}:`, error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Failed to reject ${type}: ${error.message}`);
        return;
      }

      console.log(`Successfully rejected ${type}:`, data);
      setSuccessMessage(`${type} rejected successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh the data
      fetchContent();
    } catch (err) {
      console.error(`Error rejecting ${type}:`, err);
      alert(`Failed to reject ${type}: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPending = async (type, id) => {
    setProcessing(true);
    try {
      const table = type === 'testimonial' ? 'user_testimonials' : 'feature_requests';
      const { error } = await supabase
        .from(table)
        .update({ status: 'pending' })
        .eq('id', id);
      if (error) {
        alert('Failed to mark as pending');
        return;
      }
      setSuccessMessage(`${type} marked as pending!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchContent();
    } catch (err) {
      alert('Failed to mark as pending');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <h1>Access Denied</h1>
        <p>You must be logged in to access this page.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Feedback Management</h1>
          <p>Review and approve testimonials and feature requests</p>
        </div>
        
        {successMessage && (
          <div className={styles.successMessage}>
            ✅ {successMessage}
          </div>
        )}

        <div className={styles.content}>
          {/* Left Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.buttonGroup}>
              <button
                className={`${styles.tabButton} ${activeTab === 'testimonials' ? styles.active : ''}`}
                onClick={() => setActiveTab('testimonials')}
              >
                <span className={styles.buttonIcon}>💬</span>
                <span className={styles.buttonText}>Testimonials ({testimonials.length})</span>
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'feature-requests' ? styles.active : ''}`}
                onClick={() => setActiveTab('feature-requests')}
              >
                <span className={styles.buttonIcon}>💡</span>
                <span className={styles.buttonText}>Feature Requests ({featureRequests.length})</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={styles.mainContent}>
            {loading ? (
              <div className={styles.loading}>
                {activeTab === 'testimonials'
                  ? `Loading ${testimonialStatus} testimonials...`
                  : `Loading ${featureRequestStatus} feature requests...`}
              </div>
            ) : (
              <div className={styles.tabContent}>
                                {activeTab === 'testimonials' && (
                  <div className={styles.testimonialsSection}>
                    <h2>Testimonials</h2>
                    <div className={styles.statusFilterRow}>
                      <span>Status:</span>
                      <button
                        className={testimonialStatus === 'pending' ? styles.statusActive : styles.statusButton}
                        onClick={() => setTestimonialStatus('pending')}
                      >Pending</button>
                      <button
                        className={testimonialStatus === 'approved' ? styles.statusActive : styles.statusButton}
                        onClick={() => setTestimonialStatus('approved')}
                      >Approved</button>
                      <button
                        className={testimonialStatus === 'rejected' ? styles.statusActive : styles.statusButton}
                        onClick={() => setTestimonialStatus('rejected')}
                      >Rejected</button>
                    </div>
                    {testimonials.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>No pending testimonials to review.</p>
                      </div>
                    ) : (
                      <div className={styles.tableContainer}>
                        <table className={styles.dataTable}>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Date Submitted</th>
                              <th>Content</th>
                              <th>Consent</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {testimonials.map((testimonial) => (
                              <tr key={testimonial.id}>
                                <td className={styles.nameCell}>
                                  {testimonial.profiles?.first_name} {testimonial.profiles?.last_name}
                                </td>
                                <td className={styles.emailCell}>{testimonial.profiles?.email}</td>
                                <td className={styles.dateCell}>
                                  {new Date(testimonial.created_at).toLocaleDateString()}
                                </td>
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
                                <td className={styles.actionsCell}>
                                  <div className={styles.actionButtons}>
                                    {testimonialStatus === 'pending' && <>
                                      <Button
                                        variant="green"
                                        size="sm"
                                        onClick={() => handleApprove('testimonial', testimonial.id)}
                                        disabled={processing}
                                      >
                                        ✅ Approve
                                      </Button>
                                      <Button
                                        variant="red"
                                        size="sm"
                                        onClick={() => handleReject('testimonial', testimonial.id)}
                                        disabled={processing}
                                      >
                                        ❌ Reject
                                      </Button>
                                    </>}
                                    {testimonialStatus === 'approved' && <>
                                      <Button
                                        variant="red"
                                        size="sm"
                                        onClick={() => handleReject('testimonial', testimonial.id)}
                                        disabled={processing}
                                      >
                                        ❌ Reject
                                      </Button>
                                      <Button
                                        variant="gray"
                                        size="sm"
                                        onClick={() => handleMarkPending('testimonial', testimonial.id)}
                                        disabled={processing}
                                      >
                                        ⏳ Mark Pending
                                      </Button>
                                    </>}
                                    {testimonialStatus === 'rejected' && <>
                                      <Button
                                        variant="green"
                                        size="sm"
                                        onClick={() => handleApprove('testimonial', testimonial.id)}
                                        disabled={processing}
                                      >
                                        ✅ Approve
                                      </Button>
                                      <Button
                                        variant="gray"
                                        size="sm"
                                        onClick={() => handleMarkPending('testimonial', testimonial.id)}
                                        disabled={processing}
                                      >
                                        ⏳ Mark Pending
                                      </Button>
                                    </>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                                {activeTab === 'feature-requests' && (
                  <div className={styles.featureRequestsSection}>
                    <h2>Feature Requests</h2>
                    <div className={styles.statusFilterRow}>
                      <span>Status:</span>
                      <button
                        className={featureRequestStatus === 'pending' ? styles.statusActive : styles.statusButton}
                        onClick={() => setFeatureRequestStatus('pending')}
                      >Pending</button>
                      <button
                        className={featureRequestStatus === 'approved' ? styles.statusActive : styles.statusButton}
                        onClick={() => setFeatureRequestStatus('approved')}
                      >Approved</button>
                      <button
                        className={featureRequestStatus === 'rejected' ? styles.statusActive : styles.statusButton}
                        onClick={() => setFeatureRequestStatus('rejected')}
                      >Rejected</button>
                    </div>
                    {featureRequests.length === 0 ? (
                      <div className={styles.emptyState}>
                        <p>No pending feature requests to review.</p>
                      </div>
                    ) : (
                      <div className={styles.tableContainer}>
                        <table className={styles.dataTable}>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Date Submitted</th>
                              <th>Title</th>
                              <th>Description</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {featureRequests.map((request) => (
                              <tr key={request.id}>
                                <td className={styles.nameCell}>
                                  {request.profiles?.first_name} {request.profiles?.last_name}
                                </td>
                                <td className={styles.emailCell}>{request.profiles?.email}</td>
                                <td className={styles.dateCell}>
                                  {new Date(request.created_at).toLocaleDateString()}
                                </td>
                                <td className={styles.titleCell}>
                                  {request.title}
                                </td>
                                <td className={styles.descriptionCell}>
                                  <div className={styles.contentPreview}>
                                    {request.description && request.description.length > 100 
                                      ? `${request.description.substring(0, 100)}...` 
                                      : request.description || 'No description'}
                                  </div>
                                </td>
                                <td className={styles.actionsCell}>
                                  <div className={styles.actionButtons}>
                                    {featureRequestStatus === 'pending' && <>
                                      <Button
                                        variant="green"
                                        size="sm"
                                        onClick={() => handleApprove('feature-request', request.id)}
                                        disabled={processing}
                                      >
                                        ✅ Approve
                                      </Button>
                                      <Button
                                        variant="red"
                                        size="sm"
                                        onClick={() => handleReject('feature-request', request.id)}
                                        disabled={processing}
                                      >
                                        ❌ Reject
                                      </Button>
                                    </>}
                                    {featureRequestStatus === 'approved' && <>
                                      <Button
                                        variant="red"
                                        size="sm"
                                        onClick={() => handleReject('feature-request', request.id)}
                                        disabled={processing}
                                      >
                                        ❌ Reject
                                      </Button>
                                      <Button
                                        variant="gray"
                                        size="sm"
                                        onClick={() => handleMarkPending('feature-request', request.id)}
                                        disabled={processing}
                                      >
                                        ⏳ Mark Pending
                                      </Button>
                                    </>}
                                    {featureRequestStatus === 'rejected' && <>
                                      <Button
                                        variant="green"
                                        size="sm"
                                        onClick={() => handleApprove('feature-request', request.id)}
                                        disabled={processing}
                                      >
                                        ✅ Approve
                                      </Button>
                                      <Button
                                        variant="gray"
                                        size="sm"
                                        onClick={() => handleMarkPending('feature-request', request.id)}
                                        disabled={processing}
                                      >
                                        ⏳ Mark Pending
                                      </Button>
                                    </>}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
} 