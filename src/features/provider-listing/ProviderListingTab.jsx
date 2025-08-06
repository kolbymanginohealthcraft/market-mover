import React from 'react';
import { ProviderListingHeader } from './components/ProviderListingHeader';
import { ProviderListingControls } from './components/ProviderListingControls';
import { ProviderListingTable } from './components/ProviderListingTable';
import { ProviderListingMap } from './components/ProviderListingMap';
import { useProviderListingData } from './hooks/useProviderListingData';
import { useProviderListingMap } from './hooks/useProviderListingMap';
import { useProviderListingFilters } from './hooks/useProviderListingFilters';
import { useProviderListingTags } from './hooks/useProviderListingTags';
import { useProviderListingTeam } from './hooks/useProviderListingTeam';
import styles from './ProviderListingTab.module.css';

export default function ProviderListingTab({
  provider,
  radiusInMiles,
  providers,
  isInSavedMarket,
}) {
  // Custom hooks for different concerns
  const {
    uniqueResults,
    providerCount,
    loading,
    error
  } = useProviderListingData(providers, provider);

  const {
    selectedTypes,
    setSelectedTypes,
    showOnlyCCNs,
    setShowOnlyCCNs,
    searchQuery,
    setSearchQuery,
    filteredResults,
    toggleType,
    clearFilters
  } = useProviderListingFilters(uniqueResults, provider);

  const {
    tags,
    setTags,
    taggingProviderId,
    setTaggingProviderId,
    savingTagId,
    setSavingTagId,
    handleTag,
    handleUntag,
    fetchTags
  } = useProviderListingTags(provider, isInSavedMarket);

  const {
    ccnProviderIds,
    setCcnProviderIds,
    fetchCCNs
  } = useProviderListingTeam();

  const {
    mapContainer,
    map,
    mapReady,
    containerReady,
    layersReady,
    layersAdded,
    dataReady,
    popup,
    setPopup,
    addCustomLayers
  } = useProviderListingMap(provider, radiusInMiles, uniqueResults, ccnProviderIds, tags);

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Error loading map</h3>
          <p>There was an error loading the ProviderListingTab component.</p>
          <p>Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ProviderListingHeader 
        provider={provider}
        radiusInMiles={radiusInMiles}
        isInSavedMarket={isInSavedMarket}
      />

      <ProviderListingControls 
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        showOnlyCCNs={showOnlyCCNs}
        setShowOnlyCCNs={setShowOnlyCCNs}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        providerCount={providerCount}
        filteredResults={filteredResults}
        toggleType={toggleType}
        clearFilters={clearFilters}
      />

      <div className={styles.splitView}>
        <div className={styles.tablePanel}>
          <ProviderListingTable 
            filteredResults={filteredResults}
            provider={provider}
            isInSavedMarket={isInSavedMarket}
            tags={tags}
            taggingProviderId={taggingProviderId}
            setTaggingProviderId={setTaggingProviderId}
            savingTagId={savingTagId}
            handleTag={handleTag}
            handleUntag={handleUntag}
            ccnProviderIds={ccnProviderIds}
          />
        </div>

        <div className={styles.mapPanel}>
          <ProviderListingMap 
            mapContainer={mapContainer}
            map={map}
            mapReady={mapReady}
            containerReady={containerReady}
            layersReady={layersReady}
            layersAdded={layersAdded}
            dataReady={dataReady}
            popup={popup}
            setPopup={setPopup}
            addCustomLayers={addCustomLayers}
          />
        </div>
      </div>
    </div>
  );
} 