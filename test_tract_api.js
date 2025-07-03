import fetch from 'node-fetch';

async function testTractAPI() {
  console.log('🔍 Testing Tract-Level API...\n');

  // Test with a major city (New York City area)
  const lat = 40.7128;
  const lon = -74.0060;
  const radius = 10; // 10 miles
  const level = 'tract';
  const year = '2020';

  console.log('📍 Testing with New York City area:');
  console.log(`   - Location: ${lat}, ${lon}`);
  console.log(`   - Radius: ${radius} miles`);
  console.log(`   - Level: ${level}`);
  console.log(`   - Year: ${year}\n`);

  try {
    const response = await fetch(`http://localhost:3000/api/census-data?lat=${lat}&lon=${lon}&radius=${radius}&level=${level}&year=${year}`);
    const result = await response.json();

    if (result.success) {
      console.log('✅ Tract-level API call successful!');
      console.log('\n📊 Market Totals:');
      console.log(`   Total Population: ${result.data.market_totals.total_population.toLocaleString()}`);
      console.log(`   Population 65+: ${result.data.market_totals.population_65_plus.toLocaleString()}`);
      console.log(`   Median Income: $${result.data.market_totals.median_income.toLocaleString()}`);
      console.log(`   Geographic Units: ${result.data.market_totals.total_tracts}`);
      console.log(`   ACS Year: ${result.data.market_totals.acs_year}`);

      if (result.data.geographic_units.length > 0) {
        console.log('\n🏘️  Sample Tracts:');
        result.data.geographic_units.slice(0, 5).forEach((tract, index) => {
          const distanceMiles = (tract.distance_meters / 1609.34).toFixed(1);
          console.log(`   ${index + 1}. Tract ${tract.tract_id}:`);
          console.log(`      - Distance: ${distanceMiles} miles`);
          console.log(`      - Population: ${tract.total_pop?.toLocaleString() || 'N/A'}`);
          console.log(`      - 65+ Population: ${tract.pop_65_plus?.toLocaleString() || 'N/A'}`);
          console.log(`      - Median Income: $${tract.median_income?.toLocaleString() || 'N/A'}`);
          console.log(`      - Centroid: ${tract.centroid_lat?.toFixed(4)}, ${tract.centroid_lon?.toFixed(4)}`);
        });
      } else {
        console.log('\n⚠️  No tracts found in the area.');
      }
    } else {
      console.log('❌ Tract-level API call failed:');
      console.log(`   Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Error testing tract API:', error.message);
  }
}

// Run the test
testTractAPI(); 