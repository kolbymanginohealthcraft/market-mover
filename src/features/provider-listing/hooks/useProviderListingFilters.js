import { useState, useMemo } from 'react';

export const useProviderListingFilters = (uniqueResults, provider) => {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showOnlyCCNs, setShowOnlyCCNs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter results based on selected criteria
  const filteredResults = useMemo(() => {
    if (!uniqueResults) return [];

    return uniqueResults.filter(p => {
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) {
        return false;
      }

      // CCN filter
      if (showOnlyCCNs && !p.hasCCN) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = [
          p.name,
          p.network,
          p.street,
          p.city,
          p.state,
          p.zip,
          p.type
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [uniqueResults, selectedTypes, showOnlyCCNs, searchQuery]);

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setShowOnlyCCNs(false);
    setSearchQuery("");
  };

  return {
    selectedTypes,
    setSelectedTypes,
    showOnlyCCNs,
    setShowOnlyCCNs,
    searchQuery,
    setSearchQuery,
    filteredResults,
    toggleType,
    clearFilters
  };
}; 