import { useState, useMemo, useRef, useEffect } from "react";
import { useProviderAnalysis } from "../../../../components/Context/ProviderAnalysisContext";
import { useUserTeam } from "../../../../hooks/useUserTeam";
import { apiUrl } from "../../../../utils/api";
import styles from "./CensusDataPanel.module.css";
import React from 'react';
import Spinner from "../../../../components/Buttons/Spinner";
import { Lock } from 'lucide-react';

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

const useProviderAnalysisOptional = () => {
  try {
    return useProviderAnalysis();
  } catch (err) {
    if (err?.message?.includes('useProviderAnalysis must be used within a ProviderAnalysisProvider')) {
      return null;
    }
    throw err;
  }
};

const CensusDataPanel = React.memo(({ provider, radiusInMiles, censusData: propCensusData, counties: propCounties, censusTracts: propCensusTracts }) => {
  const contextData = useProviderAnalysisOptional();

  const hasPropCensusData = typeof propCensusData !== 'undefined';
  const hasPropCounties = typeof propCounties !== 'undefined';
  const hasPropCensusTracts = typeof propCensusTracts !== 'undefined';

  const data = hasPropCensusData ? propCensusData : contextData?.censusData;
  const loading = hasPropCensusData ? false : contextData?.censusLoading || false;
  const error = hasPropCensusData ? null : contextData?.censusError || null;
  const { hasTeam, loading: teamLoading } = useUserTeam();
  const [selectedBenchmark, setSelectedBenchmark] = useState('national');
  const [countyNames, setCountyNames] = useState({});
  const geography = data?.geography === 'zip' ? 'zip' : 'tract';
  const unitLabel = geography === 'zip' ? 'ZIP codes' : 'census tracts';
  const unitCount = geography === 'zip'
    ? (data?.market_totals?.total_zip_codes ?? data?.market_totals?.total_tracts ?? 0)
    : (data?.market_totals?.total_tracts ?? 0);

  // State and county name mappings
  const stateNames = {
    '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas', '06': 'California',
    '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware', '11': 'District of Columbia',
    '12': 'Florida', '13': 'Georgia', '15': 'Hawaii', '16': 'Idaho', '17': 'Illinois',
    '18': 'Indiana', '19': 'Iowa', '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana',
    '23': 'Maine', '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
    '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska', '32': 'Nevada',
    '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico', '36': 'New York',
    '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio', '40': 'Oklahoma',
    '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island', '45': 'South Carolina',
    '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas', '49': 'Utah', '50': 'Vermont',
    '51': 'Virginia', '53': 'Washington', '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming'
  };

  // Use county names from API response if available, otherwise fetch them
  React.useEffect(() => {
    if (data && !countyNames.loaded) {
      // First, check if county names are included in the API response
      if (data.county_names && Object.keys(data.county_names).length > 0) {
        console.log('✅ Using county names from API response');
        setCountyNames(prev => ({ ...prev, ...data.county_names, loaded: true }));
        return;
      }
      
      // Fallback: fetch county names via API if not in response
      const countiesInMarket = getAvailableCounties();
      console.log('Fetching county names for counties in market:', countiesInMarket);
      
      if (countiesInMarket.length === 0) {
        setCountyNames(prev => ({ ...prev, loaded: true }));
        return;
      }
      
      // Group counties by state and fetch only the ones we need
      const countiesByState = {};
      countiesInMarket.forEach(countyKey => {
        const [stateFips, countyFips] = countyKey.split('-');
        if (!countiesByState[stateFips]) {
          countiesByState[stateFips] = [];
        }
        countiesByState[stateFips].push(countyFips);
      });
      
      // Fetch county names for each state, but only for the counties we need
      Object.keys(countiesByState).forEach(stateFips => {
        if (!countyNames[stateFips]) {
          fetchCountyNames(stateFips, countiesByState[stateFips]);
        }
      });
      setCountyNames(prev => ({ ...prev, loaded: true }));
    }
  }, [data, countyNames]);



  // Memoize data processing to prevent unnecessary recalculations
  const processedData = useMemo(() => {
    if (!data?.market_totals) return null;

    const { market_totals } = data;

    // Age group data - ordered by age
    const agePieData = [
      { name: 'Under 18', value: market_totals.population_under_18 || 0 },
      { name: '18-64', value: Math.max(0, (market_totals.total_population || 0) - (market_totals.population_65_plus || 0) - (market_totals.population_under_18 || 0)) },
      { name: '65+', value: market_totals.population_65_plus || 0 },
    ];
    const agePieColors = ['#8884d8', '#82ca9d', '#ffc658'];

    // Race/ethnicity data - ordered by count descending
    const racePieData = [
      { name: 'White', value: market_totals.white || 0 },
      { name: 'Black', value: market_totals.black || 0 },
      { name: 'Asian', value: market_totals.asian || 0 },
      { name: 'Hispanic/Latino', value: market_totals.hispanic || 0 },
      { name: 'Some Other Race', value: market_totals.some_other_race || 0 },
      { name: 'Two or More Races', value: market_totals.two_or_more || 0 },
      { name: 'Native American', value: market_totals.native_american || 0 },
      { name: 'Pacific Islander', value: market_totals.pacific_islander || 0 },
    ].sort((a, b) => b.value - a.value);
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
        <div className={styles.header}>
          <h2>Market Demographics</h2>
          <p className={styles.subtitle}>Select a provider to view comprehensive market analysis</p>
        </div>
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
        <div className={styles.header}>
          <h2>Market Demographics</h2>
        </div>
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
        <div className={styles.header}>
          <h2>Market Demographics</h2>
        </div>
        <p className={styles.noData}>No census data available for this market</p>
      </div>
    );
  }

  const { market_totals, agePieData, agePieColors, racePieData, racePieColors, populationDensity } = processedData;

  // Helper function to get current benchmark data
  function getCurrentBenchmark() {
    if (!data) return null;
    
    if (selectedBenchmark === 'national') {
      return data.national_averages;
    } else if (selectedBenchmark.startsWith('state-')) {
      const stateFips = selectedBenchmark.replace('state-', '');
      return data.state_averages ? data.state_averages[stateFips] : null;
    } else if (selectedBenchmark.startsWith('county-')) {
      const [stateFips, countyFips] = selectedBenchmark.replace('county-', '').split('-');
      const countyKey = `${stateFips}-${countyFips}`;
      return data.county_averages ? data.county_averages[countyKey] : null;
    }
    
    return data.national_averages;
  }

  // Get available states and counties
  function getAvailableStates() {
    if (!data?.state_averages) return [];
    return Object.keys(data.state_averages);
  }

  function getAvailableCounties() {
    if (!data?.county_averages) return [];
    return Object.keys(data.county_averages);
  }

  // Get display name for selected benchmark (without indentation)
  function getSelectedBenchmarkDisplay() {
    if (selectedBenchmark === 'national') {
      return 'National';
    } else if (selectedBenchmark.startsWith('state-')) {
      const stateFips = selectedBenchmark.replace('state-', '');
      return stateNames[stateFips] || `State ${stateFips}`;
    } else if (selectedBenchmark.startsWith('county-')) {
      const [stateFips, countyFips] = selectedBenchmark.replace('county-', '').split('-');
      return getCountyName(stateFips, countyFips);
    }
    return 'National';
  }

  // Build hierarchical dropdown options
  function buildBenchmarkOptions() {
    const options = [];
    
    // Add National option
    options.push(
      <option key="national" value="national">
        National
      </option>
    );
    
    // Group counties by state
    const countiesByState = {};
    const availableCounties = getAvailableCounties();
    
    availableCounties.forEach(countyKey => {
      const [stateFips, countyFips] = countyKey.split('-');
      if (!countiesByState[stateFips]) {
        countiesByState[stateFips] = [];
      }
      countiesByState[stateFips].push({ key: countyKey, fips: countyFips });
    });
    
    // Add states and their counties
    Object.keys(countiesByState).forEach(stateFips => {
      const stateName = stateNames[stateFips] || `State ${stateFips}`;
      
      // Add state option
      options.push(
        <option key={`state-${stateFips}`} value={`state-${stateFips}`}>
          {stateName}
        </option>
      );
      
      // Add county options (indented)
      countiesByState[stateFips].forEach(county => {
        const countyName = getCountyName(stateFips, county.fips);
        options.push(
          <option key={`county-${county.key}`} value={`county-${county.key}`}>
            &nbsp;&nbsp;&nbsp;&nbsp;{countyName}
          </option>
        );
      });
    });
    
    return options;
  }

  // Create a custom display component that shows clean names
  const BenchmarkDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className={styles.customDropdown} ref={dropdownRef}>
        <div 
          className={styles.dropdownTrigger}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{getSelectedBenchmarkDisplay()}</span>
          <span className={styles.dropdownArrow}>▼</span>
        </div>
        {isOpen && (
          <div className={styles.dropdownMenu}>
            <div 
              className={styles.dropdownItem}
              onClick={() => {
                setSelectedBenchmark('national');
                setIsOpen(false);
              }}
            >
              National
            </div>
            {buildBenchmarkOptions().slice(1).map(option => (
              <div 
                key={option.key}
                className={styles.dropdownItem}
                onClick={() => {
                  setSelectedBenchmark(option.props.value);
                  setIsOpen(false);
                }}
              >
                {option.props.children}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Function to get county names for a state (only for specific counties)
  async function fetchCountyNames(stateFips, specificCounties = null) {
    if (countyNames[stateFips]) return; // Already cached
    
    try {
      if (specificCounties && specificCounties.length > 0) {
        console.log(`🔍 Fetching county names for state ${stateFips}, counties:`, specificCounties);
        // Fetch only specific counties
        const countyParams = specificCounties.map(county => `countyFips=${county}`).join('&');
        const response = await fetch(apiUrl(`/api/census-data/county-names?stateFips=${stateFips}&${countyParams}`));
        if (!response.ok) {
          console.error(`Failed to fetch county names for state ${stateFips}: ${response.status} ${response.statusText}`);
          return;
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error(`Invalid response type for county names: ${contentType}`);
          const responseText = await response.text();
          console.error('Response text:', responseText.substring(0, 500));
          return;
        }
        
        const result = await response.json();
        if (result.success) {
          console.log(`✅ Setting county names for state ${stateFips}:`, result.data);
          setCountyNames(prev => ({
            ...prev,
            [stateFips]: result.data
          }));
        } else {
          console.error('Error fetching county names:', result.error);
        }
      } else {
        console.log(`🔍 No specific counties requested for state ${stateFips}`);
      }
    } catch (error) {
      console.error('Error fetching county names:', error);
      // Don't throw the error, just log it and continue
    }
  }

  // Helper function to get county name from state and county FIPS codes
  function getCountyName(stateFips, countyFips) {
    if (!stateFips || !countyFips) return `County ${countyFips || 'Unknown'}`;
    
    // Normalize county FIPS to 3 digits
    const normalizedCountyFips = String(countyFips).padStart(3, '0');
    const fullCountyFips = `${String(stateFips).padStart(2, '0')}${normalizedCountyFips}`;
    
    // Try to get county name from cache
    const countyName = countyNames[stateFips]?.[fullCountyFips];
    if (countyName) {
      return countyName;
    }
    
    // Fallback: try without leading zeros in case format differs
    const countyFipsNum = parseInt(countyFips, 10);
    if (!isNaN(countyFipsNum)) {
      const altFullCountyFips = `${String(stateFips).padStart(2, '0')}${String(countyFipsNum).padStart(3, '0')}`;
      const altCountyName = countyNames[stateFips]?.[altFullCountyFips];
      if (altCountyName) {
        return altCountyName;
      }
    }
    
    // Last resort: return formatted county code
    return `County ${normalizedCountyFips}`;
  }

  const currentBenchmark = getCurrentBenchmark();

  // Helper function to get benchmark type for indicator
  const getBenchmarkType = () => {
    if (selectedBenchmark === 'national') {
      return 'national';
    } else if (selectedBenchmark.startsWith('state-')) {
      return 'state';
    } else if (selectedBenchmark.startsWith('county-')) {
      return 'county';
    }
    return 'national';
  };

  // Helper function to render benchmark average with indicator
  const renderBenchmarkAverage = (value, formatter = formatCurrency) => {
    if (!value) return null;
    
    return (
      <span 
        key={`${selectedBenchmark}-${value}`} 
        className={styles.benchmarkAverage}
      >
        {formatter(value)}
      </span>
    );
  };

  // Check if user has team access
  if (!hasTeam && !teamLoading) {
    return (
      <div className={styles.teamRequiredState}>
        <Lock size={48} className={styles.teamRequiredIcon} />
        <h3>Team Required</h3>
        <p>Join or create a team to access population demographics analysis.</p>
        <div className={styles.teamRequiredActions}>
          <button 
            className={styles.teamRequiredButton}
            onClick={() => window.location.href = '/app/settings/company'}
          >
            Create a Team
          </button>
          <button 
            className={`${styles.teamRequiredButton} ${styles.outline}`}
            onClick={() => window.location.href = '/app/settings/company'}
          >
            Join a Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h2>Market Demographics</h2>
          <p className={styles.subtitle}>
            {unitCount} {unitLabel} • {unitLabel === 'census tracts' ? 'Census tracts are small, permanent statistical subdivisions of counties averaging 4,000 residents' : 'ZIP Code Tabulation Areas approximate USPS ZIP codes for statistical purposes'}
          </p>
        </div>

        <div className={styles.headerStats}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{formatNumber(market_totals.total_population)}</div>
            <div className={styles.statLabel}>Total Population</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{formatNumber(market_totals.population_65_plus || 0)}</div>
            <div className={styles.statLabel}>65+ Population ({(market_totals.population_65_plus / market_totals.total_population * 100).toFixed(1)}%)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{populationDensity}</div>
            <div className={styles.statLabel}>Population Density</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column - Key Metrics */}
        <div className={styles.leftColumn}>
          {/* Benchmark Selection */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Benchmark Comparison</h3>
                        <div className={styles.benchmarkControls}>
              <div className={styles.benchmarkRow}>
                <label>Compare to:</label>
                <BenchmarkDropdown />
              </div>
            </div>
          </div>

          {/* Economic Indicators */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Economic Profile</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>Median Income</span>
                  {currentBenchmark && (
                    <span className={styles.nationalAverage}>
                      {renderBenchmarkAverage(currentBenchmark.median_income)}
                    </span>
                  )}
                </div>
                <div className={styles.metricValue}>{formatCurrency(market_totals.median_income)}</div>
              </div>
              
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>Per Capita Income</span>
                  {currentBenchmark && (
                    <span className={styles.nationalAverage}>
                      {renderBenchmarkAverage(currentBenchmark.per_capita_income)}
                    </span>
                  )}
                </div>
                <div className={styles.metricValue}>{formatCurrency(market_totals.per_capita_income)}</div>
              </div>
              
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>Poverty Rate</span>
                  {currentBenchmark && (
                    <span className={styles.nationalAverage}>
                      {renderBenchmarkAverage(currentBenchmark.poverty_rate, formatPercent)}
                    </span>
                  )}
                </div>
                <div className={styles.metricValue}>{formatPercent(market_totals.poverty_rate)}</div>
              </div>
            </div>
          </div>

          {/* Housing & Cost of Living */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Housing & Cost of Living</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>Median Rent</span>
                  {currentBenchmark && (
                    <span className={styles.nationalAverage}>
                      {renderBenchmarkAverage(currentBenchmark.median_rent)}
                    </span>
                  )}
                </div>
                <div className={styles.metricValue}>{formatCurrency(market_totals.median_rent)}</div>
              </div>
              
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>Median Home Value</span>
                  {currentBenchmark && (
                    <span className={styles.nationalAverage}>
                      {renderBenchmarkAverage(currentBenchmark.median_home_value)}
                    </span>
                  )}
                </div>
                <div className={styles.metricValue}>{formatCurrency(market_totals.median_home_value)}</div>
              </div>
            </div>
          </div>

          {/* Health & Insurance */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Health & Insurance</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>Uninsured Rate</span>
                  {currentBenchmark && (
                    <span className={styles.nationalAverage}>
                      {renderBenchmarkAverage(currentBenchmark.uninsured_rate, formatPercent)}
                    </span>
                  )}
                </div>
                <div className={styles.metricValue}>{formatPercent(market_totals.uninsured_rate)}</div>
              </div>
              
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>Disability Rate</span>
                  {currentBenchmark && (
                    <span className={styles.nationalAverage}>
                      {renderBenchmarkAverage(currentBenchmark.disability_rate, formatPercent)}
                    </span>
                  )}
                </div>
                <div className={styles.metricValue}>{formatPercent(market_totals.disability_rate)}</div>
              </div>
            </div>
          </div>

          {/* Education */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Education</h3>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>Bachelor's+ Rate</span>
                  {currentBenchmark && (
                    <span className={styles.nationalAverage}>
                      {renderBenchmarkAverage(currentBenchmark.bachelors_plus_rate, formatPercent)}
                    </span>
                  )}
                </div>
                <div className={styles.metricValue}>{formatPercent(market_totals.bachelors_plus_rate)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Demographics */}
        <div className={styles.rightColumn}>
          {/* Age Distribution */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Age Distribution</h3>
            <div className={styles.demographicsCard}>
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
          </div>
          
          {/* Race & Ethnicity Distribution */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Race & Ethnicity</h3>
            <div className={styles.demographicsCard}>
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
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.source}>
            Source: U.S. Census Bureau American Community Survey ({market_totals.acs_year} 5-Year Estimates)
          </p>
          <p className={styles.note}>
            Data represents {unitLabel.toLowerCase()} within {radiusInMiles} miles of {provider.name}
          </p>
        </div>
      </div>
    </div>
  );
});

CensusDataPanel.displayName = 'CensusDataPanel';

export default CensusDataPanel; 