import { useState } from 'react';
import useTeamProviderTags from './useTeamProviderTags';

export const useProviderTagging = () => {
  const {
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
    refreshTeamProviderTags
  } = useTeamProviderTags();

  // UI state for tagging dropdown
  const [taggingProviderId, setTaggingProviderId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Helper function to handle tag addition with UI state
  const handleAddTag = async (providerId, tagType) => {
    await addTeamProviderTag(providerId, tagType);
    setTaggingProviderId(null);
  };

  // Helper function to handle tag removal
  const handleRemoveTag = async (providerId, tagType) => {
    await removeTeamProviderTag(providerId, tagType);
  };

  // Helper function to open tagging dropdown
  const openTaggingDropdown = (providerId, event) => {
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
    }
    setTaggingProviderId(providerId);
  };

  // Helper function to close tagging dropdown
  const closeTaggingDropdown = () => {
    setTaggingProviderId(null);
  };

  // Get the primary tag for a provider (first tag if multiple)
  const getPrimaryTag = (providerId) => {
    const tags = getProviderTags(providerId);
    return tags[0] || null;
  };

  // Check if a provider has any tags
  const hasAnyTag = (providerId) => {
    return getProviderTags(providerId).length > 0;
  };

  return {
    // Core tagging functionality
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
    refreshTeamProviderTags,
    
    // UI state
    taggingProviderId,
    dropdownPosition,
    
    // Helper functions
    handleAddTag,
    handleRemoveTag,
    openTaggingDropdown,
    closeTaggingDropdown,
    getPrimaryTag,
    hasAnyTag
  };
};
