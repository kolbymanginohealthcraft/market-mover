import { useState, useEffect } from 'react';
import { supabase } from '../app/supabaseClient';
import { apiUrl } from '../utils/api';

export default function useTaggedProviders() {
  const [taggedProviders, setTaggedProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingTag, setRemovingTag] = useState(null);

  // Fetch team's tagged providers with their tags
  const fetchTaggedProviders = async () => {
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

      // Get all team provider tags
      const { data: tags, error: tagsError } = await supabase
        .from('team_provider_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (tagsError) {
        throw new Error(tagsError.message);
      }

      // Group tags by provider_dhc and create provider objects
      const providerMap = new Map();
      
      tags.forEach(tag => {
        if (!providerMap.has(tag.provider_dhc)) {
          providerMap.set(tag.provider_dhc, {
            provider_dhc: tag.provider_dhc,
            tags: [],
            created_at: tag.created_at,
            updated_at: tag.updated_at
          });
        }
        providerMap.get(tag.provider_dhc).tags.push(tag.tag_type);
      });

      // Convert to array and sort by most recent
      const providers = Array.from(providerMap.values())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Fetch provider details from BigQuery for all tagged providers
      if (providers.length > 0) {
        try {
          const dhcIds = providers.map(p => p.provider_dhc);
          
          console.log('🔍 Fetching provider details for DHCs:', dhcIds);
          
          const response = await fetch(apiUrl('/api/getProvidersByDhc'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dhc_ids: dhcIds })
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ BigQuery response:', result);
            if (result.success && result.providers) {
              // Create a map of provider details by DHC
              const providerDetailsMap = {};
              result.providers.forEach(provider => {
                providerDetailsMap[provider.dhc] = provider;
              });
              
              console.log('🔍 Provider details map:', providerDetailsMap);
              
              // Merge provider details with tag data
              const providersWithDetails = providers.map(provider => ({
                ...provider,
                name: providerDetailsMap[provider.provider_dhc]?.name || `Provider ${provider.provider_dhc}`,
                type: providerDetailsMap[provider.provider_dhc]?.type || 'Unknown',
                network: providerDetailsMap[provider.provider_dhc]?.network || '—',
                city: providerDetailsMap[provider.provider_dhc]?.city || '—',
                state: providerDetailsMap[provider.provider_dhc]?.state || '—',
                street: providerDetailsMap[provider.provider_dhc]?.street || '—',
                zip: providerDetailsMap[provider.provider_dhc]?.zip || '—',
                latitude: providerDetailsMap[provider.provider_dhc]?.latitude || null,
                longitude: providerDetailsMap[provider.provider_dhc]?.longitude || null
              }));
              
              console.log('🔍 Providers with details:', providersWithDetails);
              setTaggedProviders(providersWithDetails);
            } else {
              console.log('❌ BigQuery response not successful:', result);
              // If BigQuery fetch fails, still show the providers with basic info
              setTaggedProviders(providers);
            }
          } else {
            const errorText = await response.text();
            console.error('❌ BigQuery fetch failed:', response.status, errorText);
            // If BigQuery fetch fails, still show the providers with basic info
            setTaggedProviders(providers);
          }
        } catch (err) {
          console.error('Error fetching provider details from BigQuery:', err);
          // If BigQuery fetch fails, still show the providers with basic info
          setTaggedProviders(providers);
        }
      } else {
        setTaggedProviders(providers);
      }
    } catch (err) {
      console.error('Error fetching tagged providers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Remove all tags for a provider
  const removeAllProviderTags = async (providerDhc) => {
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

      // Remove all tags for this provider
      const { error: deleteError } = await supabase
        .from('team_provider_tags')
        .delete()
        .eq('team_id', profile.team_id)
        .eq('provider_dhc', providerDhc);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Update local state
      setTaggedProviders(prev => prev.filter(p => p.provider_dhc !== providerDhc));
    } catch (err) {
      console.error('Error removing provider tags:', err);
      setError(err.message);
    } finally {
      setRemovingTag(null);
    }
  };

  // Change a specific tag for a provider
  const changeProviderTag = async (providerDhc, oldTagType, newTagType) => {
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

      // Remove the old tag
      const { error: deleteError } = await supabase
        .from('team_provider_tags')
        .delete()
        .eq('team_id', profile.team_id)
        .eq('provider_dhc', providerDhc)
        .eq('tag_type', oldTagType);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Add the new tag
      const { error: insertError } = await supabase
        .from('team_provider_tags')
        .insert({
          team_id: profile.team_id,
          provider_dhc: providerDhc,
          tag_type: newTagType
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Update local state
      setTaggedProviders(prev => prev.map(provider => {
        if (provider.provider_dhc === providerDhc) {
          return {
            ...provider,
            tags: provider.tags.map(tag => tag === oldTagType ? newTagType : tag)
          };
        }
        return provider;
      }));
    } catch (err) {
      console.error('Error changing provider tag:', err);
      setError(err.message);
    } finally {
      setRemovingTag(null);
    }
  };

  // Check if a provider has any tags
  const isTaggedProvider = (providerDhc) => {
    return taggedProviders.some(p => p.provider_dhc === providerDhc);
  };

  // Get all tags for a provider
  const getProviderTags = (providerDhc) => {
    const provider = taggedProviders.find(p => p.provider_dhc === providerDhc);
    return provider ? provider.tags : [];
  };

  // Get providers with a specific tag
  const getProvidersWithTag = (tagType) => {
    return taggedProviders
      .filter(provider => provider.tags.includes(tagType))
      .map(provider => provider.provider_dhc);
  };

  // Initialize on mount
  useEffect(() => {
    fetchTaggedProviders();
  }, []);

  return {
    taggedProviders,
    loading,
    error,
    removingTag,
    removeAllProviderTags,
    changeProviderTag,
    isTaggedProvider,
    getProviderTags,
    getProvidersWithTag,
    refreshTaggedProviders: fetchTaggedProviders
  };
} 