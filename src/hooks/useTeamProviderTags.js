import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';

export default function useTeamProviderTags() {
  const [teamProviderTags, setTeamProviderTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingTag, setAddingTag] = useState(false);
  const [removingTag, setRemovingTag] = useState(null);

  // Fetch team's provider tags
  const fetchTeamProviderTags = async () => {
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

      const { data: tags, error: tagsError } = await supabase
        .from('team_provider_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (tagsError) {
        throw new Error(tagsError.message);
      }

      setTeamProviderTags(tags || []);
    } catch (err) {
      console.error('Error fetching team provider tags:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a tag to a provider (ensures only one tag per provider)
  const addTeamProviderTag = async (providerDhc, tagType) => {
    try {
      setAddingTag(true);
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

      // First, remove any existing tags for this provider to ensure only one tag
      const { error: deleteError } = await supabase
        .from('team_provider_tags')
        .delete()
        .eq('team_id', profile.team_id)
        .eq('provider_dhc', providerDhc);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Then add the new tag
      const { error: insertError } = await supabase
        .from('team_provider_tags')
        .insert({
          team_id: profile.team_id,
          provider_dhc: providerDhc,
          tag_type: tagType
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Refresh the list
      await fetchTeamProviderTags();
    } catch (err) {
      console.error('Error adding team provider tag:', err);
      setError(err.message);
    } finally {
      setAddingTag(false);
    }
  };

  // Remove all tags from a provider (ensures only one tag per provider)
  const removeTeamProviderTag = async (providerDhc, tagType) => {
    try {
      setRemovingTag(providerDhc);
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

      // Remove ALL tags for this provider (not just the specific tag type)
      const { error: deleteError } = await supabase
        .from('team_provider_tags')
        .delete()
        .eq('team_id', profile.team_id)
        .eq('provider_dhc', providerDhc);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Update local state - remove all tags for this provider
      setTeamProviderTags(prev => prev.filter(tag => 
        tag.provider_dhc !== providerDhc
      ));
    } catch (err) {
      console.error('Error removing team provider tag:', err);
      setError(err.message);
    } finally {
      setRemovingTag(null);
    }
  };

  // Check if a provider has a specific tag
  const hasTeamProviderTag = (providerDhc, tagType) => {
    return teamProviderTags.some(tag => 
      tag.provider_dhc === providerDhc && tag.tag_type === tagType
    );
  };

  // Get all tags for a provider
  const getProviderTags = (providerDhc) => {
    return teamProviderTags
      .filter(tag => tag.provider_dhc === providerDhc)
      .map(tag => tag.tag_type);
  };

  // Get providers with a specific tag
  const getProvidersWithTag = (tagType) => {
    return teamProviderTags
      .filter(tag => tag.tag_type === tagType)
      .map(tag => tag.provider_dhc);
  };

  // Initialize on mount
  useEffect(() => {
    fetchTeamProviderTags();
  }, []);

  return {
    teamProviderTags,
    loading,
    error,
    addingTag,
    removingTag,
    addTeamProviderTag,
    removeTeamProviderTag,
    hasTeamProviderTag,
    getProviderTags,
    getProvidersWithTag,
    refreshTeamProviderTags: fetchTeamProviderTags
  };
} 