import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../app/supabaseClient';

export default function useUserActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchInProgress = useRef(false);

  // Fetch recent activities
  const fetchActivities = useCallback(async (limit = 10) => {
    // Prevent duplicate requests
    if (fetchInProgress.current) {
      console.log('🔍 Fetch already in progress, skipping...');
      return;
    }

    try {
      fetchInProgress.current = true;
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
        .limit(limit);

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
      fetchInProgress.current = false;
    }
  }, []);

  // Fetch more activities when needed
  const fetchMoreActivities = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20); // Fetch more activities

      if (error) {
        console.error('Error fetching more activities:', error);
        return;
      }
      
      console.log('✅ More activities fetched:', data?.length || 0, 'activities');
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching more activities:', err);
    }
  }, []);

  // Track a new activity
  const trackActivity = useCallback(async (activityType, targetId = null, targetName = null, metadata = {}) => {
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
  }, []);

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
  }, [fetchActivities]);

  // Delete a single activity
  const deleteActivity = useCallback(async (activityId) => {
    try {
      const { error } = await supabase
        .from('user_activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        console.error('Error deleting activity:', error);
        throw error;
      }

      // Update local state by removing the deleted activity
      setActivities(prev => {
        const newActivities = prev.filter(activity => activity.id !== activityId);
        
        // If we have less than 5 activities, fetch more
        if (newActivities.length < 5) {
          fetchMoreActivities();
        }
        
        return newActivities;
      });
      
      return true;
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError(err.message);
      return false;
    }
  }, [fetchMoreActivities]);

  // Delete all activities
  const deleteAllActivities = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_activities')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting all activities:', error);
        throw error;
      }

      // Clear local state
      setActivities([]);
      
      return true;
    } catch (err) {
      console.error('Error deleting all activities:', err);
      setError(err.message);
      return false;
    }
  }, []);

  return {
    activities,
    loading,
    error,
    trackActivity,
    deleteActivity,
    deleteAllActivities,
    refetch: fetchActivities,
    fetchMore: fetchMoreActivities
  };
} 