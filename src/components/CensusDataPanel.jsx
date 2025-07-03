import { useState } from "react";
import useCensusData, { useAvailableCensusYears } from "../hooks/useCensusData";
import Spinner from "./Buttons/Spinner";
import styles from "./CensusDataPanel.module.css";

export default function CensusDataPanel({ provider, radiusInMiles }) {
  const [level, setLevel] = useState('tract');
  const [year, setYear] = useState('2021');
  
  const { data, loading, error } = useCensusData(provider, radiusInMiles, level, year);
  const { years: availableYears } = useAvailableCensusYears();

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Market Demographics</h3>
        <div className={styles.controls}>
          <select 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
            className={styles.select}
          >
            <option value="tract">Census Tract Level</option>
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            className={styles.select}
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y} ACS</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <label>Total Population</label>
            <span className={styles.value}>{formatNumber(market_totals.total_population)}</span>
          </div>
          <div className={styles.summaryItem}>
            <label>65+ Population</label>
            <span className={styles.value}>{formatNumber(market_totals.population_65_plus)}</span>
          </div>
          <div className={styles.summaryItem}>
            <label>Median Income</label>
            <span className={styles.value}>{formatCurrency(market_totals.median_income)}</span>
          </div>
          <div className={styles.summaryItem}>
            <label>Geographic Units</label>
            <span className={styles.value}>{market_totals.total_tracts}</span>
          </div>
        </div>
      </div>

      {geographic_units.length > 0 && (
        <div className={styles.details}>
          <h4>Geographic Breakdown</h4>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{level === 'county' ? 'County' : 'Tract'}</th>
                  <th>Population</th>
                  <th>65+</th>
                  <th>Median Income</th>
                  {level === 'county' && <th>Poverty Rate</th>}
                </tr>
              </thead>
              <tbody>
                {geographic_units.slice(0, 10).map((unit, index) => (
                  <tr key={index}>
                    <td>
                      {level === 'county' 
                        ? `${unit.county_name}, ${unit.state_name}`
                        : `${unit.tract_name} (${unit.county_name})`
                      }
                    </td>
                    <td>{formatNumber(unit.total_pop)}</td>
                    <td>{formatNumber(unit.pop_65_plus)}</td>
                    <td>{formatCurrency(unit.median_income)}</td>
                    {level === 'county' && (
                      <td>{formatPercent(unit.poverty_rate)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {geographic_units.length > 10 && (
              <p className={styles.moreNote}>
                Showing top 10 of {geographic_units.length} {level === 'county' ? 'counties' : 'tracts'}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <p className={styles.source}>
          Source: U.S. Census Bureau American Community Survey ({year} 5-Year Estimates)
        </p>
        <p className={styles.note}>
          Data represents {level}-level demographics within {radiusInMiles} miles of {provider.name}
        </p>
      </div>
    </div>
  );
} 