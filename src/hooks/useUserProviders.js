import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';

export default function useUserProviders() {
  const [userProviders, setUserProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingProvider, setAddingProvider] = useState(false);
  const [removingProvider, setRemovingProvider] = useState(null);

  // Fetch user's providers
  const fetchUserProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: providers, error: providersError } = await supabase
        .from('user_providers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (providersError) {
        throw new Error(providersError.message);
      }

      setUserProviders(providers || []);
    } catch (err) {
      console.error('Error fetching user providers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a provider to user's list
  const addUserProvider = async (provider) => {
    try {
      setAddingProvider(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { error: insertError } = await supabase
        .from('user_providers')
        .insert({
          user_id: user.id,
          provider_dhc: provider.dhc,
          provider_name: provider.name,
          provider_type: provider.type,
          provider_network: provider.network,
          provider_city: provider.city,
          provider_state: provider.state
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Refresh the list
      await fetchUserProviders();
    } catch (err) {
      console.error('Error adding user provider:', err);
      setError(err.message);
    } finally {
      setAddingProvider(false);
    }
  };

  // Remove a provider from user's list
  const removeUserProvider = async (providerDhc) => {
    try {
      setRemovingProvider(providerDhc);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { error: deleteError } = await supabase
        .from('user_providers')
        .delete()
        .eq('user_id', user.id)
        .eq('provider_dhc', providerDhc);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Update local state
      setUserProviders(prev => prev.filter(p => p.provider_dhc !== providerDhc));
    } catch (err) {
      console.error('Error removing user provider:', err);
      setError(err.message);
    } finally {
      setRemovingProvider(null);
    }
  };

  // Check if a provider is in user's list
  const isUserProvider = (providerDhc) => {
    return userProviders.some(p => p.provider_dhc === providerDhc);
  };

  // Get user provider by DHC
  const getUserProvider = (providerDhc) => {
    return userProviders.find(p => p.provider_dhc === providerDhc);
  };

  // Initialize on mount
  useEffect(() => {
    fetchUserProviders();
  }, []);

  return {
    userProviders,
    loading,
    error,
    addingProvider,
    removingProvider,
    addUserProvider,
    removeUserProvider,
    isUserProvider,
    getUserProvider,
    refreshUserProviders: fetchUserProviders
  };
} 