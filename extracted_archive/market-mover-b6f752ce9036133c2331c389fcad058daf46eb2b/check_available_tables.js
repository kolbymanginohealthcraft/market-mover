import { BigQuery } from '@google-cloud/bigquery';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function checkAvailableTables() {
  console.log('🔍 Checking available ACS tables...\n');

  try {
    // Check all available tables
    const tablesQuery = `
      SELECT 
        table_id,
        creation_time,
        row_count
      FROM \`bigquery-public-data.census_bureau_acs.__TABLES__\`
      WHERE table_id LIKE '%_5yr'
      ORDER BY table_id DESC
    `;
    
    const [tableRows] = await myBigQuery.query({ query: tablesQuery, location: "US" });
    
    console.log('📊 Available ACS tables:');
    tableRows.forEach(row => {
      console.log(`   - ${row.table_id} (${row.row_count?.toLocaleString()} rows)`);
    });
    console.log('');

    // Check FIPS code format in provider data
    console.log('🔍 Checking FIPS code format in provider data...');
    
    const fipsQuery = `
      SELECT 
        fips,
        COUNT(*) as provider_count
      FROM \`market-mover-464517.providers.org_dhc\`
      WHERE fips IS NOT NULL
      GROUP BY fips
      ORDER BY provider_count DESC
      LIMIT 10
    `;
    
    const [fipsRows] = await myBigQuery.query({ query: fipsQuery, location: "US" });
    
    console.log('📊 Top 10 FIPS codes in provider data:');
    fipsRows.forEach(row => {
      console.log(`   - ${row.fips}: ${row.provider_count} providers`);
    });
    console.log('');

    // Check if any providers are in the 25-mile radius
    console.log('🔍 Testing spatial query with sample provider...');
    
    const spatialQuery = `
      SELECT 
        dhc,
        name,
        latitude,
        longitude,
        fips,
        ST_DISTANCE(
          ST_GEOGPOINT(CAST(longitude AS FLOAT64), CAST(latitude AS FLOAT64)),
          ST_GEOGPOINT(-86.6577, 32.4324)
        ) as distance_meters
      FROM \`market-mover-464517.providers.org_dhc\`
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND fips IS NOT NULL
        AND ST_DISTANCE(
          ST_GEOGPOINT(CAST(longitude AS FLOAT64), CAST(latitude AS FLOAT64)),
          ST_GEOGPOINT(-86.6577, 32.4324)
        ) <= 40233.6
      ORDER BY distance_meters ASC
      LIMIT 5
    `;
    
    const [spatialRows] = await myBigQuery.query({ query: spatialQuery, location: "US" });
    
    console.log('📊 Providers within 25 miles of sample location:');
    spatialRows.forEach((row, index) => {
      const distanceMiles = (row.distance_meters / 1609.34).toFixed(1);
      console.log(`   ${index + 1}. ${row.name} (${row.dhc})`);
      console.log(`      - Location: ${row.latitude}, ${row.longitude}`);
      console.log(`      - FIPS: ${row.fips}`);
      console.log(`      - Distance: ${distanceMiles} miles`);
    });
    console.log('');

    // Test direct county lookup
    console.log('🔍 Testing direct county lookup...');
    
    const countyQuery = `
      SELECT 
        geo_id,
        total_pop,
        median_income,
        income_per_capita
      FROM \`bigquery-public-data.census_bureau_acs.county_2020_5yr\`
      WHERE geo_id IN ('01001', '01003', '01005')
      LIMIT 5
    `;
    
    const [countyRows] = await myBigQuery.query({ query: countyQuery, location: "US" });
    
    console.log('📊 Direct county lookup results:');
    countyRows.forEach(row => {
      console.log(`   - County ${row.geo_id}:`);
      console.log(`     Population: ${row.total_pop?.toLocaleString() || 'N/A'}`);
      console.log(`     Median Income: $${row.median_income?.toLocaleString() || 'N/A'}`);
      console.log(`     Income Per Capita: $${row.income_per_capita?.toLocaleString() || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error checking available tables:', error);
  }
}

// Run the check
checkAvailableTables(); 