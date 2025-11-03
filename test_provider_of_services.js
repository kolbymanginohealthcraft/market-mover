/**
 * Test script for Provider of Services File API connection
 * Run with: node test_provider_of_services.js
 */

const API_BASE = 'http://localhost:5000/api';

async function testConnection() {
  console.log('🧪 Testing Provider of Services File API Connection\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Get Schema
    console.log('\n1️⃣ Testing GET /api/provider-of-services-schema');
    console.log('-'.repeat(60));
    const schemaResp = await fetch(`${API_BASE}/provider-of-services-schema`);
    const schemaData = await schemaResp.json();
    if (schemaData.success) {
      console.log(`✅ Success! Found ${schemaData.data.length} fields`);
      console.log(`📋 Sample fields: ${schemaData.data.slice(0, 10).join(', ')}...`);
    } else {
      console.log(`❌ Error: ${schemaData.error}`);
    }

    // Test 2: Get sample data with no filters
    console.log('\n2️⃣ Testing POST /api/provider-of-services (no filters, limit 5)');
    console.log('-'.repeat(60));
    const sampleResp = await fetch(`${API_BASE}/provider-of-services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 5 })
    });
    const sampleData = await sampleResp.json();
    if (sampleData.success) {
      console.log(`✅ Success! Got ${sampleData.data.length} records`);
      if (sampleData.data.length > 0) {
        const firstRecord = sampleData.data[0];
        console.log('\n📊 Sample record fields:');
        Object.entries(firstRecord).slice(0, 10).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
    } else {
      console.log(`❌ Error: ${sampleData.error}`);
    }

    // Test 3: Filter by state
    console.log('\n3️⃣ Testing POST /api/provider-of-services (filter by state = MO)');
    console.log('-'.repeat(60));
    const stateResp = await fetch(`${API_BASE}/provider-of-services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        filters: { STATE: 'MO' },
        limit: 3 
      })
    });
    const stateData = await stateResp.json();
    if (stateData.success) {
      console.log(`✅ Success! Found ${stateData.data.length} facilities in Missouri`);
      if (stateData.data.length > 0) {
        console.log('\n📊 Sample Missouri facility:');
        const facility = stateData.data[0];
        ['FACILITY_NAME', 'CITY_NAME', 'STATE', 'PRVDR_CTGRY_CD', 'ZIP_CD'].forEach(key => {
          if (facility[key] !== undefined) {
            console.log(`   ${key}: ${facility[key]}`);
          }
        });
      }
    } else {
      console.log(`❌ Error: ${stateData.error}`);
    }

    // Test 4: Get by FIPS
    console.log('\n4️⃣ Testing GET /api/provider-of-services-by-fips?state=MO');
    console.log('-'.repeat(60));
    const fipsResp = await fetch(`${API_BASE}/provider-of-services-by-fips?state=MO`);
    const fipsData = await fipsResp.json();
    if (fipsData.success) {
      console.log(`✅ Success! Found ${fipsData.data.length} facilities in Missouri`);
    } else {
      console.log(`❌ Error: ${fipsData.error}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed!');
    console.log('\n💡 Tip: You can also test these endpoints in:');
    console.log('   - Browser: http://localhost:5000/api/provider-of-services-schema');
    console.log('   - Postman or similar API testing tools');
    console.log('   - Frontend components using fetch()');

  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\n⚠️  Make sure your server is running on port 5000');
    console.log('   Start it with: npm run dev (or your usual server command)');
  }
}

testConnection();

