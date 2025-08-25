import { useRef, useEffect } from 'react';
import Button from '../../../../components/Buttons/Button';
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
    if (e.key === 'Enter') {
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
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <Button 
            onClick={onSearch}
            variant="blue"
            size="sm"
            disabled={loading}
          >
            Search
          </Button>
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
          <Button 
            onClick={onSaveMarket}
            variant="gold"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Market'}
          </Button>
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