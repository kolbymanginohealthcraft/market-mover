import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import styles from "./ProviderSearch.module.css";
import PageLayout from "../../../components/Layouts/PageLayout";
import Spinner from "../../../components/Buttons/Spinner";
import Dropdown from "../../../components/Buttons/Dropdown";
import ControlsRow from "../../../components/Layouts/ControlsRow";
import { apiUrl } from '../../../utils/api';
import { trackProviderSearch } from '../../../utils/activityTracker';
import { supabase } from '../../../app/supabaseClient';
import useTeamProviderTags from '../../../hooks/useTeamProviderTags';
import { useUserTeam } from '../../../hooks/useUserTeam';
import { useDropdownClose } from '../../../hooks/useDropdownClose';
import { getTagColor, getTagLabel } from '../../../utils/tagColors';
import { ProviderTagBadge } from '../../../components/Tagging/ProviderTagBadge';
import {
  Search,
  MapPin,
  Building2,
  Users,
  Shield,
  Star,
  Filter,
  X,
  Plus,
  Minus,
  Lock,
  ChevronDown,
  ChevronUp,
  Play,
  List,
  BarChart3,
  Database,
  Download,
  Bookmark
} from 'lucide-react';
import { sanitizeProviderName } from "../../../utils/providerName";
import { getSegmentationIcon, getSegmentationIconProps } from '../../../utils/segmentationIcons';

