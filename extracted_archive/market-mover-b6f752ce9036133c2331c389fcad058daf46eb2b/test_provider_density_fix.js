import fetch from 'node-fetch';

async function testProviderDensityFix() {
  try {
    console.log('Testing provider density API fixes...\n');
    
    // Test Denver, CO coordinates (which was causing issues)
    const denverLat = 39.7392;
    const denverLon = -104.9903;
    
    console.log('Testing Denver, CO provider density...');
    const response = await fetch(`http://localhost:5000/api/provider-density?lat=${denverLat}&lon=${denverLon}&radius=25`);
    const data = await response.json();
    
    console.log('Denver Provider Density Response:');
    console.log('Success:', data.success);
    console.log('Total specialties:', data.count);
    console.log('Total providers:', data.data?.reduce((sum, item) => sum + item.provider_count, 0) || 0);
    
    // Check for null specialties
    const nullSpecialties = data.data?.filter(item => !item.specialty) || [];
    console.log('Items with null specialties:', nullSpecialties.length);
    
    if (data.data && data.data.length > 0) {
      console.log('\nTop 5 specialties:');
      data.data.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.specialty || 'NULL'}: ${item.provider_count.toLocaleString()} providers`);
      });
    }
    
    // Test refresh parameter
    console.log('\n\nTesting refresh parameter...');
    const refreshResponse = await fetch(`http://localhost:5000/api/provider-density?lat=${denverLat}&lon=${denverLon}&radius=25&refresh=true`);
    const refreshData = await refreshResponse.json();
    
    console.log('Refresh Response:');
    console.log('Success:', refreshData.success);
    console.log('Cached:', refreshData.cached);
    console.log('Total providers:', refreshData.data?.reduce((sum, item) => sum + item.provider_count, 0) || 0);
    
    // Test another location for comparison
    console.log('\n\nTesting New York, NY for comparison...');
    const nyLat = 40.7128;
    const nyLon = -74.0060;
    
    const nyResponse = await fetch(`http://localhost:5000/api/provider-density?lat=${nyLat}&lon=${nyLon}&radius=25`);
    const nyData = await nyResponse.json();
    
    console.log('NY Provider Density Response:');
    console.log('Success:', nyData.success);
    console.log('Total specialties:', nyData.count);
    console.log('Total providers:', nyData.data?.reduce((sum, item) => sum + item.provider_count, 0) || 0);
    
    if (nyData.data && nyData.data.length > 0) {
      console.log('\nTop 3 specialties:');
      nyData.data.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.specialty || 'NULL'}: ${item.provider_count.toLocaleString()} providers`);
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testProviderDensityFix(); 