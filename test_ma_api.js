import fetch from 'node-fetch';

async function testMAEnrollmentAPI() {
  console.log('🔍 Testing MA Enrollment API...\n');

  try {
    const response = await fetch('http://localhost:5000/api/ma-enrollment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fipsList: ['48113', '48085', '48397'],
        publishDate: '2025-03-01'
      })
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`✅ Found ${data.data.length} MA enrollment records`);
      if (data.data.length > 0) {
        console.log('Sample record:', data.data[0]);
      }
    } else {
      console.log('❌ API error:', data.error);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testMAEnrollmentAPI(); 