export default function ProviderSearch() {
  const navigate = useNavigate();
  const location = useLocation();

  const [queryText, setQueryText] = useState("");
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(""); // Track the actual search term applied to results
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(100);
  const [map, setMap] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [componentError, setComponentError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, listing
  
  // Markets
  const [savedMarkets, setSavedMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);

  // My Taxonomies
  const [taxonomyTags, setTaxonomyTags] = useState([]);
  const [selectedTaxonomyTag, setSelectedTaxonomyTag] = useState(null);
  const [taxonomyDropdownOpen, setTaxonomyDropdownOpen] = useState(false);
  const [taxonomyTagDetails, setTaxonomyTagDetails] = useState({}); // Map of taxonomy_code -> details
  const [selectedTaxonomyCodes, setSelectedTaxonomyCodes] = useState([]);
  

  // Filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedHospitalSubtypes, setSelectedHospitalSubtypes] = useState([]);
  const [selectedPhysicianGroupSpecialties, setSelectedPhysicianGroupSpecialties] = useState([]);
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  
  // Fetched subtypes/specialties (optimized from server)
  const [fetchedHospitalSubtypes, setFetchedHospitalSubtypes] = useState([]);
  const [fetchedPhysicianGroupSpecialties, setFetchedPhysicianGroupSpecialties] = useState([]);
  const [loadingSubtypes, setLoadingSubtypes] = useState(false);

  // Collapsible filter sections
  const [expandedSections, setExpandedSections] = useState({
    types: false,
    hospitalSubtypes: false,
    physicianGroupSpecialties: false,
    networks: false,
    cities: false,
    states: false,
    network: false,
    markets: false
  });

  // Show/hide filters sidebar
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);

  // My Network and Saved Markets filters
  const [marketNPIs, setMarketNPIs] = useState(null);
  const [providerTags, setProviderTags] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagNPIs, setTagNPIs] = useState(null);

  const searchInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const lastTrackedSearch = useRef("");
  const bulkDropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const escapeTimeoutRef = useRef(null);
  const [escapeCount, setEscapeCount] = useState(0);

  // Selection and bulk actions
  const [selectedProviders, setSelectedProviders] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Tagging state
  const [taggingProviderId, setTaggingProviderId] = useState(null);

  // Team provider tags functionality
  const {
    hasTeamProviderTag,
    getProviderTags,
    addTeamProviderTag,
    removeTeamProviderTag
  } = useTeamProviderTags();

  // Check if user has a team
  const { hasTeam } = useUserTeam();

  // Error boundary for the component
  if (componentError) {
    return (
      <PageLayout>
        <div className={styles.container}>
        <div className={styles.searchHeader}>
          <h2>Search Error</h2>
        </div>
        <div className={styles.mainContent}>
          <div className={styles.error}>
            <p>Something went wrong with the search page.</p>
            <button onClick={() => setComponentError(null)}>Try Again</button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Focus search input on page load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Keyboard shortcut to toggle Filters pane (] key)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger if ']' key is pressed without modifiers
      if (
        event.key === ']' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        event.stopPropagation();
        setShowFiltersSidebar((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Load national overview, filter options, and first 500 results on mount
  useEffect(() => {
    const loadNationalOverview = async () => {
      setLoadingOverview(true);
      try {
        const response = await fetch(apiUrl('/api/search-providers-vendor/national-overview'));
        if (!response.ok) {
          setLoadingOverview(false);
          return;
        }

        const result = await response.json();
        if (result.success && result.data) {
          setNationalOverview(result.data);
          
          // Set filter options from national overview (sorted alphabetically)
          setFilterOptions({
            types: (result.data.filterOptions?.types || []).slice().sort(),
            networks: (result.data.filterOptions?.networks || []).slice().sort(),
            cities: (result.data.filterOptions?.cities || []).slice().sort(),
            states: (result.data.filterOptions?.states || []).slice().sort()
          });

          // Store counts if available from breakdowns
          const typeCounts = {};
          const stateCounts = {};
          if (result.data.breakdowns?.types) {
            result.data.breakdowns.types.forEach(item => {
              typeCounts[item.name] = item.count;
            });
          }
          if (result.data.breakdowns?.states) {
            result.data.breakdowns.states.forEach(item => {
              stateCounts[item.name] = item.count;
            });
          }
          setFilterOptionCounts({
            types: typeCounts,
            networks: {},
            cities: {},
            states: stateCounts
          });
        }
      } catch (err) {
        console.error("Error loading national overview:", err);
      } finally {
        setLoadingOverview(false);
      }
    };

    const loadInitialResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl('/api/search-providers-vendor?limit=500'));
        if (!response.ok) {
          setLoading(false);
          return;
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setResults(result.data);
          setHasSearched(true);
          
          // Update filter options from initial results
          const types = Array.from(new Set(result.data.map(p => p.type || "Unknown").filter(Boolean))).sort();
          const networks = Array.from(new Set(result.data.map(p => p.network).filter(Boolean))).sort();
          const cities = Array.from(new Set(result.data.map(p => p.city).filter(Boolean))).sort();
          const states = Array.from(new Set(result.data.map(p => p.state).filter(Boolean))).sort();

          setFilterOptions({
            types,
            networks,
            cities,
            states
          });
        }
      } catch (err) {
        console.error("Error loading initial results:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNationalOverview();
    loadInitialResults();
  }, []);

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
        
        const grouped = {
          me: tags.filter(t => t.tag_type === 'me'),
          partner: tags.filter(t => t.tag_type === 'partner'),
          competitor: tags.filter(t => t.tag_type === 'competitor'),
          target: tags.filter(t => t.tag_type === 'target')
        };
        
        setProviderTags(grouped);
      } catch (err) {
        console.error('Error fetching provider tags:', err);
      }
    }
    
    fetchMarkets();
    fetchProviderTags();
    fetchTaxonomyTags();
  }, []);

  const fetchTaxonomyTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('id', user.id)
        .single();

      if (!profile?.team_id) {
        setTaxonomyTags([]);
        return;
      }

      const { data, error } = await supabase
        .from('team_taxonomy_tags')
        .select('*')
        .eq('team_id', profile.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTaxonomyTags(data || []);

      // Fetch taxonomy details for all taxonomy codes
      if (data && data.length > 0) {
        const codes = [...new Set(data.map(tag => tag.taxonomy_code))];
        try {
          const detailsResponse = await fetch('/api/taxonomies-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codes })
          });

          const detailsResult = await detailsResponse.json();
          if (detailsResult.success) {
            const detailsMap = {};
            detailsResult.data.forEach(detail => {
              detailsMap[detail.code] = detail;
            });
            setTaxonomyTagDetails(detailsMap);
          }
        } catch (detailsErr) {
          console.error('Error fetching taxonomy details:', detailsErr);
        }
      }
    } catch (err) {
      console.error('Error fetching taxonomy tags:', err);
    }
  };

  const handleTaxonomyTagSelect = (tagId) => {
    if (!tagId) {
      setSelectedTaxonomyTag(null);
      setSelectedTaxonomyCodes([]);
      return;
    }
    
    const tag = taxonomyTags.find(t => t.id === tagId);
    if (tag) {
      setSelectedTaxonomyTag(tag);
      setSelectedTaxonomyCodes([tag.taxonomy_code]);
    }
  };

  // Fetch subtypes/specialties from optimized endpoint
  const fetchSubtypes = async (providerType) => {
    if (providerType !== 'Physician Group' && providerType !== 'Hospital') {
      return;
    }

    setLoadingSubtypes(true);
    try {
      // Build query params with current filters
      const params = new URLSearchParams();
      params.append('providerType', providerType);
      
      if (submittedSearchTerm) {
        params.append('search', submittedSearchTerm);
      }
      
      // Add current filter values
      if (selectedTypes.length > 0) {
        selectedTypes.forEach(type => params.append('types', type));
      }
      if (selectedNetworks.length > 0) {
        selectedNetworks.forEach(network => params.append('networks', network));
      }
      if (selectedCities.length > 0) {
        selectedCities.forEach(city => params.append('cities', city));
      }
      if (selectedStates.length > 0) {
        selectedStates.forEach(state => params.append('states', state));
      }
      if (selectedTaxonomyCodes.length > 0) {
        selectedTaxonomyCodes.forEach(code => params.append('taxonomyCodes', code));
      }
      
      // Add tag filter (DHC IDs)
      if (selectedTag && tagNPIs) {
        const dhcIds = providerTags && providerTags[selectedTag] 
          ? providerTags[selectedTag].map(t => t.provider_dhc)
          : [];
        dhcIds.forEach(dhc => params.append('dhcs', dhc));
      }
      
      // Add market filter (location)
      if (selectedMarket) {
        const market = savedMarkets.find(m => m.id === selectedMarket);
        if (market) {
          params.append('lat', market.latitude);
          params.append('lon', market.longitude);
          params.append('radius', market.radius_miles);
        }
      }

      const response = await fetch(apiUrl(`/api/search-providers-vendor/subtypes?${params.toString()}`));
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        if (providerType === 'Hospital') {
          setFetchedHospitalSubtypes(result.data);
        } else {
          setFetchedPhysicianGroupSpecialties(result.data);
        }
      }
    } catch (err) {
      console.error(`Error fetching ${providerType} subtypes:`, err);
      // On error, fall back to empty array (subtypes will be empty)
      if (providerType === 'Hospital') {
        setFetchedHospitalSubtypes([]);
      } else {
        setFetchedPhysicianGroupSpecialties([]);
      }
    } finally {
      setLoadingSubtypes(false);
    }
  };

  // Enhanced dropdown close hook that includes button toggle behavior
  const handleDropdownClose = () => {
    setTaggingProviderId(null);
  };

  // Use enhanced dropdown close hook for bulk actions dropdown
  const { buttonRef: bulkButtonRef } = useDropdownClose({
    ref: bulkDropdownRef,
    closeCallback: handleDropdownClose,
    isOpen: taggingProviderId === 'bulk'
  });

  // Handle button toggle behavior for bulk actions
  const handleBulkButtonClick = () => {
    if (taggingProviderId === 'bulk') {
      setTaggingProviderId(null);
    } else {
      setTaggingProviderId('bulk');
    }
  };

  // Handle button toggle behavior for individual tag buttons
  const handleTagButtonClick = (providerId, event) => {
    if (taggingProviderId === providerId) {
      setTaggingProviderId(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 5,
        left: rect.left
      });
      setTaggingProviderId(providerId);
    }
  };

  // Use enhanced dropdown close hook for individual tag dropdowns
  useDropdownClose({
    dropdownSelector: `.${styles.dropdown}`,
    buttonSelector: `.${styles.tagButton}`,
    closeCallback: () => setTaggingProviderId(null),
    isOpen: taggingProviderId && taggingProviderId !== 'bulk'
  });

  // Handle market selection
  const handleMarketSelect = async (marketId) => {
    setSelectedMarket(null);
    setMarketNPIs(null);
    
    if (!marketId) {
      return;
    }
    
    const market = savedMarkets.find(m => m.id === marketId);
    if (!market) return;
    
    setSelectedMarket(marketId);
    
    try {
      const lat = parseFloat(market.latitude);
      const lon = parseFloat(market.longitude);
      const radius = market.radius_miles;
      
      const response = await fetch(
        apiUrl(`/api/nearby-providers?lat=${lat}&lon=${lon}&radius=${radius}`)
      );
      
      const result = await response.json();
      if (!result.success) throw new Error('Failed to fetch market providers');
      
      const providers = result.data || [];
      const dhcs = providers.map(p => p.dhc).filter(Boolean);
      setMarketNPIs(dhcs.length > 0 ? dhcs : []);
    } catch (err) {
      console.error('Error loading market providers:', err);
      setMarketNPIs([]);
    }
  };

  // Handle tag selection
  const handleTagSelect = async (tagType) => {
    setSelectedTag(null);
    setTagNPIs(null);
    
    if (!tagType) {
      return;
    }
    
    setSelectedTag(tagType);
    
    try {
      const taggedProviders = providerTags[tagType] || [];
      if (taggedProviders.length === 0) {
        setTagNPIs([]);
        return;
      }
      
      const dhcs = taggedProviders.map(t => t.provider_dhc).filter(Boolean);
      setTagNPIs(dhcs);
    } catch (err) {
      console.error('Error loading tagged providers:', err);
      setTagNPIs([]);
    }
  };

  // Auto-search when filters change (except search term which requires submit)
  // Refetch subtypes when filters change (if Hospital or Physician Group is selected)
  useEffect(() => {
    if (selectedTypes.includes('Hospital')) {
      fetchSubtypes('Hospital');
    }
    if (selectedTypes.includes('Physician Group')) {
      fetchSubtypes('Physician Group');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedSearchTerm, selectedTypes, selectedNetworks, selectedCities, selectedStates, selectedTaxonomyCodes, selectedTag, selectedMarket]);

  useEffect(() => {
    // Check if we have any active filters (excluding search term)
    const hasFilters = selectedTypes.length > 0 || selectedNetworks.length > 0 ||
      selectedCities.length > 0 || selectedStates.length > 0 || selectedTag || selectedMarket || selectedTaxonomyCodes.length > 0;
    
    // Use submitted search term (what's actually applied), not the typing queryText
    const q = submittedSearchTerm.trim();
    
    // Always search - if no filters or search term, get first 500 results
    // Pass the submitted search term to maintain it during filter changes
    handleSearch(submittedSearchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTag, selectedMarket, selectedTypes, selectedNetworks, selectedCities, selectedStates, selectedTaxonomyCodes]);

  const handleSearch = async (searchTerm = null, fromUrl = false, overrideState = null) => {
    const requestId = ++latestSearchRequestRef.current;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setHasSearched(true);

    // Determine the search term to use
    let q;
    if (searchTerm !== null) {
      // Explicitly passed search term (could be empty string to clear)
      q = searchTerm;
      setSubmittedSearchTerm(searchTerm);
    } else {
      // No search term passed, use current queryText (user clicked search button)
      q = queryText.trim();
      setSubmittedSearchTerm(q);
    }
    
    // Check if we have any active filters (excluding the search term we're about to set)
    const currentSelectedTypes = overrideState?.selectedTypes ?? selectedTypes;
    const currentSelectedNetworks = overrideState?.selectedNetworks ?? selectedNetworks;
    const currentSelectedCities = overrideState?.selectedCities ?? selectedCities;
    const currentSelectedStates = overrideState?.selectedStates ?? selectedStates;
    const currentSelectedTaxonomyCodes = overrideState?.selectedTaxonomyCodes ?? selectedTaxonomyCodes;
    const currentSelectedTag = overrideState?.selectedTag ?? selectedTag;
    const currentTagNPIs = overrideState?.tagNPIs !== undefined ? overrideState.tagNPIs : tagNPIs;
    const currentSelectedMarket = overrideState?.selectedMarket ?? selectedMarket;

    const hasFilters = currentSelectedTypes.length > 0 || currentSelectedNetworks.length > 0 ||
      currentSelectedCities.length > 0 || currentSelectedStates.length > 0 || currentSelectedTaxonomyCodes.length > 0 || currentSelectedTag || currentSelectedMarket;
    
    // Always allow search - if no search term or filters, get first 500 results
    // No need to return early - always fetch results

    if (q) {
      setLastSearchTerm(q);
    }

    try {
      // Build query params
      // NOTE: We fetch ALL matching results for overview calculations
      // Listing tab will be limited to first 500 results for display
      const params = new URLSearchParams();
      if (q) {
        params.append('search', q);
      }
      // If no search term and no filters, limit to first 500 for listing
      // (overview will use national overview which reflects entire database)
      if (!q && !hasFilters) {
        params.append('limit', '500');
      }
      // Otherwise, fetch all matching results (no limit) so overview reflects full dataset
      
      // Add filter parameters
      if (currentSelectedTypes.length > 0) {
        currentSelectedTypes.forEach(type => params.append('types', type));
      }
      if (currentSelectedNetworks.length > 0) {
        currentSelectedNetworks.forEach(network => params.append('networks', network));
      }
      if (currentSelectedCities.length > 0) {
        currentSelectedCities.forEach(city => params.append('cities', city));
      }
      if (currentSelectedStates.length > 0) {
        currentSelectedStates.forEach(state => params.append('states', state));
      }
      if (currentSelectedTaxonomyCodes.length > 0) {
        currentSelectedTaxonomyCodes.forEach(code => params.append('taxonomyCodes', code));
      }

      // Add tag filter (DHC IDs)
      if (currentSelectedTag && currentTagNPIs) {
        const dhcIds = providerTags[currentSelectedTag].map(t => t.provider_dhc);
        dhcIds.forEach(dhc => params.append('dhcs', dhc));
      }

      // Add market filter (location)
      if (currentSelectedMarket) {
        const market = savedMarkets.find(m => m.id === currentSelectedMarket);
        if (market) {
          params.append('lat', market.latitude);
          params.append('lon', market.longitude);
          params.append('radius', market.radius_miles);
        }
      }

      const response = await fetch(apiUrl(`/api/search-providers-vendor?${params.toString()}`));

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        if (requestId !== latestSearchRequestRef.current) {
          return;
        }
        setResults(result.data);
        // Always update filter options from search results (even if empty)
        // This ensures filter options update correctly when filters are changed/cleared
        const types = Array.from(new Set(result.data.map(p => p.type || "Unknown").filter(Boolean))).sort();
        const networks = Array.from(new Set(result.data.map(p => p.network).filter(Boolean))).sort();
        const cities = Array.from(new Set(result.data.map(p => p.city).filter(Boolean))).sort();
        const states = Array.from(new Set(result.data.map(p => p.state).filter(Boolean))).sort();

        setFilterOptions({
          types,
          networks,
          cities,
          states
        });

        // Update filter counts from search results
        if (result.data.length > 0) {
          const typeCounts = {};
          const stateCounts = {};
          types.forEach(type => {
            typeCounts[type] = result.data.filter(p => (p.type || "Unknown") === type).length;
          });
          states.forEach(state => {
            stateCounts[state] = result.data.filter(p => p.state === state).length;
          });
          setFilterOptionCounts(prev => ({
            ...prev,
            types: typeCounts,
            states: stateCounts
          }));
        }
        if (lastTrackedSearch.current !== q) {
          await trackProviderSearch(q, result.data.length);
          lastTrackedSearch.current = q;
        }
      } else {
        if (requestId !== latestSearchRequestRef.current) {
          return;
        }
        setError(result.error || 'No results found');
        setResults([]);
        if (lastTrackedSearch.current !== q) {
          await trackProviderSearch(q, 0);
          lastTrackedSearch.current = q;
        }
      }
    } catch (err) {
      console.error("💥 Search error:", err);
      if (requestId !== latestSearchRequestRef.current) {
        return;
      }
      setError(err.message);
      setResults([]);
      if (lastTrackedSearch.current !== q) {
        await trackProviderSearch(q, 0);
        lastTrackedSearch.current = q;
      }
    }

    if (requestId === latestSearchRequestRef.current) {
      setLoading(false);
    }
  };

  // Filter options state - populated from national overview or search results
  const [filterOptions, setFilterOptions] = useState({
    types: [],
    networks: [],
    cities: [],
    states: []
  });

  // Filter option counts (for displaying counts in filters)
  const [filterOptionCounts, setFilterOptionCounts] = useState({
    types: {},
    networks: {},
    cities: {},
    states: {}
  });
  const latestSearchRequestRef = useRef(0);

  // National overview state for summary before search
  const [nationalOverview, setNationalOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Apply filters to results
  const filteredResults = results.filter(provider => {
    if (selectedTypes.length > 0) {
      const providerType = provider.type || "Unknown";
      if (!selectedTypes.includes(providerType)) {
        return false;
      }
      
      // If Hospital is selected and hospital subtypes are selected, filter by subtypes
      if (providerType === 'Hospital' && selectedHospitalSubtypes.length > 0) {
        const taxonomy = provider.primary_taxonomy_classification || '';
        // Check if the provider's taxonomy exactly matches one of the selected subtypes
        if (!selectedHospitalSubtypes.includes(taxonomy)) {
          return false;
        }
      }
      
      // If Physician Group is selected and physician group specialties are selected, filter by specialties
      if (providerType === 'Physician Group' && selectedPhysicianGroupSpecialties.length > 0) {
        const specialty = provider.primary_taxonomy_consolidated_specialty || '';
        // Check if the provider's specialty exactly matches one of the selected specialties
        if (!selectedPhysicianGroupSpecialties.includes(specialty)) {
          return false;
        }
      }
    }
    if (selectedNetworks.length > 0 && !selectedNetworks.includes(provider.network)) {
      return false;
    }
    if (selectedCities.length > 0 && !selectedCities.includes(provider.city)) {
      return false;
    }
    if (selectedStates.length > 0 && !selectedStates.includes(provider.state)) {
      return false;
    }
    return true;
  });

  // Extract unique filter options from RESULTS (unfiltered API results)
  // This ensures filter options update correctly when filters are cleared
  const allTypes = results.length > 0 
    ? Array.from(new Set(results.map(p => p.type || "Unknown").filter(Boolean))).sort()
    : filterOptions.types;
  
  // Use fetched hospital subtypes (optimized from server) instead of extracting from results
  const hospitalSubtypes = selectedTypes.includes('Hospital')
    ? fetchedHospitalSubtypes
    : [];

  // Use fetched physician group specialties (optimized from server) instead of extracting from results
  const physicianGroupSpecialties = selectedTypes.includes('Physician Group')
    ? fetchedPhysicianGroupSpecialties
    : [];
  
  const allNetworks = results.length > 0
    ? Array.from(new Set(results.map(p => p.network).filter(Boolean))).sort()
    : filterOptions.networks;
  const allCities = results.length > 0
    ? Array.from(new Set(results.map(p => p.city).filter(Boolean))).sort()
    : filterOptions.cities;
  const allStates = results.length > 0
    ? Array.from(new Set(results.map(p => p.state).filter(Boolean))).sort()
    : filterOptions.states;


  // Filter functions
  const toggleType = (type) => {
    setSelectedTypes(prev => {
      const newTypes = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      // If Hospital is being deselected, clear hospital subtypes
      if (type === 'Hospital' && prev.includes('Hospital')) {
        setSelectedHospitalSubtypes([]);
        setFetchedHospitalSubtypes([]);
        setExpandedSections(prev => ({ ...prev, hospitalSubtypes: false }));
      } else if (type === 'Hospital' && !prev.includes('Hospital')) {
        // Auto-expand hospital subtypes when Hospital is first selected
        setExpandedSections(prev => ({ ...prev, hospitalSubtypes: true }));
        // Fetch subtypes from optimized endpoint
        fetchSubtypes('Hospital');
      }
      // If Physician Group is being deselected, clear physician group specialties
      if (type === 'Physician Group' && prev.includes('Physician Group')) {
        setSelectedPhysicianGroupSpecialties([]);
        setFetchedPhysicianGroupSpecialties([]);
        setExpandedSections(prev => ({ ...prev, physicianGroupSpecialties: false }));
      } else if (type === 'Physician Group' && !prev.includes('Physician Group')) {
        // Auto-expand physician group specialties when Physician Group is first selected
        setExpandedSections(prev => ({ ...prev, physicianGroupSpecialties: true }));
        // Fetch specialties from optimized endpoint
        fetchSubtypes('Physician Group');
      }
      return newTypes;
    });
  };

  const toggleHospitalSubtype = (subtype) => {
    setSelectedHospitalSubtypes(prev =>
      prev.includes(subtype) ? prev.filter(s => s !== subtype) : [...prev, subtype]
    );
  };

  const togglePhysicianGroupSpecialty = (specialty) => {
    setSelectedPhysicianGroupSpecialties(prev =>
      prev.includes(specialty) ? prev.filter(s => s !== specialty) : [...prev, specialty]
    );
  };

  const toggleNetwork = (network) => {
    setSelectedNetworks(prev =>
      prev.includes(network) ? prev.filter(n => n !== network) : [...prev, network]
    );
  };

  const toggleCity = (city) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const toggleState = (state) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedHospitalSubtypes([]);
    setSelectedPhysicianGroupSpecialties([]);
    setFetchedHospitalSubtypes([]);
    setFetchedPhysicianGroupSpecialties([]);
    setSelectedNetworks([]);
    setSelectedCities([]);
    setSelectedStates([]);
    setSelectedTaxonomyCodes([]);
    setSelectedTaxonomyTag(null);
    setSelectedTag(null);
    setTagNPIs(null);
    setSelectedMarket(null);
    setMarketNPIs(null);
    setQueryText("");
    setSubmittedSearchTerm("");
    setError(null);
    setCurrentPage(1);
    // Reset to default state - load first 500 results
    // The useEffect will trigger handleSearch which will fetch first 500 results
    // Reload national overview filter options when clearing all
    // This ensures filter choices are restored to full dataset
    const loadNationalFilterOptions = async () => {
      try {
        const response = await fetch(apiUrl('/api/search-providers-vendor/national-overview'));
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.filterOptions) {
            setFilterOptions({
              types: (result.data.filterOptions?.types || []).slice().sort(),
              networks: (result.data.filterOptions?.networks || []).slice().sort(),
              cities: (result.data.filterOptions?.cities || []).slice().sort(),
              states: (result.data.filterOptions?.states || []).slice().sort()
            });
          }
        }
      } catch (err) {
        console.error('Error reloading filter options:', err);
      }
    };
    loadNationalFilterOptions();
    // Trigger search to get first 500 results
    handleSearch('', false, {
      selectedTypes: [],
      selectedNetworks: [],
      selectedCities: [],
      selectedStates: [],
      selectedTaxonomyCodes: [],
      selectedTag: null,
      tagNPIs: null,
      selectedMarket: null
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // For listing display: limit to first 500 results only
  // Overview will use all results or national overview for full dataset stats
  const listingResults = filteredResults.slice(0, 500);
  const totalPages = Math.ceil(listingResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = listingResults.slice(startIndex, endIndex);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredResults.length === 0) return;

    const headers = ['DHC', 'Name', 'Type', 'Network', 'Street', 'City', 'State', 'ZIP', 'Phone'];
    const csvContent = [
      headers.join(','),
      ...filteredResults.map(p => [
        p.dhc || '',
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.type || 'Unknown').replace(/"/g, '""')}"`,
        `"${(p.network || '').replace(/"/g, '""')}"`,
        `"${(p.street || '').replace(/"/g, '""')}"`,
        `"${(p.city || '').replace(/"/g, '""')}"`,
        p.state || '',
        p.zip || '',
        p.phone || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provider-results-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Selection handlers
  const handleCheckboxChange = (providerDhc, checked) => {
    const newSelected = new Set(selectedProviders);
    if (checked) {
      newSelected.add(providerDhc);
    } else {
      newSelected.delete(providerDhc);
    }
    setSelectedProviders(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedProviders.size === paginatedResults.length) {
      setSelectedProviders(new Set());
      setShowBulkActions(false);
    } else {
      const allDhcs = new Set(paginatedResults.map(p => p.dhc));
      setSelectedProviders(allDhcs);
      setShowBulkActions(true);
    }
  };

  const handleBulkTag = async (tagType) => {
    if (selectedProviders.size === 0) return;

    setBulkActionLoading(true);
    try {
      const selectedProviderObjects = paginatedResults.filter(p =>
        selectedProviders.has(p.dhc)
      );

      for (const provider of selectedProviderObjects) {
        await addTeamProviderTag(provider.dhc, tagType);
      }

      setSelectedProviders(new Set());
      setShowBulkActions(false);
      setTaggingProviderId(null);

      const tagLabel = tagType === 'me' ? 'Me' :
        tagType === 'partner' ? 'Partner' :
          tagType === 'competitor' ? 'Competitor' :
            tagType === 'target' ? 'Target' : tagType;
      alert(`${selectedProviderObjects.length} providers tagged as "${tagLabel}"!`);
    } catch (error) {
      console.error('Error tagging providers:', error);
      alert('Error tagging providers. Please try again.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const hasActiveFilters = submittedSearchTerm.trim() || selectedTypes.length > 0 || selectedHospitalSubtypes.length > 0 || selectedPhysicianGroupSpecialties.length > 0 || selectedNetworks.length > 0 ||
    selectedCities.length > 0 || selectedStates.length > 0 || selectedTaxonomyCodes.length > 0 || selectedTag || selectedMarket;

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return parseInt(num).toLocaleString();
  };


  try {
    return (
      <PageLayout fullWidth>
        <div className={styles.container}>
          {/* Top Controls Bar */}
          <div className={styles.controlsBar}>
            {/* Filters Button */}
            <button
              onClick={() => setShowFiltersSidebar(!showFiltersSidebar)}
              className="sectionHeaderButton"
              title="Toggle filters (])"
              style={{ flexShrink: 0 }}
            >
              <Filter size={14} />
            </button>

            {/* Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
              <div className="searchBarContainer" style={{ width: '300px' }}>
                <div className="searchIcon">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  value={queryText}
                  onChange={(e) => {
                    setQueryText(e.target.value);
                    setEscapeCount(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      if (escapeTimeoutRef.current) {
                        clearTimeout(escapeTimeoutRef.current);
                      }
                      if (queryText && escapeCount === 0) {
                        setQueryText('');
                        setEscapeCount(1);
                        escapeTimeoutRef.current = setTimeout(() => setEscapeCount(0), 1000);
                      } else {
                        searchInputRef.current?.blur();
                        setEscapeCount(0);
                      }
                    }
                  }}
                  placeholder="Search organizations or NPI..."
                  className="searchInput"
                  style={{ width: '100%', paddingRight: queryText ? '70px' : '12px' }}
                  data-search-enhanced="true"
                  ref={searchInputRef}
                />
                {queryText && (
                  <button
                    onClick={() => setQueryText('')}
                    className="clearButton"
                    style={{ right: '8px' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleSearch()}
                className="sectionHeaderButton primary"
                disabled={loading || !queryText.trim()}
                title={loading ? 'Searching...' : 'Search'}
              >
                <Play size={14} />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {savedMarkets.length > 0 && (
              <Dropdown
                trigger={
                  <button className="sectionHeaderButton">
                    <MapPin size={14} />
                    {selectedMarket ? 
                      (() => {
                        const market = savedMarkets.find(m => m.id === selectedMarket);
                        return market ? market.name : 'My Markets';
                      })() : 
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
                    handleMarketSelect(null);
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
                      fontWeight: selectedMarket === market.id ? '600' : '500',
                      background: selectedMarket === market.id ? 'rgba(0, 192, 139, 0.1)' : 'none',
                    }}
                  >
                    <div>{market.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>
                      {market.city}, {market.state} • {market.radius_miles} mi
                    </div>
                  </button>
                ))}
              </Dropdown>
            )}

            {taxonomyTags.length > 0 && (() => {
              const TaxonomyIcon = getSegmentationIcon('taxonomies');
              return (
                <Dropdown
                  trigger={
                    <button className="sectionHeaderButton">
                      {TaxonomyIcon && <TaxonomyIcon {...getSegmentationIconProps({ size: 14 })} />}
                      {selectedTaxonomyCodes.length > 0 ? 
                        `${selectedTaxonomyCodes.length} selected` : 
                        selectedTaxonomyTag ? 
                        `${selectedTaxonomyTag.taxonomy_code}` : 
                        'My Taxonomies'}
                      <ChevronDown size={14} />
                    </button>
                  }
                isOpen={taxonomyDropdownOpen}
                onToggle={setTaxonomyDropdownOpen}
                className={styles.dropdownMenu}
              >
                <button 
                  className={styles.dropdownItem}
                  onClick={() => {
                    handleTaxonomyTagSelect(null);
                    setTaxonomyDropdownOpen(false);
                  }}
                >
                  All Taxonomies
                </button>
                
                {(() => {
                  const tagTypeLabels = {
                    staff: 'Staff',
                    my_setting: 'My Setting',
                    upstream: 'Upstream',
                    downstream: 'Downstream'
                  };
                  
                  // Group tags by tag_type
                  const groupedTags = taxonomyTags.reduce((acc, tag) => {
                    const type = tag.tag_type || 'other';
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(tag);
                    return acc;
                  }, {});
                  
                  // Render each tag type group
                  return Object.entries(groupedTags).map(([tagType, tags]) => {
                    const label = tagTypeLabels[tagType] || tagType;
                    const allSelected = tags.every(tag => selectedTaxonomyCodes.includes(tag.taxonomy_code));
                    const someSelected = tags.some(tag => selectedTaxonomyCodes.includes(tag.taxonomy_code));
                    
                    return (
                      <div key={tagType}>
                        {/* Tag Type Header with Select All */}
                        <button
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            const codes = tags.map(t => t.taxonomy_code);
                            const allCodesSelected = codes.every(c => selectedTaxonomyCodes.includes(c));
                            if (allCodesSelected) {
                              setSelectedTaxonomyCodes(prev => prev.filter(c => !codes.includes(c)));
                            } else {
                              setSelectedTaxonomyCodes(prev => [...new Set([...prev, ...codes])]);
                            }
                            setSelectedTaxonomyTag(null);
                            setTaxonomyDropdownOpen(false);
                          }}
                          style={{
                            fontWeight: '600',
                            backgroundColor: someSelected ? 'rgba(0, 192, 139, 0.15)' : 'rgba(0, 0, 0, 0.03)',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                            padding: '8px 12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: tagType === 'staff' ? '#e0f2fe' :
                                             tagType === 'my_setting' ? '#dcfce7' :
                                             tagType === 'upstream' ? '#fef3c7' :
                                             '#fce7f3',
                              color: tagType === 'staff' ? '#0369a1' :
                                     tagType === 'my_setting' ? '#166534' :
                                     tagType === 'upstream' ? '#92400e' :
                                     '#9f1239'
                            }}>
                              {label}
                            </span>
                            <span style={{ flex: 1, fontSize: '11px', color: 'var(--gray-600)' }}>
                              Select All ({tags.length})
                            </span>
                            {allSelected && (
                              <span style={{ fontSize: '10px', color: 'var(--primary)' }}>✓</span>
                            )}
                          </div>
                        </button>
                        
                        {/* Individual taxonomy items */}
                        {tags.map(tag => {
                          const details = taxonomyTagDetails[tag.taxonomy_code];
                          const isSelected = selectedTaxonomyTag?.id === tag.id || selectedTaxonomyCodes.includes(tag.taxonomy_code);
                          
                          return (
                            <button 
                              key={tag.id}
                              className={styles.dropdownItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                // If clicking a selected single tag, deselect it
                                if (selectedTaxonomyTag?.id === tag.id) {
                                  handleTaxonomyTagSelect(null);
                                  setTaxonomyDropdownOpen(false);
                                } else if (e.shiftKey || e.ctrlKey || e.metaKey) {
                                  // Multi-select: toggle individual taxonomy
                                  const newCodes = isSelected
                                    ? selectedTaxonomyCodes.filter(code => code !== tag.taxonomy_code)
                                    : [...selectedTaxonomyCodes, tag.taxonomy_code];
                                  
                                  setSelectedTaxonomyTag(null); // Clear single tag selection when using multiple
                                  setSelectedTaxonomyCodes(newCodes);
                                } else {
                                  // Single select: select this tag only
                                  handleTaxonomyTagSelect(tag.id);
                                  setTaxonomyDropdownOpen(false);
                                }
                              }}
                              style={{
                                fontWeight: isSelected ? '600' : '400',
                                background: isSelected ? 'rgba(0, 192, 139, 0.1)' : 'none',
                                paddingLeft: '24px'
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <code style={{ fontSize: '11px', fontFamily: 'monospace' }}>{tag.taxonomy_code}</code>
                                  {isSelected && (
                                    <span style={{ fontSize: '10px', color: 'var(--primary)' }}>✓</span>
                                  )}
                                </div>
                                {details && (
                                  <>
                                    {(details.classification || details.taxonomy_classification) && (
                                      <div style={{ fontSize: '10px', color: 'var(--gray-600)', marginTop: '2px' }}>
                                        {details.classification || details.taxonomy_classification}
                                      </div>
                                    )}
                                    {(details.specialization || details.specialization_name || details.taxonomy_specialization) && (
                                      <div style={{ fontSize: '10px', color: 'var(--gray-500)', fontStyle: 'italic' }}>
                                        {details.specialization || details.specialization_name || details.taxonomy_specialization}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  });
                })()}
              </Dropdown>
              );
            })()}

            <div className={styles.spacer}></div>
            
            {((results && results.length > 0) || nationalOverview) && (
            <div className={styles.contextInfo}>
              {selectedMarket ? (
                (() => {
                  const market = savedMarkets.find(m => m.id === selectedMarket);
                  return market ? (
                    <span>{market.city}, {market.state_code} • {market.radius_miles}mi radius</span>
                  ) : (
                    <span>
                      {loading
                        ? 'Loading...'
                        : hasActiveFilters || submittedSearchTerm.trim()
                          ? `${formatNumber(filteredResults.length)} organizations`
                          : `${formatNumber(nationalOverview?.overall?.total_providers || 0)} organizations nationwide`
                      }
                    </span>
                  );
                })()
              ) : (
                <span>
                  {loading
                    ? 'Loading...'
                    : hasActiveFilters || submittedSearchTerm.trim()
                      ? `${formatNumber(filteredResults.length)} organizations`
                      : `${formatNumber(nationalOverview?.overall?.total_providers || 0)} organizations nationwide`
                  }
                </span>
              )}
            </div>
            )}
            
          </div>

          {/* Tab Navigation */}
          <div className={styles.tabNav}>
            <button 
              className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 size={16} />
              Overview
            </button>
            <button 
              className={`${styles.tab} ${activeTab === 'listing' ? styles.active : ''}`}
              onClick={() => setActiveTab('listing')}
            >
              <List size={16} />
              Listing
            </button>
          </div>

          {/* Main Layout */}
          <div className={styles.mainLayout}>
            {/* Left Sidebar - Filters Only */}
            {showFiltersSidebar && (
              <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                    <div>
                      <h3>Filters</h3>
                      <p>Narrow results</p>
                    </div>
                    {hasActiveFilters && (
                      <button 
                        onClick={clearAllFilters} 
                        className="sectionHeaderButton"
                        style={{ marginTop: '4px' }}
                      >
                        <X size={14} />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

              {/* Provider Type Filter */}
                <div className={styles.filterGroup}>
                <button 
                  className={styles.filterHeader}
                  onClick={() => toggleSection('types')}
                >
                  <div className={styles.filterHeaderLeft}>
                    <Filter size={14} />
                    <span>Provider Type</span>
                    {selectedTypes.length > 0 && (
                      <span className={styles.filterBadge}>{selectedTypes.length}</span>
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={expandedSections.types ? styles.chevronExpanded : styles.chevronCollapsed}
                  />
                </button>
                {expandedSections.types && (
                  <div className={styles.filterContent}>
                    <div className={styles.filterList}>
                      {allTypes.map(type => (
                        <div key={type}>
                          <label className={styles.filterCheckbox}>
                            <input
                              type="checkbox"
                              checked={selectedTypes.includes(type)}
                              onChange={() => toggleType(type)}
                            />
                            <span>{type}</span>
                          </label>
                          {/* Nested Hospital Subtypes */}
                          {type === 'Hospital' && selectedTypes.includes('Hospital') && hospitalSubtypes.length > 0 && (
                            <div style={{ marginLeft: '20px', marginTop: '6px', marginBottom: '6px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSection('hospitalSubtypes');
                                }}
                                className={styles.filterCheckbox}
                                style={{
                                  width: '100%',
                                  justifyContent: 'flex-start',
                                  padding: '4px 8px',
                                  marginBottom: '4px',
                                  background: expandedSections.hospitalSubtypes ? 'var(--gray-50)' : 'transparent'
                                }}
                              >
                                <ChevronDown 
                                  size={14} 
                                  className={expandedSections.hospitalSubtypes ? styles.chevronExpanded : styles.chevronCollapsed}
                                  style={{ marginRight: '6px' }}
                                />
                                <span style={{ fontSize: '12px', fontWeight: '500' }}>Hospital Types</span>
                                {selectedHospitalSubtypes.length > 0 && (
                                  <span className={styles.filterBadge} style={{ marginLeft: '6px' }}>
                                    {selectedHospitalSubtypes.length}
                                  </span>
                                )}
                              </button>
                              {expandedSections.hospitalSubtypes && (
                                <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                                  {hospitalSubtypes.map(subtype => (
                                    <label key={subtype} className={styles.filterCheckbox}>
                                      <input
                                        type="checkbox"
                                        checked={selectedHospitalSubtypes.includes(subtype)}
                                        onChange={() => toggleHospitalSubtype(subtype)}
                                      />
                                      <span style={{ fontSize: '12px' }}>{subtype}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {/* Nested Physician Group Specialties */}
                          {type === 'Physician Group' && selectedTypes.includes('Physician Group') && physicianGroupSpecialties.length > 0 && (
                            <div style={{ marginLeft: '20px', marginTop: '6px', marginBottom: '6px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSection('physicianGroupSpecialties');
                                }}
                                className={styles.filterCheckbox}
                                style={{
                                  width: '100%',
                                  justifyContent: 'flex-start',
                                  padding: '4px 8px',
                                  marginBottom: '4px',
                                  background: expandedSections.physicianGroupSpecialties ? 'var(--gray-50)' : 'transparent'
                                }}
                              >
                                <ChevronDown 
                                  size={14} 
                                  className={expandedSections.physicianGroupSpecialties ? styles.chevronExpanded : styles.chevronCollapsed}
                                  style={{ marginRight: '6px' }}
                                />
                                <span style={{ fontSize: '12px', fontWeight: '500' }}>Specialties</span>
                                {selectedPhysicianGroupSpecialties.length > 0 && (
                                  <span className={styles.filterBadge} style={{ marginLeft: '6px' }}>
                                    {selectedPhysicianGroupSpecialties.length}
                                  </span>
                                )}
                              </button>
                              {expandedSections.physicianGroupSpecialties && (
                                <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                                  {physicianGroupSpecialties.map(specialty => (
                                    <label key={specialty} className={styles.filterCheckbox}>
                                      <input
                                        type="checkbox"
                                        checked={selectedPhysicianGroupSpecialties.includes(specialty)}
                                        onChange={() => togglePhysicianGroupSpecialty(specialty)}
                                      />
                                      <span style={{ fontSize: '12px' }}>{specialty}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                  </div>

                  {/* Network Filter */}
                  <div className={styles.filterGroup}>
                <button 
                  className={styles.filterHeader}
                  onClick={() => toggleSection('networks')}
                >
                  <div className={styles.filterHeaderLeft}>
                    <Filter size={14} />
                    <span>Network</span>
                    {selectedNetworks.length > 0 && (
                      <span className={styles.filterBadge}>{selectedNetworks.length}</span>
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={expandedSections.networks ? styles.chevronExpanded : styles.chevronCollapsed}
                  />
                </button>
                {expandedSections.networks && (
                  <div className={styles.filterContent}>
                    <div className={styles.filterList}>
                      {allNetworks.map(network => (
                        <label key={network} className={styles.filterCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedNetworks.includes(network)}
                            onChange={() => toggleNetwork(network)}
                          />
                          <span>{network}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                  </div>

                  {/* City Filter */}
                  <div className={styles.filterGroup}>
                <button 
                  className={styles.filterHeader}
                  onClick={() => toggleSection('cities')}
                >
                  <div className={styles.filterHeaderLeft}>
                    <Filter size={14} />
                    <span>City</span>
                    {selectedCities.length > 0 && (
                      <span className={styles.filterBadge}>{selectedCities.length}</span>
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={expandedSections.cities ? styles.chevronExpanded : styles.chevronCollapsed}
                  />
                </button>
                {expandedSections.cities && (
                  <div className={styles.filterContent}>
                    <div className={styles.filterList}>
                      {allCities.map(city => (
                        <label key={city} className={styles.filterCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedCities.includes(city)}
                            onChange={() => toggleCity(city)}
                          />
                          <span>{city}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                  </div>

                  {/* State Filter */}
                  <div className={styles.filterGroup}>
                <button 
                  className={styles.filterHeader}
                  onClick={() => toggleSection('states')}
                >
                  <div className={styles.filterHeaderLeft}>
                    <Filter size={14} />
                    <span>State</span>
                    {selectedStates.length > 0 && (
                      <span className={styles.filterBadge}>{selectedStates.length}</span>
                    )}
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={expandedSections.states ? styles.chevronExpanded : styles.chevronCollapsed}
                  />
                </button>
                {expandedSections.states && (
                  <div className={styles.filterContent}>
                    <div className={styles.filterList}>
                      {allStates.map(state => (
                        <label key={state} className={styles.filterCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedStates.includes(state)}
                            onChange={() => toggleState(state)}
                          />
                          <span>{state}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                  </div>
              </div>
            )}

            {/* Main Content */}
            <div className={styles.mainContent}>
              {/* Active Filter Chips - Above Content */}
              {hasActiveFilters && (
                <div className={styles.activeFiltersBar}>
                  <div className={styles.activeFilters}>
                    <span className={styles.filtersLabel}>Filters:</span>
                  {submittedSearchTerm.trim() && (
                    <div className={styles.filterChip}>
                      <span>Search: "{submittedSearchTerm}"</span>
                      <button onClick={() => {
                        setQueryText('');
                        setSubmittedSearchTerm('');
                        if (hasSearched) {
                          handleSearch('');
                        }
                      }}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                    {selectedTag && (
                      <div className={styles.filterChip}>
                        <span>My {selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} ({providerTags[selectedTag]?.length || 0})</span>
                        <button onClick={() => handleTagSelect('')}>
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {selectedMarket && (
                      <div className={styles.filterChip}>
                        <span>{savedMarkets.find(m => m.id === selectedMarket)?.name || 'Market'}</span>
                        <button onClick={() => handleMarketSelect(null)}>
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    {/* Show taxonomy chips - only show selectedTaxonomyTag chip if it's a single tag, otherwise show individual codes */}
                    {selectedTaxonomyTag && selectedTaxonomyCodes.length === 1 && selectedTaxonomyCodes[0] === selectedTaxonomyTag.taxonomy_code ? (
                      <div className={styles.filterChip}>
                        <span>
                          {selectedTaxonomyTag.taxonomy_code}
                          {(() => {
                            const details = taxonomyTagDetails[selectedTaxonomyTag.taxonomy_code];
                            const classification = details?.classification || details?.taxonomy_classification;
                            return classification ? ` (${classification})` : '';
                          })()}
                        </span>
                        <button onClick={() => {
                          setSelectedTaxonomyTag(null);
                          setSelectedTaxonomyCodes([]);
                        }}>
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      selectedTaxonomyCodes.map(code => {
                        const tag = taxonomyTags.find(t => t.taxonomy_code === code);
                        const details = taxonomyTagDetails[code];
                        const classification = details?.classification || details?.taxonomy_classification;
                        return (
                          <div key={`taxonomy-${code}`} className={styles.filterChip}>
                            <span>
                              {code}
                              {classification && ` (${classification})`}
                            </span>
                            <button onClick={() => {
                              setSelectedTaxonomyCodes(prev => prev.filter(c => c !== code));
                              // If we removed the last code and there was a selected tag, clear it
                              if (selectedTaxonomyCodes.length === 1 && selectedTaxonomyTag) {
                                setSelectedTaxonomyTag(null);
                              }
                            }}>
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })
                    )}
                    {selectedTypes.map(type => (
                      <div key={`type-${type}`} className={styles.filterChip}>
                        <span>{type}</span>
                        <button onClick={() => toggleType(type)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {selectedHospitalSubtypes.map(subtype => (
                      <div key={`hospital-subtype-${subtype}`} className={styles.filterChip}>
                        <span>{subtype}</span>
                        <button onClick={() => toggleHospitalSubtype(subtype)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {selectedPhysicianGroupSpecialties.map(specialty => (
                      <div key={`physician-group-specialty-${specialty}`} className={styles.filterChip}>
                        <span>{specialty}</span>
                        <button onClick={() => togglePhysicianGroupSpecialty(specialty)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {selectedNetworks.map(network => (
                      <div key={`network-${network}`} className={styles.filterChip}>
                        <span>{network}</span>
                        <button onClick={() => toggleNetwork(network)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {selectedCities.map(city => (
                      <div key={`city-${city}`} className={styles.filterChip}>
                        <span>{city}</span>
                        <button onClick={() => toggleCity(city)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {selectedStates.map(state => (
                      <div key={`state-${state}`} className={styles.filterChip}>
                        <span>{state}</span>
                        <button onClick={() => toggleState(state)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tab Content */}
              <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className={styles.overviewContent}>
                  {/* Loading Overlay for Overview Tab - Covers only the content area */}
                  {loading && (
                    <div className={styles.loadingOverlay}>
                      <Spinner />
                    </div>
                  )}
                  <div className={styles.overviewPanel}>
                    <h3>
                      <Database size={16} />
                      {hasActiveFilters || submittedSearchTerm.trim() ? 'Filtered Results' : 'National Overview'}
                    </h3>
                    <div className={styles.overviewGrid}>
                    <div className={styles.overviewCard}>
                      <div className={styles.overviewLabel}>Total Organizations</div>
                      <div className={styles.overviewValue}>
                        {hasActiveFilters || submittedSearchTerm.trim()
                          ? formatNumber(filteredResults.length)
                          : formatNumber(nationalOverview?.overall?.total_providers || 0)
                        }
                      </div>
                    </div>
                    <div className={styles.overviewCard}>
                      <div className={styles.overviewLabel}>Networks</div>
                      <div className={styles.overviewValue}>
                        {hasActiveFilters || submittedSearchTerm.trim()
                          ? formatNumber(new Set(filteredResults.map(r => r.network).filter(Boolean)).size)
                          : formatNumber(nationalOverview?.overall?.distinct_networks || 0)
                        }
                      </div>
                    </div>
                  </div>
                  </div>
                  
                  {/* Breakdowns - Separate from overview panel */}
                  {(nationalOverview?.breakdowns || (hasActiveFilters || submittedSearchTerm.trim())) && (
                    <div className={styles.breakdownsContainer}>
                      {/* Top Types */}
                      {((nationalOverview?.breakdowns?.types || []).length > 0 || (hasActiveFilters || submittedSearchTerm.trim())) && (
                        <div className={styles.breakdownSection}>
                          <h4>Top Provider Types {(() => {
                            const typesTotal = hasActiveFilters || submittedSearchTerm.trim()
                              ? new Set(filteredResults.map(r => r.type)).size
                              : (nationalOverview?.overall?.distinct_types || 0);
                            return typesTotal ? `(${formatNumber(typesTotal)} total)` : '';
                          })()}</h4>
                          <div className={styles.breakdownList}>
                            {(() => {
                              const types = (hasActiveFilters || submittedSearchTerm.trim()) && filteredResults.length > 0
                                ? Object.entries(
                                    filteredResults.reduce((acc, r) => {
                                      const type = r.type || 'Unknown';
                                      acc[type] = (acc[type] || 0) + 1;
                                      return acc;
                                    }, {})
                                  )
                                  .map(([name, count]) => ({ name, count }))
                                  .sort((a, b) => b.count - a.count)
                                  .slice(0, 10)
                                : (nationalOverview?.breakdowns?.types || []).map(item => ({
                                    name: item.type || item.name || 'Unknown',
                                    count: parseInt(item.count || 0)
                                  })).slice(0, 10);
                              
                              if (types.length === 0) return null;
                              
                              return types.map((item, idx) => (
                                <div key={idx} className={styles.breakdownItem}>
                                  <span className={styles.breakdownName}>{item.name}</span>
                                  <div className={styles.breakdownBar}>
                                    <div 
                                      className={styles.breakdownBarFill}
                                      style={{ width: `${(item.count / types[0].count) * 100}%` }}
                                    />
                                  </div>
                                  <span className={styles.breakdownCount}>{formatNumber(item.count)}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {/* Top States */}
                      {((nationalOverview?.breakdowns?.states || []).length > 0 || (hasActiveFilters || submittedSearchTerm.trim())) && (
                        <div className={styles.breakdownSection}>
                          <h4>State Distribution {(() => {
                            const statesTotal = hasActiveFilters || submittedSearchTerm.trim()
                              ? new Set(filteredResults.map(r => r.state)).size
                              : (nationalOverview?.overall?.distinct_states || 0);
                            return statesTotal ? `(${formatNumber(statesTotal)} total)` : '';
                          })()}</h4>
                          <div className={styles.breakdownList}>
                            {(() => {
                              const states = (hasActiveFilters || submittedSearchTerm.trim()) && filteredResults.length > 0
                                ? Object.entries(
                                    filteredResults.reduce((acc, r) => {
                                      const state = r.state || 'Unknown';
                                      acc[state] = (acc[state] || 0) + 1;
                                      return acc;
                                    }, {})
                                  )
                                  .map(([name, count]) => ({ name, count }))
                                  .sort((a, b) => b.count - a.count)
                                  .slice(0, 10)
                                : (nationalOverview?.breakdowns?.states || []).map(item => ({
                                    name: item.state || item.name || 'Unknown',
                                    count: parseInt(item.count || 0)
                                  })).slice(0, 10);
                              
                              if (states.length === 0) return null;
                              
                              return states.map((item, idx) => (
                                <div key={idx} className={styles.breakdownItem}>
                                  <span className={styles.breakdownName}>{item.name}</span>
                                  <div className={styles.breakdownBar}>
                                    <div 
                                      className={styles.breakdownBarFill}
                                      style={{ width: `${(item.count / states[0].count) * 100}%` }}
                                    />
                                  </div>
                                  <span className={styles.breakdownCount}>{formatNumber(item.count)}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                      
                      {/* Top Cities */}
                      {((nationalOverview?.breakdowns?.cities || []).length > 0 || (hasActiveFilters || submittedSearchTerm.trim())) && (
                        <div className={styles.breakdownSection}>
                          <h4>Top Cities {(() => {
                            const citiesTotal = hasActiveFilters || submittedSearchTerm.trim()
                              ? new Set(filteredResults.map(r => r.city).filter(Boolean)).size
                              : (nationalOverview?.overall?.distinct_cities || 0);
                            return citiesTotal ? `(${formatNumber(citiesTotal)} total)` : '';
                          })()}</h4>
                          <div className={styles.breakdownList}>
                            {(() => {
                              const cities = (hasActiveFilters || submittedSearchTerm.trim()) && filteredResults.length > 0
                                ? Object.entries(
                                    filteredResults.reduce((acc, r) => {
                                      const city = r.city || 'Unknown';
                                      const state = r.state || '';
                                      const cityState = state ? `${city}, ${state}` : city;
                                      if (city) {
                                        acc[cityState] = (acc[cityState] || 0) + 1;
                                      }
                                      return acc;
                                    }, {})
                                  )
                                  .map(([name, count]) => ({ name, count }))
                                  .sort((a, b) => b.count - a.count)
                                  .slice(0, 10)
                                : (nationalOverview?.breakdowns?.cities || []).map(item => ({
                                    name: item.city || item.name || 'Unknown',
                                    count: parseInt(item.count || 0)
                                  })).slice(0, 10);
                              
                              if (cities.length === 0) return null;
                              
                              return cities.map((item, idx) => (
                                <div key={idx} className={styles.breakdownItem}>
                                  <span className={styles.breakdownName}>{item.name}</span>
                                  <div className={styles.breakdownBar}>
                                    <div 
                                      className={styles.breakdownBarFill}
                                      style={{ width: `${(item.count / cities[0].count) * 100}%` }}
                                    />
                                  </div>
                                  <span className={styles.breakdownCount}>{formatNumber(item.count)}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Listing Tab */}
              {activeTab === 'listing' && (
                <div className={styles.resultsPanel}>
                  {!loading && filteredResults.length === 0 && (
                    <div className={styles.emptyState}>
                      <h2>No Results Found</h2>
                      <p>Try adjusting your search terms or filters</p>
                    </div>
                  )}

                  {!loading && paginatedResults.length > 0 && (
                    <ControlsRow
                      leftContent={
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--gray-900)' }}>
                          Organizations List
                        </h3>
                      }
                      rightContent={
                        <>
                          {showBulkActions && hasTeam && (
                            <div className={styles.bulkActions}>
                              <div className={styles.dropdownContainer} ref={bulkDropdownRef}>
                                <button
                                  ref={bulkButtonRef}
                                  className={styles.glassmorphismButton}
                                  onClick={handleBulkButtonClick}
                                >
                                  Tag
                                </button>
                                {taggingProviderId === 'bulk' && (
                                  <div className={styles.dropdown}>
                                    <button
                                      className={styles.glassmorphismButton}
                                      onClick={() => handleBulkTag('me')}
                                      disabled={bulkActionLoading}
                                    >
                                      {bulkActionLoading ? 'Tagging...' : 'Me'}
                                    </button>
                                    <button
                                      className={styles.glassmorphismButton}
                                      onClick={() => handleBulkTag('partner')}
                                      disabled={bulkActionLoading}
                                    >
                                      {bulkActionLoading ? 'Tagging...' : 'Partner'}
                                    </button>
                                    <button
                                      className={styles.glassmorphismButton}
                                      onClick={() => handleBulkTag('competitor')}
                                      disabled={bulkActionLoading}
                                    >
                                      {bulkActionLoading ? 'Tagging...' : 'Competitor'}
                                    </button>
                                    <button
                                      className={styles.glassmorphismButton}
                                      onClick={() => handleBulkTag('target')}
                                      disabled={bulkActionLoading}
                                    >
                                      {bulkActionLoading ? 'Tagging...' : 'Target'}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <span className={styles.pageInfo}>
                            {(() => {
                              const total = hasActiveFilters || submittedSearchTerm.trim() ? filteredResults.length : (nationalOverview?.overall?.total_providers || 0);
                              return `Showing ${startIndex + 1}-${Math.min(endIndex, listingResults.length)} of ${formatNumber(total)}${total >= 500 ? ' (table limited to first 500)' : ''}`;
                            })()}
                          </span>
                          {totalPages > 1 && (
                            <div className={styles.paginationInline}>
                              <button 
                                className="sectionHeaderButton"
                                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                              >
                                Previous
                              </button>
                              <button 
                                className="sectionHeaderButton"
                                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                              >
                                Next
                              </button>
                            </div>
                          )}
                          <button
                            onClick={exportToCSV}
                            className="sectionHeaderButton"
                            disabled={filteredResults.length === 0}
                            title="Export to CSV"
                          >
                            <Download size={14} />
                            Export CSV
                          </button>
                        </>
                      }
                    />
                  )}

                {paginatedResults.length > 0 && (
                    <>
                      <div className={styles.tableWrapper}>
                        {loading && (
                          <div className={styles.loadingOverlay}>
                            <Spinner />
                          </div>
                        )}
                        <table className={styles.resultsTable}>
                          <thead>
                            <tr>
                              <th style={{ width: '40px' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedProviders.size === paginatedResults.length && paginatedResults.length > 0}
                                  onChange={hasTeam ? handleSelectAll : undefined}
                                  disabled={!hasTeam}
                                  className={styles.providerCheckbox}
                                  title={!hasTeam ? "Join or create a team to select providers" : ""}
                                />
                              </th>
                              <th>Provider</th>
                              <th>Type</th>
                              <th>Network</th>
                              <th>Tag</th>
                            </tr>
                          </thead>
                          <tbody>
                    {paginatedResults.map((provider) => {
                      const displayName = sanitizeProviderName(provider.name) || provider.name || 'Provider';
                      const displayNetwork = sanitizeProviderName(provider.network) || provider.network;
                      return (
                        <tr 
                          key={provider.dhc}
                        >
                                <td>
                              <input
                                type="checkbox"
                                checked={selectedProviders.has(provider.dhc)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (hasTeam) {
                                    handleCheckboxChange(provider.dhc, e.target.checked);
                                  }
                                }}
                                className={`${styles.providerCheckbox} ${!hasTeam ? styles.disabled : ''}`}
                                disabled={!hasTeam}
                                title={!hasTeam ? "Join or create a team to select providers" : ""}
                                    onClick={(e) => e.stopPropagation()}
                              />
                                </td>
                                <td>
                                  <div className={styles.providerCell}>
                              <div
                                      className={styles.providerNameLink}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/app/${provider.dhc}`);
                                }}
                              >
                                {displayName}
                              </div>
                              <div className={styles.providerAddress}>
                                {[provider.street, provider.city, provider.state, provider.zip].filter(Boolean).join(', ')}
                                {provider.phone && ` • ${provider.phone}`}
                              </div>
                              </div>
                                </td>
                                <td>{provider.type || "Unknown"}</td>
                                <td>{displayNetwork || "-"}</td>
                                <td className={styles.tagCell} onClick={(e) => e.stopPropagation()}>
                              <ProviderTagBadge
                                providerId={provider.dhc}
                                hasTeam={hasTeam}
                                teamLoading={false}
                                primaryTag={getProviderTags(provider.dhc)[0] || null}
                                isSaving={false}
                                onAddTag={addTeamProviderTag}
                                onRemoveTag={removeTeamProviderTag}
                                size="medium"
                                variant="default"
                                showRemoveOption={true}
                              />
                                </td>
                              </tr>
                            );
                          })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              </>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  } catch (error) {
    console.error("ProviderSearch component error:", error);
    setComponentError(error);
    return null;
  }
}
