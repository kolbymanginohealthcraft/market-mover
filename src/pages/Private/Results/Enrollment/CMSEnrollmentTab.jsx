import React, { useState, useMemo, useEffect } from 'react';
import styles from "./CMSEnrollmentTab.module.css";
import CMSEnrollmentPanel from "./CMSEnrollmentPanel";
import CMSEnrollmentTrendChart from "./CMSEnrollmentTrendChart";
import MAEnrollmentPanel from "./MAEnrollmentPanel";
import MAEnrollmentTrendChart from "./MAEnrollmentTrendChart";
import useCMSEnrollmentData from "../../../../hooks/useCMSEnrollmentData";
import { useCMSEnrollmentDataByLevel, useCMSEnrollmentYears } from "../../../../hooks/useCMSEnrollmentData";
import useMAEnrollmentData, { useMAEnrollmentTrendData } from "../../../../hooks/useMAEnrollmentData";
import { apiUrl } from "../../../../utils/api";
import ButtonGroup from "../../../../components/Buttons/ButtonGroup";
import Button from "../../../../components/Buttons/Button";

export default function CMSEnrollmentTab({ provider, radiusInMiles }) {
  const [selectedView, setSelectedView] = useState('overview'); // 'overview', 'trends', 'demographics', 'payers'
  const [selectedTimeframe, setSelectedTimeframe] = useState('latest'); // 'latest', 'monthly', 'yearly'
  const [selectedMetric, setSelectedMetric] = useState('ma_and_other');
  const [selectedBenchmark, setSelectedBenchmark] = useState('national'); // 'national', 'state-XX', 'county-XXXXX'
  const [showBenchmarkDropdown, setShowBenchmarkDropdown] = useState(false);
  
  // MA Enrollment state
  const [publishDates, setPublishDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [errorDates, setErrorDates] = useState(null);
  const [selectedType, setSelectedType] = useState("MA");
  
  // Fetch CMS enrollment data
  const { data, loading, error, latestMonth, months } = useCMSEnrollmentData(provider, radiusInMiles);
  
  // Fetch available years
  const { data: availableYears } = useCMSEnrollmentYears();
  
  // Get the latest year for benchmarks
  const latestYear = availableYears && availableYears.length > 0 ? availableYears[0] : '2023';

  // Fetch MA enrollment dates
  useEffect(() => {
    async function fetchDates() {
      setLoadingDates(true);
      setErrorDates(null);
      try {
        const resp = await fetch(apiUrl('/api/ma-enrollment-dates'));
        if (!resp.ok) throw new Error('Failed to fetch publish dates');
        const result = await resp.json();
        if (!result.success) throw new Error(result.error || 'Failed to fetch publish dates');
        setPublishDates(result.data || []);
      } catch (err) {
        setErrorDates(err.message);
        setPublishDates([]);
      } finally {
        setLoadingDates(false);
      }
    }
    fetchDates();
  }, []);

  // MA Enrollment data
  const publishDate = publishDates[publishDates.length - 1];
  const startDate = publishDates[0];
  const endDate = publishDate;
  const { data: maData, loading: maLoading, error: maError } = useMAEnrollmentData(provider, radiusInMiles, publishDate, selectedType);
  const { data: maTrendData, loading: maTrendLoading, error: maTrendError } = useMAEnrollmentTrendData(provider, radiusInMiles, startDate, endDate, selectedType);
  
  // Helper functions for benchmark data
  const getBenchmarkLevel = () => {
    if (selectedBenchmark === 'national') return 'national';
    if (selectedBenchmark.startsWith('state-')) return 'state';
    if (selectedBenchmark.startsWith('county-')) return 'county';
    return 'national';
  };
  
  const getBenchmarkFips = () => {
    if (selectedBenchmark === 'national') return null;
    return selectedBenchmark.replace('state-', '').replace('county-', '');
  };
  
  console.log('🔍 Hook parameters:', {
    getBenchmarkLevel: getBenchmarkLevel(),
    getBenchmarkFips: getBenchmarkFips(),
    latestYear,
    availableYears
  });
  
  console.log('🔍 About to call useCMSEnrollmentDataByLevel...');
  
  // Fetch benchmark data based on selected benchmark
  const { data: benchmarkData, error: benchmarkError } = useCMSEnrollmentDataByLevel(
    getBenchmarkLevel(),
    getBenchmarkFips(),
    latestYear
  );
  
  console.log('🔍 Hook called, benchmarkData:', benchmarkData?.length, 'benchmarkError:', benchmarkError);
  console.log('🔍 Main data sample:', data?.slice(0, 2));
  console.log('🔍 Latest month:', latestMonth);

  // Get available states and counties from the main data
  const getAvailableStates = () => {
    if (!data) return [];
    const states = [...new Set(data.map(r => r.state).filter(Boolean))];
    return states;
  };

  const getAvailableCounties = () => {
    if (!data) return [];
    const counties = [...new Set(data.map(r => r.fips).filter(Boolean))];
    return counties;
  };

  // Get display name for selected benchmark
  const getSelectedBenchmarkDisplay = () => {
    if (selectedBenchmark === 'national') {
      return 'National';
    } else if (selectedBenchmark.startsWith('state-')) {
      const stateCode = selectedBenchmark.replace('state-', '');
      return stateCode;
    } else if (selectedBenchmark.startsWith('county-')) {
      const countyFips = selectedBenchmark.replace('county-', '');
      const countyData = data?.find(r => r.fips === countyFips);
      return countyData ? `${countyData.county}, ${countyData.state}` : `County ${countyFips}`;
    }
    return 'National';
  };

  // Build benchmark options
  const buildBenchmarkOptions = () => {
    const options = [
      { value: 'national', label: 'National' }
    ];

    // Add state options
    const states = getAvailableStates();
    states.forEach(stateCode => {
      options.push({
        value: `state-${stateCode}`,
        label: stateCode
      });
    });

    // Add county options
    const counties = getAvailableCounties();
    counties.forEach(countyFips => {
      const countyData = data?.find(r => r.fips === countyFips);
      if (countyData) {
        options.push({
          value: `county-${countyFips}`,
          label: `${countyData.county}, ${countyData.state}`
        });
      }
    });

    return options;
  };

  // Helper function to get current benchmark data
  const getCurrentBenchmark = () => {
    console.log('🔍 Debugging benchmark data:', {
      benchmarkData: benchmarkData?.length,
      latestMonth,
      selectedBenchmark,
      getBenchmarkLevel: getBenchmarkLevel(),
      getBenchmarkFips: getBenchmarkFips()
    });
    
    if (!benchmarkData || !latestMonth) {
      console.log('❌ No benchmark data or latest month');
      return null;
    }
    
    // For benchmark data, we want the same time period as the main data
    // For National level, we might have 'Year' records instead of monthly data
    let latestBenchmarkData;
    if (selectedBenchmark === 'national') {
      // For National benchmarks, look for 'Year' records if no monthly data is found
      latestBenchmarkData = benchmarkData.filter(r => r.month === latestMonth);
      if (latestBenchmarkData.length === 0) {
        // Fallback to 'Year' records for National level
        latestBenchmarkData = benchmarkData.filter(r => r.month === 'Year' || r.month_raw === 'Year');
        console.log('📊 Using Year records for National benchmark:', latestBenchmarkData.length, 'records');
      }
    } else if (selectedBenchmark.startsWith('state-')) {
      // For State benchmarks, look for any monthly data (not just the exact latest month)
      // State data might have different month formats
      latestBenchmarkData = benchmarkData.filter(r => r.month !== 'Year' && r.month_raw !== 'Year');
      if (latestBenchmarkData.length === 0) {
        // Fallback to 'Year' records for State level
        latestBenchmarkData = benchmarkData.filter(r => r.month === 'Year' || r.month_raw === 'Year');
        console.log('📊 Using Year records for State benchmark:', latestBenchmarkData.length, 'records');
      } else {
        console.log('📊 Using monthly records for State benchmark:', latestBenchmarkData.length, 'records');
      }
    } else {
      latestBenchmarkData = benchmarkData.filter(r => r.month === latestMonth);
    }
    console.log('📊 Latest benchmark data:', latestBenchmarkData.length, 'records for month:', latestMonth);
    console.log('📊 Sample benchmark record:', latestBenchmarkData[0]);
    
    if (latestBenchmarkData.length === 0) {
      console.log('❌ No benchmark data for latest month:', latestMonth);
      return null;
    }
    
    // Aggregate the benchmark data
    const totalBenes = latestBenchmarkData.reduce((sum, r) => sum + (r.total_benes || 0), 0);
    const maOther = latestBenchmarkData.reduce((sum, r) => sum + (r.ma_and_other || 0), 0);
    const originalMedicare = latestBenchmarkData.reduce((sum, r) => sum + (r.original_medicare || 0), 0);
    const dualEligible = latestBenchmarkData.reduce((sum, r) => sum + (r.dual_total || 0), 0);
    const agedTotal = latestBenchmarkData.reduce((sum, r) => sum + (r.aged_total || 0), 0);
    const disabledTotal = latestBenchmarkData.reduce((sum, r) => sum + (r.disabled_total || 0), 0);
    const drugTotal = latestBenchmarkData.reduce((sum, r) => sum + (r.prescription_drug_total || 0), 0);
    const drugPdp = latestBenchmarkData.reduce((sum, r) => sum + (r.prescription_drug_pdp || 0), 0);
    const drugMapd = latestBenchmarkData.reduce((sum, r) => sum + (r.prescription_drug_mapd || 0), 0);
    
    const benchmark = {
      totalBenes,
      maOther,
      originalMedicare,
      dualEligible,
      agedTotal,
      disabledTotal,
      drugTotal,
      drugPdp,
      drugMapd,
      maPercentage: totalBenes > 0 ? ((maOther / totalBenes) * 100) : 0,
      originalMedicarePercentage: totalBenes > 0 ? ((originalMedicare / totalBenes) * 100) : 0,
      dualPercentage: totalBenes > 0 ? ((dualEligible / totalBenes) * 100) : 0,
      agedPercentage: totalBenes > 0 ? ((agedTotal / totalBenes) * 100) : 0,
      disabledPercentage: totalBenes > 0 ? ((disabledTotal / totalBenes) * 100) : 0,
      drugPercentage: totalBenes > 0 ? ((drugTotal / totalBenes) * 100) : 0,
      pdpPercentage: totalBenes > 0 ? ((drugPdp / totalBenes) * 100) : 0,
      mapdPercentage: totalBenes > 0 ? ((drugMapd / totalBenes) * 100) : 0
    };
    
    console.log('📊 Calculated benchmark:', benchmark);
    console.log('📊 Key benchmark percentages:', {
      maPercentage: benchmark.maPercentage,
      originalMedicarePercentage: benchmark.originalMedicarePercentage,
      dualPercentage: benchmark.dualPercentage,
      agedPercentage: benchmark.agedPercentage,
      disabledPercentage: benchmark.disabledPercentage,
      drugPercentage: benchmark.drugPercentage,
      pdpPercentage: benchmark.pdpPercentage,
      mapdPercentage: benchmark.mapdPercentage
    });
    
    return benchmark;
  };

  // Helper function to render benchmark average
  const renderBenchmarkAverage = (value, formatter = (val) => `${val?.toFixed(1)}%`) => {
    console.log('🎯 Rendering benchmark for value:', value);
    if (value === null || value === undefined) {
      console.log('❌ Benchmark value is null/undefined, returning null');
      return null;
    }
    
    const formatted = formatter(value);
    console.log('✅ Rendering benchmark with formatted value:', formatted);
    return (
      <span 
        key={`${selectedBenchmark}-${value}`} 
        className={styles.benchmarkAverage}
      >
        {formatted}
      </span>
    );
  };

  // Helper function to safely get benchmark value
  const getBenchmarkValue = (property) => {
    const benchmark = getCurrentBenchmark();
    console.log('🔍 getBenchmarkValue called for:', property, 'benchmark:', benchmark);
    if (!benchmark) return null;
    const value = benchmark[property] || null;
    console.log('🔍 Returning benchmark value:', value);
    return value;
  };

  // Calculate summary statistics for the main data
  const summaryStats = useMemo(() => {
    if (!data || !latestMonth) return null;
    
    const latestData = data.filter(r => r.month === latestMonth);
    if (latestData.length === 0) return null;
    
    const totalBenes = latestData.reduce((sum, r) => sum + (r.total_benes || 0), 0);
    const maOther = latestData.reduce((sum, r) => sum + (r.ma_and_other || 0), 0);
    const originalMedicare = latestData.reduce((sum, r) => sum + (r.original_medicare || 0), 0);
    const dualEligible = latestData.reduce((sum, r) => sum + (r.dual_total || 0), 0);
    const agedTotal = latestData.reduce((sum, r) => sum + (r.aged_total || 0), 0);
    const disabledTotal = latestData.reduce((sum, r) => sum + (r.disabled_total || 0), 0);
    const drugTotal = latestData.reduce((sum, r) => sum + (r.prescription_drug_total || 0), 0);
    const drugPdp = latestData.reduce((sum, r) => sum + (r.prescription_drug_pdp || 0), 0);
    const drugMapd = latestData.reduce((sum, r) => sum + (r.prescription_drug_mapd || 0), 0);
    
    const benchmark = getCurrentBenchmark();
    
    return {
      totalBenes,
      maOther,
      originalMedicare,
      dualEligible,
      agedTotal,
      disabledTotal,
      drugTotal,
      drugPdp,
      drugMapd,
      maPercentage: totalBenes > 0 ? ((maOther / totalBenes) * 100).toFixed(1) : '0.0',
      originalMedicarePercentage: totalBenes > 0 ? ((originalMedicare / totalBenes) * 100).toFixed(1) : '0.0',
      dualPercentage: totalBenes > 0 ? ((dualEligible / totalBenes) * 100).toFixed(1) : '0.0',
      agedPercentage: totalBenes > 0 ? ((agedTotal / totalBenes) * 100).toFixed(1) : '0.0',
      disabledPercentage: totalBenes > 0 ? ((disabledTotal / totalBenes) * 100).toFixed(1) : '0.0',
      drugPercentage: totalBenes > 0 ? ((drugTotal / totalBenes) * 100).toFixed(1) : '0.0',
      pdpPercentage: totalBenes > 0 ? ((drugPdp / totalBenes) * 100).toFixed(1) : '0.0',
      mapdPercentage: totalBenes > 0 ? ((drugMapd / totalBenes) * 100).toFixed(1) : '0.0',
      benchmark
    };
  }, [data, latestMonth, selectedBenchmark, benchmarkData]);

  // Calculate demographic data
  const demographicData = useMemo(() => {
    if (!data || !latestMonth) return null;
    
    const latestData = data.filter(r => r.month === latestMonth);
    if (latestData.length === 0) return null;
    
    const total = latestData.reduce((sum, r) => sum + (r.total_benes || 0), 0);
    
    if (total === 0) return null;
    
    return {
      ageGroups: {
        '65-69': latestData.reduce((sum, r) => sum + (r.age_65_to_69 || 0), 0),
        '70-74': latestData.reduce((sum, r) => sum + (r.age_70_to_74 || 0), 0),
        '75-79': latestData.reduce((sum, r) => sum + (r.age_75_to_79 || 0), 0),
        '80-84': latestData.reduce((sum, r) => sum + (r.age_80_to_84 || 0), 0),
        '85-89': latestData.reduce((sum, r) => sum + (r.age_85_to_89 || 0), 0),
        '90-94': latestData.reduce((sum, r) => sum + (r.age_90_to_94 || 0), 0),
        '95+': latestData.reduce((sum, r) => sum + (r.age_gt_94 || 0), 0),
      },
      gender: {
        male: latestData.reduce((sum, r) => sum + (r.male_total || 0), 0),
        female: latestData.reduce((sum, r) => sum + (r.female_total || 0), 0),
      },
      race: {
        white: latestData.reduce((sum, r) => sum + (r.white_total || 0), 0),
        black: latestData.reduce((sum, r) => sum + (r.black_total || 0), 0),
        hispanic: latestData.reduce((sum, r) => sum + (r.hispanic_total || 0), 0),
        api: latestData.reduce((sum, r) => sum + (r.api_total || 0), 0),
        native: latestData.reduce((sum, r) => sum + (r.native_indian_total || 0), 0),
        other: latestData.reduce((sum, r) => sum + (r.other_total || 0), 0),
      }
    };
  }, [data, latestMonth]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading CMS enrollment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1>Enrollment</h1>
            <p>Comprehensive Medicare enrollment data from the Centers for Medicare & Medicaid Services</p>
          </div>
          <div className={styles.headerStats}>
            {summaryStats && (
              <>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{summaryStats.totalBenes.toLocaleString()}</span>
                  <span className={styles.statLabel}>Total Beneficiaries</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{summaryStats.maPercentage}%</span>
                  <span className={styles.statLabel}>Medicare Advantage</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statValue}>{summaryStats.dualPercentage}%</span>
                  <span className={styles.statLabel}>Dual Eligible</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.viewControls}>
          <ButtonGroup
            options={[
              { label: 'Overview', value: 'overview' },
              { label: 'Trends', value: 'trends' },
              { label: 'Demographics', value: 'demographics' },
              { label: 'Payers', value: 'payers' }
            ]}
            selected={selectedView}
            onSelect={setSelectedView}
            size="md"
            variant="blue"
          />
        </div>
        
        <div className={styles.benchmarkControls}>
          <div className={styles.benchmarkDropdown}>
            <label>Benchmark:</label>
            <div className={styles.dropdownContainer}>
              <button 
                className={styles.dropdownButton}
                onClick={() => setShowBenchmarkDropdown(!showBenchmarkDropdown)}
              >
                {getSelectedBenchmarkDisplay()} ▼
              </button>
              {showBenchmarkDropdown && (
                <div className={styles.dropdown}>
                  {buildBenchmarkOptions().map(option => (
                    <button
                      key={option.value}
                      className={`${styles.dropdownItem} ${selectedBenchmark === option.value ? styles.selected : ''}`}
                      onClick={() => {
                        setSelectedBenchmark(option.value);
                        setShowBenchmarkDropdown(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {benchmarkError && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>
              Benchmark Error: {benchmarkError}
            </div>
          )}
        </div>
        
        {selectedView === 'trends' && (
          <div className={styles.timeframeControls}>
            <ButtonGroup
              options={[
                { label: 'Latest', value: 'latest' },
                { label: 'Monthly', value: 'monthly' },
                { label: 'Yearly', value: 'yearly' }
              ]}
              selected={selectedTimeframe}
              onSelect={setSelectedTimeframe}
              size="sm"
              variant="blue"
            />
          </div>
        )}
      </div>

      <div className={styles.content}>
        {selectedView === 'overview' && (
          <div className={styles.overviewSection}>
            <CMSEnrollmentPanel 
              data={data} 
              loading={loading} 
              error={error}
              latestMonth={latestMonth}
            />
          </div>
        )}

        {selectedView === 'trends' && (
          <div className={styles.trendsSection}>
            <CMSEnrollmentTrendChart
              data={data}
              loading={loading}
              error={error}
              timeframe={selectedTimeframe}
              metric={selectedMetric}
              months={months}
            />
          </div>
        )}

        {selectedView === 'demographics' && (
          <div className={styles.demographicsSection}>
            <div className={styles.demographicGrid}>
              <div className={styles.demographicCard}>
                <h3>Age Distribution</h3>
                <div className={styles.ageChart}>
                  {Object.entries(demographicData?.ageGroups || {}).map(([age, count]) => {
                    const percentage = summaryStats?.totalBenes > 0 ? ((count / summaryStats.totalBenes) * 100).toFixed(1) : 0;
                    return (
                      <div key={age} className={styles.ageItem}>
                        <div className={styles.ageLabel}>{age}</div>
                        <div className={styles.ageBar}>
                          <div 
                            className={styles.ageBarFill} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className={styles.ageValue}>
                          {count.toLocaleString()} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.demographicCard}>
                <h3>Gender Distribution</h3>
                <div className={styles.genderChart}>
                  <div className={styles.genderItem}>
                    <div className={styles.genderLabel}>Male</div>
                    <div className={styles.genderBar}>
                      <div 
                        className={styles.genderBarFill} 
                        style={{ 
                          width: `${summaryStats?.totalBenes > 0 ? (demographicData?.gender.male / summaryStats.totalBenes * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className={styles.genderValue}>
                      {demographicData?.gender.male.toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.genderItem}>
                    <div className={styles.genderLabel}>Female</div>
                    <div className={styles.genderBar}>
                      <div 
                        className={styles.genderBarFill} 
                        style={{ 
                          width: `${summaryStats?.totalBenes > 0 ? (demographicData?.gender.female / summaryStats.totalBenes * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className={styles.genderValue}>
                      {demographicData?.gender.female.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.demographicCard}>
                <h3>Race & Ethnicity</h3>
                <div className={styles.raceChart}>
                  {Object.entries(demographicData?.race || {}).map(([race, count]) => {
                    const percentage = summaryStats?.totalBenes > 0 ? ((count / summaryStats.totalBenes) * 100).toFixed(1) : 0;
                    return (
                      <div key={race} className={styles.raceItem}>
                        <div className={styles.raceLabel}>
                          {race.charAt(0).toUpperCase() + race.slice(1)}
                        </div>
                        <div className={styles.raceBar}>
                          <div 
                            className={styles.raceBarFill} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className={styles.raceValue}>
                          {count.toLocaleString()} ({percentage}%)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'payers' && (
          <div className={styles.payersSection}>
            {loadingDates ? (
              <div>Loading available dates...</div>
            ) : errorDates ? (
              <div>Error loading dates: {errorDates}</div>
            ) : !publishDates.length ? (
              <div>No enrollment dates available.</div>
            ) : (
              <div>
                <div className={styles.payersHeader}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Medicare Advantage Enrollment</h3>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                      Medicare enrollment data for {publishDate}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                        Plan Type:
                      </span>
                      <ButtonGroup
                        options={[
                          { label: "Medicare Advantage", value: "MA" },
                          { label: "Prescription Drug Plans", value: "PDP" }
                        ]}
                        selected={selectedType}
                        onSelect={setSelectedType}
                        size="sm"
                        variant="blue"
                      />
                    </div>
                  </div>
                </div>
                
                <MAEnrollmentPanel 
                  data={maData} 
                  loading={maLoading} 
                  error={maError}
                  type={selectedType}
                />
                
                <MAEnrollmentTrendChart
                  data={maTrendData}
                  loading={maTrendLoading}
                  error={maTrendError}
                  startDate={startDate}
                  endDate={endDate}
                  type={selectedType}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.info}>
        <h4>About This Data</h4>
        <p>
          This tab provides comprehensive Medicare enrollment data directly from the Centers for Medicare & Medicaid Services (CMS). 
          The data includes detailed demographic breakdowns by county, including age distribution, race/ethnicity, 
          dual eligibility status, and prescription drug coverage.
        </p>
        <div className={styles.dataSource}>
          <strong>Data Source:</strong> CMS Medicare Enrollment Data API<br/>
          <strong>Coverage:</strong> All Medicare beneficiaries by county<br/>
          <strong>Updates:</strong> Annual and monthly data releases<br/>
          <strong>Latest Data:</strong> {latestMonth || 'N/A'}
        </div>
      </div>
    </div>
  );
} 