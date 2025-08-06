import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';

export const useProviderListingTags = (provider, isInSavedMarket) => {
  const [tags, setTags] = useState({});
  const [taggingProviderId, setTaggingProviderId] = useState(null);
  const [savingTagId, setSavingTagId] = useState(null);

  const fetchTags = async () => {
    if (!provider || !isInSavedMarket) return;

    try {
      const { data, error } = await supabase
        .from('team_provider_tags')
        .select('provider_dhc, tag_type')
        .eq('team_id', provider.team_id);

      if (error) {
        console.error('Error fetching tags:', error);
        return;
      }

      const tagsMap = {};
      data.forEach(item => {
        tagsMap[item.provider_dhc] = item.tag_type;
      });

      setTags(tagsMap);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleTag = async (providerDhc, tagType) => {
    if (!provider || !isInSavedMarket) return;

    setSavingTagId(providerDhc);

    try {
      const { error } = await supabase
        .from('team_provider_tags')
        .upsert({
          team_id: provider.team_id,
          provider_dhc: providerDhc,
          tag_type: tagType
        });

      if (error) {
        console.error('Error saving tag:', error);
        return;
      }

      setTags(prev => ({
        ...prev,
        [providerDhc]: tagType
      }));

      setTaggingProviderId(null);
    } catch (error) {
      console.error('Error saving tag:', error);
    } finally {
      setSavingTagId(null);
    }
  };

  const handleUntag = async (providerDhc) => {
    if (!provider || !isInSavedMarket) return;

    setSavingTagId(providerDhc);

    try {
      const { error } = await supabase
        .from('team_provider_tags')
        .delete()
        .eq('team_id', provider.team_id)
        .eq('provider_dhc', providerDhc);

      if (error) {
        console.error('Error removing tag:', error);
        return;
      }

      setTags(prev => {
        const newTags = { ...prev };
        delete newTags[providerDhc];
        return newTags;
      });
    } catch (error) {
      console.error('Error removing tag:', error);
    } finally {
      setSavingTagId(null);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [provider, isInSavedMarket]);

  return {
    tags,
    setTags,
    taggingProviderId,
    setTaggingProviderId,
    savingTagId,
    setSavingTagId,
    handleTag,
    handleUntag,
    fetchTags
  };
}; 