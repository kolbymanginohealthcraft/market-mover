import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';

export default function useUserActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch recent activities
  const fetchActivities = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching user activities...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user for activity fetch');
        return;
      }

      console.log('✅ User authenticated for activity fetch:', user.id);

      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        // If table doesn't exist yet, just return empty array
        if (error.code === '42P01') { // Table doesn't exist
          console.log('❌ user_activities table not found, returning empty array');
          setActivities([]);
          return;
        }
        throw error;
      }
      
      console.log('✅ Activities fetched:', data?.length || 0, 'activities');
      setActivities(data || []);
    } catch (err) {
      console.error('❌ Error fetching activities:', err);
      setError(err.message);
      setActivities([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  // Track a new activity
  const trackActivity = async (activityType, targetId = null, targetName = null, metadata = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_activities')
        .insert({
          activity_type: activityType,
          target_id: targetId,
          target_name: targetName,
          metadata
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, just log and continue
        if (error.code === '42P01') {
          console.log('user_activities table not found, skipping activity tracking');
          return null;
        }
        throw error;
      }

      // Update local state
      setActivities(prev => [data, ...prev.slice(0, 9)]);
      
      return data;
    } catch (err) {
      console.error('Error tracking activity:', err);
      setError(err.message);
      return null;
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('user_activities')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'user_activities',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            setActivities(prev => [payload.new, ...prev.slice(0, 9)]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, []);

  return {
    activities,
    loading,
    error,
    trackActivity,
    refetch: fetchActivities
  };
} 