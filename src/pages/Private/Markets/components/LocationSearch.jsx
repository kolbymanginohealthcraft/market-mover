import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from '../InteractiveMarketCreation.module.css';

export default function LocationSearch({
  searchQuery,
  setSearchQuery,
  loading,
  error,
  radius,
  setRadius,
  onSearch,
  onSaveMarket
}) {
  const searchInputRef = useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onSearch();
    }
  };

  // Auto-focus the search input when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <div className={styles.controlsStrip}>
      <div className={styles.controlsLeft}>
        <div className={styles.searchSection}>
          <div className="searchBarContainer">
            <div className="searchIcon">
              <Search size={16} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="searchInput"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="clearButton"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={onSearch}
            className="sectionHeaderButton"
            disabled={loading || !searchQuery.trim()}
          >
            <Search size={14} />
            <span>Search</span>
          </button>
        </div>
      </div>

      <div className={styles.controlsRight}>
        <div className={styles.radiusSection}>
          <label htmlFor="radius-slider" className={styles.radiusLabel}>
            Radius: {radius} miles
          </label>
          <input
            id="radius-slider"
            type="range"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className={styles.radiusSlider}
          />
        </div>
        <div className={styles.saveSection}>
          <button 
            onClick={onSaveMarket}
            className="sectionHeaderButton primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Market'}
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
} 