import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';

export default function useUserProgress() {
  const [progress, setProgress] = useState({});
  const [streaks, setStreaks] = useState({});
  const [roi, setRoi] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user progress
  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        // If table doesn't exist, just set empty progress
        if (error.code === '42P01') { // Table doesn't exist
          console.log('user_progress table not found, using empty progress');
          setProgress({});
          return;
        }
        throw error;
      }

      const progressData = {};
      (data || []).forEach(item => {
        progressData[item.progress_type] = {
          current: item.current_value,
          target: item.target_value,
          percentage: Math.round((item.current_value / item.target_value) * 100)
        };
      });

      setProgress(progressData);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err.message);
      setProgress({}); // Fallback to empty progress
    }
  };

  // Fetch user streaks
  const fetchStreaks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        // If table doesn't exist, just set empty streaks
        if (error.code === '42P01') { // Table doesn't exist
          console.log('user_streaks table not found, using empty streaks');
          setStreaks({});
          return;
        }
        throw error;
      }

      const streaksData = {};
      (data || []).forEach(item => {
        streaksData[item.streak_type] = {
          current: item.current_streak,
          longest: item.longest_streak,
          lastActivity: item.last_activity_date
        };
      });

      setStreaks(streaksData);
    } catch (err) {
      console.error('Error fetching streaks:', err);
      setError(err.message);
      setStreaks({}); // Fallback to empty streaks
    }
  };

  // Fetch ROI data for current month
  const fetchROI = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const { data, error } = await supabase
        .from('user_roi')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', currentMonth)
        .single();

      if (error) {
        // If table doesn't exist or no data found, use defaults
        if (error.code === '42P01' || error.code === 'PGRST116') {
          console.log('user_roi table not found or no data, using defaults');
          setRoi({
            hours_saved: 0,
            value_unlocked: 0,
            reports_generated: 0,
            markets_explored: 0
          });
          return;
        }
        throw error;
      }

      setRoi(data || {
        hours_saved: 0,
        value_unlocked: 0,
        reports_generated: 0,
        markets_explored: 0
      });
    } catch (err) {
      console.error('Error fetching ROI:', err);
      setError(err.message);
      setRoi({
        hours_saved: 0,
        value_unlocked: 0,
        reports_generated: 0,
        markets_explored: 0
      });
    }
  };

  // Update progress for a specific type
  const updateProgress = async (progressType, newValue) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          progress_type: progressType,
          current_value: newValue,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // If table doesn't exist, just return
        if (error.code === '42P01') {
          console.log('user_progress table not found, skipping update');
          return null;
        }
        throw error;
      }

      // Update local state
      setProgress(prev => ({
        ...prev,
        [progressType]: {
          current: data.current_value,
          target: data.target_value,
          percentage: Math.round((data.current_value / data.target_value) * 100)
        }
      }));

      return data;
    } catch (err) {
      console.error('Error updating progress:', err);
      setError(err.message);
    }
  };

  // Initialize progress if it doesn't exist
  const initializeProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const progressTypes = ['profile_completion', 'tools_explored', 'markets_saved'];
      
      for (const type of progressTypes) {
        const { data: existing } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('progress_type', type)
          .single();

        if (!existing) {
          await supabase
            .from('user_progress')
            .insert({
              user_id: user.id,
              progress_type: type,
              current_value: 0,
              target_value: 100
            });
        }
      }
    } catch (err) {
      // If table doesn't exist, just skip initialization
      if (err.code === '42P01') {
        console.log('user_progress table not found, skipping initialization');
        return;
      }
      console.error('Error initializing progress:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await initializeProgress();
        await Promise.all([
          fetchProgress(),
          fetchStreaks(),
          fetchROI()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return {
    progress,
    streaks,
    roi,
    loading,
    error,
    updateProgress,
    refetch: () => {
      fetchProgress();
      fetchStreaks();
      fetchROI();
    }
  };
} 