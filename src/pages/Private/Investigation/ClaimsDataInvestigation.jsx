import { useState, useEffect } from "react";
import styles from "./ClaimsDataInvestigation.module.css";
import Spinner from "../../../components/Buttons/Spinner";
import Dropdown from "../../../components/Buttons/Dropdown";
import { apiUrl } from '../../../utils/api';
import { supabase } from '../../../app/supabaseClient';
import { Database, Play, Download, X, Plus, Filter as FilterIcon, Columns3, Search, MapPin, ChevronDown } from "lucide-react";

/**
 * Claims Data Investigation Tool
 * 
 * Interactive analysis interface:
 * - Add fields to Columns (GROUP BY)
 * - Add fields to Filters (WHERE)
 * - Always shows SUM(count) and SUM(charge_total)
 * - Results are always aggregated
 */

export default function ClaimsDataInvestigation() {
  // Data state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);
  
  // Query configuration
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [excludeFilters, setExcludeFilters] = useState({}); // Exclusion filters (NOT IN)
  const [limit, setLimit] = useState(100);
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({});
  const [loadingFilters, setLoadingFilters] = useState({});
  const [editingFilter, setEditingFilter] = useState(null); // Track which filter is being edited
  
  // Field search
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldSearchEscapeCount, setFieldSearchEscapeCount] = useState(0);
  
  // Results search
  const [resultsSearch, setResultsSearch] = useState('');
  const [resultsSearchEscapeCount, setResultsSearchEscapeCount] = useState(0);
  
  // Saved markets
  const [savedMarkets, setSavedMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [marketNPIs, setMarketNPIs] = useState(null);
  
  // Provider tags
  const [providerTags, setProviderTags] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagNPIs, setTagNPIs] = useState(null);
  
  // NPI field selector (which provider perspective to use)
  const [npiFieldType, setNpiFieldType] = useState('billing_provider_npi');
  
  // Metadata and default filters
  const [maxDate, setMaxDate] = useState(null);
  const [defaultDateRange, setDefaultDateRange] = useState(null);
  
  // Dropdown states
  const [npiFieldDropdownOpen, setNpiFieldDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  
  // Fields that should use text input instead of dropdown (for comma-separated values)
  const TEXT_INPUT_FIELDS = [
    'billing_provider_npi',
    'performing_provider_npi',
    'facility_provider_npi',
    'service_location_provider_npi',
    'code',
    'drg_code',
    'revenue_code',
    '_year',
    '_year_quarter'
  ];
  
  // Available fields organized by category
  const FIELD_GROUPS = {
    "Temporal": [
      { value: "date__month_grain", label: "Month" },
      { value: "_year", label: "Year" },
      { value: "_year_quarter", label: "Year-Quarter" },
    ],
    "Billing Provider": [
      { value: "billing_provider_npi", label: "NPI" },
      { value: "billing_provider_name", label: "Name" },
      { value: "billing_provider_state", label: "State" },
      { value: "billing_provider_city", label: "City" },
      { value: "billing_provider_county", label: "County" },
      { value: "billing_provider_taxonomy_classification", label: "Taxonomy Classification" },
      { value: "billing_provider_taxonomy_specialization", label: "Taxonomy Specialization" },
      { value: "billing_provider_taxonomy_consolidated_specialty", label: "Consolidated Specialty" },
    ],
    "Facility Provider": [
      { value: "facility_provider_npi", label: "NPI" },
      { value: "facility_provider_name", label: "Name" },
      { value: "facility_provider_state", label: "State" },
      { value: "facility_provider_city", label: "City" },
      { value: "facility_provider_county", label: "County" },
      { value: "facility_provider_taxonomy_classification", label: "Taxonomy Classification" },
    ],
    "Service Location Provider": [
      { value: "service_location_provider_npi", label: "NPI" },
      { value: "service_location_provider_name", label: "Name" },
      { value: "service_location_provider_state", label: "State" },
      { value: "service_location_provider_city", label: "City" },
      { value: "service_location_provider_county", label: "County" },
      { value: "service_location_provider_us_region", label: "US Region" },
      { value: "service_location_provider_us_division", label: "US Division" },
    ],
    "Performing Provider": [
      { value: "performing_provider_npi", label: "NPI" },
      { value: "performing_provider_name", label: "Name" },
      { value: "performing_provider_taxonomy_classification", label: "Taxonomy Classification" },
      { value: "performing_provider_taxonomy_specialization", label: "Taxonomy Specialization" },
    ],
    "Patient Demographics": [
      { value: "patient_age_bracket", label: "Age Bracket" },
      { value: "patient_gender", label: "Gender" },
      { value: "patient_state", label: "State" },
      { value: "patient_zip3", label: "ZIP3" },
      { value: "patient_us_region", label: "US Region" },
      { value: "patient_us_division", label: "US Division" },
    ],
    "Service & Procedures": [
      { value: "code", label: "Code" },
      { value: "code_description", label: "Code Description" },
      { value: "code_system", label: "Code System" },
      { value: "service_category_description", label: "Service Category" },
      { value: "service_line_description", label: "Service Line" },
      { value: "subservice_line_description", label: "Sub-Service Line" },
    ],
    "Payor": [
      { value: "payor_group", label: "Payor Group" },
      { value: "type_of_coverage", label: "Coverage Type" },
    ],
    "Site of Care": [
      { value: "site_of_care_summary", label: "Site of Care Summary" },
      { value: "site_of_care_classification", label: "Site of Care Classification" },
      { value: "place_of_service", label: "Place of Service" },
      { value: "place_of_service_code", label: "Place of Service Code" },
    ],
    "Billing Details": [
      { value: "bill_facility_type", label: "Facility Type" },
      { value: "bill_classification_type", label: "Classification Type" },
      { value: "bill_frequency_type", label: "Frequency Type" },
    ],
    "Clinical": [
      { value: "claim_type_code", label: "Claim Type Code" },
      { value: "drg_code", label: "DRG Code" },
      { value: "drg_description", label: "DRG Description" },
      { value: "revenue_code", label: "Revenue Code" },
      { value: "revenue_code_description", label: "Revenue Code Description" },
    ]
  };

  // Flatten all fields for easy lookup with full context
  const allFields = {};
  Object.entries(FIELD_GROUPS).forEach(([groupName, fields]) => {
    fields.forEach(field => {
      // For fields that appear in multiple groups (like "Name", "NPI"), add group context
      const isDuplicate = ['Name', 'NPI', 'State', 'City', 'County', 'Taxonomy Classification', 'Taxonomy Specialization'].includes(field.label);
      if (isDuplicate && groupName !== 'Temporal') {
        // Add group prefix for clarity (e.g., "Billing: Name")
        const shortGroup = groupName.replace(' Provider', '');
        allFields[field.value] = `${shortGroup}: ${field.label}`;
      } else {
        allFields[field.value] = field.label;
      }
    });
  });

  // Fetch saved markets and provider tags on mount
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const response = await fetch(apiUrl('/api/investigation/metadata/volume_procedure'));
        const result = await response.json();
        
        if (!result.success) {
          throw new Error('Failed to fetch metadata');
        }
        
        const maxDateValue = new Date(result.data.maxDate.value);
        setMaxDate(maxDateValue);
        
        // Calculate 12 months before max date
        const minDate = new Date(maxDateValue);
        minDate.setMonth(minDate.getMonth() - 11); // -11 to include current month = 12 months total
        
        // Format as YYYY-MM
        const minDateStr = minDate.toISOString().substring(0, 7);
        const maxDateStr = maxDateValue.toISOString().substring(0, 7);
        
        setDefaultDateRange({ min: minDateStr, max: maxDateStr });
        
        // Set default filter for last 12 months
        setFilters({ date__month_grain: `${minDateStr},${maxDateStr}` });
        
        console.log(`📅 Default date range: ${minDateStr} to ${maxDateStr} (last 12 months)`);
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    }
    
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
        console.log('Loaded saved markets:', data?.length || 0);
      } catch (err) {
        console.error('Error fetching markets:', err);
      }
    }
    
    async function fetchProviderTags() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Get user's team from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('id', user.id)
          .single();
        
        if (profileError || !profile || !profile.team_id) {
          console.log('No team found for user');
          return;
        }
        
        // Get team provider tags
        const { data: tags, error: tagsError } = await supabase
          .from('team_provider_tags')
          .select('*')
          .eq('team_id', profile.team_id);
        
        if (tagsError) throw tagsError;
        
        // Group by tag type
        const grouped = {
          me: tags.filter(t => t.tag_type === 'me'),
          partner: tags.filter(t => t.tag_type === 'partner'),
          competitor: tags.filter(t => t.tag_type === 'competitor'),
          target: tags.filter(t => t.tag_type === 'target')
        };
        
        setProviderTags(grouped);
        console.log('Loaded provider tags:', {
          me: grouped.me.length,
          partner: grouped.partner.length,
          competitor: grouped.competitor.length,
          target: grouped.target.length
        });
      } catch (err) {
        console.error('Error fetching provider tags:', err);
      }
    }
    
    fetchMetadata();
    fetchMarkets();
    fetchProviderTags();
  }, []);
  
  // Handle market selection
  const handleMarketSelect = async (marketId) => {
    if (!marketId) {
      setSelectedMarket(null);
      setMarketNPIs(null);
      setData(null);
      return;
    }
    
    // Clear tag selection when market is selected (mutually exclusive)
    setSelectedTag(null);
    setTagNPIs(null);
    
    const market = savedMarkets.find(m => m.id === marketId);
    if (!market) return;
    
    setSelectedMarket(market);
    setData(null);
    
    try {
      // Get providers within this market
      const lat = parseFloat(market.latitude);
      const lon = parseFloat(market.longitude);
      const radius = market.radius_miles;
      
      const response = await fetch(
        apiUrl(`/api/nearby-providers?lat=${lat}&lon=${lon}&radius=${radius}`)
      );
      
      const result = await response.json();
      if (!result.success) throw new Error('Failed to fetch market providers');
      
      const providers = result.data || [];
      console.log(`Market "${market.name}" has ${providers.length} providers`);
      
      // Get NPIs for these providers
      const dhcs = providers.map(p => p.dhc).filter(Boolean);
      if (dhcs.length === 0) {
        setMarketNPIs([]);
        return;
      }
      
      const npiResponse = await fetch(apiUrl('/api/related-npis'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dhc_ids: dhcs })
      });
      
      const npiResult = await npiResponse.json();
      if (!npiResult.success) throw new Error('Failed to fetch NPIs');
      
      const npis = (npiResult.data || []).map(row => row.npi);
      setMarketNPIs(npis);
      console.log(`Market has ${npis.length} NPIs`);
      
      // Clear filter options so they reload with new market scope
      setFilterOptions({});
      
    } catch (err) {
      console.error('Error loading market providers:', err);
      setError(`Failed to load market: ${err.message}`);
    }
  };
  
  // Handle tag selection
  const handleTagSelect = async (tagType) => {
    if (!tagType) {
      setSelectedTag(null);
      setTagNPIs(null);
      setData(null);
      return;
    }
    
    // Clear market selection when tag is selected (mutually exclusive)
    setSelectedMarket(null);
    setMarketNPIs(null);
    
    setSelectedTag(tagType);
    setData(null);
    
    try {
      const taggedProviders = providerTags[tagType] || [];
      if (taggedProviders.length === 0) {
        setTagNPIs([]);
        console.log(`No providers tagged as "${tagType}"`);
        return;
      }
      
      const dhcs = taggedProviders.map(t => t.provider_dhc).filter(Boolean);
      console.log(`Tag "${tagType}" has ${dhcs.length} providers`);
      
      // Get NPIs for these providers
      const npiResponse = await fetch(apiUrl('/api/related-npis'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dhc_ids: dhcs })
      });
      
      const npiResult = await npiResponse.json();
      if (!npiResult.success) throw new Error('Failed to fetch NPIs');
      
      const npis = (npiResult.data || []).map(row => row.npi);
      setTagNPIs(npis);
      console.log(`Tag has ${npis.length} NPIs`);
      
      // Clear filter options so they reload with new tag scope
      setFilterOptions({});
      
    } catch (err) {
      console.error('Error loading tagged providers:', err);
      setError(`Failed to load tag: ${err.message}`);
    }
  };

  // Filter field groups based on search
  const filteredFieldGroups = Object.entries(FIELD_GROUPS).reduce((acc, [groupName, fields]) => {
    if (!fieldSearch.trim()) {
      // No search - show all
      acc[groupName] = fields;
    } else {
      // Filter fields by search term (search in label and value)
      const searchLower = fieldSearch.toLowerCase();
      const matchingFields = fields.filter(field => 
        field.label.toLowerCase().includes(searchLower) || 
        field.value.toLowerCase().includes(searchLower) ||
        groupName.toLowerCase().includes(searchLower)
      );
      if (matchingFields.length > 0) {
        acc[groupName] = matchingFields;
      }
    }
    return acc;
  }, {});

  // Fetch aggregated data
  const fetchData = async (overrides = {}) => {
    setLoading(true);
    setError(null);
    setQueryTime(null);
    
    const startTime = performance.now();
    
    // Use overrides or fall back to state
    const columnsToUse = overrides.columns !== undefined ? overrides.columns : columns;
    const filtersToUse = overrides.filters !== undefined ? overrides.filters : filters;
    const excludeFiltersToUse = overrides.excludeFilters !== undefined ? overrides.excludeFilters : excludeFilters;
    
    console.log('🔍 Sending query with columns:', columnsToUse);
    console.log('🔍 Filters:', filtersToUse);
    console.log('🔍 Exclude filters:', excludeFiltersToUse);

    try {
      // Determine which NPIs to use (priority: tag > market > all)
      let npisToUse = null;
      if (selectedTag && tagNPIs) {
        npisToUse = tagNPIs;
      } else if (selectedMarket && marketNPIs) {
        npisToUse = marketNPIs;
      }
      
      const response = await fetch(apiUrl('/api/investigation/aggregate-data'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npis: npisToUse,
          npiFieldType: npiFieldType, // Which NPI field to filter on
          groupBy: columnsToUse,
          aggregates: [
            { function: 'SUM', column: 'count', alias: 'total_count' },
            { function: 'SUM', column: 'charge_total', alias: 'total_charges' }
          ],
          filters: filtersToUse,
          excludeFilters: excludeFiltersToUse,
          search: resultsSearch,
          limit: limit
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch data');
      }

      const endTime = performance.now();
      const queryTimeMs = endTime - startTime;
      setQueryTime(queryTimeMs);
      setData(result.data);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options for a specific field
  const fetchFilterOptions = async (field) => {
    setLoadingFilters(prev => ({ ...prev, [field]: true }));

    try {
      // Determine which NPIs to use (priority: tag > market > all)
      let npisToUse = null;
      if (selectedTag && tagNPIs) {
        npisToUse = tagNPIs;
      } else if (selectedMarket && marketNPIs) {
        npisToUse = marketNPIs;
      }
      
      const response = await fetch(apiUrl('/api/investigation/filter-options'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npis: npisToUse,
          npiFieldType: npiFieldType, // Which NPI field to filter on
          columns: [field],
          limit: 50, // Reduced limit for faster loading
          existingFilters: filters
        })
      });

      const result = await response.json();
      
      if (result.success && result.data[field]) {
        setFilterOptions(prev => ({ ...prev, [field]: result.data[field] }));
      }
      
    } catch (err) {
      console.error('Error fetching filter options:', err);
    } finally {
      setLoadingFilters(prev => ({ ...prev, [field]: false }));
    }
  };

  // Column management
  const addColumn = (field) => {
    if (!columns.includes(field)) {
      setColumns([...columns, field]);
      // Clear data when configuration changes
      setData(null);
    }
  };

  const removeColumn = (field) => {
    setColumns(columns.filter(c => c !== field));
    // Clear data when configuration changes
    setData(null);
  };

  // Filter management
  const addFilter = (field, initialValue = '') => {
    if (!Object.keys(filters).includes(field)) {
      setFilters({ ...filters, [field]: initialValue });
      // Only fetch options for dropdown fields, not text input fields
      if (!TEXT_INPUT_FIELDS.includes(field) && !initialValue) {
        fetchFilterOptions(field);
      }
      // Set editing state if no initial value (user needs to fill it in)
      if (!initialValue) {
        setEditingFilter(field);
      }
      // Clear data when configuration changes
      setData(null);
    } else if (initialValue) {
      // Field already exists as filter, just update the value
      updateFilter(field, initialValue);
    }
  };

  const removeFilter = (field) => {
    const updated = { ...filters };
    delete updated[field];
    setFilters(updated);
    setEditingFilter(null); // Clear editing state
    // Clear data when configuration changes
    setData(null);
  };

  const updateFilter = (field, value) => {
    setFilters({ ...filters, [field]: value });
    // Clear data when filter value changes
    setData(null);
  };
  
  // Handle cell click for drill-down (include filter)
  const handleCellClick = async (field, value) => {
    // Don't drill down on measure columns
    if (field === 'total_count' || field === 'total_charges') return;
    
    // Calculate new columns (remove this field if it exists)
    const newColumns = columns.includes(field) 
      ? columns.filter(c => c !== field) 
      : columns;
    
    // Calculate new filters (add or update this field)
    const stringValue = String(value);
    const newFilters = { ...filters, [field]: stringValue };
    
    // Update state
    setColumns(newColumns);
    setFilters(newFilters);
    setData(null);
    
    // Immediately run analysis with the new values (don't wait for state to update)
    fetchData({
      columns: newColumns,
      filters: newFilters
    });
  };
  
  // Handle cell right-click for exclusion
  const handleCellRightClick = (e, field, value) => {
    e.preventDefault(); // Prevent context menu
    
    // Don't drill down on measure columns
    if (field === 'total_count' || field === 'total_charges') return;
    
    // Calculate new columns (remove this field if it exists)
    const newColumns = columns.includes(field) 
      ? columns.filter(c => c !== field) 
      : columns;
    
    // Calculate new exclude filters (add or update this field)
    const stringValue = String(value);
    const newExcludeFilters = { ...excludeFilters, [field]: stringValue };
    
    // Update state
    setColumns(newColumns);
    setExcludeFilters(newExcludeFilters);
    setData(null);
    
    // Immediately run analysis with the new values
    fetchData({
      columns: newColumns,
      excludeFilters: newExcludeFilters
    });
  };
  
  // Clear all configuration
  const clearAll = () => {
    setColumns([]);
    // Reset to default date range filter if available
    if (defaultDateRange) {
      setFilters({ date__month_grain: `${defaultDateRange.min},${defaultDateRange.max}` });
    } else {
      setFilters({});
    }
    setExcludeFilters({});
    setSelectedMarket(null);
    setMarketNPIs(null);
    setSelectedTag(null);
    setTagNPIs(null);
    setResultsSearch('');
    setFieldSearch('');
    setData(null);
    setError(null);
  };

  // Handle escape key for field search
  const handleFieldSearchEscape = (e) => {
    if (e.key === 'Escape') {
      if (fieldSearch && fieldSearchEscapeCount === 0) {
        // First escape: clear the search
        setFieldSearch('');
        setFieldSearchEscapeCount(1);
        // Reset the count after a short delay
        setTimeout(() => setFieldSearchEscapeCount(0), 100);
      } else {
        // Second escape (or first if no value): exit focus
        e.target.blur();
        setFieldSearchEscapeCount(0);
      }
    }
  };

  // Handle escape key for results search
  const handleResultsSearchEscape = (e) => {
    if (e.key === 'Escape') {
      if (resultsSearch && resultsSearchEscapeCount === 0) {
        // First escape: clear the search
        setResultsSearch('');
        setResultsSearchEscapeCount(1);
        // Reset the count after a short delay
        setTimeout(() => setResultsSearchEscapeCount(0), 100);
      } else {
        // Second escape (or first if no value): exit focus
        e.target.blur();
        setResultsSearchEscapeCount(0);
      }
    }
  };

  // Export CSV
  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claims-analysis-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format numbers
  const formatNumber = (value) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'object' ? parseFloat(value.toString()) : parseFloat(value);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '$0';
    const num = typeof value === 'object' ? parseFloat(value.toString()) : parseFloat(value);
    return isNaN(num) ? '$0' : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className={styles.container}>
      {/* Top Controls Bar */}
      <div className={styles.controlsBar}>
        {queryTime !== null && (
          <span className={styles.queryTime}>
            {queryTime < 1000 ? `${queryTime.toFixed(0)}ms` : `${(queryTime / 1000).toFixed(2)}s`}
          </span>
        )}
        
        {(providerTags || savedMarkets.length > 0) && (
          <Dropdown
            trigger={
              <button className="sectionHeaderButton">
                Filter On: {npiFieldType === 'billing_provider_npi' ? 'Billing' : 
                           npiFieldType === 'performing_provider_npi' ? 'Performing' :
                           npiFieldType === 'facility_provider_npi' ? 'Facility' : 'Service Location'}
                <ChevronDown size={14} />
              </button>
            }
            isOpen={npiFieldDropdownOpen}
            onToggle={setNpiFieldDropdownOpen}
            className={styles.dropdownMenu}
          >
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                setNpiFieldType('billing_provider_npi');
                setData(null);
                setNpiFieldDropdownOpen(false);
              }}
            >
              Billing Provider
            </button>
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                setNpiFieldType('performing_provider_npi');
                setData(null);
                setNpiFieldDropdownOpen(false);
              }}
            >
              Performing Provider
            </button>
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                setNpiFieldType('facility_provider_npi');
                setData(null);
                setNpiFieldDropdownOpen(false);
              }}
            >
              Facility
            </button>
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                setNpiFieldType('service_location_provider_npi');
                setData(null);
                setNpiFieldDropdownOpen(false);
              }}
            >
              Service Location
            </button>
          </Dropdown>
        )}
        
        {providerTags && (
          <Dropdown
            trigger={
              <button className="sectionHeaderButton">
                <FilterIcon size={14} />
                {selectedTag ? 
                  `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} (${tagNPIs?.length || 0})` : 
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
        
        {savedMarkets.length > 0 && (
          <Dropdown
            trigger={
              <button className="sectionHeaderButton">
                <MapPin size={14} />
                {selectedMarket ? 
                  `${selectedMarket.name} (${marketNPIs?.length || 0})` : 
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
              >
                {market.name} ({market.radius_miles}mi)
              </button>
            ))}
          </Dropdown>
        )}
        
        <div className={styles.spacer}></div>
        
        {(columns.length > 0 || Object.keys(filters).length > 0 || Object.keys(excludeFilters).length > 0 || selectedMarket || selectedTag) && (
          <button 
            onClick={clearAll}
            className="sectionHeaderButton"
            title="Clear all columns, filters, market, and tag selections"
          >
            <X size={14} />
            Clear All
          </button>
        )}
        
        <button 
          onClick={fetchData}
          className="sectionHeaderButton primary"
          disabled={loading}
        >
          <Play size={14} />
          <span>{loading ? 'Loading...' : 'Run Analysis'}</span>
        </button>
      </div>

      {/* Main Layout */}
      <div className={styles.mainLayout}>
        
        {/* Left Sidebar - Fields */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Available Fields</h3>
            <p>Click to add to Columns or Filters</p>
            <div className="searchBarContainer">
              <div className="searchIcon">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                onKeyDown={handleFieldSearchEscape}
                placeholder="Search fields..."
                className="searchInput"
              />
              {fieldSearch && (
                <button 
                  onClick={() => setFieldSearch('')}
                  className="clearButton"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {Object.keys(filteredFieldGroups).length === 0 ? (
            <div className={styles.noSearchResults}>
              <p>No fields found matching "{fieldSearch}"</p>
            </div>
          ) : (
            Object.entries(filteredFieldGroups).map(([groupName, fields]) => (
              <div key={groupName} className={styles.fieldGroup}>
                <div className={styles.fieldGroupHeader}>{groupName}</div>
                <div className={styles.fieldList}>
                  {fields.map(field => {
                    const inColumns = columns.includes(field.value);
                    const inFilters = Object.keys(filters).includes(field.value);
                    
                    return (
                      <div 
                        key={field.value} 
                        className={`${styles.fieldItem} ${inColumns || inFilters ? styles.fieldItemUsed : ''}`}
                      >
                        <span className={styles.fieldLabel}>{field.label}</span>
                        <div className={styles.fieldActions}>
                          {!inColumns && !inFilters && (
                            <>
                              <button 
                                onClick={() => addColumn(field.value)}
                                className={styles.fieldActionBtn}
                                title="Add to Columns"
                              >
                                <Columns3 size={14} />
                              </button>
                              <button 
                                onClick={() => addFilter(field.value)}
                                className={styles.fieldActionBtn}
                                title="Add to Filters"
                              >
                                <FilterIcon size={14} />
                              </button>
                            </>
                          )}
                          {inColumns && <span className={styles.badge}>Column</span>}
                          {inFilters && <span className={styles.badge}>Filter</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          
          {/* Configuration Panel */}
          <div className={styles.configPanel}>
            
            <div className={styles.configGrid}>
              {/* Columns Section */}
              <div className={styles.configSection}>
                <div className={styles.sectionHeader}>
                  <Columns3 size={18} />
                  <h3>Columns (GROUP BY)</h3>
                  <span className={styles.count}>{columns.length}</span>
                </div>
                
                {columns.length === 0 ? (
                  <p className={styles.emptyMessage}>
                    Add fields from the left sidebar to group your data
                  </p>
                ) : (
                  <div className={styles.chipList}>
                    {columns.map(col => (
                      <div key={col} className={styles.chip}>
                        <span>{allFields[col]}</span>
                        <button onClick={() => removeColumn(col)}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters Section */}
              <div className={styles.configSection}>
                <div className={styles.sectionHeader}>
                  <FilterIcon size={18} />
                  <h3>Filters (WHERE)</h3>
                  <span className={styles.count}>{Object.keys(filters).length + Object.keys(excludeFilters).length}</span>
                </div>
                
                {Object.keys(filters).length === 0 && Object.keys(excludeFilters).length === 0 ? (
                  <p className={styles.emptyMessage}>
                    Add fields from the left sidebar to filter your data
                  </p>
                ) : (
                  <div className={styles.chipList}>
                    {/* Include Filters */}
                    {Object.entries(filters).map(([field, value]) => {
                      // Check if this is the default date range filter
                      const isDefaultDateRange = field === 'date__month_grain' && 
                                                  defaultDateRange && 
                                                  value === `${defaultDateRange.min},${defaultDateRange.max}`;
                      
                      const isEditing = editingFilter === field || !value; // Edit if clicked or empty
                      const isTextField = TEXT_INPUT_FIELDS.includes(field);
                      const hasOptions = filterOptions[field] && Array.isArray(filterOptions[field]);
                      const isLoading = loadingFilters[field];
                      
                      if (isEditing && !isDefaultDateRange) {
                        // Show editable interface
                        return (
                          <div key={field} className={styles.filterEditor}>
                            <label>{allFields[field]}:</label>
                            {isTextField ? (
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateFilter(field, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingFilter(null);
                                    if (value) fetchData();
                                  }
                                }}
                                onBlur={() => setEditingFilter(null)}
                                placeholder="Enter value"
                                className={styles.input}
                                autoFocus
                              />
                            ) : hasOptions ? (
                              <select
                                value={value}
                                onChange={(e) => {
                                  updateFilter(field, e.target.value);
                                  setEditingFilter(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && value) {
                                    setEditingFilter(null);
                                    fetchData();
                                  }
                                }}
                                onBlur={() => setEditingFilter(null)}
                                className={styles.select}
                                autoFocus
                              >
                                <option value="">Select...</option>
                                {filterOptions[field].map((option, idx) => {
                                  const displayValue = option.value?.value || option.value;
                                  let stringValue;
                                  if (displayValue instanceof Date) {
                                    stringValue = displayValue.toISOString().substring(0, 7);
                                  } else if (typeof displayValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(displayValue)) {
                                    stringValue = displayValue.substring(0, 7);
                                  } else {
                                    stringValue = String(displayValue);
                                  }
                                  return (
                                    <option key={idx} value={stringValue}>
                                      {stringValue}
                                    </option>
                                  );
                                })}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={value}
                                onChange={(e) => updateFilter(field, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingFilter(null);
                                    if (value) fetchData();
                                  }
                                }}
                                onBlur={() => setEditingFilter(null)}
                                placeholder={isLoading ? "Loading..." : "Enter value"}
                                className={styles.input}
                                disabled={isLoading}
                                autoFocus
                              />
                            )}
                            <button onClick={() => removeFilter(field)} className={styles.removeButton}>
                              <X size={14} />
                            </button>
                          </div>
                        );
                      }
                      
                      // Show chip (read-only)
                      const displayLabel = isDefaultDateRange ? 'Last 12 Months' : allFields[field];
                      const displayValue = isDefaultDateRange 
                        ? `${defaultDateRange.min} to ${defaultDateRange.max}` 
                        : value;
                      
                      return (
                        <div 
                          key={field} 
                          className={styles.chip}
                          onClick={() => !isDefaultDateRange && setEditingFilter(field)}
                          style={{ cursor: isDefaultDateRange ? 'default' : 'pointer' }}
                          title={isDefaultDateRange ? '' : 'Click to edit'}
                        >
                          <span>{displayLabel}: {displayValue}</span>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            removeFilter(field);
                          }}>
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Exclusion Filters */}
                    {Object.entries(excludeFilters).map(([field, value]) => (
                      <div key={`exclude_${field}`} className={`${styles.chip} ${styles.excludeChip}`}>
                        <span>{allFields[field]}: NOT {value}</span>
                        <button onClick={() => {
                          const updated = { ...excludeFilters };
                          delete updated[field];
                          setExcludeFilters(updated);
                          setData(null);
                        }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className={styles.resultsPanel}>
            <div className={styles.resultsHeader}>
              <h3>Results</h3>
              
              <div className={styles.resultsControls}>
                {columns.length > 0 && (
                  <div className="searchBarContainer">
                    <div className="searchIcon">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      value={resultsSearch}
                      onChange={(e) => setResultsSearch(e.target.value)}
                      onKeyDown={handleResultsSearchEscape}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          setData(null);
                          fetchData();
                        }
                      }}
                      placeholder={`Search in ${columns.map(c => allFields[c]).join(', ')}...`}
                      className="searchInput"
                    />
                    {resultsSearch && (
                      <button 
                        onClick={() => {
                          setResultsSearch('');
                          setData(null);
                        }}
                        className="clearButton"
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                )}
                
                {resultsSearch && (
                  <button
                    onClick={() => {
                      setData(null);
                      fetchData();
                    }}
                    className="sectionHeaderButton primary"
                  >
                    <Search size={14} />
                    Search
                  </button>
                )}
                
                {data && data.length > 0 && (
                  <>
                    <span className={styles.rowCount}>{data.length} rows</span>
                    <button onClick={exportToCSV} className="sectionHeaderButton">
                      <Download size={14} />
                      Export CSV
                    </button>
                  </>
                )}
              </div>
            </div>

            {!data && (
              <div className={styles.emptyState}>
                <Database size={48} />
                <p>Configure your query above and click "Run Analysis"</p>
                <div className={styles.quickTips}>
                  <h4>Quick Tips:</h4>
                  <ul>
                    <li>No columns = See grand totals only</li>
                    <li>Add columns to group data by dimensions</li>
                    <li>Add filters to narrow results</li>
                    <li>Results always show Total Procedures and Total Charges</li>
                  </ul>
                </div>
              </div>
            )}

            {data && data.length === 0 && (
              <div className={styles.emptyState}>
                <p>No results found. Try adjusting your filters or columns.</p>
              </div>
            )}

            {data && data.length > 0 && (() => {
              // Calculate max values for conditional formatting
              const maxCount = Math.max(...data.map(row => {
                const val = row.total_count;
                return typeof val === 'object' ? parseFloat(val.toString()) : parseFloat(val) || 0;
              }));
              const maxCharges = Math.max(...data.map(row => {
                const val = row.total_charges;
                return typeof val === 'object' ? parseFloat(val.toString()) : parseFloat(val) || 0;
              }));
              
              return (
                <div className={styles.tableContainer}>
                  {loading && (
                    <div className={styles.loadingOverlay}>
                      <div className={styles.loadingContent}>
                        <Spinner />
                        <span>Loading...</span>
                      </div>
                    </div>
                  )}
                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        {columns.map(col => (
                          <th key={col}>{allFields[col]}</th>
                        ))}
                        <th className={styles.measureColumn}>Total Procedures</th>
                        <th className={styles.measureColumn}>Total Charges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => {
                        const countValue = typeof row.total_count === 'object' 
                          ? parseFloat(row.total_count.toString()) 
                          : parseFloat(row.total_count) || 0;
                        const chargesValue = typeof row.total_charges === 'object'
                          ? parseFloat(row.total_charges.toString())
                          : parseFloat(row.total_charges) || 0;
                        
                        const countPercent = maxCount > 0 ? (countValue / maxCount) * 100 : 0;
                        const chargesPercent = maxCharges > 0 ? (chargesValue / maxCharges) * 100 : 0;
                        
                        return (
                          <tr key={index}>
                            {columns.map(col => (
                              <td 
                                key={col}
                                onClick={() => handleCellClick(col, row[col])}
                                onContextMenu={(e) => handleCellRightClick(e, col, row[col])}
                                className={styles.clickableCell}
                                title="Click to include | Right-click to exclude"
                              >
                                {(() => {
                                  const value = row[col];
                                  
                                  // Handle null/undefined
                                  if (value === null || value === undefined) {
                                    return <span className={styles.nullValue}>NULL</span>;
                                  }
                                  // Handle Date objects
                                  if (value instanceof Date) {
                                    return value.toISOString().substring(0, 7);
                                  }
                                  
                                  // Handle nested date objects {value: Date}
                                  if (value && typeof value === 'object' && value.value) {
                                    if (value.value instanceof Date) {
                                      return value.value.toISOString().substring(0, 7);
                                    }
                                    // Extract value property if present
                                    return String(value.value).substring(0, 7);
                                  }
                                  
                                  // Handle date strings YYYY-MM-DD
                                  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                                    return value.substring(0, 7);
                                  }
                                  
                                  // Handle any remaining objects (fallback)
                                  if (typeof value === 'object') {
                                    console.warn('Unexpected object in column', col, ':', value);
                                    return JSON.stringify(value);
                                  }
                                  
                                  // Default: convert to string
                                  return String(value);
                                })()}
                              </td>
                            ))}
                            <td className={`${styles.measureCell} ${styles.nonClickableCell}`}>
                              <div className={styles.dataBar} style={{ '--bar-width': `${countPercent}%` }}>
                                <span className={styles.dataBarValue}>{formatNumber(row.total_count)}</span>
                              </div>
                            </td>
                            <td className={`${styles.measureCell} ${styles.nonClickableCell}`}>
                              <div className={styles.dataBar} style={{ '--bar-width': `${chargesPercent}%` }}>
                                <span className={styles.dataBarValue}>{formatCurrency(row.total_charges)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
