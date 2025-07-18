import fetch from 'node-fetch';

async function testCMS() {
  console.log('🧪 Testing CMS enrollment with filter-based API...');
  
  try {
    // Test the years endpoint
    console.log('1. Testing /api/cms-enrollment-years...');
    const yearsResponse = await fetch('http://localhost:5000/api/cms-enrollment-years');
    const yearsData = await yearsResponse.json();
    console.log('✅ Years response:', yearsData);
    
    // Test the enrollment endpoint with Texas counties
    console.log('2. Testing /api/cms-enrollment...');
    const enrollmentResponse = await fetch('http://localhost:5000/api/cms-enrollment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fipsList: ['48113', '48085', '48397'], // Texas counties
        year: '2013'
      })
    });
    const enrollmentData = await enrollmentResponse.json();
    console.log('✅ Enrollment response:', enrollmentData);
    
    if (enrollmentData.success && enrollmentData.data.length > 0) {
      console.log('📊 Found enrollment data:');
      enrollmentData.data.forEach(record => {
        console.log(`  - ${record.county} (${record.fips}): ${record.total_benes} beneficiaries`);
      });
    } else {
      console.log('❌ No enrollment data found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCMS(); 