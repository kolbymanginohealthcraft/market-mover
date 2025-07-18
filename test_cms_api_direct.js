import fetch from 'node-fetch';

async function testCMS() {
  console.log('🧪 Testing CMS API with filter syntax...');
  
  try {
    const uuid = "0422c1f3-1421-42e4-bbe6-f95a4ebe4aec";
    
    // Test single FIPS filter (Dallas County)
    console.log('1. Testing single FIPS filter...');
    const singleFipsUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?filter[BENE_FIPS_CD]=48113&filter[YEAR]=2013`;
    console.log(`📡 Calling: ${singleFipsUrl}`);
    
    const singleResponse = await fetch(singleFipsUrl);
    console.log(`📊 Status: ${singleResponse.status}`);
    
    if (singleResponse.ok) {
      const singleData = await singleResponse.json();
      console.log(`✅ Single FIPS: Got ${singleData.length} records`);
      if (singleData.length > 0) {
        console.log('📊 Sample record:', singleData[0]);
      }
    } else {
      console.log(`❌ Single FIPS failed: ${singleResponse.statusText}`);
    }
    
    // Test multiple FIPS filter
    console.log('\n2. Testing multiple FIPS filter...');
    const multipleFipsUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?filter[BENE_FIPS_CD]=48113,48085,48397&filter[YEAR]=2013`;
    console.log(`📡 Calling: ${multipleFipsUrl}`);
    
    const multipleResponse = await fetch(multipleFipsUrl);
    console.log(`📊 Status: ${multipleResponse.status}`);
    
    if (multipleResponse.ok) {
      const multipleData = await multipleResponse.json();
      console.log(`✅ Multiple FIPS: Got ${multipleData.length} records`);
      if (multipleData.length > 0) {
        console.log('📊 Found counties:');
        multipleData.forEach(record => {
          console.log(`  - ${record.BENE_COUNTY_DESC} (${record.BENE_FIPS_CD}): ${record.TOT_BENES} beneficiaries`);
        });
      }
    } else {
      console.log(`❌ Multiple FIPS failed: ${multipleResponse.statusText}`);
    }
    
    // Test without year filter to see if that's the issue
    console.log('\n3. Testing without year filter...');
    const noYearUrl = `https://data.cms.gov/data-api/v1/dataset/${uuid}/data?filter[BENE_FIPS_CD]=48113`;
    console.log(`📡 Calling: ${noYearUrl}`);
    
    const noYearResponse = await fetch(noYearUrl);
    console.log(`📊 Status: ${noYearResponse.status}`);
    
    if (noYearResponse.ok) {
      const noYearData = await noYearResponse.json();
      console.log(`✅ No year filter: Got ${noYearData.length} records`);
      if (noYearData.length > 0) {
        console.log('📊 Years found:', [...new Set(noYearData.map(r => r.YEAR))].sort());
        console.log('📊 Sample records:');
        noYearData.slice(0, 3).forEach(record => {
          console.log(`  - ${record.BENE_COUNTY_DESC} (${record.BENE_FIPS_CD}) ${record.YEAR}: ${record.TOT_BENES} beneficiaries`);
        });
      }
    } else {
      console.log(`❌ No year filter failed: ${noYearResponse.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCMS(); 