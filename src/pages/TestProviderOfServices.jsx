import React, { useState, useEffect, useMemo } from 'react';
import { apiUrl } from '../utils/api';
import styles from './TestProviderOfServices.module.css';
import Spinner from '../components/Buttons/Spinner';

/**
 * Test page for Provider of Services File API
 * Displays paginated table of all Provider of Services data
 */
export default function TestProviderOfServices() {
  const [data, setData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Fetch all data on mount
  useEffect(() => {
    async function fetchAllData() {
      try {
        setDataLoading(true);
        setDataError(null);
        const apiPath = apiUrl('/api/provider-of-services');
        console.log('🔍 Fetching all Provider of Services data...');
        const resp = await fetch(apiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: {},
            limit: 999999 // Request all records
          })
        });

        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        const result = await resp.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch data');
        console.log(`✅ Loaded ${result.data.length} records`);
        setData(result.data);
      } catch (err) {
        console.error('❌ Data fetch error:', err);
        setDataError(err.message || 'Failed to fetch data. Make sure the server is running on port 5000.');
        setData(null);
      } finally {
        setDataLoading(false);
      }
    }
    fetchAllData();
  }, []);

  // Pagination calculations
  const paginatedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.ceil(data.length / itemsPerPage);
  }, [data, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, data?.length || 0);

  // Get all column names from first record
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  if (dataLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Provider of Services File</h1>
          <Spinner message="Loading all records..." />
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Provider of Services File</h1>
          <div className={styles.error}>Error: {dataError}</div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Provider of Services File</h1>
          <p>No records found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Provider of Services File</h1>
        <p className={styles.subtitle}>
          Showing {startIndex + 1}-{endIndex} of {data.length.toLocaleString()} records
        </p>
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
          <table className={styles.dataTable}>
            <thead>
              <tr>
                {columns.map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((record, idx) => (
                <tr key={idx}>
                  {columns.map((key) => (
                    <td key={key}>
                      {record[key] !== null && record[key] !== undefined
                        ? String(record[key])
                        : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Pagination */}
      <div className={styles.paginationBottom}>
        <div className={styles.paginationInfo}>
          Showing {startIndex + 1}-{endIndex} of {data.length.toLocaleString()} records
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
    </div>
  );
}
