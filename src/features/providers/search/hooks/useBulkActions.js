import { useState } from 'react';
import useTeamProviderTags from '../../../../hooks/useTeamProviderTags';

export const useBulkActions = () => {
  const [selectedProviders, setSelectedProviders] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Team provider tags functionality
  const { addTeamProviderTag } = useTeamProviderTags();

  const handleCheckboxChange = (providerDhc, checked) => {
    setSelectedProviders(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(providerDhc);
      } else {
        newSet.delete(providerDhc);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    // This would need to be implemented based on current page results
    // For now, we'll just toggle the bulk actions visibility
    setShowBulkActions(prev => !prev);
  };

  const handleSaveAsTeamProviders = async () => {
    if (selectedProviders.size === 0) return;

    setBulkActionLoading(true);
    try {
      // Add all selected providers as "me" tags
      for (const dhc of selectedProviders) {
        await addTeamProviderTag(dhc, 'me');
      }
      
      // Clear selection after successful save
      setSelectedProviders(new Set());
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error tagging providers:', error);
    } finally {
      setBulkActionLoading(false);
    }
  };

  return {
    selectedProviders,
    setSelectedProviders,
    showBulkActions,
    setShowBulkActions,
    bulkActionLoading,
    handleCheckboxChange,
    handleSelectAll,
    handleSaveAsTeamProviders
  };
}; 