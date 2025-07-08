import { BigQuery } from '@google-cloud/bigquery';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function checkFipsFormat() {
  console.log('🔍 Checking FIPS code format compatibility...\n');

  try {
    // Check geo_id format in census data
    console.log('1. Checking geo_id format in census data...');
    
    const censusFormatQuery = `
      SELECT 
        geo_id,
        LENGTH(geo_id) as geo_id_length,
        total_pop,
        median_income
      FROM \`bigquery-public-data.census_bureau_acs.county_2020_5yr\`
      ORDER BY total_pop DESC
      LIMIT 10
    `;
    
    const [censusRows] = await myBigQuery.query({ query: censusFormatQuery, location: "US" });
    
    console.log('📊 Census geo_id format:');
    censusRows.forEach(row => {
      console.log(`   - ${row.geo_id} (length: ${row.geo_id_length})`);
      console.log(`     Population: ${row.total_pop?.toLocaleString() || 'N/A'}`);
      console.log(`     Median Income: $${row.median_income?.toLocaleString() || 'N/A'}`);
    });
    console.log('');

    // Check if we can find the specific county from our sample
    console.log('2. Testing specific county lookup...');
    
    const specificCountyQuery = `
      SELECT 
        geo_id,
        total_pop,
        median_income,
        income_per_capita,
        poverty
      FROM \`bigquery-public-data.census_bureau_acs.county_2020_5yr\`
      WHERE geo_id = '01001' OR geo_id = '1001' OR geo_id = '1'
      LIMIT 5
    `;
    
    const [specificRows] = await myBigQuery.query({ query: specificCountyQuery, location: "US" });
    
    console.log('📊 Specific county lookup results:');
    if (specificRows.length > 0) {
      specificRows.forEach(row => {
        console.log(`   - Found county ${row.geo_id}:`);
        console.log(`     Population: ${row.total_pop?.toLocaleString() || 'N/A'}`);
        console.log(`     Median Income: $${row.median_income?.toLocaleString() || 'N/A'}`);
        console.log(`     Income Per Capita: $${row.income_per_capita?.toLocaleString() || 'N/A'}`);
        console.log(`     Poverty: ${row.poverty?.toLocaleString() || 'N/A'}`);
      });
    } else {
      console.log('   ❌ No matching county found');
    }
    console.log('');

    // Test with different FIPS formats
    console.log('3. Testing different FIPS formats...');
    
    const formatTestQuery = `
      SELECT 
        geo_id,
        total_pop,
        median_income
      FROM \`bigquery-public-data.census_bureau_acs.county_2020_5yr\`
      WHERE geo_id IN ('01001', '1001', '1', '0101', '001')
      ORDER BY geo_id
    `;
    
    const [formatRows] = await myBigQuery.query({ query: formatTestQuery, location: "US" });
    
    console.log('📊 Format test results:');
    if (formatRows.length > 0) {
      formatRows.forEach(row => {
        console.log(`   - County ${row.geo_id}: ${row.total_pop?.toLocaleString() || 'N/A'} people`);
      });
    } else {
      console.log('   ❌ No counties found with any of the tested formats');
    }
    console.log('');

    // Check a few more counties to understand the pattern
    console.log('4. Checking more counties to understand the pattern...');
    
    const patternQuery = `
      SELECT 
        geo_id,
        total_pop
      FROM \`bigquery-public-data.census_bureau_acs.county_2020_5yr\`
      WHERE geo_id LIKE '01%' OR geo_id LIKE '06%' OR geo_id LIKE '17%'
      ORDER BY total_pop DESC
      LIMIT 5
    `;
    
    const [patternRows] = await myBigQuery.query({ query: patternQuery, location: "US" });
    
    console.log('📊 County pattern analysis:');
    patternRows.forEach(row => {
      console.log(`   - County ${row.geo_id}: ${row.total_pop?.toLocaleString() || 'N/A'} people`);
    });

  } catch (error) {
    console.error('❌ Error checking FIPS format:', error);
  }
}

// Run the check
checkFipsFormat(); 