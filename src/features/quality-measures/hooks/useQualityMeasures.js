import { useState, useEffect } from 'react';
import { useQualityMeasuresData } from './useQualityMeasuresData';
import { useQualityMeasuresMatrix } from './useQualityMeasuresMatrix';
import { useQualityMeasuresCache } from './useQualityMeasuresCache';

export default function useQualityMeasures(provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate = null) {
  // Cache management
  const { getCachedData, setCachedData, clearCache } = useQualityMeasuresCache();
  
  // Matrix data management
  const {
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    matrixProviderIdToCcns,
    fetchMatrixData
  } = useQualityMeasuresMatrix(provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate, getCachedData, setCachedData);

  // Quality measures data management
  const {
    availableProviderTypes,
    availablePublishDates,
    currentPublishDate,
    setCurrentPublishDate,
    fetchQualityMeasuresData
  } = useQualityMeasuresData(provider, selectedPublishDate);

  // Main data fetching effect
  useEffect(() => {
    if (provider) {
      fetchMatrixData();
      fetchQualityMeasuresData();
    }
  }, [provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate]);

  return {
    // Matrix data
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    matrixProviderIdToCcns,
    
    // Quality measures data
    availableProviderTypes,
    availablePublishDates,
    currentPublishDate,
    setCurrentPublishDate,
    
    // Cache management
    clearCache
  };
} 