import { useState, useMemo } from "react";
import ProviderBarChart from "../../../components/Charts/ProviderBarChart";
import styles from "../ChartDashboard.module.css";

export default function Benchmarks(props) {
  const {
    mainProviderInMatrix,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    publishDate,
    providerTypeFilter,
    setProviderTypeFilter,
    availableProviderTypes,
  } = props;

  const [selectedMetric, setSelectedMetric] = useState(null);

  // Set default metric when measures load
  useMemo(() => {
    if (!selectedMetric && matrixMeasures.length > 0) {
      setSelectedMetric(matrixMeasures[0].code);
    }
  }, [matrixMeasures, selectedMetric]);

  if (!mainProviderInMatrix || !matrixMeasures.length) return <div>No data available.</div>;

  // Prepare chart data for selected metric
  const chartData = useMemo(() => {
    if (!selectedMetric) return [];
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
    if (!selectedMetric) return false;
    const providerPercentile = matrixData[mainProviderInMatrix.dhc]?.[selectedMetric]?.percentile ?? null;
    // Win if percentile > 0.5 (above market/national average)
    return providerPercentile !== null && providerPercentile > 0.5;
  }, [mainProviderInMatrix, matrixData, selectedMetric]);

  // Get metric display info
  const metricInfo = matrixMeasures.find((m) => m.code === selectedMetric);

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