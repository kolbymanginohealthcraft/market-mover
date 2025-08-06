import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';

export default function useTeamProviders() {
  const [teamProviders, setTeamProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingProviders, setAddingProviders] = useState(false);
  const [removingProvider, setRemovingProvider] = useState(null);

  // Fetch team's providers
  const fetchTeamProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get user's team_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.team_id) {
        throw new Error('User not part of a team');
      }

      const { data: providers, error: providersError } = await supabase
        .from('team_providers')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (providersError) {
        throw new Error(providersError.message);
      }

      setTeamProviders(providers || []);
    } catch (err) {
      console.error('Error fetching team providers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add providers to team's list
  const addTeamProviders = async (providers) => {
    try {
      setAddingProviders(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get user's team_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.team_id) {
        throw new Error('User not part of a team');
      }

      // Prepare providers for insertion
      const providersToInsert = providers.map(provider => ({
        team_id: profile.team_id,
        provider_dhc: provider.dhc,
        provider_name: provider.name,
        provider_type: provider.type,
        provider_network: provider.network,
        provider_city: provider.city,
        provider_state: provider.state
      }));

      const { error: insertError } = await supabase
        .from('team_providers')
        .upsert(providersToInsert, {
          onConflict: 'team_id,provider_dhc'
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Refresh the list
      await fetchTeamProviders();
    } catch (err) {
      console.error('Error adding team providers:', err);
      setError(err.message);
    } finally {
      setAddingProviders(false);
    }
  };

  // Remove a provider from team's list
  const removeTeamProvider = async (providerDhc) => {
    try {
      setRemovingProvider(providerDhc);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get user's team_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.team_id) {
        throw new Error('User not part of a team');
      }

      const { error: deleteError } = await supabase
        .from('team_providers')
        .delete()
        .eq('team_id', profile.team_id)
        .eq('provider_dhc', providerDhc);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Update local state
      setTeamProviders(prev => prev.filter(p => p.provider_dhc !== providerDhc));
    } catch (err) {
      console.error('Error removing team provider:', err);
      setError(err.message);
    } finally {
      setRemovingProvider(null);
    }
  };

  // Check if a provider is in team's list
  const isTeamProvider = (providerDhc) => {
    const isTeam = teamProviders.some(p => p.provider_dhc === providerDhc);
    console.log(`🔍 Checking if ${providerDhc} is team provider:`, isTeam);
    console.log(`🔍 Team providers DHCs:`, teamProviders.map(p => p.provider_dhc));
    return isTeam;
  };

  // Get team provider by DHC
  const getTeamProvider = (providerDhc) => {
    return teamProviders.find(p => p.provider_dhc === providerDhc);
  };

  // Initialize on mount
  useEffect(() => {
    fetchTeamProviders();
  }, []);

  return {
    teamProviders,
    loading,
    error,
    addingProviders,
    removingProvider,
    addTeamProviders,
    removeTeamProvider,
    isTeamProvider,
    getTeamProvider,
    refreshTeamProviders: fetchTeamProviders
  };
} 