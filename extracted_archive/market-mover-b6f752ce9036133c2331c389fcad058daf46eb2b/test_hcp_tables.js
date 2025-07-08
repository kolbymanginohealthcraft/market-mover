import { BigQuery } from '@google-cloud/bigquery';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize BigQuery client with vendor credentials
const vendorBigQuery = new BigQuery({
  keyFilename: path.join(__dirname, 'server', 'credentials', 'vendor-access.json'),
  projectId: 'populi-clients'
});

async function testHcpTables() {
  console.log('Testing HCP table accessibility...\n');

  const tablesToTest = [
    'aegis_access.hcp_base_flat',
    'aegis_access.hcp_base'
  ];

  for (const tableName of tablesToTest) {
    console.log(`\n=== Testing ${tableName} ===`);
    
    try {
      // Test 1: Check if table exists and is accessible
      console.log('1. Testing table accessibility...');
      const [metadata] = await vendorBigQuery.dataset('aegis_access').table(tableName.split('.')[1]).getMetadata();
      console.log(`✅ Table accessible: ${metadata.tableReference.tableId}`);
      console.log(`   Type: ${metadata.type}`);
      console.log(`   Row count: ${metadata.numRows?.toLocaleString() || 'Unknown'}`);
      
      // Test 2: Check for required columns
      console.log('\n2. Checking for required columns...');
      const schema = metadata.schema.fields;
      const requiredColumns = [
        'primary_address_lat',
        'primary_address_long', 
        'primary_taxonomy_classification',
        'npi_deactivation_date'
      ];
      
      const foundColumns = [];
      const missingColumns = [];
      
      for (const column of requiredColumns) {
        const field = schema.find(f => f.name === column);
        if (field) {
          foundColumns.push(`${column} (${field.type})`);
        } else {
          missingColumns.push(column);
        }
      }
      
      if (foundColumns.length > 0) {
        console.log('✅ Found columns:');
        foundColumns.forEach(col => console.log(`   - ${col}`));
      }
      
      if (missingColumns.length > 0) {
        console.log('❌ Missing columns:');
        missingColumns.forEach(col => console.log(`   - ${col}`));
      }
      
      // Test 3: Try a simple query
      console.log('\n3. Testing simple query...');
      const query = `
        SELECT 
          COUNT(*) as total_count,
          COUNT(CASE WHEN npi_deactivation_date IS NULL THEN 1 END) as active_count,
          COUNT(CASE WHEN primary_address_lat IS NOT NULL AND primary_address_long IS NOT NULL THEN 1 END) as with_coordinates
        FROM \`${tableName}\`
        LIMIT 1
      `;
      
      const [rows] = await vendorBigQuery.query({ query });
      console.log('✅ Query successful:');
      console.log(`   Total records: ${rows[0].total_count?.toLocaleString() || 'N/A'}`);
      console.log(`   Active records: ${rows[0].active_count?.toLocaleString() || 'N/A'}`);
      console.log(`   With coordinates: ${rows[0].with_coordinates?.toLocaleString() || 'N/A'}`);
      
      // Test 4: Check for taxonomy classifications
      console.log('\n4. Checking taxonomy classifications...');
      const taxonomyQuery = `
        SELECT 
          primary_taxonomy_classification,
          COUNT(*) as count
        FROM \`${tableName}\`
        WHERE npi_deactivation_date IS NULL
          AND primary_taxonomy_classification IS NOT NULL
        GROUP BY primary_taxonomy_classification
        ORDER BY count DESC
        LIMIT 10
      `;
      
      const [taxonomyRows] = await vendorBigQuery.query({ query: taxonomyQuery });
      console.log('✅ Top taxonomy classifications:');
      taxonomyRows.forEach(row => {
        console.log(`   - ${row.primary_taxonomy_classification}: ${row.count.toLocaleString()}`);
      });
      
    } catch (error) {
      console.log(`❌ Error with ${tableName}:`);
      console.log(`   ${error.message}`);
      
      if (error.message.includes('Access Denied')) {
        console.log('   🔒 This appears to be a permissions issue');
      } else if (error.message.includes('Not found')) {
        console.log('   📍 Table does not exist');
      }
    }
  }
  
  console.log('\n=== Summary ===');
  console.log('Check the results above to determine which table to use for the provider density feature.');
}

testHcpTables().catch(console.error); 