import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SearchHeader } from './components/SearchHeader';
import { SearchFilters } from './components/SearchFilters';
import { SearchResults } from './components/SearchResults';
import { SearchMap } from './components/SearchMap';
import { BulkActions } from './components/BulkActions';
import { useProviderSearch } from '../../hooks/useProviderSearch';
import { useSearchFilters } from '../../hooks/useSearchFilters';
import { useSearchMap } from '../../hooks/useSearchMap';
import { useBulkActions } from '../../hooks/useBulkActions';
import { trackProviderSearch } from '../../../utils/activityTracker';
import styles from './ProviderSearch.module.css';

export default function ProviderSearch() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [queryText, setQueryText] = useState("");
  const [componentError, setComponentError] = useState(null);

  // Custom hooks for different concerns
  const {
    results,
    loading,
    error,
    currentPage,
    resultsPerPage,
    hasSearched,
    handleSearch,
    goToPage
  } = useProviderSearch();

  const {
    filters,
    showFilters,
    setShowFilters,
    clearAllFilters,
    handleFilterChange
  } = useSearchFilters();

  const {
    map,
    mapReady,
    selectedProvider,
    setSelectedProvider,
    handleProviderSelect
  } = useSearchMap();

  const {
    selectedProviders,
    setSelectedProviders,
    showBulkActions,
    setShowBulkActions,
    handleCheckboxChange,
    handleSelectAll,
    handleSaveAsTeamProviders
  } = useBulkActions();

  // Error boundary for the component
  if (componentError) {
    return (
      <div className={styles.page}>
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
    );
  }

  // Read search parameter from URL and perform search on page load
  useEffect(() => {
    const searchTerm = searchParams.get('search');
    if (searchTerm) {
      setQueryText(searchTerm);
      handleSearch(searchTerm, true);
    }
  }, [searchParams]);

  const handleSearchSubmit = async (searchTerm = null) => {
    const term = searchTerm || queryText;
    if (!term.trim()) return;

    await handleSearch(term);
    trackProviderSearch(term);
  };

  return (
    <div className={styles.page}>
      <SearchHeader 
        queryText={queryText}
        setQueryText={setQueryText}
        onSearch={handleSearchSubmit}
        loading={loading}
      />

      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <SearchFilters 
            filters={filters}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onFilterChange={handleFilterChange}
            onClearAll={clearAllFilters}
          />

          <SearchResults 
            results={results}
            loading={loading}
            error={error}
            currentPage={currentPage}
            resultsPerPage={resultsPerPage}
            hasSearched={hasSearched}
            selectedProviders={selectedProviders}
            onProviderSelect={handleProviderSelect}
            onCheckboxChange={handleCheckboxChange}
            onSelectAll={handleSelectAll}
            onPageChange={goToPage}
            onShowBulkActions={setShowBulkActions}
          />

          {showBulkActions && (
            <BulkActions 
              selectedCount={selectedProviders.size}
              onSaveAsTeamProviders={handleSaveAsTeamProviders}
              onClearSelection={() => setSelectedProviders(new Set())}
            />
          )}
        </div>

        <div className={styles.rightPanel}>
          <SearchMap 
            map={map}
            mapReady={mapReady}
            selectedProvider={selectedProvider}
            results={results}
            onProviderSelect={handleProviderSelect}
          />
        </div>
      </div>
    </div>
  );
} 