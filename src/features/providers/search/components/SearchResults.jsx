import React from 'react';
import { Link } from 'react-router-dom';
import { ProviderCard } from './ProviderCard';
import { Pagination } from './Pagination';
import styles from './SearchResults.module.css';

export const SearchResults = ({
  results,
  loading,
  error,
  currentPage,
  resultsPerPage,
  hasSearched,
  selectedProviders,
  onProviderSelect,
  onCheckboxChange,
  onSelectAll,
  onPageChange,
  onShowBulkActions
}) => {
  if (loading) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.loading}>
          <p>Searching for providers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.error}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.emptyState}>
          <p>Enter a search term to find providers</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.noResults}>
          <p>No providers found matching your search criteria</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(results.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsHeader}>
        <div className={styles.resultsInfo}>
          <span>{results.length} providers found</span>
          {selectedProviders.size > 0 && (
            <span className={styles.selectedCount}>
              {selectedProviders.size} selected
            </span>
          )}
        </div>
        
        <div className={styles.resultsActions}>
          <button
            onClick={onSelectAll}
            className={styles.selectAllButton}
          >
            Select All
          </button>
          {selectedProviders.size > 0 && (
            <button
              onClick={() => onShowBulkActions(true)}
              className={styles.bulkActionsButton}
            >
              Bulk Actions
            </button>
          )}
        </div>
      </div>

      <div className={styles.resultsList}>
        {currentResults.map((provider) => (
          <ProviderCard
            key={provider.dhc}
            provider={provider}
            isSelected={selectedProviders.has(provider.dhc)}
            onSelect={onProviderSelect}
            onCheckboxChange={onCheckboxChange}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}; 