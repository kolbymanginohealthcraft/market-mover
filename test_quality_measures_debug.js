import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function testQualityMeasures() {
  console.log('🔍 Testing Quality Measures Data...\n');

  try {
    // Test 1: Check what tables exist
    console.log('1. Checking available tables...');
    const debugResponse = await fetch(`${API_BASE}/api/qm_debug`);
    const debugData = await debugResponse.json();
    console.log('Debug data:', JSON.stringify(debugData, null, 2));

    // Test 2: Check what CCNs are available in the quality measures data
    console.log('\n2. Checking available CCNs in quality measures...');
    const ccnTestResponse = await fetch(`${API_BASE}/api/qm_combined`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ccns: ['455904', '450742', '670044', '455617', '455731'], // Sample CCNs from logs
        publish_date: '2025-04-01'
      })
    });
    const ccnTestData = await ccnTestResponse.json();
    console.log('CCN test response:', JSON.stringify(ccnTestData, null, 2));

    // Test 3: Check what dates are available
    console.log('\n3. Checking available dates...');
    const datesResponse = await fetch(`${API_BASE}/api/qm_combined`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ccns: ['455904'], // Single CCN for testing
        publish_date: 'latest'
      })
    });
    const datesData = await datesResponse.json();
    console.log('Available dates test:', JSON.stringify(datesData, null, 2));

    // Test 4: Check what CCNs exist in the provider table
    console.log('\n4. Checking CCNs in provider table...');
    const providerResponse = await fetch(`${API_BASE}/api/qm_provider/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ccns: ['455904', '450742', '670044', '455617', '455731'],
        publish_date: '2025-04-01'
      })
    });
    const providerData = await providerResponse.json();
    console.log('Provider data test:', JSON.stringify(providerData, null, 2));

  } catch (error) {
    console.error('❌ Error testing quality measures:', error);
  }
}

testQualityMeasures(); 