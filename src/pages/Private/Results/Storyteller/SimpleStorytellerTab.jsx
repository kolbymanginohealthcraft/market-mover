import { useState, useEffect, useMemo, useRef } from "react";
import { apiUrl } from "../../../../utils/api";
import DetailedLoadingSpinner from "../../../../components/Buttons/DetailedLoadingSpinner";
import MetricTrendChart from "./MetricTrendChart";
import { X } from "lucide-react";
import styles from "./SimpleStorytellerTab.module.css";

export default function SimpleStorytellerTab({ provider }) {
  const [providerCcns, setProviderCcns] = useState([]);
  const [ccnsLoading, setCcnsLoading] = useState(true);
  const [ccnsError, setCcnsError] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [measuresDictionary, setMeasuresDictionary] = useState([]);
  const lastCcnsString = useRef('');
  const isFetching = useRef(false);
  
  // Client-side cache for trend data
  const trendDataCache = useRef(new Map());

  // Fetch provider CCNs
  useEffect(() => {
    async function fetchProviderCcns() {
      if (!provider?.dhc || isNaN(parseInt(provider.dhc))) {
        setCcnsLoading(false);
        return;
      }

      // Reset the CCNs string ref, clear cache, and reset fetching flag when provider changes
      lastCcnsString.current = '';
      trendDataCache.current.clear();
      isFetching.current = false;
      
      setCcnsLoading(true);
      setCcnsError(null);

      try {
        const response = await fetch(apiUrl('/api/related-ccns'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dhc_ids: [provider.dhc] })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch provider CCNs: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch provider CCNs');
        }

        const ccns = (result.data || []).map(row => {
          // Normalize CCN - could be number or string from API
          const ccn = row.ccn ? String(row.ccn).trim() : null;
          return ccn;
        }).filter(Boolean);
        
        console.log('🔍 Fetched CCNs for provider:', provider.dhc, 'CCNs:', ccns, 'from data:', result.data);
        
        if (ccns.length === 0) {
          console.warn('⚠️ No CCNs found for provider', provider.dhc);
        }
        
        setProviderCcns(ccns);
      } catch (err) {
        console.error('Error fetching provider CCNs:', err);
        setCcnsError(err.message);
        setProviderCcns([]);
      } finally {
        setCcnsLoading(false);
      }
    }

    fetchProviderCcns();
  }, [provider?.dhc]);

  // Fetch all trend data for all periods
  useEffect(() => {
    async function fetchTrendData() {
      if (!providerCcns.length) {
        return;
      }

      // Create a stable string representation of CCNs
      const currentCcnsString = JSON.stringify([...providerCcns].sort());
      
      // Only fetch if CCNs have actually changed and we're not already fetching
      if (currentCcnsString === lastCcnsString.current || isFetching.current) {
        return;
      }

      lastCcnsString.current = currentCcnsString;
      isFetching.current = true;
      setTrendLoading(true);
      setTrendError(null);

      try {
        // Step 1: Get all available dates using the simpler endpoint (no CCNs needed, much faster)
        const datesResponse = await fetch(apiUrl('/api/qm_post/available-dates'), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!datesResponse.ok) {
          throw new Error('Failed to fetch available dates');
        }

        const datesResult = await datesResponse.json();
        if (!datesResult.success) {
          throw new Error(datesResult.error || 'Failed to fetch available dates');
        }

        const availableDates = datesResult.data || [];
        
        if (availableDates.length === 0) {
          setTrendData([]);
          setTrendLoading(false);
          isFetching.current = false;
          return;
        }

        // Limit to last 6 periods to reduce query load
        const datesToFetch = availableDates.slice(0, 6);
        
        // Step 2: Fetch data for all date periods in parallel
        const cacheKey = `trend_${currentCcnsString}`;
        const cached = trendDataCache.current.get(cacheKey);
        
        if (cached) {
          console.log('📦 Using cached trend data');
          setTrendData(cached);
          setTrendLoading(false);
          isFetching.current = false;
          return;
        }

        const fetchPromises = datesToFetch.map(async (publishDate) => {
          try {
            const dataResponse = await fetch(apiUrl('/api/qm_combined'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                ccns: providerCcns,
                publish_date: publishDate
              })
            });

            if (!dataResponse.ok) return null;

            const dataResult = await dataResponse.json();
            if (!dataResult.success) return null;

            return { publishDate, data: dataResult.data };
          } catch (err) {
            console.error(`Error fetching data for ${publishDate}:`, err);
            return null;
          }
        });

        // Wait for all requests to complete
        const results = await Promise.all(fetchPromises);
        
        // Process all results
        const allTrendData = [];
        
        console.log('🔍 Processing results:', results.length, 'date periods');
        console.log('🔍 Provider CCNs to match:', providerCcns);
        
        results.forEach((result, idx) => {
          if (!result || !result.data) {
            console.log(`⚠️ Result ${idx} is null or has no data`);
            return;
          }
          
          const { publishDate, data } = result;
          const { measures, providerData: rawProviderData, nationalAverages } = data;

          // Store measures dictionary (use first non-empty one)
          if (measures && measures.length > 0 && measuresDictionary.length === 0) {
            setMeasuresDictionary(measures);
          }

          console.log(`📊 Processing ${publishDate}:`, {
            rawProviderDataCount: rawProviderData?.length || 0,
            measuresCount: measures?.length || 0,
            sampleCcns: rawProviderData?.slice(0, 3).map(r => r.ccn) || []
          });

          // Process provider data: aggregate across CCNs
          const providerDataByMeasure = {};
          
          rawProviderData.forEach(row => {
            if (!row.ccn || !row.code) return;
            
            // Normalize CCN to string for comparison
            const rowCcn = String(row.ccn).trim();
            
            // Normalize provider CCNs and check if this row matches
            const matches = providerCcns.some(ccn => {
              const normalizedCcn = String(ccn).trim();
              // Compare both as strings and as numbers to handle type mismatches
              return normalizedCcn === rowCcn || 
                     (Number(normalizedCcn) === Number(rowCcn) && !isNaN(Number(rowCcn)));
            });
            
            if (matches) {
              if (!providerDataByMeasure[row.code]) {
                providerDataByMeasure[row.code] = [];
              }
              providerDataByMeasure[row.code].push({
                score: row.score,
                percentile: row.percentile_column
              });
            }
          });

          console.log(`📊 After filtering for ${publishDate}:`, {
            measuresWithData: Object.keys(providerDataByMeasure).length,
            measureCodes: Object.keys(providerDataByMeasure)
          });

          // Average across CCNs for each measure
          Object.keys(providerDataByMeasure).forEach(measureCode => {
            const values = providerDataByMeasure[measureCode];
            const avgScore = values.reduce((sum, v) => sum + (v.score || 0), 0) / values.length;
            const avgPercentile = values.reduce((sum, v) => sum + (v.percentile || 0), 0) / values.length;
            
            const measure = measures.find(m => m.code === measureCode);
            
            if (measure && (avgScore !== null && avgScore !== undefined)) {
              allTrendData.push({
                publishDate,
                measureCode: measure.code,
                measureName: measure.name || measure.code,
                value: avgScore,
                percentile: avgPercentile,
                nationalAverage: nationalAverages[measureCode]?.score || null
              });
            }
          });
        });

        // Sort by measure name, then by date (descending)
        allTrendData.sort((a, b) => {
          if (a.measureName !== b.measureName) {
            return a.measureName.localeCompare(b.measureName);
          }
          return b.publishDate.localeCompare(a.publishDate);
        });

        // Cache the result
        trendDataCache.current.set(cacheKey, allTrendData);
        
        // Clear old cache entries (keep only last 5)
        if (trendDataCache.current.size > 5) {
          const firstKey = trendDataCache.current.keys().next().value;
          trendDataCache.current.delete(firstKey);
        }

        console.log('✅ Final trend data count:', allTrendData.length, 'data points');
        if (allTrendData.length === 0) {
          console.warn('⚠️ No trend data found. Check:', {
            providerCcns,
            resultsCount: results.length,
            validResults: results.filter(r => r && r.data).length,
            sampleRawData: results.find(r => r?.data?.providerData)?.data?.providerData?.slice(0, 3)
          });
        }

        setTrendData(allTrendData);
      } catch (err) {
        console.error('Error fetching trend data:', err);
        setTrendError(err.message);
        setTrendData([]);
      } finally {
        setTrendLoading(false);
        isFetching.current = false;
      }
    }

    fetchTrendData();
  }, [providerCcns]);

  // Group trend data by measure for display (always compute, even if empty)
  const trendByMeasure = useMemo(() => {
    const result = {};
    trendData.forEach(item => {
      if (!result[item.measureCode]) {
        const measureInfo = measuresDictionary.find(m => m.code === item.measureCode);
        result[item.measureCode] = {
          measureName: item.measureName,
          measureLabel: measureInfo?.label,
          measureDescription: measureInfo?.description,
          measureSource: measureInfo?.source,
          measureDirection: measureInfo?.direction,
          periods: []
        };
      }
      result[item.measureCode].periods.push(item);
    });
    return result;
  }, [trendData, measuresDictionary]);

  // Get unique measure codes sorted by name
  const measureCodes = useMemo(() => {
    return Object.keys(trendByMeasure).sort((a, b) => 
      trendByMeasure[a].measureName.localeCompare(trendByMeasure[b].measureName)
    );
  }, [trendByMeasure]);

  // Get latest period for each measure (for table display)
  const latestPeriods = useMemo(() => {
    return measureCodes.map(measureCode => {
      const measureData = trendByMeasure[measureCode];
      if (!measureData || measureData.periods.length === 0) {
        return null;
      }
      // Sort periods by date descending and get the first one (latest)
      const sortedPeriods = [...measureData.periods].sort((a, b) => 
        b.publishDate.localeCompare(a.publishDate)
      );
      return {
        measureCode,
        measureName: measureData.measureName,
        latest: sortedPeriods[0]
      };
    }).filter(Boolean);
  }, [measureCodes, trendByMeasure]);

  // Get trend data for selected metric
  const selectedMetricTrend = useMemo(() => {
    if (!selectedMetric || !trendByMeasure[selectedMetric]) return null;
    return trendByMeasure[selectedMetric];
  }, [selectedMetric, trendByMeasure]);

  // Loading state
  if (ccnsLoading || trendLoading) {
    return (
      <DetailedLoadingSpinner 
        message="Loading quality measures trend data..." 
        showProgress={false}
      />
    );
  }

  // Error state
  if (ccnsError || (providerCcns.length === 0 && !trendError)) {
    return (
      <div className={styles.container}>
        <div className={styles.infoCard}>
          <h4>No Quality Measures Data Available</h4>
          <p>
            {ccnsError || "This provider doesn't have CCNs associated with quality measures data."}
          </p>
        </div>
      </div>
    );
  }

  if (trendError) {
    return (
      <div className={styles.container}>
        <div className={styles.infoCard}>
          <h4>Error Loading Quality Measures</h4>
          <p>{trendError}</p>
        </div>
      </div>
    );
  }

  // Helper to format values
  const formatValue = (val, measureName) => {
    if (val === null || val === undefined) return '—';

    const STAR_RATING_COLUMNS = [
      "overall", "survey", "qm", "qm long", "qm short", "staffing"
    ];

    const isRating = STAR_RATING_COLUMNS.includes(measureName?.toLowerCase());

    if (isRating) {
      return Math.round(val);
    }
    return Number(val).toFixed(2);
  };

  // Helper to format percentile (0-1 float to percentage)
  const formatPercentile = (val) => {
    if (val === null || val === undefined) return '—';
    return `${Math.round(val * 100)}%`;
  };

  // Helper to format date (YYYY-MM-DD to YYYY-MM)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.substring(0, 7); // YYYY-MM
  };

  // Handle metric click
  const handleMetricClick = (measureCode) => {
    setSelectedMetric(measureCode);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedMetric(null);
  };

  // Get percentile class for styling
  const getPercentileClass = (percentile) => {
    if (percentile === null || percentile === undefined) return '';
    const pct = percentile * 100;
    if (pct >= 80) return styles.excellent;
    if (pct >= 60) return styles.good;
    if (pct >= 40) return styles.average;
    if (pct >= 20) return styles.poor;
    return styles.veryPoor;
  };

  return (
    <div className={styles.container}>
      {latestPeriods.length > 0 && (
        <div className={styles.infoBanner}>
          <strong>Latest Period Data:</strong> Click on any metric name to view trend over time
        </div>
      )}
      
      {latestPeriods.length === 0 ? (
        <div className={styles.infoCard}>
          <h4>No Quality Measures Data Available</h4>
          <p>This provider doesn't have quality measures data for any periods.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.metricsTable}>
            <thead>
              <tr>
                <th>Metric Name</th>
                <th>Value</th>
                <th>National Average</th>
                <th>Percentile</th>
              </tr>
            </thead>
            <tbody>
              {latestPeriods.map(({ measureCode, measureName, latest }) => (
                <tr key={measureCode}>
                  <td 
                    className={`${styles.metricName} ${styles.clickable}`}
                    onClick={() => handleMetricClick(measureCode)}
                    title="Click to view trend"
                  >
                    {measureName}
                  </td>
                  <td className={styles.value}>
                    {formatValue(latest.value, measureName)}
                  </td>
                  <td className={styles.nationalAverage}>
                    {formatValue(latest.nationalAverage, measureName)}
                  </td>
                  <td className={`${styles.percentile} ${getPercentileClass(latest.percentile)}`}>
                    {formatPercentile(latest.percentile)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trend Chart Modal */}
      {selectedMetric && selectedMetricTrend && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Trend Analysis</h2>
              <button className={styles.closeButton} onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <MetricTrendChart 
                periods={selectedMetricTrend.periods}
                measureName={selectedMetricTrend.measureName}
                measureLabel={selectedMetricTrend.measureLabel}
                measureDescription={selectedMetricTrend.measureDescription}
                measureSource={selectedMetricTrend.measureSource}
                measureDirection={selectedMetricTrend.measureDirection}
                providerName={provider?.name}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

