import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Calendar, Building2, User, TrendingUp, Users, FileText } from 'lucide-react';
import Spinner from '../../../../components/Buttons/Spinner';
import { apiUrl } from '../../../../utils/api';
import styles from './ProviderAffiliationsExplorer.module.css';

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return Number(value).toLocaleString();
};

const formatQuarter = (dateValue) => {
  if (!dateValue) return '—';
  
  let dateStr = dateValue;
  
  if (typeof dateValue === 'object') {
    if (dateValue.value) {
      dateStr = dateValue.value;
    } else if (dateValue.toISOString) {
      dateStr = dateValue.toISOString();
    } else {
      return '—';
    }
  }
  
  if (typeof dateStr !== 'string') {
    dateStr = String(dateStr);
  }
  
  try {
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const quarter = Math.ceil(month / 3);
      return `Q${quarter} ${year}`;
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date in formatQuarter:', dateStr);
      return '—';
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return `Q${quarter} ${year}`;
  } catch (error) {
    console.error('Error formatting quarter:', error, dateValue);
    return '—';
  }
};

export default function ProviderAffiliationsExplorer() {
  const [metadata, setMetadata] = useState(null);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState(null);

  const [searchMode, setSearchMode] = useState('sample'); // 'sample', 'by-service-location', 'by-performing-provider', 'top'
  const [serviceLocationNpi, setServiceLocationNpi] = useState('');
  const [performingProviderNpi, setPerformingProviderNpi] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit, setLimit] = useState(100);

  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setMetadataLoading(true);
        setMetadataError(null);

        const response = await fetch(apiUrl('/api/provider-affiliations/metadata'));
        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to load metadata');
        }

        setMetadata(result.data);
        
        const mostRecentQuarter = result.data.mostRecentQuarter || result.data.max_date;
        
        if (mostRecentQuarter) {
          let maxDateValue = mostRecentQuarter;
          if (maxDateValue && typeof maxDateValue === 'object' && maxDateValue.value) {
            maxDateValue = maxDateValue.value;
          }
          if (maxDateValue) {
            const maxDate = new Date(maxDateValue);
            if (!isNaN(maxDate.getTime())) {
              setDateTo(maxDate.toISOString().split('T')[0]);
              
              const maxYear = maxDate.getFullYear();
              const maxMonth = maxDate.getMonth() + 1;
              
              let fourQuartersAgoYear = maxYear;
              let fourQuartersAgoMonth = maxMonth - 9;
              
              while (fourQuartersAgoMonth <= 0) {
                fourQuartersAgoMonth += 12;
                fourQuartersAgoYear -= 1;
              }
              
              const fourQuartersAgoDate = new Date(fourQuartersAgoYear, fourQuartersAgoMonth - 1, 1);
              const fourQuartersAgoDateStr = fourQuartersAgoDate.toISOString().split('T')[0];
              setDateFrom(fourQuartersAgoDateStr);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching metadata:', error);
        setMetadataError(error.message);
      } finally {
        setMetadataLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const fetchResults = useCallback(async () => {
    if (searchMode === 'by-service-location' && !serviceLocationNpi.trim()) {
      setResultsError('Service Location NPI is required');
      return;
    }

    if (searchMode === 'by-performing-provider' && !performingProviderNpi.trim()) {
      setResultsError('Performing Provider NPI is required');
      return;
    }

    try {
      setResultsLoading(true);
      setResultsError(null);

      let endpoint = '/api/provider-affiliations/sample';
      const body = {
        limit: parseInt(limit) || 100
      };

      if (dateFrom) body.dateFrom = dateFrom;
      if (dateTo) body.dateTo = dateTo;

      if (searchMode === 'by-service-location') {
        endpoint = '/api/provider-affiliations/by-service-location';
        body.serviceLocationNpi = serviceLocationNpi.trim();
      } else if (searchMode === 'by-performing-provider') {
        endpoint = '/api/provider-affiliations/by-performing-provider';
        body.performingProviderNpi = performingProviderNpi.trim();
      } else if (searchMode === 'top') {
        endpoint = '/api/provider-affiliations/top-affiliations';
      } else {
        if (serviceLocationNpi.trim()) body.serviceLocationNpi = serviceLocationNpi.trim();
        if (performingProviderNpi.trim()) body.performingProviderNpi = performingProviderNpi.trim();
      }

      const response = await fetch(apiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Request failed');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to load results');
      }

      console.log(`✅ Search results: ${result.data?.length || 0} rows`, {
        searchMode,
        serviceLocationNpi,
        performingProviderNpi,
        dateFrom,
        dateTo,
        resultCount: result.data?.length || 0
      });

      setResults(result.data || []);
      
      if (result.data && result.data.length === 0) {
        setResultsError('No results found. Try adjusting your search criteria or date range.');
      } else {
        setResultsError(null);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setResultsError(error.message || 'Failed to load results. Please check the console for details.');
      setResults(null);
    } finally {
      setResultsLoading(false);
    }
  }, [searchMode, serviceLocationNpi, performingProviderNpi, dateFrom, dateTo, limit]);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);

      const body = {
        groupBy: 'quarter'
      };

      if (dateFrom) body.dateFrom = dateFrom;
      if (dateTo) body.dateTo = dateTo;

      const response = await fetch(apiUrl('/api/provider-affiliations/summary'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }

      const result = await response.json();
      if (result.success) {
        setSummaryData(result.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleSearch = () => {
    fetchResults();
  };

  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <h1>Provider Affiliations Explorer</h1>
        <p>Explore relationships between service locations and performing providers</p>
      </div>

      {metadataLoading && (
        <div className={styles.loadingContainer}>
          <Spinner />
          <span>Loading metadata...</span>
        </div>
      )}

      {metadataError && (
        <div className={styles.errorContainer}>
          <p>Error loading metadata: {metadataError}</p>
        </div>
      )}

      {metadata && (
        <>
          <div className={styles.metadataCards}>
            <div className={styles.metadataCard}>
              <div className={styles.metadataCardIcon}>
                <Calendar />
              </div>
              <div className={styles.metadataCardContent}>
                <div className={styles.metadataCardLabel}>Most Recent Quarter</div>
                <div className={styles.metadataCardValue}>
                  {formatQuarter(metadata.mostRecentQuarter || metadata.max_date)}
                </div>
              </div>
            </div>

            <div className={styles.metadataCard}>
              <div className={styles.metadataCardIcon}>
                <Building2 />
              </div>
              <div className={styles.metadataCardContent}>
                <div className={styles.metadataCardLabel}>Service Locations</div>
                <div className={styles.metadataCardValue}>
                  {formatNumber(metadata.unique_service_locations)}
                </div>
              </div>
            </div>

            <div className={styles.metadataCard}>
              <div className={styles.metadataCardIcon}>
                <User />
              </div>
              <div className={styles.metadataCardContent}>
                <div className={styles.metadataCardLabel}>Performing Providers</div>
                <div className={styles.metadataCardValue}>
                  {formatNumber(metadata.unique_performing_providers)}
                </div>
              </div>
            </div>

            <div className={styles.metadataCard}>
              <div className={styles.metadataCardIcon}>
                <FileText />
              </div>
              <div className={styles.metadataCardContent}>
                <div className={styles.metadataCardLabel}>Total Claims</div>
                <div className={styles.metadataCardValue}>
                  {formatNumber(metadata.total_claims)}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.controls}>
            <div className={styles.controlsRow}>
              <div className={styles.controlGroup}>
                <label>Search Mode</label>
                <select
                  value={searchMode}
                  onChange={(e) => {
                    setSearchMode(e.target.value);
                    setResults(null);
                    setResultsError(null);
                  }}
                  className={styles.input}
                >
                  <option value="sample">Sample Data</option>
                  <option value="by-service-location">By Service Location</option>
                  <option value="by-performing-provider">By Performing Provider</option>
                  <option value="top">Top Affiliations</option>
                </select>
              </div>

              {searchMode !== 'top' && (
                <>
                  {searchMode !== 'by-performing-provider' && (
                    <div className={styles.controlGroup}>
                      <label>Service Location NPI</label>
                      <input
                        type="text"
                        value={serviceLocationNpi}
                        onChange={(e) => setServiceLocationNpi(e.target.value)}
                        placeholder="Enter NPI"
                        className={styles.input}
                      />
                    </div>
                  )}

                  {searchMode !== 'by-service-location' && (
                    <div className={styles.controlGroup}>
                      <label>Performing Provider NPI</label>
                      <input
                        type="text"
                        value={performingProviderNpi}
                        onChange={(e) => setPerformingProviderNpi(e.target.value)}
                        placeholder="Enter NPI"
                        className={styles.input}
                      />
                    </div>
                  )}
                </>
              )}

              <div className={styles.controlGroup}>
                <label>Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.controlGroup}>
                <label>Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.controlGroup}>
                <label>Limit</label>
                <input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  min="1"
                  max="1000"
                  className={styles.input}
                />
              </div>

              <button onClick={handleSearch} className={styles.searchButton} disabled={resultsLoading}>
                {resultsLoading ? <Spinner /> : <Search />}
                Search
              </button>
            </div>
          </div>

          {summaryData && summaryData.length > 0 && (
            <div className={styles.summarySection}>
              <h2>Summary by Quarter</h2>
              <div className={styles.summaryTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Quarter</th>
                      <th>Service Locations</th>
                      <th>Performing Providers</th>
                      <th>Unique Affiliations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row, idx) => (
                      <tr key={idx}>
                        <td>{formatQuarter(row.period)}</td>
                        <td>{formatNumber(row.unique_service_locations)}</td>
                        <td>{formatNumber(row.unique_performing_providers)}</td>
                        <td>{formatNumber(row.unique_affiliations)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {resultsError && (
            <div className={styles.errorContainer}>
              <p>Error: {resultsError}</p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className={styles.resultsSection}>
              <h2>Results ({results.length})</h2>
              <div className={styles.resultsTable}>
                <table>
                  <thead>
                    <tr>
                      {searchMode === 'by-service-location' ? (
                        <>
                          <th>Performing Provider NPI</th>
                          <th>Performing Provider Name</th>
                          <th>Specialty</th>
                          <th>Quarters Active</th>
                          <th>First Quarter</th>
                          <th>Last Quarter</th>
                          <th>Total Claims</th>
                        </>
                      ) : searchMode === 'by-performing-provider' ? (
                        <>
                          <th>Service Location NPI</th>
                          <th>Service Location Name</th>
                          <th>DHC</th>
                          <th>Type</th>
                          <th>Quarters Active</th>
                          <th>First Quarter</th>
                          <th>Last Quarter</th>
                          <th>Total Claims</th>
                        </>
                      ) : (
                        <>
                          <th>Service Location NPI</th>
                          <th>Service Location Name</th>
                          <th>DHC</th>
                          <th>Performing Provider NPI</th>
                          <th>Performing Provider Name</th>
                          <th>Specialty</th>
                          {searchMode === 'top' && <th>Quarters Active</th>}
                          {searchMode === 'top' && <th>First Quarter</th>}
                          {searchMode === 'top' && <th>Last Quarter</th>}
                          {searchMode !== 'top' && <th>Quarter</th>}
                          <th>Claims</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, idx) => (
                      <tr key={idx}>
                        {searchMode === 'by-service-location' ? (
                          <>
                            <td>{row.performing_provider_npi || '—'}</td>
                            <td>{row.performing_provider_name || '—'}</td>
                            <td>{row.performing_provider_specialty || '—'}</td>
                            <td>{formatNumber(row.quarters_active)}</td>
                            <td>{formatQuarter(row.first_quarter)}</td>
                            <td>{formatQuarter(row.last_quarter)}</td>
                            <td>{formatNumber(row.total_claim_count)}</td>
                          </>
                        ) : searchMode === 'by-performing-provider' ? (
                          <>
                            <td>{row.service_location_provider_npi || '—'}</td>
                            <td>{row.service_location_name || '—'}</td>
                            <td>{row.service_location_dhc ? String(row.service_location_dhc) : '—'}</td>
                            <td>{row.service_location_type || '—'}</td>
                            <td>{formatNumber(row.quarters_active)}</td>
                            <td>{formatQuarter(row.first_quarter)}</td>
                            <td>{formatQuarter(row.last_quarter)}</td>
                            <td>{formatNumber(row.total_claim_count)}</td>
                          </>
                        ) : (
                          <>
                            <td>{row.service_location_provider_npi || '—'}</td>
                            <td>{row.service_location_name || '—'}</td>
                            <td>{row.service_location_dhc ? String(row.service_location_dhc) : '—'}</td>
                            <td>{row.performing_provider_npi || '—'}</td>
                            <td>{row.performing_provider_name || '—'}</td>
                            <td>{row.performing_provider_specialty || '—'}</td>
                            {searchMode === 'top' && <td>{formatNumber(row.quarters_active)}</td>}
                            {searchMode === 'top' && <td>{formatQuarter(row.first_quarter)}</td>}
                            {searchMode === 'top' && <td>{formatQuarter(row.last_quarter)}</td>}
                            {searchMode !== 'top' && <td>{formatQuarter(row.date__quarter_grain)}</td>}
                            <td>{formatNumber(searchMode === 'top' ? row.total_claim_count : row.claim_count)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results && results.length === 0 && !resultsLoading && !resultsError && (
            <div className={styles.noResults}>
              <p>No results found for the given search criteria.</p>
              <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
                Try: Removing date filters, checking the NPI format, or selecting a different search mode.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

