import React from 'react';
import styles from './ProviderListingMap.module.css';

export const ProviderListingMap = ({
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
}) => {
  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
  );
}; 