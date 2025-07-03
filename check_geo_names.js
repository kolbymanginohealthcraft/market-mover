import myBigQuery from "./server/utils/myBigQueryClient.js";

async function checkGeoNameTables() {
  try {
    console.log('🔍 Checking for geographic name tables...\n');
    
    // Check for geographic name tables
    const query = `
      SELECT 
        table_schema,
        table_name,
        table_type
      FROM \`bigquery-public-data\`.INFORMATION_SCHEMA.TABLES
      WHERE table_schema LIKE '%geo%' 
         OR table_name LIKE '%name%'
         OR table_name LIKE '%county%'
         OR table_name LIKE '%state%'
         OR table_name LIKE '%fips%'
      ORDER BY table_schema, table_name
      LIMIT 50
    `;
    
    const [rows] = await myBigQuery.query({ query, location: 'US' });
    console.log('📊 Available geographic name tables:');
    rows.forEach(row => {
      console.log(`  - ${row.table_schema}.${row.table_name} (${row.table_type})`);
    });
    
    // Check specific tables that might have county names
    const specificTables = [
      'bigquery-public-data.census_bureau_acs.county_2020_5yr',
      'bigquery-public-data.geo_census_tracts.us_census_tracts_national',
      'bigquery-public-data.census_utility.fips_codes_all'
    ];
    
    console.log('\n🔍 Checking specific tables for name columns...');
    for (const tableName of specificTables) {
      try {
        const schemaQuery = `
          SELECT column_name, data_type
          FROM \`${tableName}\`.INFORMATION_SCHEMA.COLUMNS
          WHERE column_name LIKE '%name%' 
             OR column_name LIKE '%county%'
             OR column_name LIKE '%state%'
          ORDER BY column_name
        `;
        
        const [schemaRows] = await myBigQuery.query({ query: schemaQuery, location: 'US' });
        if (schemaRows.length > 0) {
          console.log(`\n📋 ${tableName}:`);
          schemaRows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
          });
        }
      } catch (err) {
        console.log(`❌ Error checking ${tableName}: ${err.message}`);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkGeoNameTables(); 