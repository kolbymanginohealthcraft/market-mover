const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';

async function testClaimsAPI() {
  console.log('🧪 Testing Claims API...\n');

  // Test 1: Claims volume endpoint
  console.log('1. Testing claims volume endpoint...');
  try {
    const response = await fetch(`${API_BASE}/claims-volume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        npis: ['1234567890'],
        claimType: 'rendered',
        dataType: 'diagnosis'
      }),
    });
    
    const result = await response.json();
    console.log('✅ Claims volume response:', {
      success: result.success,
      dataLength: result.data?.length || 0,
      debug: result.debug
    });
  } catch (error) {
    console.log('❌ Claims volume error:', error.message);
  }

  // Test 2: Claims by provider endpoint
  console.log('\n2. Testing claims by provider endpoint...');
  try {
    const response = await fetch(`${API_BASE}/claims-by-provider`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        npis: ['1234567890'],
        claimType: 'referred',
        dataType: 'procedure'
      }),
    });
    
    const result = await response.json();
    console.log('✅ Claims by provider response:', {
      success: result.success,
      dataLength: result.data?.length || 0,
      debug: result.debug
    });
  } catch (error) {
    console.log('❌ Claims by provider error:', error.message);
  }

  // Test 3: Claims by service line endpoint
  console.log('\n3. Testing claims by service line endpoint...');
  try {
    const response = await fetch(`${API_BASE}/claims-by-service-line`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        npis: ['1234567890'],
        claimType: 'rendered',
        dataType: 'diagnosis'
      }),
    });
    
    const result = await response.json();
    console.log('✅ Claims by service line response:', {
      success: result.success,
      dataLength: result.data?.length || 0,
      debug: result.debug
    });
  } catch (error) {
    console.log('❌ Claims by service line error:', error.message);
  }

  // Test 4: Invalid combination
  console.log('\n4. Testing invalid claim type/data type combination...');
  try {
    const response = await fetch(`${API_BASE}/claims-volume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        npis: ['1234567890'],
        claimType: 'invalid',
        dataType: 'diagnosis'
      }),
    });
    
    const result = await response.json();
    console.log('✅ Invalid combination response:', {
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.log('❌ Invalid combination error:', error.message);
  }

  console.log('\n🏁 Claims API testing complete!');
}

// Run the test
testClaimsAPI().catch(console.error); 