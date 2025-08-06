import { useState, useEffect } from 'react';
import { supabase } from '../../../../app/supabaseClient';

export const useFeedbackManagement = (testimonialStatus, featureRequestStatus) => {
  const [testimonials, setTestimonials] = useState([]);
  const [featureRequests, setFeatureRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchContent = async () => {
    setLoading(true);
    console.log(`Fetching content with testimonial status: ${testimonialStatus}, feature request status: ${featureRequestStatus}`);
    
    try {
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
        setTestimonials(testimonialsData || []);
      }

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
        
        // Fetch user profiles for feature requests
        if (requestsData && requestsData.length > 0) {
          const userIds = requestsData.map(r => r.user_id).filter(id => id);
          
          if (userIds.length > 0) {
            const { data: userProfiles, error: profileError } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .in('id', userIds);

            if (profileError) {
              console.error('Error fetching user profiles:', profileError);
            } else {
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

              setFeatureRequests(requestsWithProfiles);
            }
          } else {
            setFeatureRequests(requestsData);
          }
        } else {
          setFeatureRequests([]);
        }
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (type, id) => {
    setProcessing(true);
    setSuccessMessage('');

    try {
      const table = type === 'testimonial' ? 'user_testimonials' : 'feature_requests';
      const { error } = await supabase
        .from(table)
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) {
        console.error(`Error approving ${type}:`, error);
        setSuccessMessage(`Error approving ${type}`);
      } else {
        console.log(`${type} approved successfully`);
        setSuccessMessage(`${type} approved successfully`);
        fetchContent(); // Refresh the data
      }
    } catch (error) {
      console.error(`Error approving ${type}:`, error);
      setSuccessMessage(`Error approving ${type}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (type, id) => {
    setProcessing(true);
    setSuccessMessage('');

    try {
      const table = type === 'testimonial' ? 'user_testimonials' : 'feature_requests';
      const { error } = await supabase
        .from(table)
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) {
        console.error(`Error rejecting ${type}:`, error);
        setSuccessMessage(`Error rejecting ${type}`);
      } else {
        console.log(`${type} rejected successfully`);
        setSuccessMessage(`${type} rejected successfully`);
        fetchContent(); // Refresh the data
      }
    } catch (error) {
      console.error(`Error rejecting ${type}:`, error);
      setSuccessMessage(`Error rejecting ${type}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPending = async (type, id) => {
    setProcessing(true);
    setSuccessMessage('');

    try {
      const table = type === 'testimonial' ? 'user_testimonials' : 'feature_requests';
      const { error } = await supabase
        .from(table)
        .update({ status: 'pending' })
        .eq('id', id);

      if (error) {
        console.error(`Error marking ${type} as pending:`, error);
        setSuccessMessage(`Error marking ${type} as pending`);
      } else {
        console.log(`${type} marked as pending successfully`);
        setSuccessMessage(`${type} marked as pending successfully`);
        fetchContent(); // Refresh the data
      }
    } catch (error) {
      console.error(`Error marking ${type} as pending:`, error);
      setSuccessMessage(`Error marking ${type} as pending`);
    } finally {
      setProcessing(false);
    }
  };

  return {
    testimonials,
    featureRequests,
    loading,
    processing,
    successMessage,
    handleApprove,
    handleReject,
    handleMarkPending,
    fetchContent
  };
}; 