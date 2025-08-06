import { useState, useEffect } from 'react';
import { useCMSEnrollmentDataByLevel, useCMSEnrollmentYears } from '../../../hooks/useCMSEnrollmentData';

export const useCMSEnrollmentBenchmarks = (data) => {
  const [selectedBenchmark, setSelectedBenchmark] = useState('national');
  const [showBenchmarkDropdown, setShowBenchmarkDropdown] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarkError, setBenchmarkError] = useState(null);

  // Fetch available years
  const { data: availableYears } = useCMSEnrollmentYears();
  const latestYear = availableYears && availableYears.length > 0 ? availableYears[0] : '2023';

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

  // Fetch benchmark data based on selected benchmark
  const { data: benchmarkDataFromHook, error: benchmarkErrorFromHook } = useCMSEnrollmentDataByLevel(
    getBenchmarkLevel(),
    getBenchmarkFips(),
    latestYear
  );

  useEffect(() => {
    setBenchmarkData(benchmarkDataFromHook);
    setBenchmarkError(benchmarkErrorFromHook);
  }, [benchmarkDataFromHook, benchmarkErrorFromHook]);

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

  // Get current benchmark data
  const getCurrentBenchmark = () => {
    if (!benchmarkData || benchmarkData.length === 0) return null;
    
    // Return the first benchmark record (assuming single benchmark for the selected level)
    return benchmarkData[0];
  };

  // Render benchmark average
  const renderBenchmarkAverage = (value, formatter = (val) => `${val?.toFixed(1)}%`) => {
    if (!value) return null;
    
    return (
      <span className="benchmarkAverage">
        {formatter(value)}
      </span>
    );
  };

  // Get benchmark value for a specific property
  const getBenchmarkValue = (property) => {
    const benchmark = getCurrentBenchmark();
    if (!benchmark) return null;

    switch (property) {
      case 'maPercentage':
        return benchmark.total_benes > 0 ? ((benchmark.ma_and_other / benchmark.total_benes) * 100) : 0;
      case 'originalMedicarePercentage':
        return benchmark.total_benes > 0 ? ((benchmark.original_medicare / benchmark.total_benes) * 100) : 0;
      case 'dualPercentage':
        return benchmark.total_benes > 0 ? ((benchmark.dual_total / benchmark.total_benes) * 100) : 0;
      case 'agedPercentage':
        const agedTotal = (benchmark.age_65_74 || 0) + (benchmark.age_75_84 || 0) + (benchmark.age_85_plus || 0);
        return benchmark.total_benes > 0 ? ((agedTotal / benchmark.total_benes) * 100) : 0;
      case 'disabledPercentage':
        return benchmark.total_benes > 0 ? ((benchmark.disabled_total / benchmark.total_benes) * 100) : 0;
      default:
        return null;
    }
  };

  return {
    selectedBenchmark,
    setSelectedBenchmark,
    showBenchmarkDropdown,
    setShowBenchmarkDropdown,
    benchmarkData,
    benchmarkError,
    getCurrentBenchmark,
    getBenchmarkValue,
    renderBenchmarkAverage,
    buildBenchmarkOptions,
    getSelectedBenchmarkDisplay
  };
}; 