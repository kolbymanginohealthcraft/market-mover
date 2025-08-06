import React, { useRef } from 'react';
import Button from '../../../../components/Buttons/Button';
import styles from './SearchHeader.module.css';

export const SearchHeader = ({ 
  queryText, 
  setQueryText, 
  onSearch, 
  loading 
}) => {
  const searchInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className={styles.searchHeader}>
      <div className={styles.headerContent}>
        <h2>Provider Search</h2>
        <p className={styles.subtitle}>
          Search for healthcare providers by name, location, or specialty
        </p>
      </div>

      <form className={styles.searchForm} onSubmit={handleSubmit}>
        <div className={styles.searchInputContainer}>
          <input
            ref={searchInputRef}
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search providers..."
            className={styles.searchInput}
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !queryText.trim()}
            className={styles.searchButton}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>
    </div>
  );
}; 