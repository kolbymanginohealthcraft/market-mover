import { useState, useMemo, useEffect } from "react";
import useNearbyProviders from "../../../hooks/useNearbyProviders";
import useQualityMeasures from "../../../hooks/useQualityMeasures";
import ProviderBarChart from "../../../components/Charts/ProviderBarChart";
import styles from "../ChartDashboard.module.css";

export default function Benchmarks({ provider, radiusInMiles }) {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [providerTypeFilter, setProviderTypeFilter] = useState('');

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
    availableProviderTypes
  } = useQualityMeasures(provider, nearbyProviders, nearbyDhcCcns);

  // Set default provider type filter when available types change
  useEffect(() => {
    if (availableProviderTypes.length > 0 && !providerTypeFilter) {
      setProviderTypeFilter(availableProviderTypes[0]);
    }
  }, [availableProviderTypes, providerTypeFilter]);

  // Set default metric when measures load
  useEffect(() => {
    if (!selectedMetric && matrixMeasures.length > 0) {
      setSelectedMetric(matrixMeasures[0].code);
    }
  }, [matrixMeasures, selectedMetric]);

  // Filter providers by selected type (if any)
  const filteredMatrixProviders = useMemo(() => {
    return providerTypeFilter
      ? allMatrixProviders.filter(p => p.type === providerTypeFilter)
      : allMatrixProviders;
  }, [providerTypeFilter, allMatrixProviders]);

  // Main provider for the benchmarks
  const mainProviderInMatrix = useMemo(() => {
    return filteredMatrixProviders.find(p => p.dhc === provider?.dhc);
  }, [filteredMatrixProviders, provider?.dhc]);

  // Prepare chart data for selected metric
  const chartData = useMemo(() => {
    if (!selectedMetric || !mainProviderInMatrix) return [];
    const providerValue = matrixData[mainProviderInMatrix.dhc]?.[selectedMetric]?.score ?? null;
    const marketValue = matrixMarketAverages[selectedMetric]?.score ?? null;
    const nationalValue = matrixNationalAverages[selectedMetric]?.score ?? null;
    return [
      { label: "My Facility", value: providerValue },
      { label: "Market Average", value: marketValue },
      { label: "National Average", value: nationalValue },
    ].filter((d) => d.value !== null);
  }, [mainProviderInMatrix, matrixData, matrixMarketAverages, matrixNationalAverages, selectedMetric]);

  // Determine if this metric is a "win"
  const isWin = useMemo(() => {
    if (!selectedMetric || !mainProviderInMatrix) return false;
    const providerPercentile = matrixData[mainProviderInMatrix.dhc]?.[selectedMetric]?.percentile ?? null;
    // Win if percentile > 0.5 (above market/national average)
    return providerPercentile !== null && providerPercentile > 0.5;
  }, [mainProviderInMatrix, matrixData, selectedMetric]);

  // Get metric display info
  const metricInfo = useMemo(() => {
    return matrixMeasures.find((m) => m.code === selectedMetric);
  }, [matrixMeasures, selectedMetric]);

  // Early returns after all hooks
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
            {matrixMeasures.map((m) => (
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