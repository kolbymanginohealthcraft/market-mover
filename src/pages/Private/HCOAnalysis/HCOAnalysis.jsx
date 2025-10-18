import { useState, useEffect } from 'react';
import { supabase } from '../../../app/supabaseClient';
import styles from './HCOAnalysis.module.css';
import Dropdown from '../../../components/Buttons/Dropdown';
import { MapPin, ChevronDown, Database, Play } from 'lucide-react';

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

  const handleMarketSelect = (market) => {
    setSelectedMarket(market);
    setShowSampleData(false);
    fetchHCOStats(market);
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
          <button
            className={styles.sampleButton}
            onClick={fetchSampleData}
            disabled={loading}
          >
            <Play size={14} />
            {showSampleData ? 'Refresh Sample' : 'Load Sample Data'}
          </button>
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

              {/* Breakdown by Firm Type */}
              <div className={styles.section}>
                <h3>Breakdown by Organization Type</h3>
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

            {/* Sample Data Table */}
            {showSampleData && sampleData.length > 0 && (
                <div className={styles.section}>
                  <h3>Sample Organizations (Nearest 50)</h3>
                  <div className={styles.table}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>City, State</th>
                          <th>Distance</th>
                          <th>Hospital Parent</th>
                          <th>Network</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleData.map((org, idx) => (
                          <tr key={idx}>
                            <td>{org.name}</td>
                            <td>{org.firm_type || 'N/A'}</td>
                            <td>
                              {org.address.city}, {org.address.state}
                            </td>
                            <td>{org.distance_miles.toFixed(2)} mi</td>
                            <td>{org.relationships.hospital_parent_name || '-'}</td>
                            <td>{org.relationships.network_name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

