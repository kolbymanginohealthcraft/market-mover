import { useEffect, useRef } from 'react';
import styles from './InteractiveMarketCreation.module.css';
import { LocationSearch, MarketMap, SaveMarketSidebar } from './components';
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
      <LocationSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        error={error}
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

      <SaveMarketSidebar
        showSaveSidebar={showSaveSidebar}
        setShowSaveSidebar={setShowSaveSidebar}
        marketName={marketName}
        setMarketName={setMarketName}
        resolvedLocation={resolvedLocation}
        radius={radius}
        center={center}
        savingMarket={savingMarket}
        error={error}
        onSaveMarket={handleSaveMarket}
      />
    </div>
  );
} 