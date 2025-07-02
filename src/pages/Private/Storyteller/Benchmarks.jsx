import { useState, useMemo, useEffect } from "react";
import useQualityMeasures from "../../../hooks/useQualityMeasures";
import ProviderBarChart from "../../../components/Charts/ProviderBarChart";
import TrendLineChart from "../../../components/Charts/TrendLineChart";
import styles from "../ChartDashboard.module.css";

export default function Benchmarks({ 
  provider, 
  radiusInMiles, 
  nearbyProviders, 
  nearbyDhcCcns, 
  mainProviderCcns,
  prefetchedData,
  providerTypeFilter,
  setProviderTypeFilter,
  selectedPublishDate,
  setSelectedPublishDate,
  chartMode,
  setChartMode
}) {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [xAxisLabels, setXAxisLabels] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // Use prefetched data if available and the selected publish date matches the current date, otherwise use the hook
  const usePrefetchedData = prefetchedData && 
    !prefetchedData.loading && 
    !prefetchedData.error && 
    selectedPublishDate === prefetchedData.currentDate;
  
  const {
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    availableProviderTypes,
    availablePublishDates
  } = useQualityMeasures(
    usePrefetchedData ? null : provider, 
    usePrefetchedData ? null : nearbyProviders, 
    usePrefetchedData ? null : nearbyDhcCcns,
    selectedPublishDate
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

  // Helper to format measure values (same as ProviderComparisonMatrix)
  const formatValue = (val, measure) => {
    if (val === null || val === undefined) return '—';

    const isRating = measure && typeof measure.source === "string" && measure.source.toLowerCase() === "ratings";

    if (isRating) {
      return Math.round(val);
    }
    return Number(val).toFixed(2);
  };

  useEffect(() => {
    if (chartMode !== "trend" || !selectedMetric || !availablePublishDates.length || !provider) {
      setTrendData(null);
      setTrendLoading(false);
      return;
    }
    let isMounted = true;
    setTrendLoading(true);
    console.log('[Trend Debug] selectedMetric:', selectedMetric);
    console.log('[Trend Debug] provider:', provider);
    console.log('[Trend Debug] nearbyDhcCcns:', nearbyDhcCcns);
    Promise.all(
      [...availablePublishDates].sort().map(date => {
        // Use mainProviderCcns prop for My Facility
        const myFacilityCcns = mainProviderCcns || [];
        // All market CCNs
        const marketCcns = nearbyDhcCcns ? nearbyDhcCcns.map(row => row.ccn) : [];
        // For the API, send all unique CCNs (main + market)
        const ccns = Array.from(new Set([...myFacilityCcns, ...marketCcns]));
        console.log('[Trend Debug] mainProviderCcns:', myFacilityCcns);
        console.log('[Trend Debug] marketCcns:', marketCcns);
        console.log('[Trend Debug] ccns for date', date, ccns);
        const payload = { ccns, publish_date: date };
        console.log('[Trend Debug] API payload for date', date, payload);
        return fetch('/api/qm_combined', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(result => {
          console.log('[Trend Debug] API result for date', date, result);
          if (result && result.data) {
            console.log('[Trend Debug] providerData for date', date, result.data.providerData);
            console.log('[Trend Debug] measures for date', date, result.data.measures);
          }
          return { date, ...result, myFacilityCcns, marketCcns };
        });
      })
    ).then(results => {
      if (!isMounted) return;
      // Build arrays for each series
      const myFacility = [];
      const marketAvg = [];
      const nationalAvg = [];
      const xAxisLabels = [];
      results.forEach(res => {
        if (!res.success || !res.data) {
          myFacility.push(null);
          marketAvg.push(null);
          nationalAvg.push(null);
          xAxisLabels.push(res.date);
          return;
        }
        const { providerData, nationalAverages } = res.data;
        const { myFacilityCcns, marketCcns } = res;
        // Debug: log mainProviderCcns and all providerData CCNs (with types)
        console.log('[Trend Debug] For date', res.date, 'myFacilityCcns:', myFacilityCcns, myFacilityCcns.map(x => typeof x));
        const providerDataCcns = providerData.map(d => d.ccn);
        console.log('[Trend Debug] For date', res.date, 'providerData CCNs:', providerDataCcns, providerDataCcns.map(x => typeof x));
        // My Facility: average score for selectedMetric for mainProviderCcns (as strings)
        const myRows = providerData.filter(d => myFacilityCcns.map(String).includes(String(d.ccn)) && d.code === selectedMetric);
        console.log('[Trend Debug] For date', res.date, 'myRows:', myRows);
        const myScore = myRows.length ? myRows.reduce((sum, d) => sum + (d.score || 0), 0) / myRows.length : null;
        // Market Average: average score for selectedMetric for all marketCcns (as strings)
        const marketRows = providerData.filter(d => marketCcns.map(String).includes(String(d.ccn)) && d.code === selectedMetric);
        const marketScore = marketRows.length ? marketRows.reduce((sum, d) => sum + (d.score || 0), 0) / marketRows.length : null;
        // National Average: from nationalAverages
        const natScore = nationalAverages && nationalAverages[selectedMetric] ? nationalAverages[selectedMetric].score : null;
        console.log('[Trend Debug] For date', res.date, {
          providerData,
          nationalAverages,
          myRows,
          myScore,
          marketRows,
          marketScore,
          natScore
        });
        myFacility.push(myScore);
        marketAvg.push(marketScore);
        nationalAvg.push(natScore);
        xAxisLabels.push(res.date);
      });
      setTrendData([
        { label: "My Facility", values: myFacility },
        { label: "Market Average", values: marketAvg },
        { label: "National Average", values: nationalAvg }
      ]);
      setXAxisLabels(xAxisLabels);
      setTrendLoading(false);
    });
    return () => { isMounted = false; };
  }, [chartMode, selectedMetric, availablePublishDates, provider, mainProviderCcns, nearbyDhcCcns]);

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
        <div className={styles.chartContainer}>
          {chartMode === "snapshot" ? (
            <ProviderBarChart data={chartData} />
          ) : trendLoading ? (
            <div>Loading trend data...</div>
          ) : (
            Array.isArray(trendData) && trendData.length === 3 && trendData.every(s => s && Array.isArray(s.values)) ? (
              <TrendLineChart 
                data={trendData} 
                xAxisLabels={xAxisLabels}
                formatValue={(val) => formatValue(val, metricInfo)}
                metricLabel={metricInfo ? (metricInfo.short_name || metricInfo.name) : ""} 
              />
            ) : (
              <div>No trend data available for this metric.</div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
   