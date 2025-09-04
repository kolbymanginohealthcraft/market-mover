import { useEffect, useRef } from 'react';
import styles from './InteractiveMarketCreation.module.css';
import { LocationSearch, MarketMap } from './components';
import RightDrawer from '../../../components/Overlays/RightDrawer';
import Button from '../../../components/Buttons/Button';
import { useMarketCreation } from './hooks';

export default function InteractiveMarketCreation() {
  const mapContainerRef = useRef(null);
  const {
    searchQuery,
    setSearchQuery,
    loading,
    error,
    center,
    setCenter,
    radius,
    setRadius,
    showSaveSidebar,
    setShowSaveSidebar,
    marketName,
    setMarketName,
    savingMarket,
    resolvedLocation,
    handleSearch,
    handleSaveMarketClick,
    handleSaveMarket
  } = useMarketCreation();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <LocationSearch
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loading={loading}
          error={error}
          radius={radius}
          setRadius={setRadius}
          onSearch={handleSearch}
          onSaveMarket={handleSaveMarketClick}
        />

        <MarketMap
          center={center}
          radius={radius}
          onCenterChange={setCenter}
          onRadiusChange={setRadius}
          mapContainerRef={mapContainerRef}
        />
      </div>

      <RightDrawer
        isOpen={showSaveSidebar}
        onClose={() => setShowSaveSidebar(false)}
        title="Save Market"
      >
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0.5rem 0' }}><strong>Location:</strong> {resolvedLocation ? `${resolvedLocation.city}, ${resolvedLocation.state}` : 'Loading location...'}</p>
            <p style={{ margin: '0.5rem 0' }}><strong>Radius:</strong> {radius} miles</p>
            <p style={{ margin: '0.5rem 0' }}><strong>Center:</strong> {center.lat.toFixed(4)}, {center.lng.toFixed(4)}</p>
            {!resolvedLocation && (
              <p style={{ margin: '0.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>Determining location from circle center...</p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="marketName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Market Name
            </label>
            <input
              id="marketName"
              type="text"
              placeholder="e.g., Atlanta Metro, Dallas-Fort Worth"
              value={marketName}
              onChange={(e) => setMarketName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && marketName.trim() && !savingMarket) {
                  handleSaveMarket();
                }
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          {error && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #f87171', 
              color: '#dc2626', 
              padding: '0.75rem', 
              borderRadius: '6px', 
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              <p style={{ margin: 0 }}>{error}</p>
            </div>
          )}

          <div className="drawerActions">
            <Button
              variant="green"
              size="md"
              onClick={handleSaveMarket}
              disabled={savingMarket || !marketName.trim()}
            >
              {savingMarket ? 'Saving...' : 'Save Market'}
            </Button>
            <Button 
              variant="gray" 
              size="md" 
              outline 
              onClick={() => setShowSaveSidebar(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </RightDrawer>
    </div>
  );
} 