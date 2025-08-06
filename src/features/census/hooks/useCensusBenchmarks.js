import { useState, useEffect, useMemo } from 'react';

export const useCensusBenchmarks = (data) => {
  const [selectedBenchmark, setSelectedBenchmark] = useState('national');
  const [countyNames, setCountyNames] = useState({});

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

  // Fetch county names when data is available
  useEffect(() => {
    if (data && !countyNames.loaded) {
      console.log('Fetching county names for all states');
      const states = getAvailableStates();
      states.forEach(stateFips => {
        if (!countyNames[stateFips]) {
          fetchCountyNames(stateFips);
        }
      });
      setCountyNames(prev => ({ ...prev, loaded: true }));
    }
  }, [data, countyNames]);

  const getCurrentBenchmark = () => {
    if (!data?.benchmarks) return null;
    
    const benchmarkType = getBenchmarkType();
    return data.benchmarks[benchmarkType] || null;
  };

  const getAvailableStates = () => {
    if (!data?.geographic_breakdown) return [];
    return Object.keys(data.geographic_breakdown);
  };

  const getAvailableCounties = () => {
    if (!data?.geographic_breakdown) return [];
    const counties = [];
    Object.values(data.geographic_breakdown).forEach(stateData => {
      Object.keys(stateData).forEach(countyFips => {
        counties.push(countyFips);
      });
    });
    return counties;
  };

  const getSelectedBenchmarkDisplay = () => {
    switch (selectedBenchmark) {
      case 'national':
        return 'National Average';
      case 'state':
        return 'State Average';
      case 'county':
        return 'County Average';
      default:
        return 'National Average';
    }
  };

  const buildBenchmarkOptions = () => {
    const options = [
      { value: 'national', label: 'National Average' }
    ];

    // Add state options if available
    const availableStates = getAvailableStates();
    if (availableStates.length > 0) {
      options.push({ value: 'state', label: 'State Average' });
    }

    // Add county options if available
    const availableCounties = getAvailableCounties();
    if (availableCounties.length > 0) {
      options.push({ value: 'county', label: 'County Average' });
    }

    return options;
  };

  const fetchCountyNames = async (stateFips) => {
    try {
      const response = await fetch(`/api/county-names/${stateFips}`);
      if (response.ok) {
        const countyData = await response.json();
        setCountyNames(prev => ({
          ...prev,
          [stateFips]: countyData
        }));
      }
    } catch (error) {
      console.error('Error fetching county names:', error);
    }
  };

  const getCountyName = (stateFips, countyFips) => {
    const stateCounties = countyNames[stateFips];
    return stateCounties?.[countyFips] || `County ${countyFips}`;
  };

  const getBenchmarkType = () => {
    switch (selectedBenchmark) {
      case 'national':
        return 'national';
      case 'state':
        return 'state';
      case 'county':
        return 'county';
      default:
        return 'national';
    }
  };

  const currentBenchmark = getCurrentBenchmark();
  const benchmarkOptions = buildBenchmarkOptions();

  return {
    selectedBenchmark,
    setSelectedBenchmark,
    currentBenchmark,
    benchmarkOptions,
    getCountyName,
    stateNames
  };
}; 