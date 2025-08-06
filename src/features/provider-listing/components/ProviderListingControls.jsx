import React from 'react';
import Button from '../../../components/Buttons/Button';
import styles from './ProviderListingControls.module.css';

export const ProviderListingControls = ({
  selectedTypes,
  setSelectedTypes,
  showOnlyCCNs,
  setShowOnlyCCNs,
  searchQuery,
  setSearchQuery,
  providerCount,
  filteredResults,
  toggleType,
  clearFilters
}) => {
  // Get unique provider types for filter buttons
  const providerTypes = [...new Set(filteredResults.map(p => p.type).filter(Boolean))];

  return (
    <div className={styles.controls}>
      <div className={`${styles.controlsGroup} ${styles.filterGroup}`}>
        <div className={styles.filterButtons}>
          {providerTypes.map(type => (
            <Button
              key={type}
              isFilter
              isActive={selectedTypes.includes(type)}
              className="button-sm"
              onClick={() => toggleType(type)}
            >
              {type}
            </Button>
          ))}
        </div>

        <Button
          isFilter
          isActive={showOnlyCCNs}
          className="button-sm"
          onClick={() => setShowOnlyCCNs((prev) => !prev)}
        >
          Only show Medicare-certified providers
        </Button>
      </div>

      <div className={`${styles.controlsGroup} ${styles.searchGroup}`}>
        <input
          type="text"
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={`${styles.controlsGroup} ${styles.resultCount}`}>
        <div className={styles.providerCount}>
          Showing {providerCount} provider
          {filteredResults.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}; 