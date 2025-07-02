import { useState, useMemo, useEffect } from "react";
import useQualityMeasures from "../../../hooks/useQualityMeasures";
import ProviderBarChart from "../../../components/Charts/ProviderBarChart";
import styles from "../ChartDashboard.module.css";

export default function Benchmarks({ provider, radiusInMiles, nearbyProviders, nearbyDhcCcns, prefetchedData }) {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [providerTypeFilter, setProviderTypeFilter] = useState('');

  // Use prefetched data if available, otherwise use the hook
  const usePrefetchedData = prefetchedData && !prefetchedData.loading && !prefetchedData.error;
  
  const {
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    availableProviderTypes
  } = useQualityMeasures(
    usePrefetchedData ? null : provider, 
    usePrefetchedData ? null : nearbyProviders, 
    usePrefetchedData ? null : nearbyDhcCcns
  );

  // Use prefetched data when available
  const finalLoading = usePrefetchedData ? false : matrixLoading;
  const finalMeasures = usePrefetchedData ? prefetchedData.measures : matrixMeasures;
  const finalData = usePrefetchedData ? prefetchedData.data : matrixData;
  const finalMarketAverages = usePrefetchedData ? prefetchedData.marketAverages : matrixMarketAverages;
  const finalNationalAverages = usePrefetchedData ? prefetchedData.nationalAverages : matrixNationalAverages;
  const finalError = usePrefetchedData ? prefetchedData.error : matrixError;
  const finalAllProviders = usePrefetchedData ? prefetchedData.allProviders : allMatrixProviders;
  const finalProviderTypes = usePrefetchedData ? prefetchedData.providerTypes : availableProviderTypes;

  // Set default provider type filter when available types change
  useEffect(() => {
    if (finalProviderTypes.length > 0 && !providerTypeFilter) {
      setProviderTypeFilter(finalProviderTypes[0]);
    }
  }, [finalProviderTypes, providerTypeFilter]);

  // Set default metric when measures load
  useEffect(() => {
    if (!selectedMetric && finalMeasures.length > 0) {
      setSelectedMetric(finalMeasures[0].code);
    }
  }, [finalMeasures, selectedMetric]);

  // Filter providers by selected type (if any)
  const filteredMatrixProviders = useMemo(() => {
    return providerTypeFilter
      ? finalAllProviders.filter(p => p.type === providerTypeFilter)
      : finalAllProviders;
  }, [providerTypeFilter, finalAllProviders]);

  // Main provider for the benchmarks
  const mainProviderInMatrix = useMemo(() => {
    return filteredMatrixProviders.find(p => p.dhc === provider?.dhc);
  }, [filteredMatrixProviders, provider?.dhc]);

  // Prepare chart data for selected metric
  const chartData = useMemo(() => {
    if (!selectedMetric || !mainProviderInMatrix) return [];
    const providerValue = finalData[mainProviderInMatrix.dhc]?.[selectedMetric]?.score ?? null;
    const marketValue = finalMarketAverages[selectedMetric]?.score ?? null;
    const nationalValue = finalNationalAverages[selectedMetric]?.score ?? null;
    return [
      { label: "My Facility", value: providerValue },
      { label: "Market Average", value: marketValue },
      { label: "National Average", value: nationalValue },
    ].filter((d) => d.value !== null);
  }, [mainProviderInMatrix, finalData, finalMarketAverages, finalNationalAverages, selectedMetric]);

  // Determine if this metric is a "win"
  const isWin = useMemo(() => {
    if (!selectedMetric || !mainProviderInMatrix) return false;
    const providerPercentile = finalData[mainProviderInMatrix.dhc]?.[selectedMetric]?.percentile ?? null;
    // Win if percentile > 0.5 (above market/national average)
    return providerPercentile !== null && providerPercentile > 0.5;
  }, [mainProviderInMatrix, finalData, selectedMetric]);

  // Get metric display info
  const metricInfo = useMemo(() => {
    return finalMeasures.find((m) => m.code === selectedMetric);
  }, [finalMeasures, selectedMetric]);

  // Early returns after all hooks
  if (finalLoading) {
    return <div>Loading quality measure data...</div>;
  }

  if (finalError) {
    return <div>Error loading quality measure data: {finalError}</div>;
  }

  if (!mainProviderInMatrix || !finalMeasures.length) {
    return <div>No quality measure data available for this provider.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Benchmarks</h2>
        <p>
          Wins are metrics where your performance exceeds market and national averages. These are good marketing opportunities.
        </p>
        <div style={{ margin: "1em 0" }}>
          <label htmlFor="metric-select">Choose a metric:</label>
          <select
            id="metric-select"
            value={selectedMetric || ""}
            onChange={(e) => setSelectedMetric(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {finalMeasures.map((m) => (
              <option key={m.code} value={m.code}>
                {m.short_name || m.name}
              </option>
            ))}
          </select>
        </div>
        {isWin && (
          <div style={{ color: "#27ae60", fontWeight: "bold", margin: "1em 0" }}>
            ️ This is a WIN! Highlight this metric in your marketing.
          </div>
        )}
        {metricInfo && (
          <div style={{ margin: "1em 0", fontStyle: "italic" }}>
            {metricInfo.description}
          </div>
        )}
      </div>
      <div className={styles.mainContent}>
        <ProviderBarChart data={chartData} />
      </div>
    </div>
  );
} 