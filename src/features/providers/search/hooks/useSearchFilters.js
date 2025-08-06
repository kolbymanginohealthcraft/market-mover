import { useState, useEffect } from 'react';

export const useSearchFilters = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [showOnlyCCNs, setShowOnlyCCNs] = useState(false);
  const [ccnProviderIds, setCcnProviderIds] = useState(new Set());

  const filters = {
    selectedTypes,
    selectedNetworks,
    selectedCities,
    selectedStates,
    showOnlyCCNs
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleNetwork = (network) => {
    setSelectedNetworks(prev => 
      prev.includes(network) 
        ? prev.filter(n => n !== network)
        : [...prev, network]
    );
  };

  const toggleCity = (city) => {
    setSelectedCities(prev => 
      prev.includes(city) 
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  const toggleState = (state) => {
    setSelectedStates(prev => 
      prev.includes(state) 
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedNetworks([]);
    setSelectedCities([]);
    setSelectedStates([]);
    setShowOnlyCCNs(false);
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'type':
        toggleType(value);
        break;
      case 'network':
        toggleNetwork(value);
        break;
      case 'city':
        toggleCity(value);
        break;
      case 'state':
        toggleState(value);
        break;
      case 'ccn':
        setShowOnlyCCNs(value);
        break;
      default:
        break;
    }
  };

  // Extract unique filter options from results
  const extractFilterOptions = (results) => {
    const types = new Set();
    const networks = new Set();
    const cities = new Set();
    const states = new Set();

    results.forEach(provider => {
      if (provider.type) types.add(provider.type);
      if (provider.network) networks.add(provider.network);
      if (provider.city) cities.add(provider.city);
      if (provider.state) states.add(provider.state);
    });

    return {
      types: Array.from(types).sort(),
      networks: Array.from(networks).sort(),
      cities: Array.from(cities).sort(),
      states: Array.from(states).sort()
    };
  };

  return {
    filters,
    showFilters,
    setShowFilters,
    clearAllFilters,
    handleFilterChange,
    extractFilterOptions,
    toggleType,
    toggleNetwork,
    toggleCity,
    toggleState,
    showOnlyCCNs,
    setShowOnlyCCNs,
    ccnProviderIds,
    setCcnProviderIds
  };
}; 