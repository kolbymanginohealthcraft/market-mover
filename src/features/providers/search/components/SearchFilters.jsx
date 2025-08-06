import React from 'react';
import styles from './SearchFilters.module.css';

export const SearchFilters = ({
  filters,
  showFilters,
  setShowFilters,
  onFilterChange,
  onClearAll
}) => {
  const { selectedTypes, selectedNetworks, selectedCities, selectedStates, showOnlyCCNs } = filters;

  const toggleFilter = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h3>Filters</h3>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={styles.toggleFiltersButton}
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {showFilters && (
        <div className={styles.filtersContent}>
          {/* Provider Type Filter */}
          <div className={styles.filterSection}>
            <h4>Provider Type</h4>
            <div className={styles.filterOptions}>
              {['Hospital', 'Clinic', 'Practice', 'Center'].map(type => (
                <label key={type} className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => toggleFilter('type', type)}
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Network Filter */}
          <div className={styles.filterSection}>
            <h4>Network</h4>
            <div className={styles.filterOptions}>
              {['Medicare', 'Medicaid', 'Private', 'VA'].map(network => (
                <label key={network} className={styles.filterOption}>
                  <input
                    type="checkbox"
                    checked={selectedNetworks.includes(network)}
                    onChange={() => toggleFilter('network', network)}
                  />
                  <span>{network}</span>
                </label>
              ))}
            </div>
          </div>

          {/* CCN Filter */}
          <div className={styles.filterSection}>
            <h4>Provider Type</h4>
            <div className={styles.filterOptions}>
              <label className={styles.filterOption}>
                <input
                  type="checkbox"
                  checked={showOnlyCCNs}
                  onChange={(e) => toggleFilter('ccn', e.target.checked)}
                />
                <span>Show only CCN providers</span>
              </label>
            </div>
          </div>

          {/* Clear All Button */}
          <div className={styles.filterActions}>
            <button
              onClick={onClearAll}
              className={styles.clearFiltersButton}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 