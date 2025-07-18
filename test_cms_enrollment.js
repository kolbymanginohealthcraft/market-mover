import fetch from 'node-fetch';

async function testCMSEnrollment() {
  console.log('🧪 Testing CMS Enrollment API...\n');

  try {
    // Test 1: Get available years
    console.log('1. Testing /api/cms-enrollment-years...');
    const yearsResponse = await fetch('http://localhost:5000/api/cms-enrollment-years');
    const yearsResult = await yearsResponse.json();
    
    if (yearsResult.success) {
      console.log('✅ Years endpoint working');
      console.log('Available years:', yearsResult.data);
    } else {
      console.log('❌ Years endpoint failed:', yearsResult.error);
    }

    // Test 2: Get enrollment data for a specific county
    console.log('\n2. Testing /api/cms-enrollment...');
    const enrollmentResponse = await fetch('http://localhost:5000/api/cms-enrollment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fipsList: ['29057'], // Jackson County, MO
        year: '2023'
      })
    });
    const enrollmentResult = await enrollmentResponse.json();
    
    if (enrollmentResult.success) {
      console.log('✅ Enrollment endpoint working');
      console.log('Found', enrollmentResult.data.length, 'records');
      if (enrollmentResult.data.length > 0) {
        console.log('Sample record:', enrollmentResult.data[0]);
      }
    } else {
      console.log('❌ Enrollment endpoint failed:', enrollmentResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCMSEnrollment(); 