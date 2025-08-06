import { useRef, useEffect } from 'react';
import Banner from '../../../../components/Banner';
import styles from '../InteractiveMarketCreation.module.css';

export default function LocationSearch({
  searchQuery,
  setSearchQuery,
  loading,
  error,
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
    <>
      <Banner
        title="Create Market"
        subtitle="Define your market area by searching for a location and adjusting the radius."
        gradient="blue"
        buttonsUnderText={false}
        searchBar={{
          placeholder: "Search location...",
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          onKeyPress: handleKeyPress,
          inputRef: searchInputRef
        }}
        buttons={[
          { 
            text: loading ? 'Saving...' : 'Save Market', 
            onClick: onSaveMarket, 
            variant: 'primary',
            disabled: !searchQuery.trim() || loading
          }
        ]}
      />

      {error && (
        <div className={styles.headerError}>
          <p>{error}</p>
        </div>
      )}
    </>
  );
} 