import { useState } from "react";
import useCensusData, { useAvailableCensusYears } from "../hooks/useCensusData";
import Spinner from "./Buttons/Spinner";
import styles from "./CensusDataPanel.module.css";
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import React from 'react';

// Custom legend for pie charts
function CustomPieLegend({ payload }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginTop: 12 }}>
      {payload.map((entry, idx) => (
        <span key={entry.value} style={{ display: 'flex', alignItems: 'center', fontSize: 14, marginRight: 12 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: entry.color, marginRight: 6, border: '1px solid #ccc' }} />
          <span style={{ color: '#444' }}>{entry.value}</span>
        </span>
      ))}
    </div>
  );
}

export default function CensusDataPanel({ provider, radiusInMiles }) {
  // Hardcode year to 2022
  const year = '2022';
  const { data, loading, error } = useCensusData(provider, radiusInMiles, year);

  if (!provider?.latitude || !provider?.longitude) {
    return (
      <div className={styles.container}>
        <h3>Market Demographics</h3>
        <p className={styles.noData}>Select a provider to view market demographics</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h3>Market Demographics</h3>
        <div className={styles.loading}>
          <Spinner size="small" />
          <span>Loading census data...</span>
        </div>
      </div>
    );
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

  if (!data) {
    return (
      <div className={styles.container}>
        <h3>Market Demographics</h3>
        <p className={styles.noData}>No census data available for this market</p>
      </div>
    );
  }

  const { market_totals, geographic_units } = data;

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

  // Age group pie chart data
  const agePieData = [
    { name: '65+', value: market_totals.population_65_plus || 0 },
    { name: 'Under 18', value: market_totals.population_under_18 || 0 },
    { name: '18-64', value: Math.max(0, (market_totals.total_population || 0) - (market_totals.population_65_plus || 0) - (market_totals.population_under_18 || 0)) },
  ];
  const agePieColors = ['#8884d8', '#82ca9d', '#ffc658'];

  // Race/ethnicity pie chart data
  const racePieData = [
    { name: 'White', value: market_totals.white || 0 },
    { name: 'Black', value: market_totals.black || 0 },
    { name: 'Asian', value: market_totals.asian || 0 },
    { name: 'Hispanic/Latino', value: market_totals.hispanic || 0 },
    { name: 'Other', value: Math.max(0, (market_totals.total_population || 0) - (market_totals.white || 0) - (market_totals.black || 0) - (market_totals.asian || 0) - (market_totals.hispanic || 0)) },
  ];
  const racePieColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Market Demographics</h3>
      </div>

      {/* Top row: Total Population and Geographic Units */}
      <div className={styles.topRow}>
        <div className={styles.summaryItem}>
          <label>Total Population</label>
          <span className={styles.value}>{formatNumber(market_totals.total_population)}</span>
        </div>
        <div className={styles.summaryItem}>
          <label>Geographic Units (Tracts)</label>
          <span className={styles.value}>{market_totals.total_tracts}</span>
        </div>
      </div>

      {/* Second row: Pie charts side by side */}
      <div className={styles.pieRow}>
        <div className={styles.chartSection}>
          <h5>Age Distribution</h5>
          <div className={styles.chartRow}>
            <PieChart width={Math.min(400, window.innerWidth * 0.4)} height={260} style={{ minWidth: 260, maxWidth: 400 }}>
              <Pie
                data={agePieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={80}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {agePieData.map((entry, idx) => (
                  <Cell key={`cell-age-${idx}`} fill={agePieColors[idx % agePieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend content={CustomPieLegend} layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </div>
        </div>
        <div className={styles.chartSection}>
          <h5>Race & Ethnicity Distribution</h5>
          <div className={styles.chartRow}>
            <PieChart width={Math.min(400, window.innerWidth * 0.4)} height={260} style={{ minWidth: 260, maxWidth: 400 }}>
              <Pie
                data={racePieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                outerRadius={80}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              >
                {racePieData.map((entry, idx) => (
                  <Cell key={`cell-race-${idx}`} fill={racePieColors[idx % racePieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend content={CustomPieLegend} layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </div>
        </div>
      </div>

      {/* Economics */}
      <h4>Economics</h4>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}><label>Median Income</label><span className={styles.value}>{formatCurrency(market_totals.median_income)}</span></div>
        <div className={styles.summaryItem}><label>Per Capita Income</label><span className={styles.value}>{formatCurrency(market_totals.per_capita_income)}</span></div>
        <div className={styles.summaryItem}><label>Poverty Rate</label><span className={styles.value}>{formatPercent(market_totals.poverty_rate)}</span></div>
      </div>

      {/* Housing & Cost of Living */}
      <h4>Housing & Cost of Living</h4>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}><label>Median Rent</label><span className={styles.value}>{formatCurrency(market_totals.median_rent)}</span></div>
        <div className={styles.summaryItem}><label>Median Home Value</label><span className={styles.value}>{formatCurrency(market_totals.median_home_value)}</span></div>
      </div>

      {/* Health & Insurance */}
      <h4>Health & Insurance</h4>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}><label>Uninsured Rate</label><span className={styles.value}>{formatPercent(market_totals.uninsured_rate)}</span></div>
        <div className={styles.summaryItem}><label>Disability Rate</label><span className={styles.value}>{formatPercent(market_totals.disability_rate)}</span></div>
      </div>

      {/* Education */}
      <h4>Education</h4>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}><label>Bachelor's+ Rate</label><span className={styles.value}>{formatPercent(market_totals.bachelors_plus_rate)}</span></div>
      </div>

      {geographic_units.length > 0 && (
        <div className={styles.details}>
          <h4>Geographic Breakdown</h4>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tract</th>
                  <th>Population</th>
                  <th>65+</th>
                  <th>Median Income</th>
                </tr>
              </thead>
              <tbody>
                {geographic_units.slice(0, 10).map((unit, index) => (
                  <tr key={index}>
                    <td>{unit.tract_name} ({unit.county_name})</td>
                    <td>{formatNumber(unit.total_pop)}</td>
                    <td>{formatNumber(unit.pop_65_plus)}</td>
                    <td>{formatCurrency(unit.median_income)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {geographic_units.length > 10 && (
              <p className={styles.moreNote}>
                Showing top 10 of {geographic_units.length} tracts
              </p>
            )}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <p className={styles.source}>
          Source: U.S. Census Bureau American Community Survey (2022 5-Year Estimates)
        </p>
        <p className={styles.note}>
          Data represents census tract-level demographics within {radiusInMiles} miles of {provider.name}
        </p>
      </div>
    </div>
  );
} 