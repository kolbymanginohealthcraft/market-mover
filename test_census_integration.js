import { BigQuery } from '@google-cloud/bigquery';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function getLatestAcsYear() {
  const query = `
    SELECT 
      REGEXP_EXTRACT(table_id, r'county_(\\d{4})_5yr') as year
    FROM \`bigquery-public-data.census_bureau_acs.__TABLES__\`
    WHERE table_id LIKE 'county_%_5yr'
    ORDER BY year DESC
    LIMIT 1
  `;
  const [rows] = await myBigQuery.query({ query, location: "US" });
  return rows[0]?.year || '2018';
}

async function testCensusIntegration() {
  console.log('🔍 Testing Census Data Integration...\n');

  try {
    // Get the latest available ACS year
    const acsYear = await getLatestAcsYear();
    console.log(`ℹ️  Using latest available ACS year: ${acsYear}`);

    // Test 1: Check if we can access the public census dataset
    console.log('1. Testing access to BigQuery public census dataset...');
    
    const testQuery = `
      SELECT 
        table_id,
        creation_time,
        row_count
      FROM \`bigquery-public-data.census_bureau_acs.__TABLES__\`
      WHERE table_id LIKE 'county_%_5yr'
      ORDER BY table_id DESC
      LIMIT 5
    `;
    
    const [testRows] = await myBigQuery.query({
      query: testQuery,
      location: "US"
    });
    
    console.log('✅ Successfully accessed census dataset');
    console.log('📊 Available county tables:');
    testRows.forEach(row => {
      console.log(`   - ${row.table_id} (${row.row_count?.toLocaleString()} rows)`);
    });
    console.log('');

    // Test 2: Check if we have providers with FIPS codes
    console.log('2. Testing provider FIPS code availability...');
    
    const fipsQuery = `
      SELECT 
        COUNT(*) as total_providers,
        COUNT(CASE WHEN fips IS NOT NULL THEN 1 END) as providers_with_fips,
        COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as providers_with_coords
      FROM \`market-mover-464517.providers.org_dhc\`
      LIMIT 1
    `;
    
    const [fipsRows] = await myBigQuery.query({
      query: fipsQuery,
      location: "US"
    });
    
    const stats = fipsRows[0];
    console.log('✅ Provider data analysis:');
    console.log(`   - Total providers: ${stats.total_providers?.toLocaleString()}`);
    console.log(`   - Providers with FIPS codes: ${stats.providers_with_fips?.toLocaleString()}`);
    console.log(`   - Providers with coordinates: ${stats.providers_with_coords?.toLocaleString()}`);
    console.log('');

    // Test 3: Test a sample census query
    console.log('3. Testing sample census query...');
    
    // Get a sample provider with coordinates
    const sampleProviderQuery = `
      SELECT 
        dhc,
        name,
        latitude,
        longitude,
        fips
      FROM \`market-mover-464517.providers.org_dhc\`
      WHERE latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND fips IS NOT NULL
      LIMIT 1
    `;
    
    const [providerRows] = await myBigQuery.query({
      query: sampleProviderQuery,
      location: "US"
    });
    
    if (providerRows.length === 0) {
      console.log('❌ No providers found with complete geographic data');
      return;
    }
    
    const sampleProvider = providerRows[0];
    console.log(`✅ Found sample provider: ${sampleProvider.name} (${sampleProvider.dhc})`);
    console.log(`   - Location: ${sampleProvider.latitude}, ${sampleProvider.longitude}`);
    console.log(`   - FIPS: ${sampleProvider.fips}`);
    console.log('');

    // Test 4: Test county-level census query
    console.log('4. Testing county-level census query...');
    
    const censusQuery = `
      WITH market_counties AS (
        SELECT DISTINCT 
          fips as county_geo_id,
          -- Convert 5-digit FIPS to census format: 01001 -> 1001, 06037 -> 6037
          CAST(SUBSTR(fips, 2) AS STRING) as census_geo_id
        FROM \`market-mover-464517.providers.org_dhc\`
        WHERE latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND fips IS NOT NULL
          AND ST_DISTANCE(
            ST_GEOGPOINT(CAST(longitude AS FLOAT64), CAST(latitude AS FLOAT64)),
            ST_GEOGPOINT(@lon, @lat)
          ) <= @radiusMeters
      )
      SELECT 
        c.geo_id,
        mc.county_geo_id as original_fips,
        c.total_pop,
        -- Calculate 65+ population from available age columns
        (c.female_65_to_66 + c.female_67_to_69 + c.female_70_to_74 + c.female_75_to_79 + c.female_80_to_84 + c.female_85_and_over +
         c.male_65_to_66 + c.male_67_to_69 + c.male_70_to_74 + c.male_75_to_79 + c.male_80_to_84 + c.male_85_and_over) as pop_65_plus,
        c.median_income,
        c.income_per_capita,
        c.poverty,
        c.housing_units,
        c.owner_occupied_housing_units,
        c.housing_units_renter_occupied as renter_occupied_housing_units
      FROM \`bigquery-public-data.census_bureau_acs.county_${acsYear}_5yr\` c
      INNER JOIN market_counties mc ON c.geo_id = mc.census_geo_id
      ORDER BY c.total_pop DESC
      LIMIT 5
    `;
    
    const radiusMeters = 25 * 1609.34; // 25 miles
    
    const [censusRows] = await myBigQuery.query({
      query: censusQuery,
      location: "US",
      params: {
        lat: sampleProvider.latitude,
        lon: sampleProvider.longitude,
        radiusMeters
      }
    });
    
    console.log(`✅ Census query successful for 25-mile radius around ${sampleProvider.name}`);
    console.log(`📊 Found ${censusRows.length} counties in market area:`);
    
    censusRows.forEach((row, index) => {
      console.log(`   ${index + 1}. County ${row.geo_id} (Original FIPS: ${row.original_fips})`);
      console.log(`      - Population: ${row.total_pop?.toLocaleString() || 'N/A'}`);
      console.log(`      - 65+: ${row.pop_65_plus?.toLocaleString() || 'N/A'}`);
      console.log(`      - Median Income: $${row.median_income?.toLocaleString() || 'N/A'}`);
      console.log(`      - Income Per Capita: $${row.income_per_capita?.toLocaleString() || 'N/A'}`);
      console.log(`      - Poverty: ${row.poverty?.toLocaleString() || 'N/A'}`);
    });
    console.log('');

    // Test 5: Test tract-level query
    console.log('5. Testing tract-level census query...');
    
    const tractQuery = `
      SELECT 
        t.geo_id as tract_id,
        t.total_pop,
        -- Calculate 65+ population from available age columns
        (t.female_65_to_66 + t.female_67_to_69 + t.female_70_to_74 + t.female_75_to_79 + t.female_80_to_84 + t.female_85_and_over +
         t.male_65_to_66 + t.male_67_to_69 + t.male_70_to_74 + t.male_75_to_79 + t.male_80_to_84 + t.male_85_and_over) as pop_65_plus,
        t.median_income,
        t.income_per_capita,
        t.poverty,
        ST_DISTANCE(
          ST_GEOGPOINT(t.centroid_lon, t.centroid_lat),
          ST_GEOGPOINT(@lon, @lat)
        ) as distance_meters
      FROM \`bigquery-public-data.census_bureau_acs.censustract_${acsYear}_5yr\` t
      WHERE ST_DISTANCE(
        ST_GEOGPOINT(t.centroid_lon, t.centroid_lat),
        ST_GEOGPOINT(@lon, @lat)
      ) <= @radiusMeters
      ORDER BY distance_meters ASC
      LIMIT 5
    `;
    
    const [tractRows] = await myBigQuery.query({
      query: tractQuery,
      location: "US",
      params: {
        lat: sampleProvider.latitude,
        lon: sampleProvider.longitude,
        radiusMeters
      }
    });
    
    console.log(`✅ Tract query successful`);
    console.log(`📊 Found ${tractRows.length} tracts in market area:`);
    
    tractRows.forEach((row, index) => {
      const distanceMiles = (row.distance_meters / 1609.34).toFixed(1);
      console.log(`   ${index + 1}. Tract ID: ${row.tract_id}`);
      console.log(`      - Distance: ${distanceMiles} miles`);
      console.log(`      - Population: ${row.total_pop?.toLocaleString() || 'N/A'}`);
      console.log(`      - 65+: ${row.pop_65_plus?.toLocaleString() || 'N/A'}`);
      console.log(`      - Median Income: $${row.median_income?.toLocaleString() || 'N/A'}`);
    });
    console.log('');

    console.log('🎉 All census integration tests passed!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ BigQuery public dataset access working');
    console.log('   ✅ Provider FIPS codes available');
    console.log('   ✅ County-level census queries working');
    console.log('   ✅ Tract-level census queries working');
    console.log('   ✅ Spatial queries functioning correctly');
    console.log('');
    console.log('🚀 Ready to integrate census data into Market Mover!');

  } catch (error) {
    console.error('❌ Census integration test failed:', error);
    console.error('');
    console.error('🔧 Troubleshooting tips:');
    console.error('   1. Check BigQuery permissions for public datasets');
    console.error('   2. Verify service account has necessary access');
    console.error('   3. Ensure provider data has valid coordinates and FIPS codes');
    console.error('   4. Check if ACS data is available in public dataset');
  }
}

// Run the test
testCensusIntegration(); 