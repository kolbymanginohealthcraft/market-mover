import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import styles from './HCOAnalysis.module.css';
import Dropdown from '../../../components/Buttons/Dropdown';
import HCOMap from './HCOMap';
import { MapPin, ChevronDown, Database, Play, Map as MapIcon } from 'lucide-react';

export default function HCOAnalysis() {
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [sampleData, setSampleData] = useState([]);
  const [showSampleData, setShowSampleData] = useState(false);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [mapData, setMapData] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [loadingAllOrgs, setLoadingAllOrgs] = useState(false);
  const [sortField, setSortField] = useState('distance_miles');
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch user's saved markets
  useEffect(() => {
    fetchMarkets();
  }, []);

  const fetchMarkets = async () => {
    try {
      setLoadingMarkets(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('User not authenticated');
        return;
      }

      const { data, error: marketsError } = await supabase
        .from('markets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (marketsError) {
        throw marketsError;
      }

      setMarkets(data || []);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError(err.message);
    } finally {
      setLoadingMarkets(false);
    }
  };

  const fetchHCOStats = async (market) => {
    try {
      setLoading(true);
      setError(null);
      setStats(null);
      setSampleData([]);

      const params = new URLSearchParams({
        latitude: market.latitude,
        longitude: market.longitude,
        radius: market.radius_miles,
      });

      const response = await fetch(`/api/hco-data/stats?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch HCO statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching HCO stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSampleData = async () => {
    if (!selectedMarket) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        latitude: selectedMarket.latitude,
        longitude: selectedMarket.longitude,
        radius: selectedMarket.radius_miles,
        limit: 50,
      });

      const response = await fetch(`/api/hco-data/sample?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sample data');
      }

      const data = await response.json();
      setSampleData(data.organizations || []);
      setShowSampleData(true);
    } catch (err) {
      console.error('Error fetching sample data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMapData = async () => {
    if (!selectedMarket) return;

    try {
      setLoadingMap(true);
      setError(null);

      const params = new URLSearchParams({
        latitude: selectedMarket.latitude,
        longitude: selectedMarket.longitude,
        radius: selectedMarket.radius_miles,
        limit: 10000, // Load up to 10k for mapping (clustering will handle it)
      });

      const response = await fetch(`/api/hco-data/sample?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch map data');
      }

      const data = await response.json();
      setMapData(data.organizations || []);
      setShowMap(true);
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError(err.message);
    } finally {
      setLoadingMap(false);
    }
  };

  const handleMarketSelect = (market) => {
    setSelectedMarket(market);
    setShowSampleData(false);
    setShowMap(false);
    setShowAllOrgs(false);
    setMapData([]);
    setAllOrganizations([]);
    fetchHCOStats(market);
  };

  const fetchAllOrganizations = async () => {
    if (!selectedMarket) return;

    try {
      setLoadingAllOrgs(true);
      setError(null);

      const params = new URLSearchParams({
        latitude: selectedMarket.latitude,
        longitude: selectedMarket.longitude,
        radius: selectedMarket.radius_miles,
        limit: 50000, // Load up to 50k organizations
      });

      const response = await fetch(`/api/hco-data/sample?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch organizations');
      }

      const data = await response.json();
      setAllOrganizations(data.organizations || []);
      setShowAllOrgs(true);
    } catch (err) {
      console.error('Error fetching all organizations:', err);
      setError(err.message);
    } finally {
      setLoadingAllOrgs(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedOrganizations = () => {
    if (!allOrganizations.length) return [];
    
    const sorted = [...allOrganizations].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          aVal = a.name || '';
          bVal = b.name || '';
          break;
        case 'classification':
          aVal = a.taxonomy?.classification || '';
          bVal = b.taxonomy?.classification || '';
          break;
        case 'specialty':
          aVal = a.taxonomy?.consolidated_specialty || '';
          bVal = b.taxonomy?.consolidated_specialty || '';
          break;
        case 'city':
          aVal = a.address.city || '';
          bVal = b.address.city || '';
          break;
        case 'state':
          aVal = a.address.state || '';
          bVal = b.address.state || '';
          break;
        case 'distance_miles':
          aVal = a.distance_miles;
          bVal = b.distance_miles;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' 
          ? aVal - bVal
          : bVal - aVal;
      }
    });
    
    return sorted;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const formatPercent = (numerator, denominator) => {
    if (!denominator) return '0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  };

  return (
    <div className={styles.container}>
      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <Database size={18} style={{ color: 'var(--primary-teal)' }} />
        <h1 className={styles.title}>HCO Data Analysis</h1>
        
        <div className={styles.spacer} />

        {/* Market Selector */}
        <Dropdown
          trigger={
            <button className={styles.dropdownTrigger}>
              <MapPin size={14} />
              {selectedMarket ? selectedMarket.name : 'Select Market'}
              <ChevronDown size={14} />
            </button>
          }
          isOpen={marketDropdownOpen}
          onToggle={setMarketDropdownOpen}
          className={styles.dropdownMenu}
        >
          {loadingMarkets ? (
            <div className={styles.dropdownItem} style={{ color: 'var(--gray-500)' }}>
              Loading markets...
            </div>
          ) : markets.length === 0 ? (
            <div className={styles.dropdownItem} style={{ color: 'var(--gray-500)' }}>
              No saved markets
            </div>
          ) : (
            markets.map((market) => (
              <button
                key={market.id}
                className={styles.dropdownItem}
                onClick={() => {
                  handleMarketSelect(market);
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
            ))
          )}
        </Dropdown>

        {selectedMarket && !loading && stats && (
          <>
            <button
              className={styles.actionButton}
              onClick={fetchAllOrganizations}
              disabled={loadingAllOrgs}
            >
              <Database size={14} />
              {loadingAllOrgs ? 'Loading...' : showAllOrgs ? 'Refresh List' : 'View All Organizations'}
            </button>
            <button
              className={styles.sampleButton}
              onClick={fetchSampleData}
              disabled={loading}
            >
              <Play size={14} />
              {showSampleData ? 'Refresh Sample' : 'Load Sample (50)'}
            </button>
            <button
              className={styles.mapButton}
              onClick={fetchMapData}
              disabled={loadingMap}
            >
              <MapIcon size={14} />
              {loadingMap ? 'Loading Map...' : showMap ? 'Refresh Map' : 'Load on Map'}
            </button>
          </>
        )}
        
        {stats?.parameters && (
          <div className={styles.queryTime}>
            {stats.parameters.radius_miles} mi radius
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {error && (
          <div className={styles.errorBanner}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className={styles.emptyState}>
            <Database size={48} style={{ color: 'var(--gray-300)' }} />
            <h2>Loading HCO Data...</h2>
            <p>Analyzing healthcare organizations in {selectedMarket?.name}...</p>
          </div>
        )}

        {!selectedMarket && !loading && (
          <div className={styles.emptyState}>
            <Database size={48} style={{ color: 'var(--gray-300)' }} />
            <h2>Select a Market to Begin</h2>
            <p>Choose a saved market from the dropdown above to analyze healthcare organizations in that area.</p>
          </div>
        )}

        {stats && !loading && (
          <div className={styles.statsContainer}>
            {/* Overall Statistics */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Organizations</div>
                <div className={styles.statValue}>
                  {formatNumber(stats.stats.total_organizations)}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Firm Types</div>
                <div className={styles.statValue}>
                  {stats.stats.distinct_firm_types}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Cities</div>
                <div className={styles.statValue}>
                  {stats.stats.distinct_cities}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>States</div>
                <div className={styles.statValue}>
                  {stats.stats.distinct_states}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Avg Distance (mi)</div>
                <div className={styles.statValue}>
                  {stats.stats.avg_distance_miles}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>ZIP Codes</div>
                <div className={styles.statValue}>
                  {stats.stats.distinct_zip_codes}
                </div>
              </div>
            </div>

            {/* Relationship Coverage */}
            <div className={styles.section}>
              <h3>Organizational Relationships</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Hospital Parent</div>
                  <div className={styles.statValue}>
                    {formatNumber(stats.stats.with_hospital_parent)}
                    <span className={styles.statPercent}>
                      {formatPercent(stats.stats.with_hospital_parent, stats.stats.total_organizations)}
                    </span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Physician Group Parent</div>
                  <div className={styles.statValue}>
                    {formatNumber(stats.stats.with_physician_group_parent)}
                    <span className={styles.statPercent}>
                      {formatPercent(stats.stats.with_physician_group_parent, stats.stats.total_organizations)}
                    </span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Network Affiliation</div>
                  <div className={styles.statValue}>
                    {formatNumber(stats.stats.with_network_affiliation)}
                    <span className={styles.statPercent}>
                      {formatPercent(stats.stats.with_network_affiliation, stats.stats.total_organizations)}
                    </span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Definitive ID</div>
                  <div className={styles.statValue}>
                    {formatNumber(stats.stats.with_definitive_id)}
                    <span className={styles.statPercent}>
                      {formatPercent(stats.stats.with_definitive_id, stats.stats.total_organizations)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown by Taxonomy Classification */}
            <div className={styles.section}>
              <h3>Breakdown by Service Type (Taxonomy Classification)</h3>
              <p className={styles.sectionHint}>What types of healthcare services are provided in this market</p>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Service Type</th>
                      <th>Count</th>
                      <th>% of Total</th>
                      <th>Avg Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.breakdown_by_taxonomy_classification.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.classification}</td>
                        <td>{formatNumber(row.count)}</td>
                        <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                        <td>{row.avg_distance} mi</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Breakdown by Consolidated Specialty */}
            <div className={styles.section}>
              <h3>Breakdown by Specialty Category</h3>
              <p className={styles.sectionHint}>Consolidated specialty groupings for easier analysis</p>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Specialty</th>
                      <th>Count</th>
                      <th>% of Total</th>
                      <th>Avg Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.breakdown_by_consolidated_specialty.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.specialty}</td>
                        <td>{formatNumber(row.count)}</td>
                        <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                        <td>{row.avg_distance} mi</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Breakdown by Taxonomy Grouping */}
            <div className={styles.section}>
              <h3>Breakdown by Industry Grouping</h3>
              <p className={styles.sectionHint}>High-level industry categories</p>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Industry Group</th>
                      <th>Count</th>
                      <th>% of Total</th>
                      <th>Avg Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.breakdown_by_taxonomy_grouping.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.grouping}</td>
                        <td>{formatNumber(row.count)}</td>
                        <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                        <td>{row.avg_distance} mi</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Breakdown by Firm Type */}
            <div className={styles.section}>
              <h3>Breakdown by Organization Type (Definitive)</h3>
              <p className={styles.sectionHint}>Organizational structure classification (36% coverage)</p>
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Count</th>
                      <th>% of Total</th>
                      <th>Avg Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.breakdown_by_firm_type.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.firm_type_full || row.firm_type}</td>
                        <td>{formatNumber(row.count)}</td>
                        <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                        <td>{row.avg_distance} mi</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

              {/* Breakdown by State */}
              <div className={styles.section}>
                <h3>Breakdown by State</h3>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>State</th>
                        <th>Count</th>
                        <th>% of Total</th>
                        <th>Avg Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.breakdown_by_state.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.state}</td>
                          <td>{formatNumber(row.count)}</td>
                          <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                          <td>{row.avg_distance} mi</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Breakdown by City */}
              <div className={styles.section}>
                <h3>Top Cities</h3>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>City</th>
                        <th>State</th>
                        <th>Count</th>
                        <th>% of Total</th>
                        <th>Avg Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.breakdown_by_city.map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.city}</td>
                          <td>{row.state}</td>
                          <td>{formatNumber(row.count)}</td>
                          <td>{formatPercent(row.count, stats.stats.total_organizations)}</td>
                          <td>{row.avg_distance} mi</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            {/* All Organizations Listing */}
            {showAllOrgs && allOrganizations.length > 0 && (
              <div className={styles.section}>
                <h3>All Organizations ({formatNumber(allOrganizations.length)})</h3>
                <p className={styles.sectionHint}>
                  Click column headers to sort • All organizations within {selectedMarket.radius_miles} mile radius
                </p>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th 
                          onClick={() => handleSort('name')}
                          className={styles.sortableHeader}
                        >
                          Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          onClick={() => handleSort('classification')}
                          className={styles.sortableHeader}
                        >
                          Service Type {sortField === 'classification' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          onClick={() => handleSort('specialty')}
                          className={styles.sortableHeader}
                        >
                          Specialty {sortField === 'specialty' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          onClick={() => handleSort('city')}
                          className={styles.sortableHeader}
                        >
                          City {sortField === 'city' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          onClick={() => handleSort('state')}
                          className={styles.sortableHeader}
                        >
                          State {sortField === 'state' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          onClick={() => handleSort('distance_miles')}
                          className={styles.sortableHeader}
                        >
                          Distance {sortField === 'distance_miles' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedOrganizations().map((org, idx) => (
                        <tr key={idx}>
                          <td>{org.name}</td>
                          <td>{org.taxonomy?.classification || '-'}</td>
                          <td>{org.taxonomy?.consolidated_specialty || '-'}</td>
                          <td>{org.address.city}</td>
                          <td>{org.address.state}</td>
                          <td>{org.distance_miles.toFixed(2)} mi</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sample Data Table */}
            {showSampleData && sampleData.length > 0 && (
              <div className={styles.section}>
                <h3>Sample Organizations (Nearest 50)</h3>
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Service Type</th>
                        <th>Specialty</th>
                        <th>City, State</th>
                        <th>Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleData.map((org, idx) => (
                        <tr key={idx}>
                          <td>{org.name}</td>
                          <td>{org.taxonomy?.classification || 'N/A'}</td>
                          <td>{org.taxonomy?.consolidated_specialty || 'N/A'}</td>
                          <td>
                            {org.address.city}, {org.address.state}
                          </td>
                          <td>{org.distance_miles.toFixed(2)} mi</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Map Visualization */}
            {showMap && mapData.length > 0 && (
              <div className={styles.section}>
                <h3>Map Visualization ({formatNumber(mapData.length)} organizations)</h3>
                <p className={styles.mapHint}>
                  Click clusters to zoom in • Click individual markers for details
                </p>
                <HCOMap
                  center={{ lat: selectedMarket.latitude, lng: selectedMarket.longitude }}
                  radius={selectedMarket.radius_miles}
                  organizations={mapData}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

