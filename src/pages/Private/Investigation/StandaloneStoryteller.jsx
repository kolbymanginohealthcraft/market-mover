import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Search, X, Plus, Building2, MapPin, Filter as FilterIcon, ChevronDown } from "lucide-react";
import { apiUrl } from '../../../utils/api';
import { supabase } from '../../../app/supabaseClient';
import Dropdown from '../../../components/Buttons/Dropdown';
import Storyteller from '../Results/Storyteller/Storyteller';
import styles from './StandaloneStoryteller.module.css';

export default function StandaloneStoryteller() {
  const location = useLocation();
  const searchContainerRef = useRef(null);
  const [selectedCcns, setSelectedCcns] = useState([]);
  const [ccnInput, setCcnInput] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [radiusInMiles, setRadiusInMiles] = useState(10);
  const [nearbyProviders, setNearbyProviders] = useState([]);
  const [nearbyDhcCcns, setNearbyDhcCcns] = useState([]);
  const [mainProviderCcns, setMainProviderCcns] = useState([]);

  // Saved markets and network tags
  const [savedMarkets, setSavedMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketDhcCcns, setMarketDhcCcns] = useState([]);
  const [providerTags, setProviderTags] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagDhcCcns, setTagDhcCcns] = useState([]);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);

  // Search for providers by name or NPI
  const searchProviders = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/search/providers?q=${encodeURIComponent(query)}&limit=10`));
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.providers || []);
      }
    } catch (error) {
      console.error('Error searching providers:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchProviders(providerSearch);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [providerSearch]);

  // Fetch saved markets and provider tags on mount
  useEffect(() => {
    async function fetchMarkets() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabase
          .from('markets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSavedMarkets(data || []);
      } catch (err) {
        console.error('Error fetching markets:', err);
      }
    }
    
    async function fetchProviderTags() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.id)
          .single();
        
        if (profileError || !profile || !profile.team_id) {
          return;
        }
        
        const { data: tags, error: tagsError } = await supabase
          .from('team_provider_tags')
          .select('*')
          .eq('team_id', profile.team_id);
        
        if (tagsError) throw tagsError;
        
        // Organize tags by type
        const organized = {
          me: tags.filter(t => t.tag_type === 'me') || [],
          partner: tags.filter(t => t.tag_type === 'partner') || [],
          competitor: tags.filter(t => t.tag_type === 'competitor') || [],
          target: tags.filter(t => t.tag_type === 'target') || []
        };
        
        setProviderTags(organized);
      } catch (err) {
        console.error('Error fetching provider tags:', err);
      }
    }
    
    fetchMarkets();
    fetchProviderTags();
  }, []);

  // Handle provider selection from search
  const handleProviderSelect = async (provider) => {
    setSelectedProvider(provider);
    setProviderSearch('');
    setSearchResults([]);
    setSearchDropdownOpen(false);
    
    // Clear market and tag selections when provider is selected
    setSelectedMarket(null);
    setMarketDhcCcns([]);
    setSelectedTag(null);
    setTagDhcCcns([]);
    
    // Fetch CCNs for the selected provider
    if (provider.dhc && !isNaN(parseInt(provider.dhc))) {
      try {
        const response = await fetch(apiUrl('/api/related-ccns'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dhc_ids: [provider.dhc] })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const ccns = result.data.map(row => row.ccn);
            setMainProviderCcns(ccns);
          }
        }
      } catch (err) {
        console.error('Error fetching provider CCNs:', err);
      }
    }
    
    // Fetch nearby providers if provider has coordinates
    if (provider.latitude && provider.longitude) {
      try {
        const response = await fetch(apiUrl(`/api/nearby-providers?lat=${provider.latitude}&lon=${provider.longitude}&radius=${radiusInMiles}`));
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const filtered = result.data.filter(p => p.dhc !== provider.dhc);
            setNearbyProviders(filtered);
            
            // Fetch CCNs for nearby providers
            const dhcIds = filtered.map(p => p.dhc).filter(Boolean);
            if (dhcIds.length > 0) {
              const ccnResponse = await fetch(apiUrl('/api/related-ccns'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dhc_ids: dhcIds })
              });
              if (ccnResponse.ok) {
                const ccnResult = await ccnResponse.json();
                if (ccnResult.success) {
                  setNearbyDhcCcns(ccnResult.data || []);
                }
              }
            } else {
              setNearbyDhcCcns([]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching nearby providers:', err);
      }
    }
  };

  // Handle market selection
  const handleMarketSelect = async (marketId) => {
    if (!marketId) {
      setSelectedMarket(null);
      setMarketDhcCcns([]);
      return;
    }
    
    const market = savedMarkets.find(m => m.id === marketId);
    if (!market) return;
    
    setSelectedMarket(market);
    setSelectedProvider(null); // Clear provider selection
    setMainProviderCcns([]);
    setNearbyProviders([]);
    setNearbyDhcCcns([]);
    setSelectedTag(null); // Clear tag selection
    setTagDhcCcns([]);
    
    try {
      // Fetch providers in the market area
      const response = await fetch(apiUrl(`/api/nearby-providers?lat=${market.latitude}&lon=${market.longitude}&radius=${market.radius_miles}`));
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Store providers so they show up individually in the matrix
          setNearbyProviders(result.data || []);
          
          // Get DHCs from providers
          const dhcIds = result.data.map(p => p.dhc).filter(Boolean);
          
          // Fetch CCNs for all providers in the market
          if (dhcIds.length > 0) {
            const ccnResponse = await fetch(apiUrl('/api/related-ccns'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dhc_ids: dhcIds })
            });
            if (ccnResponse.ok) {
              const ccnResult = await ccnResponse.json();
              if (ccnResult.success) {
                // Keep original DHCs so each provider can be displayed separately
                const marketCcns = (ccnResult.data || []).map(row => ({
                  dhc: String(row.dhc),
                  ccn: String(row.ccn)
                }));
                setMarketDhcCcns(marketCcns);
              }
            }
          } else {
            setMarketDhcCcns([]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading market:', err);
    }
  };

  // Handle tag selection
  const handleTagSelect = async (tagType) => {
    if (!tagType) {
      setSelectedTag(null);
      setTagDhcCcns([]);
      return;
    }
    
    setSelectedTag(tagType);
    setSelectedProvider(null); // Clear provider selection
    setMainProviderCcns([]);
    setNearbyProviders([]);
    setNearbyDhcCcns([]);
    setSelectedMarket(null); // Clear market selection
    setMarketDhcCcns([]);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();
      
      if (!profile || !profile.team_id) return;
      
      // Get DHCs from tagged providers
      const { data: tags } = await supabase
        .from('team_provider_tags')
        .select('provider_dhc')
        .eq('team_id', profile.team_id)
        .eq('tag_type', tagType);
      
      if (!tags || tags.length === 0) {
        setTagDhcCcns([]);
        setNearbyProviders([]);
        return;
      }
      
      const dhcIds = tags.map(t => t.provider_dhc).filter(Boolean);
      
      // Fetch provider info for tagged DHCs so they show up individually in the matrix
      if (dhcIds.length > 0) {
        try {
          const providerResponse = await fetch(apiUrl('/api/getProvidersByDhc'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dhc_ids: dhcIds })
          });
          if (providerResponse.ok) {
            const providerResult = await providerResponse.json();
            if (providerResult.success && providerResult.providers) {
              // Store providers so they show up individually in the matrix
              setNearbyProviders(providerResult.providers || []);
            }
          }
        } catch (err) {
          console.error('Error fetching provider info for tags:', err);
        }
        
        // Fetch CCNs for tagged providers
        const response = await fetch(apiUrl('/api/related-ccns'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dhc_ids: dhcIds })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Keep original DHCs so each provider can be displayed separately
            const tagCcns = (result.data || []).map(row => ({
              dhc: String(row.dhc),
              ccn: String(row.ccn)
            }));
            setTagDhcCcns(tagCcns);
          }
        }
      } else {
        setTagDhcCcns([]);
        setNearbyProviders([]);
      }
    } catch (err) {
      console.error('Error loading tag:', err);
    }
  };

  // Handle CCN input
  const handleCcnAdd = () => {
    const ccn = ccnInput.trim();
    if (ccn && !selectedCcns.includes(ccn)) {
      setSelectedCcns([...selectedCcns, ccn]);
      setCcnInput('');
    }
  };

  const handleCcnRemove = (ccn) => {
    setSelectedCcns(selectedCcns.filter(c => c !== ccn));
  };

  const handleCcnKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCcnAdd();
    }
  };

  // Convert manually entered CCNs to {dhc, ccn} format
  // Group all manually entered CCNs under a single 'ccn-only' DHC
  const manualDhcCcns = selectedCcns.map(ccn => ({
    dhc: 'ccn-only', // Single placeholder DHC for all manually entered CCNs
    ccn: String(ccn)
  }));

  // Combine all CCN sources
  const allDhcCcns = [...nearbyDhcCcns, ...marketDhcCcns, ...tagDhcCcns, ...manualDhcCcns];
  const allCcns = [...new Set([...selectedCcns, ...mainProviderCcns, ...allDhcCcns.map(c => c.ccn)])];
  
  // Check if we have any parameters set
  const hasParameters = selectedProvider || selectedMarket || selectedTag || selectedCcns.length > 0;
  
  // Create a minimal provider object when only CCNs are provided (no actual provider)
  // This is needed for markets, tags, or manually entered CCNs
  // Always create it if we have parameters set, even if CCNs are still loading
  const storyTellerProvider = selectedProvider || (hasParameters ? {
    dhc: 'ccn-only',
    name: selectedMarket ? selectedMarket.name : (selectedTag ? `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} Network` : 'CCN Selection'),
    latitude: null,
    longitude: null
  } : null);

  // Clear all selections
  const handleClearAll = () => {
    setSelectedProvider(null);
    setSelectedCcns([]);
    setNearbyProviders([]);
    setNearbyDhcCcns([]);
    setMainProviderCcns([]);
    setSelectedMarket(null);
    setMarketDhcCcns([]);
    setSelectedTag(null);
    setTagDhcCcns([]);
    setProviderSearch('');
    setSearchResults([]);
    setCcnInput('');
    setSearchDropdownOpen(false);
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchDropdownOpen && searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchDropdownOpen]);

  return (
    <div className={styles.container}>
      {/* Filter Controls Bar */}
      <div className={styles.controlsBar}>
        {/* Provider Search */}
        <div className={styles.searchContainer} ref={searchContainerRef}>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search providers..."
              value={providerSearch}
              onChange={(e) => setProviderSearch(e.target.value)}
              onFocus={() => setSearchDropdownOpen(true)}
              className={styles.searchInput}
            />
            {selectedProvider && (
              <button
                onClick={() => {
                  setSelectedProvider(null);
                  setMainProviderCcns([]);
                  setNearbyProviders([]);
                  setNearbyDhcCcns([]);
                }}
                className={styles.clearButton}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchDropdownOpen && (providerSearch || searchResults.length > 0) && (
            <div className={styles.searchDropdown}>
              {searchLoading ? (
                <div className={styles.dropdownItem}>Loading...</div>
              ) : searchResults.length === 0 && providerSearch.length >= 2 ? (
                <div className={styles.dropdownItem}>No providers found</div>
              ) : (
                searchResults.map((provider) => (
                  <button
                    key={provider.dhc}
                    className={styles.dropdownItem}
                    onClick={() => handleProviderSelect(provider)}
                  >
                    <Building2 size={14} />
                    <div>
                      <div>{provider.name || provider.facility_name}</div>
                      {provider.city && provider.state && (
                        <div className={styles.providerLocation}>
                          {provider.city}, {provider.state}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* CCN Input */}
        <div className={styles.ccnInputContainer}>
          <input
            type="text"
            placeholder="Enter CCN..."
            value={ccnInput}
            onChange={(e) => setCcnInput(e.target.value)}
            onKeyPress={handleCcnKeyPress}
            className={styles.ccnInput}
          />
          <button onClick={handleCcnAdd} className={styles.addButton}>
            <Plus size={14} />
          </button>
        </div>

        {/* Network Tags */}
        {providerTags && (
          <Dropdown
            trigger={
              <button className={styles.filterButton}>
                <FilterIcon size={14} />
                {selectedTag ? 
                  `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} (${tagDhcCcns.length})` : 
                  'Network Tag'}
                <ChevronDown size={14} />
              </button>
            }
            isOpen={tagDropdownOpen}
            onToggle={setTagDropdownOpen}
            className={styles.dropdownMenu}
          >
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                handleTagSelect('');
                setTagDropdownOpen(false);
              }}
            >
              All Providers
            </button>
            {providerTags.me?.length > 0 && (
              <button 
                className={styles.dropdownItem}
                onClick={() => {
                  handleTagSelect('me');
                  setTagDropdownOpen(false);
                }}
              >
                My Providers ({providerTags.me.length})
              </button>
            )}
            {providerTags.partner?.length > 0 && (
              <button 
                className={styles.dropdownItem}
                onClick={() => {
                  handleTagSelect('partner');
                  setTagDropdownOpen(false);
                }}
              >
                Partners ({providerTags.partner.length})
              </button>
            )}
            {providerTags.competitor?.length > 0 && (
              <button 
                className={styles.dropdownItem}
                onClick={() => {
                  handleTagSelect('competitor');
                  setTagDropdownOpen(false);
                }}
              >
                Competitors ({providerTags.competitor.length})
              </button>
            )}
            {providerTags.target?.length > 0 && (
              <button 
                className={styles.dropdownItem}
                onClick={() => {
                  handleTagSelect('target');
                  setTagDropdownOpen(false);
                }}
              >
                Targets ({providerTags.target.length})
              </button>
            )}
          </Dropdown>
        )}

        {/* Saved Markets */}
        {savedMarkets.length > 0 && (
          <Dropdown
            trigger={
              <button className={styles.filterButton}>
                <MapPin size={14} />
                {selectedMarket ? 
                  `${selectedMarket.name} (${marketDhcCcns.length})` : 
                  'Saved Market'}
                <ChevronDown size={14} />
              </button>
            }
            isOpen={marketDropdownOpen}
            onToggle={setMarketDropdownOpen}
            className={styles.dropdownMenu}
          >
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                handleMarketSelect('');
                setMarketDropdownOpen(false);
              }}
            >
              No Market
            </button>
            {savedMarkets.map(market => (
              <button 
                key={market.id}
                className={styles.dropdownItem}
                onClick={() => {
                  handleMarketSelect(market.id);
                  setMarketDropdownOpen(false);
                }}
                style={{
                  fontWeight: selectedMarket?.id === market.id ? '600' : '500',
                  background: selectedMarket?.id === market.id ? 'rgba(0, 192, 139, 0.1)' : 'none',
                }}
              >
                <div>{market.name}</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  {market.city}, {market.state} • {market.radius_miles} mi
                </div>
              </button>
            ))}
          </Dropdown>
        )}

        {/* Clear All Button */}
        {hasParameters && (
          <button onClick={handleClearAll} className={styles.clearAllButton}>
            <X size={14} />
            Clear All
          </button>
        )}

        {/* Selected Items Display */}
        <div className={styles.selectedItems}>
          {selectedProvider && (
            <div className={styles.selectedTag}>
              <Building2 size={12} />
              <span>{selectedProvider.name || selectedProvider.facility_name}</span>
              <span className={styles.count}>{mainProviderCcns.length} CCNs</span>
            </div>
          )}
          {selectedMarket && (
            <div className={styles.selectedTag}>
              <MapPin size={12} />
              <span>{selectedMarket.name}</span>
              <span className={styles.count}>{marketDhcCcns.length} CCNs</span>
            </div>
          )}
          {selectedTag && (
            <div className={styles.selectedTag}>
              <FilterIcon size={12} />
              <span>{selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)}</span>
              <span className={styles.count}>{tagDhcCcns.length} CCNs</span>
            </div>
          )}
          {selectedCcns.map((ccn) => (
            <div key={ccn} className={styles.selectedTag}>
              <span>CCN: {ccn}</span>
              <button
                onClick={() => handleCcnRemove(ccn)}
                className={styles.removeTagButton}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.content}>
        {!hasParameters ? (
          <div className={styles.emptyState}>
            <h2>Select Parameters to View Quality Measures</h2>
            <p>Use the filters above to select providers, markets, network tags, or enter CCNs directly.</p>
          </div>
        ) : (
          <Storyteller
            provider={storyTellerProvider}
            radiusInMiles={radiusInMiles}
            nearbyProviders={nearbyProviders}
            nearbyDhcCcns={allDhcCcns}
            mainProviderCcns={[...new Set([...mainProviderCcns, ...allDhcCcns.map(c => c.ccn)])]}
            prefetchedData={null}
          />
        )}
      </div>
    </div>
  );
}
