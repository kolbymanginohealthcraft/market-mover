import { BigQuery } from '@google-cloud/bigquery';

const vendorBigQuery = new BigQuery({
  projectId: 'populi-clients',
  keyFilename: './server/credentials/vendor-access.json'
});

async function testHcpFlatSchema() {
  console.log('🔍 Testing hcp_flat table schema...\n');

  try {
    // Test 1: Check if we can access the table
    console.log('1. Testing basic access to hcp_flat table...');
    
    const basicQuery = `
      SELECT COUNT(*) as total_count
      FROM \`aegis_access.hcp_flat\`
      LIMIT 1
    `;
    
    const [basicRows] = await vendorBigQuery.query({ query: basicQuery });
    console.log(`✅ Successfully accessed hcp_flat table. Total rows: ${basicRows[0]?.total_count?.toLocaleString()}`);
    console.log('');

    // Test 2: Check the schema
    console.log('2. Checking hcp_flat table schema...');
    
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM \`aegis_access.INFORMATION_SCHEMA.COLUMNS\`
      WHERE table_name = 'hcp_flat'
      ORDER BY ordinal_position
    `;
    
    const [schemaRows] = await vendorBigQuery.query({ query: schemaQuery });
    
    console.log(`📊 hcp_flat table has ${schemaRows.length} columns:`);
    schemaRows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    console.log('');

    // Test 3: Check for location columns
    console.log('3. Looking for location-related columns...');
    const locationColumns = schemaRows.filter(col => 
      col.column_name.toLowerCase().includes('lat') || 
      col.column_name.toLowerCase().includes('lon') || 
      col.column_name.toLowerCase().includes('address')
    );
    
    console.log(`📍 Found ${locationColumns.length} location-related columns:`);
    locationColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log('');

    // Test 4: Check for taxonomy/specialty columns
    console.log('4. Looking for taxonomy/specialty-related columns...');
    const taxonomyColumns = schemaRows.filter(col => 
      col.column_name.toLowerCase().includes('taxonomy') || 
      col.column_name.toLowerCase().includes('specialty') || 
      col.column_name.toLowerCase().includes('classification')
    );
    
    console.log(`🏥 Found ${taxonomyColumns.length} taxonomy/specialty-related columns:`);
    taxonomyColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log('');

    // Test 5: Check for deactivation/status columns
    console.log('5. Looking for deactivation/status-related columns...');
    const statusColumns = schemaRows.filter(col => 
      col.column_name.toLowerCase().includes('deactivation') || 
      col.column_name.toLowerCase().includes('status') || 
      col.column_name.toLowerCase().includes('active')
    );
    
    console.log(`📋 Found ${statusColumns.length} status-related columns:`);
    statusColumns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    console.log('');

    // Test 6: Sample data to see actual values
    console.log('6. Getting sample data to see actual values...');
    
    const sampleQuery = `
      SELECT *
      FROM \`aegis_access.hcp_flat\`
      WHERE primary_address_lat IS NOT NULL 
        AND primary_address_long IS NOT NULL
        AND npi_deactivation_date IS NULL
      LIMIT 3
    `;
    
    const [sampleRows] = await vendorBigQuery.query({ query: sampleQuery });
    
    if (sampleRows.length > 0) {
      console.log('📊 Sample row structure:');
      const sample = sampleRows[0];
      Object.keys(sample).forEach(key => {
        console.log(`   ${key}: ${sample[key]}`);
      });
    } else {
      console.log('⚠️  No sample data found with location and active status');
    }

  } catch (error) {
    console.error('❌ Error testing hcp_flat schema:', error);
  }
}

testHcpFlatSchema(); 