import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { X, Plus, MapPin, Filter as FilterIcon, ChevronDown } from "lucide-react";
import { apiUrl } from '../../../utils/api';
import { supabase } from '../../../app/supabaseClient';
import Dropdown from '../../../components/Buttons/Dropdown';
import Spinner from '../../../components/Buttons/Spinner';
import Storyteller from '../Results/Storyteller/Storyteller';
import styles from './StandaloneStoryteller.module.css';
import { getSegmentationIcon, getSegmentationIconProps } from '../../../utils/segmentationIcons';

export default function StandaloneStoryteller() {
  const [searchParams] = useSearchParams();
  const ccnInputRef = useRef(null);
  const [selectedCcns, setSelectedCcns] = useState([]);
  const [ccnInput, setCcnInput] = useState('');
  const [manualProviderDetails, setManualProviderDetails] = useState({});
  const [providerLabelMap, setProviderLabelMap] = useState({});
  const [marketProviders, setMarketProviders] = useState([]);
  const [tagProviders, setTagProviders] = useState([]);
  
  // Get selected provider from URL params
  const selectedProviderDhc = searchParams.get('provider');

  // Saved markets and network tags
  const [savedMarkets, setSavedMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketDhcCcns, setMarketDhcCcns] = useState([]);
  const [providerTags, setProviderTags] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagDhcCcns, setTagDhcCcns] = useState([]);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [highlightTagTypes, setHighlightTagTypes] = useState([]);
  const [highlightDropdownOpen, setHighlightDropdownOpen] = useState(false);
  const [myKpiCodes, setMyKpiCodes] = useState([]);
  const [kpiTagsLoading, setKpiTagsLoading] = useState(false);
  const [showMyKpisOnly, setShowMyKpisOnly] = useState(false);


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
        setHighlightTagTypes(prev => {
          if (!Array.isArray(prev) || prev.length === 0) return prev;
          return prev.filter(type => (organized?.[type] || []).length > 0);
        });
      } catch (err) {
        console.error('Error fetching provider tags:', err);
      }
    }
    
    fetchMarkets();
    fetchProviderTags();
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchKpiTags() {
      try {
        setKpiTagsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setMyKpiCodes([]);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.team_id) {
          if (isMounted) setMyKpiCodes([]);
          return;
        }

        const { data: tags, error: tagsError } = await supabase
          .from('team_kpi_tags')
          .select('kpi_code')
          .eq('team_id', profile.team_id);

        if (tagsError) throw tagsError;

        const codes = Array.from(new Set((tags || [])
          .map(tag => (tag?.kpi_code ? String(tag.kpi_code).trim() : ''))
          .filter(Boolean)));

        if (isMounted) {
          setMyKpiCodes(codes);
        }
      } catch (err) {
        console.error('Error fetching KPI tags:', err);
        if (isMounted) {
          setMyKpiCodes([]);
        }
      } finally {
        if (isMounted) {
          setKpiTagsLoading(false);
        }
      }
    }

    fetchKpiTags();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!kpiTagsLoading && myKpiCodes.length === 0 && showMyKpisOnly) {
      setShowMyKpisOnly(false);
    }
  }, [kpiTagsLoading, myKpiCodes, showMyKpisOnly]);


  // Handle market selection
  const handleMarketSelect = async (marketId) => {
    if (!marketId) {
      setSelectedMarket(null);
      setMarketDhcCcns([]);
      setMarketProviders([]);
      return;
    }
    
    const market = savedMarkets.find(m => m.id === marketId);
    if (!market) return;
    
    setSelectedMarket(market);
    
    try {
      // Fetch providers in the market area
      const response = await fetch(apiUrl(`/api/nearby-providers?lat=${market.latitude}&lon=${market.longitude}&radius=${market.radius_miles}`));
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Store providers so they show up individually in the matrix
            setMarketProviders(result.data || []);
          
          // Get DHCs from providers
          const dhcIds = Array.from(new Set(result.data.map(p => p.dhc).filter(Boolean).map(String)));
          
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
            setMarketProviders([]);
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
      setTagProviders([]);
      return;
    }
    
    setSelectedTag(tagType);
    
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
        setTagProviders([]);
        return;
      }
      
      const dhcIds = Array.from(new Set(tags.map(t => t.provider_dhc).filter(Boolean).map(String)));
      
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
              const normalizedProviders = (providerResult.providers || []).map(item => {
                const dhcKey = item?.dhc ? String(item.dhc) : null;
                const label = item?.name || item?.facility_name || (dhcKey ? providerLabelMap[dhcKey] : null) || `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} Network`;
                return {
                  ...item,
                  name: label,
                  facility_name: item?.facility_name || label,
                  context: 'tag',
                  tagType: tagType,
                  tagLabel: label,
                  shouldDisplay: true
                };
              });

              const labelUpdates = {};
              normalizedProviders.forEach(item => {
                if (item?.dhc) {
                  labelUpdates[String(item.dhc)] = item.name;
                }
              });

              if (Object.keys(labelUpdates).length > 0) {
                setProviderLabelMap(prev => ({
                  ...prev,
                  ...labelUpdates
                }));
              }

              // Store providers so they show up individually in the matrix
              setTagProviders(normalizedProviders);
            }
          }
        } catch (err) {
          console.error('Error fetching provider info for tags:', err);
          setTagProviders([]);
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
        setTagProviders([]);
      }
    } catch (err) {
      console.error('Error loading tag:', err);
      setTagProviders([]);
    }
  };

  // Handle CCN input
  const handleCcnAdd = () => {
    const ccn = ccnInput.trim();
    if (ccn && !selectedCcns.includes(ccn)) {
      setProviderLabelMap(prev => ({
        ...prev,
        [`ccn:${String(ccn)}`]: prev[`ccn:${String(ccn)}`] || `CCN ${ccn}`
      }));
      setSelectedCcns([...selectedCcns, ccn]);
      setCcnInput('');
    }
  };

  const handleCcnRemove = (ccn) => {
    setSelectedCcns(selectedCcns.filter(c => c !== ccn));
    setManualProviderDetails(prev => {
      if (!prev[ccn]) return prev;
      const next = { ...prev };
      delete next[ccn];
      return next;
    });
  };

  const handleCcnKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCcnAdd();
    }
  };

  const manualDhcCcns = useMemo(() => (
    selectedCcns.map(ccn => ({
      dhc: `ccn:${String(ccn)}`,
      ccn: String(ccn)
    }))
  ), [selectedCcns]);

  const manualProviders = useMemo(() => (
    selectedCcns.map(ccn => {
      const detail = manualProviderDetails[ccn];
      const mapKey = `ccn:${String(ccn)}`;
      const mappedName = providerLabelMap[mapKey];
      const displayName = detail?.FAC_NAME || detail?.name || mappedName || `CCN ${ccn}`;
      return {
        dhc: `ccn:${String(ccn)}`,
        name: displayName,
        facilityName: detail?.FAC_NAME,
        ccn: String(ccn),
        manualCcn: String(ccn),
        latitude: null,
        longitude: null,
      };
    })
  ), [selectedCcns, manualProviderDetails, providerLabelMap]);

  const marketDhcKeySet = useMemo(() => new Set(
    (marketDhcCcns || []).map(item => String(item.dhc))
  ), [marketDhcCcns]);

  const tagDhcKeySet = useMemo(() => new Set(
    (tagDhcCcns || []).map(item => String(item.dhc))
  ), [tagDhcCcns]);

  const combinedNearbyProviders = useMemo(() => {
    const baseProviders = [
      ...(Array.isArray(marketProviders) ? marketProviders : []),
      ...(Array.isArray(tagProviders) ? tagProviders : [])
    ];
    const uniqueByDhc = new Map();

    baseProviders.forEach(provider => {
      if (provider?.dhc) {
        const dhcKey = String(provider.dhc);
        const mappedName = providerLabelMap[dhcKey];
        uniqueByDhc.set(dhcKey, {
          ...provider,
          name: mappedName || provider.name || provider.facility_name || providerLabelMap[dhcKey] || provider.name,
          facility_name: provider.facility_name || mappedName || provider.name
        });
      }
    });

    manualProviders.forEach(provider => {
      const dhcKey = String(provider.dhc);
      if (!uniqueByDhc.has(dhcKey)) {
        uniqueByDhc.set(dhcKey, provider);
      }
    });

    return Array.from(uniqueByDhc.values()).filter(provider => {
      const dhcKey = provider?.dhc ? String(provider.dhc) : null;
      if (!dhcKey) return false;
      const isManual = dhcKey.startsWith('ccn:');
      const matchesMarket = !selectedMarket || isManual || marketDhcKeySet.has(dhcKey);
      const matchesTag = !selectedTag || isManual || tagDhcKeySet.has(dhcKey);
      return matchesMarket && matchesTag;
    });
  }, [marketProviders, tagProviders, manualProviders, providerLabelMap, selectedMarket, selectedTag, marketDhcKeySet, tagDhcKeySet]);

  const activeDhcKeySet = useMemo(() => new Set(
    combinedNearbyProviders
      .map(provider => (provider?.dhc ? String(provider.dhc) : null))
      .filter(Boolean)
  ), [combinedNearbyProviders]);

  const allDhcCcns = useMemo(() => {
    const filteredMarket = (marketDhcCcns || []).filter(item => activeDhcKeySet.has(String(item.dhc)));
    const filteredTag = (tagDhcCcns || []).filter(item => activeDhcKeySet.has(String(item.dhc)));
    return [...filteredMarket, ...filteredTag, ...manualDhcCcns];
  }, [marketDhcCcns, tagDhcCcns, manualDhcCcns, activeDhcKeySet]);

  const storytellerFocusedCcns = useMemo(() => (
    [...new Set(allDhcCcns.map(c => String(c.ccn)))]
  ), [allDhcCcns]);

  const hasParameters = useMemo(() => {
    const tagHasProviders = Boolean(
      selectedTag && (
        (tagDhcCcns && tagDhcCcns.length > 0) ||
        (tagProviders && tagProviders.length > 0)
      )
    );
    return Boolean(
      selectedMarket ||
      tagHasProviders ||
      (selectedCcns && selectedCcns.length > 0)
    );
  }, [selectedMarket, selectedTag, selectedCcns.length, tagDhcCcns, tagProviders]);

  const highlightCounts = useMemo(() => ({
    me: providerTags?.me?.length || 0,
    partner: providerTags?.partner?.length || 0,
    competitor: providerTags?.competitor?.length || 0,
    target: providerTags?.target?.length || 0
  }), [providerTags]);

  const hasHighlightOptions = useMemo(() => (
    Object.values(highlightCounts).some(count => count > 0)
  ), [highlightCounts]);

  const highlightLabels = useMemo(() => ({
    me: 'My Providers',
    partner: 'Partners',
    competitor: 'Competitors',
    target: 'Targets'
  }), []);

  const highlightSelectionSet = useMemo(() => new Set(highlightTagTypes), [highlightTagTypes]);

  const highlightTriggerLabel = useMemo(() => {
    if (!highlightTagTypes || highlightTagTypes.length === 0) return 'Highlight Providers';
    if (highlightTagTypes.length === 1) {
      const type = highlightTagTypes[0];
      const label = highlightLabels[type] || type;
      return `Highlight: ${label}`;
    }
    return `Highlight: ${highlightTagTypes.length} types`;
  }, [highlightTagTypes, highlightLabels]);

  const highlightedDhcByType = useMemo(() => {
    if (!providerTags || highlightTagTypes.length === 0) return new Map();
    const map = new Map();
    highlightTagTypes.forEach(type => {
      const entries = providerTags?.[type] || [];
      entries.forEach(item => {
        const dhcKey = item?.provider_dhc ? String(item.provider_dhc) : null;
        if (!dhcKey) return;
        if (!map.has(dhcKey)) {
          map.set(dhcKey, new Set());
        }
        map.get(dhcKey).add(type);
      });
    });
    return map;
  }, [providerTags, highlightTagTypes]);

  const highlightedDhcKeys = useMemo(() => Array.from(highlightedDhcByType.keys()), [highlightedDhcByType]);

  // Find the selected provider from URL params or use manual providers
  const storyTellerProvider = useMemo(() => {
    // If a provider is selected via URL param, find it in combined providers
    if (selectedProviderDhc) {
      const foundProvider = combinedNearbyProviders.find(p => {
        const dhcKey = p?.dhc ? String(p.dhc) : null;
        return dhcKey === String(selectedProviderDhc);
      });
      if (foundProvider) {
        return foundProvider;
      }
    }
    
    // Fallback to manual providers if no URL selection
    if (manualProviders.length > 0) {
      return manualProviders[0];
    }
    return null;
  }, [selectedProviderDhc, combinedNearbyProviders, manualProviders]);

  // Clear all selections
  const handleClearAll = () => {
    setSelectedCcns([]);
    setSelectedMarket(null);
    setMarketDhcCcns([]);
    setSelectedTag(null);
    setTagDhcCcns([]);
    setMarketProviders([]);
    setTagProviders([]);
    setCcnInput('');
    setManualProviderDetails({});
    setShowMyKpisOnly(false);
    setHighlightTagTypes([]);
    setHighlightDropdownOpen(false);
  };

  const fetchManualProviderDetails = useCallback(async (ccnsToFetch) => {
    const normalized = (ccnsToFetch || [])
      .map(ccn => String(ccn).trim())
      .filter(Boolean);
    if (normalized.length === 0) return;

    const uniqueCcns = Array.from(new Set(normalized));

    try {
      const response = await fetch(apiUrl('/api/provider-of-services'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: { PRVDR_NUM: uniqueCcns },
          limit: uniqueCcns.length
        })
      });

      if (!response.ok) {
        console.error('Failed to fetch provider details for CCNs:', uniqueCcns, response.statusText);
        return null;
      }

      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        console.warn('No provider-of-services data for CCNs:', uniqueCcns);
        return null;
      }

      const detailsMap = {};
      result.data.forEach(item => {
        const ccn = item?.PRVDR_NUM ? String(item.PRVDR_NUM) : null;
        if (!ccn) return;
        detailsMap[ccn] = {
          ...item,
          name: item?.FAC_NAME || `CCN ${ccn}`
        };
      });

      return detailsMap;
    } catch (error) {
      console.error('Error loading provider-of-services details for CCNs:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const missingCcns = selectedCcns.filter(ccn => !manualProviderDetails[ccn]);
    if (missingCcns.length === 0) return;

    let isMounted = true;

    (async () => {
      const details = await fetchManualProviderDetails(missingCcns);
      if (!isMounted || !details || Object.keys(details).length === 0) return;
      setManualProviderDetails(prev => ({
        ...prev,
        ...details
      }));
      setProviderLabelMap(prev => {
        const updates = {};
        Object.entries(details).forEach(([ccnValue, info]) => {
          const label = info?.FAC_NAME || info?.name || `CCN ${ccnValue}`;
          updates[`ccn:${ccnValue}`] = label;
        });
        if (Object.keys(updates).length === 0) return prev;
        return {
          ...prev,
          ...updates
        };
      });
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedCcns, manualProviderDetails, fetchManualProviderDetails]);

  // Remove any clear buttons added by global script when input is empty
  useEffect(() => {
    if (ccnInputRef.current) {
      const clearBtn = ccnInputRef.current.parentNode?.querySelector('.clearButton');
      if (!ccnInput || !ccnInput.trim()) {
        // Remove clear button if input is empty (only if it's not our React-managed one)
        if (clearBtn && clearBtn.parentNode && !clearBtn.hasAttribute('data-react-clear')) {
          clearBtn.remove();
        }
      }
    }
  }, [ccnInput]);

  return (
    <div className={styles.container}>
      {/* Filter Controls Bar */}
      <div className={styles.controlsBar}>
        {/* CCN Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
          <div className="searchBarContainer" style={{ width: '300px' }}>
            <input
              ref={ccnInputRef}
              type="text"
              placeholder="Enter CCN..."
              value={ccnInput}
              onChange={(e) => setCcnInput(e.target.value)}
              onKeyPress={handleCcnKeyPress}
              className="searchInput"
              data-search-enhanced="true"
              style={{ width: '100%', paddingLeft: '12px', paddingRight: (ccnInput && ccnInput.trim().length > 0) ? '40px' : '12px' }}
            />
            {ccnInput && ccnInput.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setCcnInput('')}
                className="clearButton"
                data-react-clear="true"
                title="Clear"
                style={{ right: '8px' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleCcnAdd}
            className="sectionHeaderButton"
            disabled={!ccnInput || !ccnInput.trim()}
            title="Add CCN"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>

        {/* My Network */}
        {providerTags && (() => {
          const NetworkIcon = getSegmentationIcon('network');
          return (
            <Dropdown
              trigger={
                <button type="button" className="sectionHeaderButton">
                  {NetworkIcon && <NetworkIcon {...getSegmentationIconProps({ size: 14 })} />}
                  {selectedTag ? 
                    `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} (${tagDhcCcns.length})` : 
                    'My Network'}
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
          );
        })()}

        {/* My Markets */}
        {savedMarkets.length > 0 && (() => {
          const MarketsIcon = getSegmentationIcon('savedMarkets');
          return (
            <Dropdown
              trigger={
                <button type="button" className="sectionHeaderButton">
                  {MarketsIcon && <MarketsIcon {...getSegmentationIconProps({ size: 14 })} />}
                  {selectedMarket ? 
                    `${selectedMarket.name} (${marketDhcCcns.length})` : 
                    'My Markets'}
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
                <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                  {market.city}, {market.state} • {market.radius_miles} mi
                </div>
              </button>
            ))}
          </Dropdown>
          );
        })()}

        {/* Vertical Separator */}
        <div style={{ width: '1px', height: '24px', background: 'var(--gray-300)', margin: '0 8px' }}></div>

        {/* Highlight Providers */}
        {hasHighlightOptions && (
          <Dropdown
            trigger={
              <button
                type="button"
                className={`sectionHeaderButton ${highlightTagTypes.length > 0 ? styles.activeFilterButton : ''}`}
              >
                <FilterIcon size={14} />
                {highlightTriggerLabel}
                <ChevronDown size={14} />
              </button>
            }
            isOpen={highlightDropdownOpen}
            onToggle={setHighlightDropdownOpen}
            className={styles.dropdownMenu}
          >
            <button
              className={styles.dropdownItem}
              onClick={() => {
                setHighlightTagTypes([]);
                setHighlightDropdownOpen(false);
              }}
              style={{
                fontWeight: highlightTagTypes.length === 0 ? '600' : '500',
                background: highlightTagTypes.length === 0 ? 'rgba(38, 89, 71, 0.08)' : 'none'
              }}
            >
              No Highlight
            </button>
            {highlightCounts.me > 0 && (
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setHighlightTagTypes(prev => (
                    prev.includes('me') ? prev.filter(type => type !== 'me') : [...prev, 'me']
                  ));
                }}
                style={{
                  fontWeight: highlightSelectionSet.has('me') ? '600' : '500',
                  background: highlightSelectionSet.has('me') ? 'rgba(38, 89, 71, 0.08)' : 'none'
                }}
              >
                Highlight My Providers ({highlightCounts.me})
              </button>
            )}
            {highlightCounts.partner > 0 && (
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setHighlightTagTypes(prev => (
                    prev.includes('partner') ? prev.filter(type => type !== 'partner') : [...prev, 'partner']
                  ));
                }}
                style={{
                  fontWeight: highlightSelectionSet.has('partner') ? '600' : '500',
                  background: highlightSelectionSet.has('partner') ? 'rgba(38, 89, 71, 0.08)' : 'none'
                }}
              >
                Highlight Partners ({highlightCounts.partner})
              </button>
            )}
            {highlightCounts.competitor > 0 && (
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setHighlightTagTypes(prev => (
                    prev.includes('competitor') ? prev.filter(type => type !== 'competitor') : [...prev, 'competitor']
                  ));
                }}
                style={{
                  fontWeight: highlightSelectionSet.has('competitor') ? '600' : '500',
                  background: highlightSelectionSet.has('competitor') ? 'rgba(38, 89, 71, 0.08)' : 'none'
                }}
              >
                Highlight Competitors ({highlightCounts.competitor})
              </button>
            )}
            {highlightCounts.target > 0 && (
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setHighlightTagTypes(prev => (
                    prev.includes('target') ? prev.filter(type => type !== 'target') : [...prev, 'target']
                  ));
                }}
                style={{
                  fontWeight: highlightSelectionSet.has('target') ? '600' : '500',
                  background: highlightSelectionSet.has('target') ? 'rgba(38, 89, 71, 0.08)' : 'none'
                }}
              >
                Highlight Targets ({highlightCounts.target})
              </button>
            )}
          </Dropdown>
        )}

        {/* Use My Metrics */}
        <button
          type="button"
          onClick={() => setShowMyKpisOnly(prev => !prev)}
          className={`sectionHeaderButton ${showMyKpisOnly ? styles.activeFilterButton : ''} ${(!kpiTagsLoading && myKpiCodes.length === 0) ? styles.disabledFilterButton : ''}`}
          disabled={(!kpiTagsLoading && myKpiCodes.length === 0)}
          title={(!kpiTagsLoading && myKpiCodes.length === 0) ? 'Tag metrics to enable this filter' : undefined}
        >
          {showMyKpisOnly ? 'Using My Metrics' : 'Use My Metrics'}
        </button>

        {/* Clear All Button */}
        {hasParameters && (
          <button type="button" onClick={handleClearAll} className="sectionHeaderButton" style={{ flexShrink: 0 }}>
            <X size={14} />
            Clear All
          </button>
        )}

        <div className={styles.spacer}></div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasParameters && (
        <div className={styles.activeFiltersBar}>
          <div className={styles.activeFilters}>
            <span className={styles.filtersLabel}>Filters:</span>
            {selectedMarket && (
              <div className={styles.filterChip}>
                <span>{selectedMarket.name}</span>
                <button onClick={() => handleMarketSelect('')}>
                  <X size={12} />
                </button>
              </div>
            )}
            {selectedTag && (
              <div className={styles.filterChip}>
                <span>{selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)}</span>
                <button onClick={() => handleTagSelect('')}>
                  <X size={12} />
                </button>
              </div>
            )}
            {showMyKpisOnly && (
              <div className={styles.filterChip}>
                <span>My Metrics ({myKpiCodes.length})</span>
                <button onClick={() => setShowMyKpisOnly(false)}>
                  <X size={12} />
                </button>
              </div>
            )}
            {selectedCcns.map((ccn) => (
              <div key={ccn} className={styles.filterChip}>
                <span>
                  {manualProviderDetails[ccn]?.FAC_NAME || `CCN ${ccn}`}
                  {manualProviderDetails[ccn]?.FAC_NAME ? ` • CCN ${ccn}` : ''}
                </span>
                <button onClick={() => handleCcnRemove(ccn)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className={styles.content}>
        {selectedTag && tagDhcCcns.length > 0 && combinedNearbyProviders.length === 0 ? (
          <div className={styles.loadingState}>
            <Spinner />
            <p>Loading network results…</p>
          </div>
        ) : !hasParameters ? (
          <div className={styles.emptyState}>
            <h2>Select Parameters to View Quality Measures</h2>
            <p>Use the filters above to select providers, markets, network tags, or enter CCNs directly.</p>
          </div>
        ) : (
          <Storyteller
            provider={storyTellerProvider}
            radiusInMiles={selectedMarket?.radius_miles || 10}
            nearbyProviders={combinedNearbyProviders}
            nearbyDhcCcns={allDhcCcns}
            mainProviderCcns={storytellerFocusedCcns}
            prefetchedData={null}
            providerLabels={providerLabelMap}
            showMyKpisOnly={showMyKpisOnly}
            myKpiCodes={myKpiCodes}
            highlightedDhcKeys={highlightedDhcKeys}
            highlightedDhcByType={highlightedDhcByType}
            highlightTagTypes={highlightTagTypes}
            highlightPrimaryProvider={false}
          />
        )}
      </div>
    </div>
  );
}
