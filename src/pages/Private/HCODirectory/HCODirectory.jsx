import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../app/supabaseClient';
import styles from './HCODirectory.module.css';
import Spinner from '../../../components/Buttons/Spinner';
import { 
  Building2, 
  MapPin, 
  Search, 
  Filter as FilterIcon, 
  X, 
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Building,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

/**
 * HCO Directory - Advanced Healthcare Organization Search
 * 
 * Features:
 * - Multi-dimensional filtering (state, city, firm type, taxonomies)
 * - Market-based search
 * - Taxonomy exploration (classification, specialty, grouping)
 * - Fast pagination
 * - Profile view navigation
 */

export default function HCODirectory() {
  const navigate = useNavigate();
  
  // Markets
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    states: [],
    cities: [],
    firmTypes: [],
    taxonomyClassifications: [],
    taxonomyConsolidatedSpecialties: [],
    taxonomyGroupings: [],
    hasHospitalParent: null,
    hasPhysicianGroup: null,
    hasNetwork: null,
    hasDefinitiveId: null
  });
  
  // Filter options (populated from API)
  const [filterOptions, setFilterOptions] = useState({
    states: [],
    cities: [],
    firmTypes: [],
    taxonomies: [],
    specialties: [],
    groupings: []
  });
  
  // Expanded filter sections
  const [expandedSections, setExpandedSections] = useState({
    states: false,
    cities: false,
    firmTypes: false,
    taxonomies: true,
    specialties: false,
    groupings: false,
    affiliations: false
  });
  
  // Results
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  
  // Sort
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Fetch markets on mount
  useEffect(() => {
    fetchMarkets();
    fetchFilterOptions(); // Load initial filter options
  }, []);
  
  const fetchMarkets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (marketsError) throw marketsError;
      setMarkets(data || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
    }
  };
  
  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const requestBody = {
        optionType: 'all'
      };
      
      // Include market if selected
      if (selectedMarket) {
        requestBody.marketLatitude = parseFloat(selectedMarket.latitude);
        requestBody.marketLongitude = parseFloat(selectedMarket.longitude);
        requestBody.marketRadius = parseFloat(selectedMarket.radius_miles);
      }
      
      const response = await fetch('/api/hco-directory/filter-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFilterOptions({
          states: result.data.states || [],
          cities: result.data.cities || [],
          firmTypes: result.data.firmTypes || [],
          taxonomies: result.data.taxonomies || [],
          specialties: result.data.specialties || [],
          groupings: result.data.groupings || []
        });
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    } finally {
      setLoadingFilters(false);
    }
  };
  
  const searchOrganizations = async (page = 1) => {
    setLoading(true);
    setError(null);
    setCurrentPage(page);
    
    try {
      const requestBody = {
        search: searchTerm,
        states: filters.states,
        cities: filters.cities,
        firmTypes: filters.firmTypes,
        taxonomyClassifications: filters.taxonomyClassifications,
        taxonomyConsolidatedSpecialties: filters.taxonomyConsolidatedSpecialties,
        taxonomyGroupings: filters.taxonomyGroupings,
        hasHospitalParent: filters.hasHospitalParent,
        hasPhysicianGroup: filters.hasPhysicianGroup,
        hasNetwork: filters.hasNetwork,
        hasDefinitiveId: filters.hasDefinitiveId,
        sortBy,
        sortOrder,
        page,
        pageSize
      };
      
      // Add market if selected
      if (selectedMarket) {
        requestBody.marketLatitude = parseFloat(selectedMarket.latitude);
        requestBody.marketLongitude = parseFloat(selectedMarket.longitude);
        requestBody.marketRadius = parseFloat(selectedMarket.radius_miles);
      }
      
      const response = await fetch('/api/hco-directory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to search');
      }
      
      setResults(result.data);
      console.log(`✅ Found ${result.data.pagination.totalCount} organizations`);
      
    } catch (err) {
      console.error('Error searching:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarketSelect = (market) => {
    setSelectedMarket(market);
    setFilters({
      states: [],
      cities: [],
      firmTypes: [],
      taxonomyClassifications: [],
      taxonomyConsolidatedSpecialties: [],
      taxonomyGroupings: [],
      hasHospitalParent: null,
      hasPhysicianGroup: null,
      hasNetwork: null,
      hasDefinitiveId: null
    });
    setResults(null);
    // Reload filter options based on market
    fetchFilterOptions();
  };
  
  const toggleFilterValue = (filterKey, value) => {
    setFilters(prev => {
      const currentValues = prev[filterKey] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [filterKey]: newValues };
    });
  };
  
  const setBooleanFilter = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: prev[filterKey] === value ? null : value
    }));
  };
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      states: [],
      cities: [],
      firmTypes: [],
      taxonomyClassifications: [],
      taxonomyConsolidatedSpecialties: [],
      taxonomyGroupings: [],
      hasHospitalParent: null,
      hasPhysicianGroup: null,
      hasNetwork: null,
      hasDefinitiveId: null
    });
    setSelectedMarket(null);
    setResults(null);
    setCurrentPage(1);
  };
  
  const hasActiveFilters = () => {
    return searchTerm ||
      selectedMarket ||
      filters.states.length > 0 ||
      filters.cities.length > 0 ||
      filters.firmTypes.length > 0 ||
      filters.taxonomyClassifications.length > 0 ||
      filters.taxonomyConsolidatedSpecialties.length > 0 ||
      filters.taxonomyGroupings.length > 0 ||
      filters.hasHospitalParent !== null ||
      filters.hasPhysicianGroup !== null ||
      filters.hasNetwork !== null ||
      filters.hasDefinitiveId !== null;
  };
  
  const exportToCSV = () => {
    if (!results || !results.organizations || results.organizations.length === 0) return;

    const headers = [
      'NPI',
      'Name',
      'Firm Type',
      'Taxonomy Classification',
      'Taxonomy Specialty',
      'Taxonomy Grouping',
      'Address',
      'City',
      'State',
      'ZIP',
      'County',
      'Hospital Parent',
      'Physician Group Parent',
      'Network',
      ...(selectedMarket ? ['Distance (mi)'] : [])
    ];
    
    const csvContent = [
      headers.join(','),
      ...results.organizations.map(org => [
        org.npi,
        `"${(org.name || '').replace(/"/g, '""')}"`,
        `"${(org.definitive_firm_type || '').replace(/"/g, '""')}"`,
        `"${(org.primary_taxonomy_classification || '').replace(/"/g, '""')}"`,
        `"${(org.primary_taxonomy_consolidated_specialty || '').replace(/"/g, '""')}"`,
        `"${(org.primary_taxonomy_grouping || '').replace(/"/g, '""')}"`,
        `"${(org.primary_address_line_1 || '').replace(/"/g, '""')}"`,
        `"${(org.primary_address_city || '').replace(/"/g, '""')}"`,
        org.state || '',
        org.zip || '',
        `"${(org.primary_address_county || '').replace(/"/g, '""')}"`,
        `"${(org.hospital_parent_name || '').replace(/"/g, '""')}"`,
        `"${(org.physician_group_parent_name || '').replace(/"/g, '""')}"`,
        `"${(org.network_name || '').replace(/"/g, '""')}"`,
        ...(selectedMarket ? [org.distance_miles?.toFixed(2) || ''] : [])
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hco-directory-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const viewProfile = (npi) => {
    navigate(`/app/hco-directory/${npi}`);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Building2 size={24} />
          <div>
            <h1>HCO Directory</h1>
            <p>Explore and filter healthcare organizations</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          {hasActiveFilters() && (
            <button onClick={clearAllFilters} className="sectionHeaderButton">
              <X size={14} />
              Clear All
            </button>
          )}
          <button 
            onClick={() => searchOrganizations(1)}
            className="sectionHeaderButton primary"
            disabled={loading}
          >
            <Search size={14} />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* Filters Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3><FilterIcon size={16} /> Filters</h3>
          </div>

          {/* Market Selector */}
          {markets.length > 0 && (
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                <MapPin size={14} />
                Market Filter
              </label>
              <select
                value={selectedMarket?.id || ''}
                onChange={(e) => {
                  const market = markets.find(m => m.id === e.target.value);
                  handleMarketSelect(market || null);
                }}
                className={styles.select}
              >
                <option value="">All (National)</option>
                {markets.map(market => (
                  <option key={market.id} value={market.id}>
                    {market.name} ({market.radius_miles}mi)
                  </option>
                ))}
              </select>
              {selectedMarket && (
                <div className={styles.marketInfo}>
                  {selectedMarket.city}, {selectedMarket.state} • {selectedMarket.radius_miles} mi
                </div>
              )}
            </div>
          )}

          {/* Search Input */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <Search size={14} />
              Organization Name or NPI
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') searchOrganizations(1);
              }}
              placeholder="Search organizations..."
              className={styles.input}
            />
          </div>

          {/* States Filter */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('states')}
            >
              <span>
                States
                {filters.states.length > 0 && (
                  <span className={styles.filterBadge}>{filters.states.length}</span>
                )}
              </span>
              {expandedSections.states ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.states && (
              <div className={styles.filterContent}>
                {loadingFilters ? (
                  <div className={styles.filterLoading}>Loading...</div>
                ) : (
                  <div className={styles.filterList}>
                    {filterOptions.states.map((option, idx) => (
                      <label key={idx} className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.states.includes(option.value)}
                          onChange={() => toggleFilterValue('states', option.value)}
                        />
                        <span>{option.label}</span>
                        <span className={styles.filterCount}>({parseInt(option.count).toLocaleString()})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cities Filter */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('cities')}
            >
              <span>
                Cities
                {filters.cities.length > 0 && (
                  <span className={styles.filterBadge}>{filters.cities.length}</span>
                )}
              </span>
              {expandedSections.cities ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.cities && (
              <div className={styles.filterContent}>
                {loadingFilters ? (
                  <div className={styles.filterLoading}>Loading...</div>
                ) : (
                  <div className={styles.filterList}>
                    {filterOptions.cities.slice(0, 100).map((option, idx) => (
                      <label key={idx} className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.cities.includes(option.value)}
                          onChange={() => toggleFilterValue('cities', option.value)}
                        />
                        <span>{option.label}</span>
                        <span className={styles.filterCount}>({parseInt(option.count).toLocaleString()})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Firm Types Filter */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('firmTypes')}
            >
              <span>
                Organization Type
                {filters.firmTypes.length > 0 && (
                  <span className={styles.filterBadge}>{filters.firmTypes.length}</span>
                )}
              </span>
              {expandedSections.firmTypes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.firmTypes && (
              <div className={styles.filterContent}>
                {loadingFilters ? (
                  <div className={styles.filterLoading}>Loading...</div>
                ) : (
                  <div className={styles.filterList}>
                    {filterOptions.firmTypes.map((option, idx) => (
                      <label key={idx} className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.firmTypes.includes(option.value)}
                          onChange={() => toggleFilterValue('firmTypes', option.value)}
                        />
                        <span>{option.label}</span>
                        <span className={styles.filterCount}>({parseInt(option.count).toLocaleString()})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Taxonomy Classifications */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('taxonomies')}
            >
              <span>
                Taxonomy Classification
                {filters.taxonomyClassifications.length > 0 && (
                  <span className={styles.filterBadge}>{filters.taxonomyClassifications.length}</span>
                )}
              </span>
              {expandedSections.taxonomies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.taxonomies && (
              <div className={styles.filterContent}>
                {loadingFilters ? (
                  <div className={styles.filterLoading}>Loading...</div>
                ) : (
                  <div className={styles.filterList}>
                    {filterOptions.taxonomies.map((option, idx) => (
                      <label key={idx} className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.taxonomyClassifications.includes(option.value)}
                          onChange={() => toggleFilterValue('taxonomyClassifications', option.value)}
                        />
                        <span>{option.label}</span>
                        <span className={styles.filterCount}>({parseInt(option.count).toLocaleString()})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Taxonomy Specialties */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('specialties')}
            >
              <span>
                Taxonomy Specialty
                {filters.taxonomyConsolidatedSpecialties.length > 0 && (
                  <span className={styles.filterBadge}>{filters.taxonomyConsolidatedSpecialties.length}</span>
                )}
              </span>
              {expandedSections.specialties ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.specialties && (
              <div className={styles.filterContent}>
                {loadingFilters ? (
                  <div className={styles.filterLoading}>Loading...</div>
                ) : (
                  <div className={styles.filterList}>
                    {filterOptions.specialties.map((option, idx) => (
                      <label key={idx} className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.taxonomyConsolidatedSpecialties.includes(option.value)}
                          onChange={() => toggleFilterValue('taxonomyConsolidatedSpecialties', option.value)}
                        />
                        <span>{option.label}</span>
                        <span className={styles.filterCount}>({parseInt(option.count).toLocaleString()})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Taxonomy Groupings */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('groupings')}
            >
              <span>
                Taxonomy Grouping
                {filters.taxonomyGroupings.length > 0 && (
                  <span className={styles.filterBadge}>{filters.taxonomyGroupings.length}</span>
                )}
              </span>
              {expandedSections.groupings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.groupings && (
              <div className={styles.filterContent}>
                {loadingFilters ? (
                  <div className={styles.filterLoading}>Loading...</div>
                ) : (
                  <div className={styles.filterList}>
                    {filterOptions.groupings.map((option, idx) => (
                      <label key={idx} className={styles.filterCheckbox}>
                        <input
                          type="checkbox"
                          checked={filters.taxonomyGroupings.includes(option.value)}
                          onChange={() => toggleFilterValue('taxonomyGroupings', option.value)}
                        />
                        <span>{option.label}</span>
                        <span className={styles.filterCount}>({parseInt(option.count).toLocaleString()})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Affiliations Filter */}
          <div className={styles.filterGroup}>
            <button 
              className={styles.filterHeader}
              onClick={() => toggleSection('affiliations')}
            >
              <span>Affiliations</span>
              {expandedSections.affiliations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expandedSections.affiliations && (
              <div className={styles.filterContent}>
                <div className={styles.booleanFilter}>
                  <label>Hospital Parent:</label>
                  <div className={styles.booleanButtons}>
                    <button
                      className={`${styles.booleanButton} ${filters.hasHospitalParent === true ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasHospitalParent', true)}
                    >
                      Yes
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasHospitalParent === false ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasHospitalParent', false)}
                    >
                      No
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasHospitalParent === null ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasHospitalParent', null)}
                    >
                      Any
                    </button>
                  </div>
                </div>

                <div className={styles.booleanFilter}>
                  <label>Physician Group:</label>
                  <div className={styles.booleanButtons}>
                    <button
                      className={`${styles.booleanButton} ${filters.hasPhysicianGroup === true ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasPhysicianGroup', true)}
                    >
                      Yes
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasPhysicianGroup === false ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasPhysicianGroup', false)}
                    >
                      No
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasPhysicianGroup === null ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasPhysicianGroup', null)}
                    >
                      Any
                    </button>
                  </div>
                </div>

                <div className={styles.booleanFilter}>
                  <label>Network:</label>
                  <div className={styles.booleanButtons}>
                    <button
                      className={`${styles.booleanButton} ${filters.hasNetwork === true ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasNetwork', true)}
                    >
                      Yes
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasNetwork === false ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasNetwork', false)}
                    >
                      No
                    </button>
                    <button
                      className={`${styles.booleanButton} ${filters.hasNetwork === null ? styles.active : ''}`}
                      onClick={() => setBooleanFilter('hasNetwork', null)}
                    >
                      Any
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Results Header */}
          {results && (
            <div className={styles.resultsHeader}>
              <div className={styles.resultsInfo}>
                <h2>
                  {results.pagination.totalCount.toLocaleString()} Organizations Found
                </h2>
                <p>
                  Page {results.pagination.page} of {results.pagination.totalPages}
                  {selectedMarket && ` • ${selectedMarket.name}`}
                </p>
              </div>
              <div className={styles.resultsActions}>
                {results.organizations.length > 0 && (
                  <button onClick={exportToCSV} className="sectionHeaderButton">
                    <Download size={14} />
                    Export CSV
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className={styles.loadingState}>
              <Spinner />
              <p>Searching organizations...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className={styles.errorState}>
              <p>Error: {error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !results && (
            <div className={styles.emptyState}>
              <Building size={48} />
              <h2>Healthcare Organization Directory</h2>
              <p>Use the filters on the left to search for organizations</p>
              <p>Filter by state, city, organization type, taxonomy, or select a saved market</p>
              <button 
                onClick={() => searchOrganizations(1)}
                className="sectionHeaderButton primary"
              >
                <Search size={14} />
                Show All Organizations
              </button>
            </div>
          )}

          {/* Results Table */}
          {!loading && results && results.organizations.length > 0 && (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.resultsTable}>
                  <thead>
                    <tr>
                      <th>Organization</th>
                      <th>Type</th>
                      <th>Taxonomy</th>
                      <th>Location</th>
                      <th>Affiliations</th>
                      {selectedMarket && <th>Distance</th>}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.organizations.map((org) => (
                      <tr key={org.npi}>
                        <td>
                          <div className={styles.orgCell}>
                            <div className={styles.orgName}>{org.name}</div>
                            <div className={styles.orgNpi}>NPI: {org.npi}</div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.firmType}>
                            {org.definitive_firm_type || '-'}
                          </div>
                        </td>
                        <td>
                          <div className={styles.taxonomyCell}>
                            <div className={styles.taxonomyMain}>
                              {org.primary_taxonomy_classification || '-'}
                            </div>
                            {org.primary_taxonomy_consolidated_specialty && (
                              <div className={styles.taxonomySub}>
                                {org.primary_taxonomy_consolidated_specialty}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.locationCell}>
                            <div>{org.primary_address_city}, {org.state}</div>
                            <div className={styles.zip}>{org.zip}</div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.affiliationCell}>
                            {org.hospital_parent_name && (
                              <span className={styles.badge} title={org.hospital_parent_name}>Hospital</span>
                            )}
                            {org.physician_group_parent_name && (
                              <span className={styles.badge} title={org.physician_group_parent_name}>PG</span>
                            )}
                            {org.network_name && (
                              <span className={styles.badge} title={org.network_name}>Network</span>
                            )}
                            {!org.hospital_parent_name && !org.physician_group_parent_name && !org.network_name && (
                              <span className={styles.independent}>Independent</span>
                            )}
                          </div>
                        </td>
                        {selectedMarket && (
                          <td>
                            {org.distance_miles ? `${org.distance_miles.toFixed(1)} mi` : '-'}
                          </td>
                        )}
                        <td>
                          <button
                            onClick={() => viewProfile(org.npi)}
                            className="sectionHeaderButton primary"
                            title="View Profile"
                          >
                            <Eye size={14} />
                            View Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {results.pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => searchOrganizations(currentPage - 1)}
                    disabled={!results.pagination.hasPreviousPage}
                    className="sectionHeaderButton"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span className={styles.paginationInfo}>
                    Page {results.pagination.page} of {results.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => searchOrganizations(currentPage + 1)}
                    disabled={!results.pagination.hasNextPage}
                    className="sectionHeaderButton"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* No Results */}
          {!loading && results && results.organizations.length === 0 && (
            <div className={styles.emptyState}>
              <Building size={48} />
              <h2>No Organizations Found</h2>
              <p>Try adjusting your filters or search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

