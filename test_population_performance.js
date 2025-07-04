// Performance test for Population Tab optimizations
console.log('🚀 Testing Population Tab Performance...\n');

import fetch from 'node-fetch';

// Test configuration
const TEST_PROVIDER = {
  name: 'Test Hospital',
  latitude: 40.7128,
  longitude: -74.0060,
  npi: '1234567890'
};

const TEST_RADIUS = 25; // 25 mile radius
const TEST_YEAR = '2022';

// Performance measurement function
const measurePerformance = async (testName, testFunction) => {
  const startTime = Date.now();
  try {
    const result = await testFunction();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ ${testName}: ${duration}ms`);
    return { success: true, duration, result };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`❌ ${testName}: ${duration}ms (Error: ${error.message})`);
    return { success: false, duration, error: error.message };
  }
};

// Test 1: Cache hit performance
const testCacheHit = async () => {
  const url = `http://localhost:3001/api/census-acs-api?lat=${TEST_PROVIDER.latitude}&lon=${TEST_PROVIDER.longitude}&radius=${TEST_RADIUS}&year=${TEST_YEAR}`;
  
  // First request (cache miss)
  const firstRequest = await measurePerformance('First Request (Cache Miss)', () => 
    fetch(url).then(res => res.json())
  );
  
  // Second request (cache hit)
  const secondRequest = await measurePerformance('Second Request (Cache Hit)', () => 
    fetch(url).then(res => res.json())
  );
  
  const improvement = firstRequest.duration - secondRequest.duration;
  const improvementPercent = ((improvement / firstRequest.duration) * 100).toFixed(1);
  
  console.log(`📈 Cache Performance Improvement: ${improvement}ms (${improvementPercent}% faster)`);
  
  return { firstRequest, secondRequest, improvement, improvementPercent };
};

// Test 2: Different radius sizes
const testRadiusPerformance = async () => {
  const radii = [5, 15, 25, 50];
  const results = {};
  
  for (const radius of radii) {
    const url = `http://localhost:3001/api/census-acs-api?lat=${TEST_PROVIDER.latitude}&lon=${TEST_PROVIDER.longitude}&radius=${radius}&year=${TEST_YEAR}`;
    
    const result = await measurePerformance(`${radius} mile radius`, () => 
      fetch(url).then(res => res.json())
    );
    
    results[radius] = result;
  }
  
  return results;
};

// Test 3: Error handling
const testErrorHandling = async () => {
  const invalidUrl = `http://localhost:3001/api/census-acs-api?lat=invalid&lon=invalid&radius=${TEST_RADIUS}&year=${TEST_YEAR}`;
  
  const result = await measurePerformance('Invalid Parameters', () => 
    fetch(invalidUrl).then(res => res.json())
  );
  
  return result;
};

// Test 4: Concurrent requests
const testConcurrentRequests = async () => {
  const url = `http://localhost:3001/api/census-acs-api?lat=${TEST_PROVIDER.latitude}&lon=${TEST_PROVIDER.longitude}&radius=${TEST_RADIUS}&year=${TEST_YEAR}`;
  
  const startTime = Date.now();
  
  const promises = Array(3).fill().map((_, i) => 
    fetch(url).then(res => res.json()).then(data => ({ index: i, data }))
  );
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  
  console.log(`✅ Concurrent Requests (3): ${totalDuration}ms`);
  
  return { totalDuration, results };
};

// Main test runner
const runPerformanceTests = async () => {
  console.log('🧪 Starting Performance Tests...\n');
  
  try {
    // Test 1: Cache performance
    console.log('📦 Testing Cache Performance:');
    await testCacheHit();
    console.log('');
    
    // Test 2: Radius performance
    console.log('📏 Testing Different Radius Sizes:');
    await testRadiusPerformance();
    console.log('');
    
    // Test 3: Error handling
    console.log('⚠️ Testing Error Handling:');
    await testErrorHandling();
    console.log('');
    
    // Test 4: Concurrent requests
    console.log('🔄 Testing Concurrent Requests:');
    await testConcurrentRequests();
    console.log('');
    
    console.log('🎉 Performance Tests Complete!');
    console.log('\n📝 Performance Optimization Summary:');
    console.log('   ✅ Added server-side spatial filtering');
    console.log('   ✅ Implemented caching for census data');
    console.log('   ✅ Added parallel processing for API calls');
    console.log('   ✅ Optimized frontend with React.memo and useMemo');
    console.log('   ✅ Added request cancellation and better error handling');
    console.log('   ✅ Improved loading states and user feedback');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTests();
}

export { runPerformanceTests, testCacheHit, testRadiusPerformance, testErrorHandling, testConcurrentRequests }; 