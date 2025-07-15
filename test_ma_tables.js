import { BigQuery } from '@google-cloud/bigquery';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function testMATables() {
  console.log('🔍 Testing MA Enrollment Tables...\n');

  try {
    // Test 1: Check if MA tables exist
    console.log('1. Checking MA tables availability...');
    
    const tablesQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.payers.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name LIKE 'ma_%'
      ORDER BY table_name
    `;
    
    const [tableRows] = await myBigQuery.query({ query: tablesQuery, location: "US" });
    
    console.log('📊 Available MA tables:');
    tableRows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

    if (tableRows.length === 0) {
      console.log('❌ No MA tables found in payers dataset');
      return;
    }

    // Test 2: Check schema of each MA table
    for (const tableRow of tableRows) {
      const tableName = tableRow.table_name;
      console.log(`2. Checking schema for ${tableName}...`);
      
      const schemaQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM \`market-mover-464517.payers.INFORMATION_SCHEMA.COLUMNS\`
        WHERE table_name = '${tableName}'
        ORDER BY ordinal_position
      `;
      
      const [schemaRows] = await myBigQuery.query({ query: schemaQuery, location: "US" });
      
      console.log(`📋 Schema for ${tableName} (${schemaRows.length} columns):`);
      schemaRows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
      });
      console.log('');

      // Test 3: Get sample data from each table
      console.log(`3. Getting sample data from ${tableName}...`);
      
      const sampleQuery = `
        SELECT *
        FROM \`market-mover-464517.payers.${tableName}\`
        LIMIT 5
      `;
      
      const [sampleRows] = await myBigQuery.query({ query: sampleQuery, location: "US" });
      
      console.log(`📊 Sample data from ${tableName} (${sampleRows.length} rows):`);
      sampleRows.forEach((row, index) => {
        console.log(`   Row ${index + 1}:`, JSON.stringify(row, null, 2));
      });
      console.log('');
    }

    // Test 4: Check for county FIPS codes in MA tables
    console.log('4. Checking for county FIPS codes in MA tables...');
    
    const fipsQuery = `
      SELECT 
        'ma_enrollment' as table_name,
        COUNT(*) as total_rows,
        COUNT(CASE WHEN fips IS NOT NULL THEN 1 END) as rows_with_fips
      FROM \`market-mover-464517.payers.ma_enrollment\`
      UNION ALL
      SELECT 
        'ma_penetration' as table_name,
        COUNT(*) as total_rows,
        COUNT(CASE WHEN fips IS NOT NULL THEN 1 END) as rows_with_fips
      FROM \`market-mover-464517.payers.ma_penetration\`
    `;
    
    const [fipsRows] = await myBigQuery.query({ query: fipsQuery, location: "US" });
    
    console.log('📊 County FIPS code availability:');
    fipsRows.forEach(row => {
      console.log(`   - ${row.table_name}: ${row.total_rows?.toLocaleString()} total rows, ${row.rows_with_fips?.toLocaleString()} with FIPS`);
    });
    console.log('');

    // Test 5: Check sample county FIPS codes
    console.log('5. Checking sample county FIPS codes...');
    
    const sampleFipsQuery = `
      SELECT DISTINCT fips
      FROM \`market-mover-464517.payers.ma_enrollment\`
      WHERE fips IS NOT NULL
      LIMIT 10
    `;
    
    const [sampleFipsRows] = await myBigQuery.query({ query: sampleFipsQuery, location: "US" });
    
    console.log('📊 Sample county FIPS codes:');
    sampleFipsRows.forEach(row => {
      console.log(`   - ${row.fips}`);
    });
    console.log('');

    // Test 6: Check enrollment data structure
    console.log('6. Checking enrollment data structure...');
    
    const enrollmentQuery = `
      SELECT 
        fips,
        plan_id,
        publish_date,
        enrollment
      FROM \`market-mover-464517.payers.ma_enrollment\`
      WHERE fips IS NOT NULL
      LIMIT 5
    `;
    
    const [enrollmentRows] = await myBigQuery.query({ query: enrollmentQuery, location: "US" });
    
    console.log('📊 Sample enrollment data:');
    enrollmentRows.forEach((row, index) => {
      console.log(`   Row ${index + 1}:`);
      console.log(`     - County FIPS: ${row.fips}`);
      console.log(`     - Plan ID: ${row.plan_id}`);
      console.log(`     - Publish Date: ${row.publish_date?.value || row.publish_date}`);
      console.log(`     - Enrollment: ${row.enrollment}`);
    });
    console.log('');

    console.log('🎉 MA tables test completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ MA tables are available');
    console.log('   ✅ County FIPS codes are present');
    console.log('   ✅ Enrollment data structure is clear');
    console.log('   ✅ Ready to implement MA Enrollment tab');

  } catch (error) {
    console.error('❌ MA tables test failed:', error);
    console.error('');
    console.error('🔧 Troubleshooting tips:');
    console.error('   1. Check BigQuery permissions for payers dataset');
    console.error('   2. Verify service account has necessary access');
    console.error('   3. Ensure MA tables exist in the payers dataset');
  }
}

async function printFipsForRowlett() {
  const lat = 32.9029;
  const lon = -96.5639;
  const radiusMiles = 10;
  const radiusMeters = radiusMiles * 1609.34;

  const bqQuery = `
    SELECT DISTINCT
      state_fips_code,
      county_fips_code
    FROM \`bigquery-public-data.geo_census_tracts.us_census_tracts_national\`
    WHERE ST_DISTANCE(
      ST_GEOGPOINT(CAST(internal_point_lon AS FLOAT64), CAST(internal_point_lat AS FLOAT64)),
      ST_GEOGPOINT(@lon, @lat)
    ) <= @radiusMeters
  `;

  const [rows] = await myBigQuery.query({
    query: bqQuery,
    location: 'US',
    params: { lat, lon, radiusMeters }
  });

  const fipsList = rows.map(r => `${r.state_fips_code.toString().padStart(2, '0')}${r.county_fips_code.toString().padStart(3, '0')}`);
  console.log('FIPS codes for Rowlett, TX (10mi radius):', fipsList);
  console.log('Count:', fipsList.length);
}

printFipsForRowlett();

testMATables(); 