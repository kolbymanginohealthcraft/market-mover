import fetch from 'node-fetch';

async function testProviderDensity() {
  try {
    console.log('Testing provider density API...\n');
    
    // Test the main provider density endpoint
    const response = await fetch('http://localhost:5000/api/provider-density?lat=40.7128&lon=-74.0060&radius=25');
    const data = await response.json();
    
    console.log('Provider Density Response:');
    console.log('Success:', data.success);
    console.log('Total specialties:', data.count);
    console.log('Total providers:', data.data?.reduce((sum, item) => sum + item.provider_count, 0) || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\nTop 5 specialties:');
      data.data.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.specialty}: ${item.provider_count.toLocaleString()} providers`);
      });
    }
    
    // Test the details endpoint for a specific specialty
    console.log('\n\nTesting provider density details...');
    const detailsResponse = await fetch('http://localhost:5000/api/provider-density-details?lat=40.7128&lon=-74.0060&radius=25&specialty=Counselor');
    const detailsData = await detailsResponse.json();
    
    console.log('Details Response:');
    console.log('Success:', detailsData.success);
    console.log('Provider count:', detailsData.count);
    
    if (detailsData.data && detailsData.data.length > 0) {
      console.log('\nFirst provider details:');
      const firstProvider = detailsData.data[0];
      console.log('NPI:', firstProvider.npi);
      console.log('Provider Name:', firstProvider.provider_name);
      console.log('Specialty:', firstProvider.specialty);
      console.log('Distance:', firstProvider.distance_miles, 'miles');
      console.log('All fields:', Object.keys(firstProvider));
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testProviderDensity(); 