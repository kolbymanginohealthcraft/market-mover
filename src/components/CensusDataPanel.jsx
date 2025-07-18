import { useState, useMemo } from "react";
import useCensusData, { useAvailableCensusYears } from "../hooks/useCensusData";
import styles from "./CensusDataPanel.module.css";
import React from 'react';
import Spinner from "./Buttons/Spinner";

// Memoized formatting functions to prevent unnecessary recalculations
const formatNumber = (num) => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat().format(Math.round(num));
};

const formatCurrency = (num) => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

const formatPercent = (num) => {
  if (num === null || num === undefined) return 'N/A';
  return `${(num * 100).toFixed(1)}%`;
};

const CensusDataPanel = React.memo(({ provider, radiusInMiles }) => {
  // Hardcode year to 2023
  const year = '2023';
  const { data, loading, error } = useCensusData(provider, radiusInMiles, year);

  // Memoize data processing to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    if (!data?.market_totals) return null;

    const { market_totals } = data;

    // Age group data
    const agePieData = [
      { name: '65+', value: market_totals.population_65_plus || 0 },
      { name: 'Under 18', value: market_totals.population_under_18 || 0 },
      { name: '18-64', value: Math.max(0, (market_totals.total_population || 0) - (market_totals.population_65_plus || 0) - (market_totals.population_under_18 || 0)) },
    ];
    const agePieColors = ['#8884d8', '#82ca9d', '#ffc658'];

    // Race/ethnicity data
    const racePieData = [
      { name: 'White', value: market_totals.white || 0 },
      { name: 'Black', value: market_totals.black || 0 },
      { name: 'Native American', value: market_totals.native_american || 0 },
      { name: 'Asian', value: market_totals.asian || 0 },
      { name: 'Pacific Islander', value: market_totals.pacific_islander || 0 },
      { name: 'Some Other Race', value: market_totals.some_other_race || 0 },
      { name: 'Two or More Races', value: market_totals.two_or_more || 0 },
      { name: 'Hispanic/Latino', value: market_totals.hispanic || 0 },
    ];
    const racePieColors = ['#ff6b6b', '#4ecdc4', '#b8860b', '#45b7d1', '#feca57', '#a569bd', '#34495e', '#96ceb4'];

    // Calculate population density
    const landAreaSquareMiles = market_totals.total_land_area_meters ? 
      market_totals.total_land_area_meters / 2589988.11 : 0; // 1 sq mile = 2,589,988.11 sq meters
    const density = landAreaSquareMiles > 0 ? market_totals.total_population / landAreaSquareMiles : 0;
    const populationDensity = density ? `${Math.round(density).toLocaleString()}/mi²` : 'N/A';

    return {
      market_totals,
      agePieData,
      agePieColors,
      racePieData,
      racePieColors,
      populationDensity
    };
  }, [data]);

  if (!provider?.latitude || !provider?.longitude) {
    return (
      <div className={styles.container}>
        <h3>Market Demographics</h3>
        <p className={styles.noData}>Select a provider to view market demographics</p>
      </div>
    );
  }

  // Show loading state if we're loading OR if we don't have data yet
  if (loading || !data) {
    return <Spinner message="Loading census data..." />;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h3>Market Demographics</h3>
        <div className={styles.error}>
          <p>❌ Error loading census data: {error}</p>
          <p className={styles.errorNote}>
            Note: Census data requires access to BigQuery public datasets
          </p>
        </div>
      </div>
    );
  }

  // Only show "no data" if we have data but it's empty
  if (!processedData || !processedData.market_totals || processedData.market_totals.total_population === 0) {
    return (
      <div className={styles.container}>
        <h3>Market Demographics</h3>
        <p className={styles.noData}>No census data available for this market</p>
      </div>
    );
  }

  const { market_totals, agePieData, agePieColors, racePieData, racePieColors, populationDensity } = processedData;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Market Demographics</h3>
      </div>

      {/* Top row: Total Population, Geographic Units, and Population Density */}
      <div className={styles.topRow}>
        <div className={styles.summaryItem}>
          <label>Total Population</label>
          <span className={styles.value}>{formatNumber(market_totals.total_population)}</span>
        </div>
        <div className={styles.summaryItem}>
          <label>Geographic Units (Tracts)</label>
          <span className={styles.value}>{market_totals.total_tracts}</span>
        </div>
        <div className={styles.summaryItem}>
          <label>Population Density</label>
          <span className={styles.value}>{populationDensity}</span>
        </div>
      </div>

      {/* Economics */}
      <h4>Economics</h4>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <label>Median Income</label>
          <span className={styles.value}>{formatCurrency(market_totals.median_income)}</span>
          {data.national_averages && (
            <span className={styles.nationalAverage}>US: {formatCurrency(data.national_averages.median_income)}</span>
          )}
        </div>
        <div className={styles.summaryItem}>
          <label>Per Capita Income</label>
          <span className={styles.value}>{formatCurrency(market_totals.per_capita_income)}</span>
          {data.national_averages && (
            <span className={styles.nationalAverage}>US: {formatCurrency(data.national_averages.per_capita_income)}</span>
          )}
        </div>
        <div className={styles.summaryItem}>
          <label>Poverty Rate</label>
          <span className={styles.value}>{formatPercent(market_totals.poverty_rate)}</span>
          {data.national_averages && (
            <span className={styles.nationalAverage}>US: {formatPercent(data.national_averages.poverty_rate)}</span>
          )}
        </div>
      </div>

      {/* Housing & Cost of Living */}
      <h4>Housing & Cost of Living</h4>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <label>Median Rent</label>
          <span className={styles.value}>{formatCurrency(market_totals.median_rent)}</span>
          {data.national_averages && (
            <span className={styles.nationalAverage}>US: {formatCurrency(data.national_averages.median_rent)}</span>
          )}
        </div>
        <div className={styles.summaryItem}>
          <label>Median Home Value</label>
          <span className={styles.value}>{formatCurrency(market_totals.median_home_value)}</span>
          {data.national_averages && (
            <span className={styles.nationalAverage}>US: {formatCurrency(data.national_averages.median_home_value)}</span>
          )}
        </div>
      </div>

      {/* Health & Insurance */}
      <h4>Health & Insurance</h4>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <label>Uninsured Rate</label>
          <span className={styles.value}>{formatPercent(market_totals.uninsured_rate)}</span>
          {data.national_averages && (
            <span className={styles.nationalAverage}>US: {formatPercent(data.national_averages.uninsured_rate)}</span>
          )}
        </div>
        <div className={styles.summaryItem}>
          <label>Disability Rate</label>
          <span className={styles.value}>{formatPercent(market_totals.disability_rate)}</span>
          {data.national_averages && (
            <span className={styles.nationalAverage}>US: {formatPercent(data.national_averages.disability_rate)}</span>
          )}
        </div>
      </div>

      {/* Education */}
      <h4>Education</h4>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <label>Bachelor's+ Rate</label>
          <span className={styles.value}>{formatPercent(market_totals.bachelors_plus_rate)}</span>
          {data.national_averages && (
            <span className={styles.nationalAverage}>US: {formatPercent(data.national_averages.bachelors_plus_rate)}</span>
          )}
        </div>
      </div>

      {/* Demographics Section */}
      <div className={styles.demographicsSection}>
        <div className={styles.demographicsGrid}>
          <div className={styles.demographicsCard}>
            <h5>Age Distribution</h5>
            <div className={styles.demographicsList}>
              {agePieData.map((item, idx) => (
                <div key={item.name} className={styles.demographicsItem}>
                  <div className={styles.demographicsBar}>
                    <div 
                      className={styles.demographicsBarFill} 
                      style={{ 
                        width: `${(item.value / market_totals.total_population) * 100}%`,
                        backgroundColor: agePieColors[idx % agePieColors.length]
                      }}
                    ></div>
                  </div>
                  <div className={styles.demographicsLabel}>
                    <span className={styles.demographicsName}>{item.name}</span>
                    <span className={styles.demographicsValue}>
                      {formatNumber(item.value)} ({((item.value / market_totals.total_population) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.demographicsCard}>
            <h5>Race & Ethnicity Distribution</h5>
            <div className={styles.demographicsList}>
              {racePieData.map((item, idx) => (
                <div key={item.name} className={styles.demographicsItem}>
                  <div className={styles.demographicsBar}>
                    <div 
                      className={styles.demographicsBarFill} 
                      style={{ 
                        width: `${(item.value / market_totals.total_population) * 100}%`,
                        backgroundColor: racePieColors[idx % racePieColors.length]
                      }}
                    ></div>
                  </div>
                  <div className={styles.demographicsLabel}>
                    <span className={styles.demographicsName}>{item.name}</span>
                    <span className={styles.demographicsValue}>
                      {formatNumber(item.value)} ({((item.value / market_totals.total_population) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p className={styles.source}>
          Source: U.S. Census Bureau American Community Survey ({market_totals.acs_year} 5-Year Estimates)
        </p>
        <p className={styles.note}>
          Data represents census tract-level demographics within {radiusInMiles} miles of {provider.name}
        </p>
      </div>
    </div>
  );
});

CensusDataPanel.displayName = 'CensusDataPanel';

export default CensusDataPanel; 