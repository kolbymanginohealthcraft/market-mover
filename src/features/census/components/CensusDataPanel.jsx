import React from 'react';
import { CensusHeader } from './CensusHeader';
import { CensusMetrics } from './CensusMetrics';
import { CensusDemographics } from './CensusDemographics';
import { CensusFooter } from './CensusFooter';
import { useCensusData } from '../../hooks/useCensusData';
import { useCensusFormatters } from '../../hooks/useCensusFormatters';
import { useCensusBenchmarks } from '../../hooks/useCensusBenchmarks';
import styles from './CensusDataPanel.module.css';

const CensusDataPanel = React.memo(({ provider, radiusInMiles }) => {
  const year = '2023';
  const { data, loading, error } = useCensusData(provider, radiusInMiles, year);
  const { formatNumber, formatCurrency, formatPercent } = useCensusFormatters();
  const { 
    selectedBenchmark, 
    setSelectedBenchmark, 
    currentBenchmark,
    benchmarkOptions 
  } = useCensusBenchmarks(data);

  if (loading) return <div className={styles.loading}>Loading census data...</div>;
  if (error) return <div className={styles.error}>Error loading census data</div>;
  if (!data?.market_totals) return null;

  const { market_totals } = data;

  return (
    <div className={styles.container}>
      <CensusHeader 
        marketTotals={market_totals}
        formatNumber={formatNumber}
        radiusInMiles={radiusInMiles}
        provider={provider}
      />
      
      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <CensusMetrics 
            marketTotals={market_totals}
            currentBenchmark={currentBenchmark}
            selectedBenchmark={selectedBenchmark}
            setSelectedBenchmark={setSelectedBenchmark}
            benchmarkOptions={benchmarkOptions}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </div>
        
        <div className={styles.rightColumn}>
          <CensusDemographics 
            marketTotals={market_totals}
            formatNumber={formatNumber}
          />
        </div>
      </div>
      
      <CensusFooter 
        marketTotals={market_totals}
        radiusInMiles={radiusInMiles}
        provider={provider}
      />
    </div>
  );
});

CensusDataPanel.displayName = 'CensusDataPanel';

export default CensusDataPanel; 