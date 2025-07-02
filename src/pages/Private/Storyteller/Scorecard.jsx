import { useState } from "react";
import useNearbyProviders from "../../../hooks/useNearbyProviders";
import useQualityMeasures from "../../../hooks/useQualityMeasures";
import ProviderComparisonMatrix from "../ProviderComparisonMatrix";

console.log("Scorecard component mounted");

export default function Scorecard({ provider, radiusInMiles }) {
  const [providerTypeFilter, setProviderTypeFilter] = useState('');
  const [selectedPublishDate, setSelectedPublishDate] = useState(null);

  // Get nearby providers and their CCNs
  const { providers: nearbyProviders, ccns: nearbyDhcCcns } = useNearbyProviders(provider, radiusInMiles);

  // Get quality measure data
  const {
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    availableProviderTypes,
    availablePublishDates,
    currentPublishDate
  } = useQualityMeasures(provider, nearbyProviders, nearbyDhcCcns, selectedPublishDate);

  // Set default provider type filter when available types change
  if (availableProviderTypes.length > 0 && !providerTypeFilter) {
    setProviderTypeFilter(availableProviderTypes[0]);
  }

  // Filter providers by selected type (if any)
  const filteredMatrixProviders = providerTypeFilter
    ? allMatrixProviders.filter(p => p.type === providerTypeFilter)
    : allMatrixProviders;

  // Main provider and competitors for the matrix
  const mainProviderInMatrix = filteredMatrixProviders.find(p => p.dhc === provider?.dhc);
  const competitorsInMatrix = filteredMatrixProviders.filter(p => p.dhc !== provider?.dhc);

  if (matrixLoading) {
    return <div>Loading quality measure data...</div>;
  }

  if (matrixError) {
    return <div>Error loading quality measure data: {matrixError}</div>;
  }

  if (!mainProviderInMatrix || !matrixMeasures.length) {
    return <div>No quality measure data available for this provider.</div>;
  }

  return (
    <ProviderComparisonMatrix
      provider={mainProviderInMatrix}
      competitors={competitorsInMatrix}
      measures={matrixMeasures}
      data={matrixData}
      marketAverages={matrixMarketAverages}
      nationalAverages={matrixNationalAverages}
      publishDate={currentPublishDate}
      providerTypeFilter={providerTypeFilter}
      setProviderTypeFilter={setProviderTypeFilter}
      availableProviderTypes={availableProviderTypes}
      availablePublishDates={availablePublishDates}
      selectedPublishDate={selectedPublishDate}
      setSelectedPublishDate={setSelectedPublishDate}
    />
  );
} 