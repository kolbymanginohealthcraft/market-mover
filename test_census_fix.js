import fetch from 'node-fetch';

async function testCensusEndpoint() {
  try {
    // Test with a sample location (New York City)
    const lat = 40.7128;
    const lon = -74.0060;
    const radius = 10;
    const year = '2022';

    console.log('Testing census-acs-api endpoint...');
    console.log(`Location: ${lat}, ${lon}, radius: ${radius} miles, year: ${year}`);

    const response = await fetch(`http://localhost:3000/api/census-acs-api?lat=${lat}&lon=${lon}&radius=${radius}&year=${year}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch census data');
    }

    console.log('\n✅ Success! Data structure:');
    console.log(JSON.stringify(result.data, null, 2));

    // Check for required fields
    const { market_totals } = result.data;
    const requiredFields = [
      'total_population',
      'population_65_plus', 
      'population_under_18',
      'white',
      'black',
      'asian',
      'hispanic',
      'median_income',
      'per_capita_income',
      'poverty_rate',
      'median_rent',
      'median_home_value',
      'uninsured_rate',
      'disability_rate',
      'bachelors_plus_rate'
    ];

    console.log('\n🔍 Checking required fields:');
    requiredFields.forEach(field => {
      const value = market_totals[field];
      const status = value !== null && value !== undefined ? '✅' : '❌';
      console.log(`${status} ${field}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCensusEndpoint(); 