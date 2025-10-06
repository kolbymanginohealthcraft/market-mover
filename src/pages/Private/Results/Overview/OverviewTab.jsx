import React, { useMemo, useState, useEffect } from 'react';
import { useProviderAnalysis } from '../../../../components/Context/ProviderAnalysisContext';
import useQualityMeasures from '../../../../hooks/useQualityMeasures';
import { apiUrl } from '../../../../utils/api';
import { Award, Activity } from 'lucide-react';
import styles from './OverviewTab.module.css';

export default function OverviewTab({ provider }) {
  const {
    providers: nearbyProviders,
    ccns: nearbyDhcCcns,
    npis,
    qualityMeasuresDates
  } = useProviderAnalysis();

  // State for procedures data
  const [proceduresData, setProceduresData] = useState({
    totalProcedures: 0,
    loading: false,
    error: null
  });

  // Use the same hook as storyteller to get quality measures data
  const {
    matrixLoading,
    matrixMeasures,
    matrixData,
    matrixMarketAverages,
    matrixNationalAverages,
    matrixError,
    allMatrixProviders,
    clearCache
  } = useQualityMeasures(
    provider,
    nearbyProviders,
    nearbyDhcCcns,
    null, // selectedPublishDate
    qualityMeasuresDates,
    'SNF'  // Use SNF filter like benchmarks
  );


  // Fetch procedures data - Temporarily disabled due to API issues
  useEffect(() => {
    async function fetchProceduresData() {
      // Temporarily disabled due to BigQuery API issues
      return;
      
      if (!npis?.length) return;

      setProceduresData(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Use only the main provider's NPIs to avoid BigQuery issues
        // Get NPIs that belong to the main provider only
        const mainProviderNpis = npis.filter(npi => {
          // This is a simplified approach - in reality we'd need to check which NPIs belong to the main provider
          // For now, just take a small subset to test
          return true;
        }).slice(0, 10); // Use only 10 NPIs for testing
        
        console.log('🔍 Fetching procedures data for NPIs:', { 
          totalNpis: npis.length, 
          mainProviderNpis: mainProviderNpis.length,
          sampleNpis: mainProviderNpis.slice(0, 3)
        });
        
        // Use the claims-data endpoint like the claims tab
        const response = await fetch(apiUrl('/api/claims-data'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            npis: mainProviderNpis,
            tableName: 'volume_procedure',
            aggregation: 'provider',
            originalAggregation: 'billing_provider',
            filters: {},
            limit: 100
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Procedures API error:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`Failed to fetch procedures data: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          console.error('❌ Procedures API returned error:', result);
          throw new Error(result.error || 'API returned unsuccessful response');
        }

        // Process claims data - sum up total procedures across all providers
        const totalProcedures = result.data.reduce((sum, item) => sum + (item.total_claims || 0), 0);

        setProceduresData({
          totalProcedures,
          loading: false,
          error: null
        });

        console.log('🔍 Claims data fetched for procedures:', {
          totalProcedures,
          providersWithData: result.data.length,
          sampleData: result.data.slice(0, 3)
        });

      } catch (err) {
        console.error('Error fetching procedures data:', err);
        // Set a fallback message instead of showing error
        setProceduresData(prev => ({ 
          ...prev, 
          loading: false, 
          error: null,
          totalProcedures: 0 // Show 0 instead of error
        }));
      }
    }

    fetchProceduresData();
  }, [npis]);

  // Clear cache when component mounts to ensure fresh data
  React.useEffect(() => {
    if (clearCache) {
      console.log('🧹 Clearing quality measures cache for fresh data');
      clearCache();
    }
  }, [clearCache]);


  // Get measures that the provider actually has data for (from the SNF-filtered set)
  const providerMeasures = useMemo(() => {
    if (!matrixData || !provider?.dhc || !matrixMeasures?.length) return [];

    const providerKey = provider.dhc;
    const providerData = matrixData[providerKey];
    
    if (!providerData) return [];

    // Get SNF measures that the provider has data for (hook already filtered by SNF)
    return matrixMeasures.filter(measure => {
      const measureData = providerData[measure.code];
      return measureData?.score !== null && measureData?.score !== undefined;
    });
  }, [matrixData, matrixMeasures, provider]);

  // Calculate average percentile for the provider (same logic as storyteller)
  const averagePercentile = useMemo(() => {
    if (!providerMeasures?.length) return null;

    const providerKey = provider.dhc;
    const providerData = matrixData[providerKey];
    
    if (!providerData) return null;

    // Get all measures that have percentile data for this provider
    const measuresWithPercentiles = providerMeasures
      .map(measure => {
        const measureData = providerData[measure.code];
        return measureData?.percentile;
      })
      .filter(percentile => percentile !== null && percentile !== undefined);

    if (measuresWithPercentiles.length === 0) return null;

    // Calculate average percentile
    const totalPercentile = measuresWithPercentiles.reduce((sum, percentile) => sum + percentile, 0);
    return totalPercentile / measuresWithPercentiles.length;
  }, [matrixData, providerMeasures, provider]);



  if (!provider) {
    return <p>Loading provider data...</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <h2>{provider.name}</h2>
          <p className={styles.type}>{provider.type}</p>
          {provider.network && <p className={styles.network}>{provider.network}</p>}
        </div>

        <div className={styles.profileDetails}>
          <div>
            <label>Address</label>
            <p>
              {provider.street},<br />
              {provider.city}, {provider.state} {provider.zip}
            </p>
          </div>

          <div>
            <label>Phone</label>
            <p>{provider.phone || '—'}</p>
          </div>
        </div>
      </div>

      {/* Quality Performance Section */}
      {matrixLoading ? (
        <div className={styles.metricsCard}>
          <div className={styles.metricsHeader}>
            <Award size={20} />
            <h3>Quality Performance</h3>
          </div>
          <div className={styles.loading}>Loading quality measures...</div>
        </div>
      ) : matrixError ? (
        <div className={styles.metricsCard}>
          <div className={styles.metricsHeader}>
            <Award size={20} />
            <h3>Quality Performance</h3>
          </div>
          <div className={styles.error}>Unable to load quality measures data</div>
        </div>
      ) : averagePercentile !== null ? (
        <div className={styles.metricsCard}>
          <div className={styles.metricsHeader}>
            <Award size={20} />
            <h3>Quality Performance</h3>
          </div>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <div className={styles.metricLabel}>Average Percentile</div>
              <div className={styles.metricValue}>
                {Math.round(averagePercentile * 100)}%
              </div>
              <div className={styles.metricDescription}>
                Across {providerMeasures.length} quality measures
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Procedures Section - Temporarily disabled due to API issues */}
      {false && proceduresData.loading ? (
        <div className={styles.metricsCard}>
          <div className={styles.metricsHeader}>
            <Activity size={20} />
            <h3>Procedures</h3>
          </div>
          <div className={styles.loading}>Loading procedures data...</div>
        </div>
      ) : false && proceduresData.error ? (
        <div className={styles.metricsCard}>
          <div className={styles.metricsHeader}>
            <Activity size={20} />
            <h3>Procedures</h3>
          </div>
          <div className={styles.error}>Unable to load procedures data</div>
        </div>
      ) : false && proceduresData.totalProcedures > 0 ? (
        <div className={styles.metricsCard}>
          <div className={styles.metricsHeader}>
            <Activity size={20} />
            <h3>Procedures</h3>
          </div>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <div className={styles.metricLabel}>Total Procedures</div>
              <div className={styles.metricValue}>
                {proceduresData.totalProcedures.toLocaleString()}
              </div>
              <div className={styles.metricDescription}>
                Last 12 months as billing provider
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
