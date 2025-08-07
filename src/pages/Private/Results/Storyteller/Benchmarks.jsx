import { useState, useMemo, useEffect, useCallback } from "react";
import useQualityMeasures from "../../../../hooks/useQualityMeasures";
import ProviderBarChart from "./ProviderBarChart";
import TrendLineChart from "./TrendLineChart";
import styles from "./ChartDashboard.module.css";
import { apiUrl } from '../../../../utils/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Filter measures by selected setting (if any) instead of filtering providers
  const filteredMeasures = finalMeasures.filter(m => {
    // If no filter is selected, show all measures
    if (!providerTypeFilter || providerTypeFilter === 'All') {
      return true;
    }
    
    // Infer setting from measure code since database setting field might be empty
    let inferredSetting = 'Other';
    if (m.code && m.code.includes('HOSPITAL')) inferredSetting = 'Hospital';
    else if (m.code && m.code.includes('SNF')) inferredSetting = 'SNF';
    else if (m.code && m.code.includes('HH')) inferredSetting = 'HH';
    else if (m.code && m.code.includes('HOSPICE')) inferredSetting = 'Hospice';
    else if (m.code && m.code.includes('IRF')) inferredSetting = 'IRF';
    else if (m.code && m.code.includes('LTCH')) inferredSetting = 'LTCH';
    else if (m.code && m.code.includes('CAH')) inferredSetting = 'Hospital';
    
    return inferredSetting === providerTypeFilter;
  });

  // Fallback: if no measures found for selected setting, show all measures
  const finalFilteredMeasures = filteredMeasures.length > 0 ? filteredMeasures : finalMeasures;

  // Filter providers to ONLY show those that have data for the filtered measures
  const filteredProviders = finalAllProviders.filter(provider => {
    const providerData = finalData[provider.dhc] || {};
    // Check if this provider has data for ANY of the filtered measures
    return finalFilteredMeasures.some(measure => providerData[measure.code]);
  });

  // Main provider for the benchmarks (only show providers with data for selected setting)
  const mainProviderInMatrix = filteredProviders.find(p => p.dhc === provider?.dhc);

  // Set default metric when measures load
  useEffect(() => {
    if (!selectedMetric && finalFilteredMeasures.length > 0) {
      setSelectedMetric(finalFilteredMeasures[0].code);
    } else if (selectedMetric && !finalFilteredMeasures.some(m => m.code === selectedMetric)) {
      // If selected metric is not in filtered measures, select the first available
      if (finalFilteredMeasures.length > 0) {
        setSelectedMetric(finalFilteredMeasures[0].code);
      }
    }
  }, [finalFilteredMeasures, selectedMetric]);

  // DEBUG: Log filtering info
  console.log('🔍 Benchmarks filtering:', {
    providerTypeFilter,
    totalMeasures: finalMeasures.length,
    filteredMeasuresCount: filteredMeasures.length,
    finalFilteredMeasuresCount: finalFilteredMeasures.length,
    totalProviders: finalAllProviders.length,
    filteredProvidersCount: filteredProviders.length,
    mainProviderHasData: mainProviderInMatrix ? 'YES' : 'NO',
    selectedMetric,
    filteredMeasures: filteredMeasures.map(m => ({ code: m.code, name: m.name })),
    finalFilteredMeasures: finalFilteredMeasures.map(m => ({ code: m.code, name: m.name }))
  });

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
    return finalFilteredMeasures.find((m) => m.code === selectedMetric);
  }, [finalFilteredMeasures, selectedMetric]);

  // Helper to format measure values (same as ProviderComparisonMatrix)
  const formatValue = (val, measure) => {
    if (val === null || val === undefined) return '—';

    const isRating = measure && typeof measure.source === "string" && measure.source.toLowerCase() === "ratings";

    if (isRating) {
      return Math.round(val);
    }
    return Number(val).toFixed(2);
  };

  const fetchData = useCallback(async () => {
    if (!provider?.dhc || !nearbyProviders?.length) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching benchmarks data for provider:', provider?.dhc);
      
      return fetch(apiUrl('/api/qm_combined'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dhc: provider.dhc,
          nearby_dhcs: nearbyProviders.map(p => p.dhc),
          radius: radiusInMiles
        })
      });
    } catch (e) {
      console.error('Error fetching benchmarks data:', e);
      setError(e.message);
    }
  }, [provider?.dhc, nearbyProviders, radiusInMiles]);

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
            {finalFilteredMeasures.map((m) => (
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
   