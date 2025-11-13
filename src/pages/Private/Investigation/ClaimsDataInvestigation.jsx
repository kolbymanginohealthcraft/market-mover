import { useState, useEffect } from "react";
import styles from "./ClaimsDataInvestigation.module.css";
import Spinner from "../../../components/Buttons/Spinner";
import Dropdown from "../../../components/Buttons/Dropdown";
import { apiUrl } from '../../../utils/api';
import { supabase } from '../../../app/supabaseClient';
import { Database, Play, Download, X, Plus, Filter as FilterIcon, Columns3, Search, MapPin, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Bookmark, Check, XCircle, Tag } from "lucide-react";
import { getSegmentationIcon, getSegmentationIconProps } from '../../../utils/segmentationIcons';

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
  
  // Pathway drill-down state
  const [pathwayModal, setPathwayModal] = useState(null); // { row, direction, data, loading, groupBy }
  const [pathwayData, setPathwayData] = useState(null);
  const [pathwayLoading, setPathwayLoading] = useState(false);
  const [pathwayGroupBy, setPathwayGroupBy] = useState([]);
  const [pathwayFilters, setPathwayFilters] = useState({}); // Additional filters for pathway results
  const [showPathwayFieldSelector, setShowPathwayFieldSelector] = useState(false);
  const [editingPathwayFilter, setEditingPathwayFilter] = useState(null);
  const [pathwayFilterOptions, setPathwayFilterOptions] = useState({});
  
  // Query configuration
  const [columns, setColumns] = useState([]);
  const [filters, setFilters] = useState({});
  const [excludeFilters, setExcludeFilters] = useState({}); // Exclusion filters (NOT IN)
  const [limit, setLimit] = useState(100);
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({});
  const [loadingFilters, setLoadingFilters] = useState({});
  const [editingFilter, setEditingFilter] = useState(null); // Track which filter is being edited
  const [isClickingButton, setIsClickingButton] = useState(false); // Track if clicking a button to prevent blur
  
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
  
  // Procedure tags
  const [procedureTags, setProcedureTags] = useState([]);
  const [selectedProcedureTag, setSelectedProcedureTag] = useState(null);
  const [procedureCodes, setProcedureCodes] = useState(null);
  
  // Taxonomy tags
  const [taxonomyTags, setTaxonomyTags] = useState([]);
  const [selectedTaxonomyTag, setSelectedTaxonomyTag] = useState(null);
  const [taxonomyCodes, setTaxonomyCodes] = useState(null);
  const [selectedTaxonomyFields, setSelectedTaxonomyFields] = useState([]); // Which taxonomy code fields to apply filter to
  const taxonomyCodeFields = [
    { value: 'billing_provider_taxonomy_code', label: 'Billing: Taxonomy Code' },
    { value: 'billing_provider_primary_taxonomy_code', label: 'Billing: Primary Taxonomy Code' },
    { value: 'facility_provider_taxonomy_code', label: 'Facility: Taxonomy Code' },
    { value: 'facility_provider_primary_taxonomy_code', label: 'Facility: Primary Taxonomy Code' },
    { value: 'service_location_provider_taxonomy_code', label: 'Service Location: Taxonomy Code' },
    { value: 'service_location_provider_primary_taxonomy_code', label: 'Service Location: Primary Taxonomy Code' },
    { value: 'performing_provider_taxonomy_code', label: 'Performing: Taxonomy Code' },
    { value: 'performing_provider_primary_taxonomy_code', label: 'Performing: Primary Taxonomy Code' },
  ];
  
  // NPI field selector (which provider perspective to use)
  const [npiFieldType, setNpiFieldType] = useState('billing_provider_npi');
  
  // Metadata and default filters
  const [maxDate, setMaxDate] = useState(null);
  const [defaultDateRange, setDefaultDateRange] = useState(null);
  
  // Dropdown states
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [procedureDropdownOpen, setProcedureDropdownOpen] = useState(false);
  const [taxonomyDropdownOpen, setTaxonomyDropdownOpen] = useState(false);
  
  // Collapsible field group sections
  const [expandedFieldGroups, setExpandedFieldGroups] = useState({});
  
  // Fields that should use text input instead of dropdown (for comma-separated values)
  const TEXT_INPUT_FIELDS = [
    'billing_provider_npi',
    'performing_provider_npi',
    'facility_provider_npi',
    'service_location_provider_npi',
    'billing_provider_name',
    'facility_provider_name',
    'service_location_provider_name',
    'performing_provider_name',
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
      { value: "billing_provider_name", label: "Name" },
      { value: "billing_provider_npi", label: "NPI" },
      { value: "billing_provider_npi_type", label: "NPI Type" },
      { value: "billing_provider_taxonomy_code", label: "Taxonomy Code" },
      { value: "billing_provider_primary_taxonomy_code", label: "Primary Taxonomy Code" },
      { value: "billing_provider_taxonomy_grouping", label: "Taxonomy Grouping" },
      { value: "billing_provider_taxonomy_classification", label: "Taxonomy Classification" },
      { value: "billing_provider_taxonomy_specialization", label: "Taxonomy Specialization" },
      { value: "billing_provider_taxonomy_consolidated_specialty", label: "Consolidated Specialty" },
      { value: "billing_provider_state", label: "State" },
      { value: "billing_provider_city", label: "City" },
      { value: "billing_provider_county", label: "County" },
    ],
    "Facility Provider": [
      { value: "facility_provider_name", label: "Name" },
      { value: "facility_provider_npi", label: "NPI" },
      { value: "facility_provider_npi_type", label: "NPI Type" },
      { value: "facility_provider_taxonomy_code", label: "Taxonomy Code" },
      { value: "facility_provider_primary_taxonomy_code", label: "Primary Taxonomy Code" },
      { value: "facility_provider_taxonomy_grouping", label: "Taxonomy Grouping" },
      { value: "facility_provider_taxonomy_classification", label: "Taxonomy Classification" },
      { value: "facility_provider_taxonomy_specialization", label: "Taxonomy Specialization" },
      { value: "facility_provider_taxonomy_consolidated_specialty", label: "Consolidated Specialty" },
      { value: "facility_provider_state", label: "State" },
      { value: "facility_provider_city", label: "City" },
      { value: "facility_provider_county", label: "County" },
    ],
    "Service Location Provider": [
      { value: "service_location_provider_name", label: "Name" },
      { value: "service_location_provider_npi", label: "NPI" },
      { value: "service_location_provider_npi_type", label: "NPI Type" },
      { value: "service_location_provider_taxonomy_code", label: "Taxonomy Code" },
      { value: "service_location_provider_primary_taxonomy_code", label: "Primary Taxonomy Code" },
      { value: "service_location_provider_taxonomy_grouping", label: "Taxonomy Grouping" },
      { value: "service_location_provider_taxonomy_classification", label: "Taxonomy Classification" },
      { value: "service_location_provider_taxonomy_specialization", label: "Taxonomy Specialization" },
      { value: "service_location_provider_taxonomy_consolidated_specialty", label: "Consolidated Specialty" },
      { value: "service_location_provider_state", label: "State" },
      { value: "service_location_provider_city", label: "City" },
      { value: "service_location_provider_county", label: "County" },
    ],
    "Performing Provider": [
      { value: "performing_provider_name", label: "Name" },
      { value: "performing_provider_npi", label: "NPI" },
      { value: "performing_provider_npi_type", label: "NPI Type" },
      { value: "performing_provider_taxonomy_code", label: "Taxonomy Code" },
      { value: "performing_provider_primary_taxonomy_code", label: "Primary Taxonomy Code" },
      { value: "performing_provider_taxonomy_grouping", label: "Taxonomy Grouping" },
      { value: "performing_provider_taxonomy_classification", label: "Taxonomy Classification" },
      { value: "performing_provider_taxonomy_specialization", label: "Taxonomy Specialization" },
      { value: "performing_provider_taxonomy_consolidated_specialty", label: "Consolidated Specialty" },
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
      // Add provider group prefix for all provider fields
      const isProviderGroup = groupName.includes('Provider');
      if (isProviderGroup) {
        // Add group prefix for clarity (e.g., "Billing: Name", "Facility: Consolidated Specialty")
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
    
    async function fetchProcedureTags() {
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
        
        // Get team procedure tags
        const { data: tags, error: tagsError } = await supabase
          .from('team_procedure_tags')
          .select('*')
          .eq('team_id', profile.team_id)
          .order('created_at', { ascending: false });
        
        if (tagsError) throw tagsError;
        
        setProcedureTags(tags || []);
        console.log('Loaded procedure tags:', tags?.length || 0);
      } catch (err) {
        console.error('Error fetching procedure tags:', err);
      }
    }
    
    async function fetchTaxonomyTags() {
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
        
        // Get team taxonomy tags
        const { data: tags, error: tagsError } = await supabase
          .from('team_taxonomy_tags')
          .select('*')
          .eq('team_id', profile.team_id)
          .order('created_at', { ascending: false });
        
        if (tagsError) throw tagsError;
        
        setTaxonomyTags(tags || []);
        console.log('Loaded taxonomy tags:', tags?.length || 0);
      } catch (err) {
        console.error('Error fetching taxonomy tags:', err);
      }
    }
    
    fetchMetadata();
    fetchMarkets();
    fetchProviderTags();
    fetchProcedureTags();
    fetchTaxonomyTags();
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
  
  // Toggle field group expansion
  const toggleFieldGroup = (groupName) => {
    setExpandedFieldGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };
  
  // Handle taxonomy tag selection (doesn't apply filters - just selects the taxonomy)
  const handleTaxonomyTagSelect = (tagId) => {
    if (tagId === 'all') {
      // "All" selected - clear taxonomy filters
      setSelectedTaxonomyTag(null);
      setTaxonomyCodes(null);
      setSelectedTaxonomyFields([]);
      
      // Remove all taxonomy code field filters
      const updatedFilters = { ...filters };
      taxonomyCodeFields.forEach(field => {
        if (updatedFilters[field.value]) {
          delete updatedFilters[field.value];
        }
      });
      setFilters(updatedFilters);
      setData(null);
      // Don't close dropdown - keep it open
      return;
    }
    
    if (tagId === 'all_tagged') {
      // "All Tagged" selected - set taxonomy codes but don't apply filters yet
      const codes = taxonomyTags.map(t => t.taxonomy_code);
      setSelectedTaxonomyTag({ id: 'all_tagged', taxonomy_code: 'All Tagged' });
      setTaxonomyCodes(codes);
      // Clear field selection so user must choose which fields to apply to
      setSelectedTaxonomyFields([]);
      // Don't apply filters yet - wait for user to select fields
      // Don't close dropdown - keep it open so user can select fields
      return;
    }
    
    const tag = taxonomyTags.find(t => t.id === tagId);
    if (!tag) return;
    
    // Single taxonomy selected - set taxonomy code but don't apply filters yet
    setSelectedTaxonomyTag(tag);
    setTaxonomyCodes([tag.taxonomy_code]);
    // Clear field selection so user must choose which fields to apply to
    setSelectedTaxonomyFields([]);
    // Don't apply filters yet - wait for user to select fields
    // Don't close dropdown - keep it open so user can select fields
  };
  
  // Handle taxonomy field selection (which fields to apply filter to)
  const handleTaxonomyFieldToggle = (fieldValue) => {
    const updatedFields = selectedTaxonomyFields.includes(fieldValue)
      ? selectedTaxonomyFields.filter(f => f !== fieldValue)
      : [...selectedTaxonomyFields, fieldValue];
    
    setSelectedTaxonomyFields(updatedFields);
    
    // Update filters based on selected fields
    if (taxonomyCodes && taxonomyCodes.length > 0) {
      const updatedFilters = { ...filters };
      
      // Remove filters from unselected fields
      taxonomyCodeFields.forEach(field => {
        if (!updatedFields.includes(field.value) && updatedFilters[field.value]) {
          delete updatedFilters[field.value];
        }
      });
      
      // Add filters to newly selected fields
      updatedFields.forEach(field => {
        updatedFilters[field] = taxonomyCodes;
      });
      
      setFilters(updatedFilters);
      setData(null);
    }
    
    // Don't close dropdown - allow user to select multiple fields
  };
  
  // Handle procedure tag selection
  const handleProcedureTagSelect = (tagId) => {
    if (tagId === 'all') {
      // "All" selected - clear procedure code filter
      setSelectedProcedureTag(null);
      setProcedureCodes(null);
      // Remove code filter if it exists
      const updatedFilters = { ...filters };
      if (updatedFilters.code) {
        delete updatedFilters.code;
        setFilters(updatedFilters);
      }
      setData(null);
      return;
    }
    
    if (tagId === 'all_tagged') {
      // "All Tagged" selected - filter by all tagged procedure codes
      const codes = procedureTags.map(t => t.procedure_code);
      setSelectedProcedureTag({ id: 'all_tagged', procedure_code: 'All Tagged' });
      setProcedureCodes(codes);
      
      // Update filters to include all procedure codes
      setFilters(prev => ({
        ...prev,
        code: codes
      }));
      
      setData(null);
      return;
    }
    
    const tag = procedureTags.find(t => t.id === tagId);
    if (!tag) return;
    
    setSelectedProcedureTag(tag);
    // Set procedure codes as an array for the filter
    const codes = [tag.procedure_code];
    setProcedureCodes(codes);
    
    // Update filters to include the procedure code
    setFilters(prev => ({
      ...prev,
      code: codes
    }));
    
    setData(null);
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
  
  // Auto-expand sections that contain matching fields when searching
  useEffect(() => {
    if (fieldSearch.trim()) {
      // When there's a search term, expand all sections that have matching fields
      const searchLower = fieldSearch.toLowerCase();
      const groupsToExpand = Object.entries(FIELD_GROUPS).reduce((acc, [groupName, fields]) => {
        // Check if group name matches or any field in this group matches
        const hasMatch = groupName.toLowerCase().includes(searchLower) ||
          fields.some(field => 
            field.label.toLowerCase().includes(searchLower) || 
            field.value.toLowerCase().includes(searchLower)
          );
        if (hasMatch) {
          acc[groupName] = true;
        }
        return acc;
      }, {});
      setExpandedFieldGroups(prev => ({
        ...prev,
        ...groupsToExpand
      }));
    }
  }, [fieldSearch]);

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

  // Pathway field groups for the modal
  const PATHWAY_FIELD_GROUPS = {
    "Provider Identity": [
      { value: "billing_provider_name", label: "Provider Name" },
      { value: "facility_provider_name", label: "Facility Name" },
      { value: "service_location_provider_name", label: "Service Location" },
      { value: "performing_provider_name", label: "Performing Provider" },
    ],
    "Provider Type": [
      { value: "billing_provider_taxonomy_classification", label: "Taxonomy Classification" },
      { value: "billing_provider_taxonomy_consolidated_specialty", label: "Consolidated Specialty" },
      { value: "billing_provider_taxonomy_specialization", label: "Taxonomy Specialization" },
    ],
    "Geography": [
      { value: "billing_provider_state", label: "Provider State" },
      { value: "billing_provider_city", label: "Provider City" },
      { value: "billing_provider_county", label: "Provider County" },
    ],
    "Procedures & Services": [
      { value: "code", label: "Procedure Code" },
      { value: "code_description", label: "Code Description" },
      { value: "service_line_description", label: "Service Line" },
      { value: "subservice_line_description", label: "Sub-Service Line" },
      { value: "service_category_description", label: "Service Category" },
    ],
    "Patient Demographics": [
      { value: "patient_age_bracket", label: "Age Bracket" },
      { value: "patient_gender", label: "Gender" },
      { value: "patient_state", label: "Patient State" },
      { value: "patient_zip3", label: "Patient ZIP3" },
    ],
    "Payor": [
      { value: "payor_group", label: "Payor Group" },
      { value: "type_of_coverage", label: "Coverage Type" },
    ],
    "Temporal": [
      { value: "date__month_grain", label: "Month" },
    ],
  };

  // Preset pathway views
  const PATHWAY_PRESETS = {
    upstream: [
      { name: "By Provider", fields: ['billing_provider_name', 'billing_provider_state'] },
      { name: "By Provider Type", fields: ['billing_provider_taxonomy_classification'] },
      { name: "Provider + Type", fields: ['billing_provider_name', 'billing_provider_taxonomy_classification'] },
      { name: "By Geography", fields: ['billing_provider_state', 'billing_provider_city'] },
      { name: "By Demographics", fields: ['patient_age_bracket', 'patient_gender'] },
    ],
    downstream: [
      { name: "By Provider", fields: ['billing_provider_name', 'billing_provider_state'] },
      { name: "By Provider Type", fields: ['billing_provider_taxonomy_classification'] },
      { name: "Provider + Type", fields: ['billing_provider_name', 'billing_provider_taxonomy_classification'] },
      { name: "By Code", fields: ['code', 'code_description'] },
      { name: "By Service Line", fields: ['service_line_description'] },
      { name: "By Payor", fields: ['payor_group'] },
    ]
  };

  // Query pathways for a specific row (upstream or downstream)
  const queryPathways = async (row, direction, customGroupBy = null) => {
    // If this is initial click, set default groupBy
    const defaultGroupBy = direction === 'upstream' 
      ? ['billing_provider_name', 'billing_provider_state']
      : ['billing_provider_name', 'code', 'service_line_description'];
    
    const groupByToUse = customGroupBy || pathwayGroupBy.length > 0 ? pathwayGroupBy : defaultGroupBy;
    
    setPathwayModal({ row, direction, loading: true, data: null, groupBy: groupByToUse });
    setPathwayLoading(true);
    
    // Set pathway group by if not already set
    if (pathwayGroupBy.length === 0) {
      setPathwayGroupBy(defaultGroupBy);
    }

    try {
      // Build filters from the row data
      const combinedFilters = {};
      
      // Map columns from the row to pathway filters
      columns.forEach(col => {
        if (row[col] !== null && row[col] !== undefined) {
          // Handle values that might be objects (BigQuery returns)
          const value = row[col]?.value !== undefined ? row[col].value : row[col];
          combinedFilters[col] = value;
        }
      });

      // Add existing filters from main query
      Object.entries(filters).forEach(([key, value]) => {
        combinedFilters[key] = value;
      });
      
      // Add pathway-specific filters (from modal)
      Object.entries(pathwayFilters).forEach(([key, value]) => {
        combinedFilters[key] = value;
      });

      console.log('🔍 Pathway query request:', {
        direction,
        filters: combinedFilters,
        groupBy: groupByToUse
      });

      // Query pathways table
      const response = await fetch('/api/patient-journey/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupBy: groupByToUse,
          aggregates: [
            { function: 'COUNT', column: '*', alias: 'total_count' },
            { function: 'SUM', column: 'charges_total', alias: 'total_charges' }
          ],
          filters: combinedFilters,
          limit: 100,
          direction
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pathway data');
      }

      const result = await response.json();
      setPathwayModal(prev => ({ ...prev, loading: false, data: result.data }));
      
    } catch (err) {
      console.error('Error querying pathways:', err);
      setPathwayModal(prev => ({ ...prev, loading: false, error: err.message }));
    } finally {
      setPathwayLoading(false);
    }
  };

  const closePathwayModal = () => {
    setPathwayModal(null);
    setPathwayGroupBy([]);
    setPathwayFilters({});
    setShowPathwayFieldSelector(false);
    setEditingPathwayFilter(null);
    setPathwayFilterOptions({});
  };

  const togglePathwayField = (field) => {
    setPathwayGroupBy(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const applyPathwayPreset = (preset) => {
    setPathwayGroupBy(preset.fields);
    // Re-run query with new grouping
    if (pathwayModal) {
      queryPathways(pathwayModal.row, pathwayModal.direction, preset.fields);
    }
  };

  const refreshPathwayQuery = () => {
    if (pathwayModal && pathwayGroupBy.length > 0) {
      queryPathways(pathwayModal.row, pathwayModal.direction, pathwayGroupBy);
    }
  };

  const addPathwayFilter = async (field) => {
    setEditingPathwayFilter(field);
    
    try {
      // Build current filters to send for distinct values
      const combinedFilters = {};
      
      // Add row context
      columns.forEach(col => {
        if (pathwayModal.row[col] !== null && pathwayModal.row[col] !== undefined) {
          const value = pathwayModal.row[col]?.value !== undefined ? pathwayModal.row[col].value : pathwayModal.row[col];
          combinedFilters[col] = value;
        }
      });
      
      // Add existing filters
      Object.entries(filters).forEach(([key, value]) => {
        combinedFilters[key] = value;
      });
      
      // Add pathway filters
      Object.entries(pathwayFilters).forEach(([key, value]) => {
        combinedFilters[key] = value;
      });

      const response = await fetch('/api/patient-journey/distinct-values', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column: field,
          filters: combinedFilters,
          limit: 100,
          direction: pathwayModal.direction
        })
      });

      if (!response.ok) throw new Error('Failed to fetch filter options');

      const result = await response.json();
      setPathwayFilterOptions(prev => ({
        ...prev,
        [field]: result.data
      }));
    } catch (err) {
      console.error('Error fetching pathway filter options:', err);
    }
  };

  const togglePathwayFilterValue = (field, value) => {
    setPathwayFilters(prev => {
      const currentValues = prev[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [field]: newValues };
    });
  };

  const removePathwayFilter = (field) => {
    setPathwayFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  };

  const clearAllPathwayFilters = () => {
    setPathwayFilters({});
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
  
  // Toggle a filter between include and exclude
  const toggleFilterType = (field, currentValue) => {
    // Remove from current location
    const updatedFilters = { ...filters };
    const updatedExcludeFilters = { ...excludeFilters };
    
    if (filters[field] !== undefined) {
      // Currently an include filter - move to exclude
      delete updatedFilters[field];
      updatedExcludeFilters[field] = currentValue;
      setFilters(updatedFilters);
      setExcludeFilters(updatedExcludeFilters);
      // Keep editor open for the exclude filter
      setEditingFilter(`exclude_${field}`);
    } else if (excludeFilters[field] !== undefined) {
      // Currently an exclude filter - move to include
      delete updatedExcludeFilters[field];
      updatedFilters[field] = currentValue;
      setFilters(updatedFilters);
      setExcludeFilters(updatedExcludeFilters);
      // Keep editor open for the include filter
      setEditingFilter(field);
    }
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
    // Use array to preserve values that contain commas (e.g., "Office visit, established")
    const stringValue = String(value);
    const filterValue = [stringValue]; // Wrap in array to prevent comma-splitting in backend
    const newFilters = { ...filters, [field]: filterValue };
    
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
    // Use array to preserve values that contain commas (e.g., "Office visit, established")
    const stringValue = String(value);
    const filterValue = [stringValue]; // Wrap in array to prevent comma-splitting in backend
    const newExcludeFilters = { ...excludeFilters, [field]: filterValue };
    
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
    setSelectedProcedureTag(null);
    setProcedureCodes(null);
    setSelectedTaxonomyTag(null);
    setTaxonomyCodes(null);
    setSelectedTaxonomyFields([]);
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
        
        {providerTags && (() => {
          const NetworkIcon = getSegmentationIcon('network');
          return (
            <Dropdown
              trigger={
                <button className="sectionHeaderButton">
                  {NetworkIcon && <NetworkIcon {...getSegmentationIconProps({ size: 14 })} />}
                  {selectedTag ? 
                    `${selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1)} (${tagNPIs?.length || 0})` : 
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
        
        {savedMarkets.length > 0 && (
          <Dropdown
            trigger={
              <button className="sectionHeaderButton">
                <MapPin size={14} />
                {selectedMarket ? 
                  `${selectedMarket.name} (${marketNPIs?.length || 0})` : 
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
        )}
        
        {procedureTags.length > 0 && (
          <Dropdown
            trigger={
              <button className="sectionHeaderButton">
                <Bookmark size={14} />
                {selectedProcedureTag ? 
                  (selectedProcedureTag.id === 'all_tagged' 
                    ? `All Tagged (${procedureTags.length})` 
                    : selectedProcedureTag.procedure_code) : 
                  'Procedure Tag'}
                <ChevronDown size={14} />
              </button>
            }
            isOpen={procedureDropdownOpen}
            onToggle={setProcedureDropdownOpen}
            className={styles.dropdownMenu}
          >
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                handleProcedureTagSelect('all');
                setProcedureDropdownOpen(false);
              }}
            >
              All Procedures
            </button>
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                handleProcedureTagSelect('all_tagged');
                setProcedureDropdownOpen(false);
              }}
              style={{
                fontWeight: selectedProcedureTag?.id === 'all_tagged' ? '600' : '500',
                background: selectedProcedureTag?.id === 'all_tagged' ? 'rgba(0, 192, 139, 0.1)' : 'none',
              }}
            >
              All Tagged ({procedureTags.length})
            </button>
            {procedureTags.map(tag => (
              <button 
                key={tag.id}
                className={styles.dropdownItem}
                onClick={() => {
                  handleProcedureTagSelect(tag.id);
                  setProcedureDropdownOpen(false);
                }}
                style={{
                  fontWeight: selectedProcedureTag?.id === tag.id ? '600' : '500',
                  background: selectedProcedureTag?.id === tag.id ? 'rgba(0, 192, 139, 0.1)' : 'none',
                }}
              >
                {tag.procedure_code}
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
                  {selectedTaxonomyTag ? 
                    (selectedTaxonomyTag.id === 'all_tagged' 
                      ? `All Tagged (${taxonomyTags.length})` 
                      : selectedTaxonomyTag.taxonomy_code) : 
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
                handleTaxonomyTagSelect('all');
                setTaxonomyDropdownOpen(false);
              }}
            >
              All Taxonomies
            </button>
            <button 
              className={styles.dropdownItem}
              onClick={() => {
                handleTaxonomyTagSelect('all_tagged');
                // Don't close dropdown - keep it open so user can select fields
              }}
              style={{
                fontWeight: selectedTaxonomyTag?.id === 'all_tagged' ? '600' : '500',
                background: selectedTaxonomyTag?.id === 'all_tagged' ? 'rgba(0, 192, 139, 0.1)' : 'none',
              }}
            >
              All Tagged ({taxonomyTags.length})
            </button>
            {taxonomyTags.map(tag => (
              <button 
                key={tag.id}
                className={styles.dropdownItem}
                onClick={() => {
                  handleTaxonomyTagSelect(tag.id);
                  // Don't close dropdown - keep it open so user can select fields
                }}
                style={{
                  fontWeight: selectedTaxonomyTag?.id === tag.id ? '600' : '500',
                  background: selectedTaxonomyTag?.id === tag.id ? 'rgba(0, 192, 139, 0.1)' : 'none',
                }}
              >
                {tag.taxonomy_code}
              </button>
            ))}
            {selectedTaxonomyTag && (
              <>
                <div style={{ borderTop: '1px solid var(--gray-200)', margin: '8px 0' }}></div>
                <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--gray-600)', fontWeight: '600' }}>
                  Apply to fields:
                </div>
                {taxonomyCodeFields.map(field => (
                  <button
                    key={field.value}
                    className={styles.dropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaxonomyFieldToggle(field.value);
                    }}
                    style={{
                      paddingLeft: '24px',
                      fontWeight: selectedTaxonomyFields.includes(field.value) ? '600' : '400',
                      background: selectedTaxonomyFields.includes(field.value) ? 'rgba(0, 192, 139, 0.1)' : 'none',
                    }}
                  >
                    {selectedTaxonomyFields.includes(field.value) && <Check size={12} style={{ marginRight: '6px', display: 'inline-block' }} />}
                    {field.label}
                  </button>
                ))}
              </>
            )}
          </Dropdown>
          );
        })()}
        
        <div className={styles.spacer}></div>
        
        {(columns.length > 0 || Object.keys(filters).length > 0 || Object.keys(excludeFilters).length > 0 || selectedMarket || selectedTag || selectedProcedureTag || selectedTaxonomyTag) && (
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
            Object.entries(filteredFieldGroups).map(([groupName, fields]) => {
              const isExpanded = expandedFieldGroups[groupName];
              return (
                <div key={groupName} className={styles.fieldGroup}>
                  <div 
                    className={styles.fieldGroupHeader}
                    onClick={() => toggleFieldGroup(groupName)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <span>{groupName}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  {isExpanded && (
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
                  )}
                </div>
              );
            })
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
                      
                      const isEditing = editingFilter === field || !value || (Array.isArray(value) && value.length === 0); // Edit if clicked or empty
                      const isTextField = TEXT_INPUT_FIELDS.includes(field);
                      const hasOptions = filterOptions[field] && Array.isArray(filterOptions[field]);
                      const isLoading = loadingFilters[field];
                      
                      if (isEditing && !isDefaultDateRange) {
                        // Show editable interface
                        // Convert array values to string for editing
                        const editValue = Array.isArray(value) ? value.join(', ') : (value || '');
                        
                        return (
                          <div key={field} className={styles.filterEditor} onMouseDown={(e) => e.preventDefault()}>
                            <label>{allFields[field]}:</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              {isTextField ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => updateFilter(field, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingFilter(null);
                                      if (editValue) fetchData();
                                    } else if (e.key === 'Escape') {
                                      setEditingFilter(null);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Don't close if we're clicking a button inside
                                    setTimeout(() => {
                                      if (!isClickingButton) {
                                        setEditingFilter(null);
                                      }
                                      setIsClickingButton(false);
                                    }, 100);
                                  }}
                                  placeholder="Enter value"
                                  className={styles.input}
                                  style={{ flex: 1 }}
                                  autoFocus
                                />
                              ) : hasOptions ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => {
                                    updateFilter(field, e.target.value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && editValue) {
                                      setEditingFilter(null);
                                      fetchData();
                                    } else if (e.key === 'Escape') {
                                      setEditingFilter(null);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Don't close if we're clicking a button inside
                                    setTimeout(() => {
                                      if (!isClickingButton) {
                                        setEditingFilter(null);
                                      }
                                      setIsClickingButton(false);
                                    }, 100);
                                  }}
                                  className={styles.select}
                                  style={{ flex: 1 }}
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
                                  value={editValue}
                                  onChange={(e) => updateFilter(field, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingFilter(null);
                                      if (editValue) fetchData();
                                    } else if (e.key === 'Escape') {
                                      setEditingFilter(null);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Don't close if we're clicking a button inside
                                    setTimeout(() => {
                                      if (!isClickingButton) {
                                        setEditingFilter(null);
                                      }
                                      setIsClickingButton(false);
                                    }, 100);
                                  }}
                                  placeholder={isLoading ? "Loading..." : "Enter value"}
                                  className={styles.input}
                                  style={{ flex: 1 }}
                                  disabled={isLoading}
                                  autoFocus
                                />
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setIsClickingButton(true);
                                  toggleFilterType(field, value);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setIsClickingButton(true);
                                }}
                                className={styles.toggleButton}
                                title="Toggle to exclude"
                                style={{ 
                                  padding: '4px 8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  color: 'var(--gray-600)',
                                  background: 'var(--gray-100)',
                                  border: '1px solid var(--gray-200)',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Check size={12} />
                                <span>Include</span>
                              </button>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsClickingButton(true);
                                removeFilter(field);
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsClickingButton(true);
                              }}
                              className={styles.removeButton}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      }
                      
                      // Show chip (read-only)
                      const displayLabel = isDefaultDateRange ? 'Last 12 Months' : allFields[field];
                      
                      // Handle array values (from breadcrumb clicks)
                      let displayValue;
                      if (isDefaultDateRange) {
                        displayValue = `${defaultDateRange.min} to ${defaultDateRange.max}`;
                      } else if (Array.isArray(value)) {
                        // Array value - show elements
                        displayValue = value.length === 1 ? value[0] : value.join(', ');
                      } else {
                        displayValue = value;
                      }
                      
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
                    {Object.entries(excludeFilters).map(([field, value]) => {
                      const isEditing = editingFilter === `exclude_${field}` || !value || (Array.isArray(value) && value.length === 0);
                      const isTextField = TEXT_INPUT_FIELDS.includes(field);
                      const hasOptions = filterOptions[field] && Array.isArray(filterOptions[field]);
                      const isLoading = loadingFilters[field];
                      
                      if (isEditing) {
                        // Show editable interface for exclude filter
                        const editValue = Array.isArray(value) ? value.join(', ') : (value || '');
                        
                        return (
                          <div key={`exclude_${field}`} className={styles.filterEditor} onMouseDown={(e) => e.preventDefault()}>
                            <label>{allFields[field]}:</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              {isTextField ? (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => {
                                    const updated = { ...excludeFilters };
                                    updated[field] = e.target.value;
                                    setExcludeFilters(updated);
                                    setData(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingFilter(null);
                                      if (editValue) fetchData();
                                    } else if (e.key === 'Escape') {
                                      setEditingFilter(null);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Don't close if we're clicking a button inside
                                    setTimeout(() => {
                                      if (!isClickingButton) {
                                        setEditingFilter(null);
                                      }
                                      setIsClickingButton(false);
                                    }, 100);
                                  }}
                                  placeholder="Enter value"
                                  className={styles.input}
                                  style={{ flex: 1 }}
                                  autoFocus
                                />
                              ) : hasOptions ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => {
                                    const updated = { ...excludeFilters };
                                    updated[field] = e.target.value;
                                    setExcludeFilters(updated);
                                    setData(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && editValue) {
                                      setEditingFilter(null);
                                      fetchData();
                                    } else if (e.key === 'Escape') {
                                      setEditingFilter(null);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Don't close if we're clicking a button inside
                                    setTimeout(() => {
                                      if (!isClickingButton) {
                                        setEditingFilter(null);
                                      }
                                      setIsClickingButton(false);
                                    }, 100);
                                  }}
                                  className={styles.select}
                                  style={{ flex: 1 }}
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
                                  value={editValue}
                                  onChange={(e) => {
                                    const updated = { ...excludeFilters };
                                    updated[field] = e.target.value;
                                    setExcludeFilters(updated);
                                    setData(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingFilter(null);
                                      if (editValue) fetchData();
                                    } else if (e.key === 'Escape') {
                                      setEditingFilter(null);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Don't close if we're clicking a button inside
                                    setTimeout(() => {
                                      if (!isClickingButton) {
                                        setEditingFilter(null);
                                      }
                                      setIsClickingButton(false);
                                    }, 100);
                                  }}
                                  placeholder={isLoading ? "Loading..." : "Enter value"}
                                  className={styles.input}
                                  style={{ flex: 1 }}
                                  disabled={isLoading}
                                  autoFocus
                                />
                              )}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setIsClickingButton(true);
                                  toggleFilterType(field, value);
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setIsClickingButton(true);
                                }}
                                className={styles.toggleButton}
                                title="Toggle to include"
                                style={{ 
                                  padding: '4px 8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  color: 'var(--gray-600)',
                                  background: 'var(--gray-100)',
                                  border: '1px solid var(--gray-200)',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <XCircle size={12} />
                                <span>Exclude</span>
                              </button>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsClickingButton(true);
                                const updated = { ...excludeFilters };
                                delete updated[field];
                                setExcludeFilters(updated);
                                setEditingFilter(null);
                                setData(null);
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsClickingButton(true);
                              }}
                              className={styles.removeButton}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      }
                      
                      // Handle array values (from breadcrumb clicks)
                      const displayValue = Array.isArray(value) 
                        ? (value.length === 1 ? value[0] : value.join(', '))
                        : value;
                      
                      return (
                        <div 
                          key={`exclude_${field}`} 
                          className={`${styles.chip} ${styles.excludeChip}`}
                          onClick={() => setEditingFilter(`exclude_${field}`)}
                          style={{ cursor: 'pointer' }}
                          title="Click to edit"
                        >
                          <span>{allFields[field]}: NOT {displayValue}</span>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            const updated = { ...excludeFilters };
                            delete updated[field];
                            setExcludeFilters(updated);
                            setData(null);
                          }}>
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
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
            {/* Loading Overlay - Always show when loading */}
            {loading && (
              <div className={styles.loadingOverlay}>
                <Spinner />
              </div>
            )}
            
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
                if (val === null || val === undefined) return 0;
                return typeof val === 'object' ? parseFloat(val.toString()) : parseFloat(val) || 0;
              }));
              const maxCharges = Math.max(...data.map(row => {
                const val = row.total_charges;
                if (val === null || val === undefined) return 0;
                return typeof val === 'object' ? parseFloat(val.toString()) : parseFloat(val) || 0;
              }));
              
              return (
                <div className={styles.tableContainer}>
                  <div className={styles.tableWrapper}>
                    <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th className={styles.actionColumn}>Pathways</th>
                        {columns.map(col => (
                          <th key={col}>{allFields[col]}</th>
                        ))}
                        <th className={styles.measureColumn}>Total Procedures</th>
                        <th className={styles.measureColumn}>Total Charges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => {
                        const countValue = row.total_count === null || row.total_count === undefined
                          ? 0
                          : typeof row.total_count === 'object' 
                            ? parseFloat(row.total_count.toString()) 
                            : parseFloat(row.total_count) || 0;
                        const chargesValue = row.total_charges === null || row.total_charges === undefined
                          ? 0
                          : typeof row.total_charges === 'object'
                            ? parseFloat(row.total_charges.toString())
                            : parseFloat(row.total_charges) || 0;
                        
                        const countPercent = maxCount > 0 ? (countValue / maxCount) * 100 : 0;
                        const chargesPercent = maxCharges > 0 ? (chargesValue / maxCharges) * 100 : 0;
                        
                        return (
                          <tr key={index}>
                            {/* Pathway Action Buttons */}
                            <td className={styles.actionCell}>
                              <div className={styles.pathwayActions}>
                                <button
                                  className={styles.pathwayButton}
                                  onClick={() => queryPathways(row, 'upstream')}
                                  title="See where these patients came from"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  className={styles.pathwayButton}
                                  onClick={() => queryPathways(row, 'downstream')}
                                  title="See where these patients went next"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>
                            </td>
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

      {/* Pathway Modal */}
      {pathwayModal && (
        <div className={styles.modalOverlay} onClick={closePathwayModal}>
          <div className={styles.pathwayModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                {pathwayModal.direction === 'upstream' ? (
                  <>
                    <ArrowUp size={16} />
                    Upstream: Where did these patients come from?
                  </>
                ) : (
                  <>
                    <ArrowDown size={16} />
                    Downstream: Where did these patients go next?
                  </>
                )}
              </div>
              <button className={styles.modalClose} onClick={closePathwayModal}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalContext}>
              <strong>Context:</strong> {columns.map(col => `${allFields[col]}: ${pathwayModal.row[col]}`).join(' | ')}
            </div>

            {/* Pathway Controls */}
            <div className={styles.pathwayControls}>
              {/* Preset Views */}
              <div className={styles.presetButtons}>
                <span className={styles.presetLabel}>View by:</span>
                {PATHWAY_PRESETS[pathwayModal.direction].map((preset, idx) => (
                  <button
                    key={idx}
                    className={styles.presetButton}
                    onClick={() => applyPathwayPreset(preset)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Field Selector Toggle */}
              <button
                className={styles.fieldSelectorToggle}
                onClick={() => setShowPathwayFieldSelector(!showPathwayFieldSelector)}
              >
                <Columns3 size={14} />
                Custom Fields ({pathwayGroupBy.length})
                <ChevronDown size={14} style={{ transform: showPathwayFieldSelector ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Refresh Button */}
              {pathwayGroupBy.length > 0 && (
                <button
                  className={styles.refreshButton}
                  onClick={refreshPathwayQuery}
                  disabled={pathwayLoading}
                >
                  <Play size={14} />
                  Refresh
                </button>
              )}
            </div>

            {/* Active Pathway Filters */}
            {Object.keys(pathwayFilters).length > 0 && (
              <div className={styles.pathwayActiveFilters}>
                <div className={styles.pathwayActiveFiltersHeader}>
                  <span><FilterIcon size={14} /> Active Filters ({Object.keys(pathwayFilters).length})</span>
                  <button className={styles.clearFiltersBtn} onClick={clearAllPathwayFilters}>
                    Clear All
                  </button>
                </div>
                <div className={styles.pathwayFilterChips}>
                  {Object.entries(pathwayFilters).map(([field, value]) => {
                    const fieldLabel = Object.values(PATHWAY_FIELD_GROUPS)
                      .flat()
                      .find(f => f.value === field)?.label || field;
                    return (
                      <div key={field} className={styles.pathwayFilterChip}>
                        {fieldLabel}: {Array.isArray(value) ? `${value.length} selected` : value}
                        <button onClick={() => removePathwayFilter(field)}>
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Field Selector (Collapsible) */}
            {showPathwayFieldSelector && (
              <div className={styles.pathwayFieldSelector}>
                {Object.entries(PATHWAY_FIELD_GROUPS).map(([groupName, fields]) => (
                  <div key={groupName} className={styles.pathwayFieldGroup}>
                    <div className={styles.pathwayFieldGroupName}>{groupName}</div>
                    <div className={styles.pathwayFieldList}>
                      {fields.map(field => (
                        <div key={field.value} className={styles.pathwayFieldItem}>
                          <button
                            className={`${styles.pathwayFieldChip} ${pathwayGroupBy.includes(field.value) ? styles.pathwayFieldChipSelected : ''}`}
                            onClick={() => togglePathwayField(field.value)}
                          >
                            {field.label}
                            {pathwayGroupBy.includes(field.value) && ' ✓'}
                          </button>
                          <button
                            className={styles.pathwayFilterIcon}
                            onClick={() => addPathwayFilter(field.value)}
                            title="Add filter"
                          >
                            <FilterIcon size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalContent}>
              {pathwayModal.loading && (
                <div className={styles.modalLoading}>
                  <Spinner size={24} />
                  <p>Querying 240 billion pathway records...</p>
                </div>
              )}

              {pathwayModal.error && (
                <div className={styles.modalError}>
                  {pathwayModal.error}
                </div>
              )}

              {pathwayModal.data && pathwayModal.data.length > 0 && (
                <div className={styles.pathwayResults}>
                  <table className={styles.pathwayTable}>
                    <thead>
                      <tr>
                        {Object.keys(pathwayModal.data[0]).map(key => (
                          <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pathwayModal.data.map((row, idx) => (
                        <tr key={idx}>
                          {Object.values(row).map((value, colIdx) => {
                            const displayValue = value && typeof value === 'object' && value.value !== undefined
                              ? value.value
                              : value;
                            
                            const formattedValue = typeof displayValue === 'number'
                              ? new Intl.NumberFormat().format(displayValue)
                              : displayValue;

                            return <td key={colIdx}>{formattedValue || '-'}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {pathwayModal.data && pathwayModal.data.length === 0 && !pathwayModal.loading && (
                <div className={styles.modalEmpty}>
                  No pathway data found for this selection
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pathway Filter Modal */}
      {editingPathwayFilter && pathwayFilterOptions[editingPathwayFilter] && (
        <div className={styles.filterModalOverlay} onClick={() => setEditingPathwayFilter(null)}>
          <div className={styles.filterModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.filterModalHeader}>
              <h3>Filter: {Object.values(PATHWAY_FIELD_GROUPS).flat().find(f => f.value === editingPathwayFilter)?.label}</h3>
              <button onClick={() => setEditingPathwayFilter(null)}>
                <X size={16} />
              </button>
            </div>
            <div className={styles.filterModalContent}>
              {pathwayFilterOptions[editingPathwayFilter].map((option, idx) => (
                <div key={idx} className={styles.filterOption}>
                  <label>
                    <input
                      type="checkbox"
                      checked={(pathwayFilters[editingPathwayFilter] || []).includes(option.value)}
                      onChange={() => togglePathwayFilterValue(editingPathwayFilter, option.value)}
                    />
                    {option.value} ({formatNumber(option.count)})
                  </label>
                </div>
              ))}
            </div>
            <div className={styles.filterModalFooter}>
              <button 
                onClick={() => {
                  setEditingPathwayFilter(null);
                  refreshPathwayQuery();
                }} 
                className={styles.filterApplyButton}
              >
                Apply & Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
