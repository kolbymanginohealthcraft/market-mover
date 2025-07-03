import { BigQuery } from '@google-cloud/bigquery';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function testTractIntegration() {
  console.log('🔍 Testing Tract-Level Census Integration...\n');

  try {
    // Test 1: Check if TIGER/Line geometry tables are available
    console.log('1. Checking TIGER/Line geometry tables...');
    
    const geometryTablesQuery = `
      SELECT 
        table_id,
        creation_time,
        row_count
      FROM \`bigquery-public-data.geo_census_tracts.__TABLES__\`
      ORDER BY table_id DESC
      LIMIT 10
    `;
    
    const [geometryRows] = await myBigQuery.query({ query: geometryTablesQuery, location: "US" });
    
    console.log('📊 Available TIGER/Line tract tables:');
    geometryRows.forEach(row => {
      console.log(`   - ${row.table_id} (${row.row_count?.toLocaleString()} rows)`);
    });
    console.log('');

    // Test 2: Check the schema of the national tract table
    console.log('2. Checking national tract geometry table schema...');
    
    const schemaQuery = `
      SELECT 
        column_name,
        data_type
      FROM \`bigquery-public-data.geo_census_tracts.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'us_census_tracts_national'
      ORDER BY ordinal_position
    `;
    
    const [schemaRows] = await myBigQuery.query({ query: schemaQuery, location: "US" });
    
    console.log('📊 National tract geometry table schema:');
    schemaRows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    console.log('');

    // Test 3: Check if we can join ACS tract data with geometry data
    console.log('3. Testing ACS tract data with geometry join...');
    
    const joinTestQuery = `
      SELECT 
        acs.geo_id as acs_geo_id,
        geo.geo_id as geo_geoid,
        acs.total_pop,
        acs.median_income,
        CAST(geo.internal_point_lat AS FLOAT64) as centroid_lat,
        CAST(geo.internal_point_lon AS FLOAT64) as centroid_lon
      FROM \`bigquery-public-data.census_bureau_acs.censustract_2020_5yr\` acs
      INNER JOIN \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\` geo
        ON acs.geo_id = geo.geo_id
      WHERE acs.total_pop > 0
      ORDER BY acs.total_pop DESC
      LIMIT 5
    `;
    
    const [joinRows] = await myBigQuery.query({ query: joinTestQuery, location: "US" });
    
    console.log('📊 ACS + Geometry join test results:');
    joinRows.forEach((row, index) => {
      console.log(`   ${index + 1}. Tract ${row.acs_geo_id}:`);
      console.log(`      - Population: ${row.total_pop?.toLocaleString() || 'N/A'}`);
      console.log(`      - Median Income: $${row.median_income?.toLocaleString() || 'N/A'}`);
      console.log(`      - Centroid: ${row.centroid_lat?.toFixed(4)}, ${row.centroid_lon?.toFixed(4)}`);
    });
    console.log('');

    // Test 4: Test spatial query with tract centroids
    console.log('4. Testing spatial query with tract centroids...');
    
    const spatialQuery = `
      WITH tract_data AS (
        SELECT 
          acs.geo_id,
          acs.total_pop,
          (acs.female_65_to_66 + acs.female_67_to_69 + acs.female_70_to_74 + acs.female_75_to_79 + acs.female_80_to_84 + acs.female_85_and_over +
           acs.male_65_to_66 + acs.male_67_to_69 + acs.male_70_to_74 + acs.male_75_to_79 + acs.male_80_to_84 + acs.male_85_and_over) as pop_65_plus,
          acs.median_income,
          acs.income_per_capita,
          acs.poverty,
          CAST(geo.internal_point_lat AS FLOAT64) as centroid_lat,
          CAST(geo.internal_point_lon AS FLOAT64) as centroid_lon
        FROM \`bigquery-public-data.census_bureau_acs.censustract_2020_5yr\` acs
        INNER JOIN \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\` geo
          ON acs.geo_id = geo.geo_id
        WHERE acs.total_pop > 0
      )
      SELECT 
        geo_id,
        total_pop,
        pop_65_plus,
        median_income,
        income_per_capita,
        poverty,
        centroid_lat,
        centroid_lon,
        ST_DISTANCE(
          ST_GEOGPOINT(centroid_lon, centroid_lat),
          ST_GEOGPOINT(@lon, @lat)
        ) as distance_meters
      FROM tract_data
      WHERE ST_DISTANCE(
        ST_GEOGPOINT(centroid_lon, centroid_lat),
        ST_GEOGPOINT(@lon, @lat)
      ) <= @radiusMeters
      ORDER BY distance_meters ASC
      LIMIT 10
    `;
    
    const radiusMeters = 25 * 1609.34; // 25 miles
    const testLat = 32.4324; // Sample location
    const testLon = -86.6577;
    
    const [spatialRows] = await myBigQuery.query({
      query: spatialQuery,
      location: "US",
      params: {
        lat: testLat,
        lon: testLon,
        radiusMeters
      }
    });
    
    console.log(`📊 Spatial query results (25-mile radius around ${testLat}, ${testLon}):`);
    console.log(`   Found ${spatialRows.length} tracts in market area:`);
    
    spatialRows.forEach((row, index) => {
      const distanceMiles = (row.distance_meters / 1609.34).toFixed(1);
      console.log(`   ${index + 1}. Tract ${row.geo_id}:`);
      console.log(`      - Distance: ${distanceMiles} miles`);
      console.log(`      - Population: ${row.total_pop?.toLocaleString() || 'N/A'}`);
      console.log(`      - 65+: ${row.pop_65_plus?.toLocaleString() || 'N/A'}`);
      console.log(`      - Median Income: $${row.median_income?.toLocaleString() || 'N/A'}`);
      console.log(`      - Centroid: ${row.centroid_lat?.toFixed(4)}, ${row.centroid_lon?.toFixed(4)}`);
    });

    if (spatialRows.length > 0) {
      console.log('\n✅ Tract-level spatial queries are working!');
      console.log('🚀 You can now offer tract-level census data in your API.');
    } else {
      console.log('\n⚠️  No tracts found in the test area. This might be normal for rural areas.');
    }

  } catch (error) {
    console.error('❌ Tract integration test failed:', error);
    console.error('');
    console.error('🔧 This might mean:');
    console.error('   1. TIGER/Line geometry tables are not available in BigQuery');
    console.error('   2. The join between ACS and geometry data is not working');
    console.error('   3. Spatial functions are not available');
    console.error('');
    console.error('📝 Recommendation: Stick with county-level data for now.');
  }
}

// Run the test
testTractIntegration(); 