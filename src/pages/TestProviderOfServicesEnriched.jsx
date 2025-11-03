import React, { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '../utils/api';
import styles from './TestProviderOfServicesEnriched.module.css';
import Spinner from '../components/Buttons/Spinner';
import Button from '../components/Buttons/Button';

/**
 * Test page for Provider of Services Enriched API
 * Tests the endpoint that enriches hco_flat data with POS bed counts
 */
export default function TestProviderOfServicesEnriched() {
  const [data, setData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Filter state
  const [filterType, setFilterType] = useState('definitive_ids'); // 'definitive_ids', 'npis', 'coordinates'
  const [definitiveIds, setDefinitiveIds] = useState('');
  const [npis, setNpis] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lon: '', radius: '10' });
  const [limit, setLimit] = useState(1000);

  // Fetch enriched data
  const fetchEnrichedData = async () => {
    try {
      setDataLoading(true);
      setDataError(null);

      // Build filters based on filter type
      const filters = {};
      
      if (filterType === 'definitive_ids' && definitiveIds.trim()) {
        filters.definitive_ids = definitiveIds
          .split(',')
          .map(id => id.trim())
          .filter(id => id.length > 0);
      } else if (filterType === 'npis' && npis.trim()) {
        filters.npis = npis
          .split(',')
          .map(npi => npi.trim())
          .filter(npi => npi.length > 0);
      } else if (filterType === 'coordinates' && coordinates.lat && coordinates.lon) {
        filters.coordinates = {
          lat: parseFloat(coordinates.lat),
          lon: parseFloat(coordinates.lon),
          radius: parseFloat(coordinates.radius) || 10
        };
      }

      const apiPath = apiUrl('/api/provider-of-services-enriched');
      console.log('🔍 Fetching enriched data from:', apiPath, 'with filters:', filters);
      
      const resp = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          limit: parseInt(limit) || 1000
        })
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      const result = await resp.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch enriched data');
      
      console.log(`✅ Loaded ${result.data.length} enriched records`);
      console.log('📊 Sample record:', result.data[0]);
      console.log('📊 Sample record keys:', result.data[0] ? Object.keys(result.data[0]) : []);
      
      // Process BigQuery results - handle date objects and value wrappers
      const processedData = result.data.map(row => {
        const processed = {};
        for (const [key, value] of Object.entries(row)) {
          // Handle BigQuery date objects
          if (value instanceof Date) {
            processed[key] = value.toISOString();
          } else if (value && typeof value === 'object' && value.value !== undefined) {
            // Handle BigQuery value wrappers {value: ...}
            if (value.value instanceof Date) {
              processed[key] = value.value.toISOString();
            } else {
              processed[key] = value.value;
            }
          } else {
            processed[key] = value;
          }
        }
        return processed;
      });
      
      setData(processedData);
    } catch (err) {
      console.error('❌ Enriched data fetch error:', err);
      setDataError(err.message || 'Failed to fetch enriched data. Make sure the server is running on port 5000.');
      setData(null);
    } finally {
      setDataLoading(false);
    }
  };

  // Filter data to only show records with CCNs
  const dataWithCcns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.filter(record => {
      const ccns = record.ccns;
      return Array.isArray(ccns) && ccns.length > 0;
    });
  }, [data]);

  // Pagination calculations (on filtered data)
  const paginatedData = useMemo(() => {
    if (!dataWithCcns || dataWithCcns.length === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = dataWithCcns.slice(startIndex, endIndex);
    console.log(`📄 Paginated data: ${paginated.length} records for page ${currentPage} (showing ${startIndex + 1}-${Math.min(endIndex, dataWithCcns.length)} of ${dataWithCcns.length} with CCNs)`);
    return paginated;
  }, [dataWithCcns, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (!dataWithCcns || dataWithCcns.length === 0) return 1;
    return Math.ceil(dataWithCcns.length / itemsPerPage);
  }, [dataWithCcns, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, dataWithCcns?.length || 0);

  // Get all column names from first record
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    const firstRecord = data[0];
    if (!firstRecord) return [];
    const keys = Object.keys(firstRecord);
    console.log('📋 Table columns:', keys);
    return keys;
  }, [data]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Statistics (based on filtered data with CCNs)
  const stats = useMemo(() => {
    if (!dataWithCcns || dataWithCcns.length === 0) return null;
    const withPosData = dataWithCcns.filter(d => d.has_pos_data).length;
    const totalBedCount = dataWithCcns
      .filter(d => d.pos_data?.BED_CNT)
      .reduce((sum, d) => sum + (d.pos_data.BED_CNT || 0), 0);
    const totalCertifiedBedCount = dataWithCcns
      .filter(d => d.pos_data?.CRTFD_BED_CNT)
      .reduce((sum, d) => sum + (d.pos_data.CRTFD_BED_CNT || 0), 0);
    
    return {
      total: dataWithCcns.length,
      originalTotal: data?.length || 0,
      filteredOut: (data?.length || 0) - dataWithCcns.length,
      withPosData,
      withoutPosData: dataWithCcns.length - withPosData,
      totalBedCount,
      totalCertifiedBedCount
    };
  }, [dataWithCcns, data]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Provider of Services - Enriched Data</h1>
        <p>Enriches hco_flat data with Provider of Services bed counts</p>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <h2>Filters</h2>
        <div className={styles.filterControls}>
          <div className={styles.filterTypeSelector}>
            <label>
              Filter Type:
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={styles.select}
              >
                <option value="definitive_ids">Definitive IDs</option>
                <option value="npis">NPIs</option>
                <option value="coordinates">Coordinates (Lat/Lon/Radius)</option>
              </select>
            </label>
          </div>

          {filterType === 'definitive_ids' && (
            <div className={styles.filterInput}>
              <label>
                Definitive IDs (comma-separated):
                <input
                  type="text"
                  value={definitiveIds}
                  onChange={(e) => setDefinitiveIds(e.target.value)}
                  placeholder="def-id-1, def-id-2, ..."
                  className={styles.input}
                />
              </label>
            </div>
          )}

          {filterType === 'npis' && (
            <div className={styles.filterInput}>
              <label>
                NPIs (comma-separated):
                <input
                  type="text"
                  value={npis}
                  onChange={(e) => setNpis(e.target.value)}
                  placeholder="1234567890, 0987654321, ..."
                  className={styles.input}
                />
              </label>
            </div>
          )}

          {filterType === 'coordinates' && (
            <div className={styles.coordinateInputs}>
              <label>
                Latitude:
                <input
                  type="number"
                  step="any"
                  value={coordinates.lat}
                  onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
                  placeholder="38.6270"
                  className={styles.input}
                />
              </label>
              <label>
                Longitude:
                <input
                  type="number"
                  step="any"
                  value={coordinates.lon}
                  onChange={(e) => setCoordinates({ ...coordinates, lon: e.target.value })}
                  placeholder="-90.1994"
                  className={styles.input}
                />
              </label>
              <label>
                Radius (miles):
                <input
                  type="number"
                  step="any"
                  value={coordinates.radius}
                  onChange={(e) => setCoordinates({ ...coordinates, radius: e.target.value })}
                  placeholder="10"
                  className={styles.input}
                />
              </label>
            </div>
          )}

          <div className={styles.filterInput}>
            <label>
              Limit:
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min={1}
                max={10000}
                className={styles.input}
              />
            </label>
          </div>

          <Button onClick={fetchEnrichedData} disabled={dataLoading}>
            {dataLoading ? 'Loading...' : 'Fetch Enriched Data'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {dataError && (
        <div className={styles.errorSection}>
          <div className={styles.error}>Error: {dataError}</div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className={styles.statsSection}>
          <h2>Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.total.toLocaleString()}</div>
              <div className={styles.statLabel}>Records with CCNs</div>
              {stats.filteredOut > 0 && (
                <div className={styles.statSubtext}>({stats.filteredOut} filtered out)</div>
              )}
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.withPosData.toLocaleString()}</div>
              <div className={styles.statLabel}>With POS Data</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.withoutPosData.toLocaleString()}</div>
              <div className={styles.statLabel}>Without POS Data</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalBedCount.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Bed Count</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.totalCertifiedBedCount.toLocaleString()}</div>
              <div className={styles.statLabel}>Total Certified Beds</div>
            </div>
          </div>
        </div>
      )}

      {/* Data Display */}
      {dataLoading && (
        <div className={styles.loadingSection}>
          <Spinner message="Loading enriched data..." />
        </div>
      )}

      {data && data.length === 0 && !dataLoading && (
        <div className={styles.noDataSection}>
          <p>No records found matching your filters.</p>
        </div>
      )}

      {data && data.length > 0 && dataWithCcns.length === 0 && (
        <div className={styles.noDataSection}>
          <p>No records found with CCN relationships.</p>
          <p className={styles.filterNote}>Total records loaded: {data.length} (filtered to show only records with CCNs)</p>
        </div>
      )}

      {data && data.length > 0 && dataWithCcns.length > 0 && (
        <>
          {/* Debug Info */}
          <div className={styles.debugInfo}>
            <p><strong>Records with CCNs:</strong> {dataWithCcns.length} of {data.length} total</p>
            <p><strong>Columns:</strong> {columns.length}</p>
            <p><strong>Page:</strong> {currentPage} of {totalPages}</p>
            <p><strong>Showing:</strong> {startIndex + 1}-{endIndex}</p>
            {paginatedData.length > 0 && (
              <p><strong>Sample keys:</strong> {Object.keys(paginatedData[0]).slice(0, 5).join(', ')}...</p>
            )}
          </div>

          {/* Pagination Controls */}
          <div className={styles.paginationTop}>
            <div className={styles.pageSizeSelector}>
              <label htmlFor="pageSize">Show:</label>
              <select
                id="pageSize"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className={styles.pageSizeSelect}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
              <span className={styles.paginationInfo}>per page</span>
            </div>
            <div className={styles.paginationControls}>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className={styles.paginationPage}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            <div className={styles.tableContainer}>
              {paginatedData.length > 0 ? (
                <table className={styles.dataTable} style={{ display: 'table' }}>
                  <thead>
                    <tr>
                      {columns.map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((record, idx) => {
                      console.log(`Rendering row ${idx}:`, record);
                      return (
                        <tr key={idx}>
                          {columns.map((key) => {
                            const value = record[key];
                            let displayValue = '';
                            
                            if (key === 'pos_data') {
                              if (value && typeof value === 'object') {
                                displayValue = (
                                  <div className={styles.nestedObject}>
                                    {Object.entries(value).map(([k, v]) => (
                                      <div key={k} className={styles.nestedItem}>
                                        <strong>{k}:</strong> {String(v ?? '')}
                                      </div>
                                    ))}
                                  </div>
                                );
                              } else {
                                displayValue = <span className={styles.nullValue}>No POS data</span>;
                              }
                            } else if (key === 'ccns') {
                              if (Array.isArray(value)) {
                                displayValue = (
                                  <div className={styles.arrayValue}>
                                    {value.length > 0 ? value.join(', ') : 'None'}
                                  </div>
                                );
                              } else {
                                displayValue = String(value ?? '');
                              }
                            } else {
                              if (value === null || value === undefined) {
                                displayValue = '';
                              } else if (typeof value === 'object' && !Array.isArray(value)) {
                                if (value.value !== undefined) {
                                  displayValue = String(value.value);
                                } else {
                                  displayValue = JSON.stringify(value);
                                }
                              } else {
                                displayValue = String(value);
                              }
                            }
                            
                            return (
                              <td 
                                key={key} 
                                className={key === 'pos_data' ? styles.nestedData : ''}
                              >
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyTableMessage}>
                  <p>No data to display for current page.</p>
                  <p>Total records: {data.length}</p>
                  <p>Current page: {currentPage}</p>
                  <p>Items per page: {itemsPerPage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Pagination */}
          <div className={styles.paginationBottom}>
            <div className={styles.paginationInfo}>
              Showing {startIndex + 1}-{endIndex} of {dataWithCcns.length.toLocaleString()} records with CCNs
              {data && data.length > dataWithCcns.length && (
                <span className={styles.filterNote}> (filtered from {data.length.toLocaleString()} total)</span>
              )}
            </div>
            <div className={styles.paginationControls}>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className={styles.paginationPage}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className={styles.paginationButton}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

