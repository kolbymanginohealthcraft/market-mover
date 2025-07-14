import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';

export default function useTestimonials() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch system announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_announcements')
        .select('*')
        .eq('is_active', true)
        .order('announcement_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit a testimonial
  const submitTestimonial = async (content, consentToFeature = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_testimonials')
        .insert({
          user_id: user.id,
          content,
          consent_to_feature: consentToFeature,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error submitting testimonial:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return {
    announcements,
    loading,
    error,
    submitTestimonial,
    refetch: fetchAnnouncements
  };
} 