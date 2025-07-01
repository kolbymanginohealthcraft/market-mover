import vendorBigQueryClient from "./server/utils/vendorBigQueryClient.js";

async function testVendorConnection() {
  try {
    console.log("🔍 Testing vendor BigQuery connection...");
    
    // Test 1: Check if we can connect and list datasets
    const [datasets] = await vendorBigQueryClient.getDatasets();
    
    console.log("✅ Successfully connected to vendor BigQuery");
    console.log(`📊 Found ${datasets.length} datasets`);
    
    // List all datasets
    datasets.forEach(dataset => {
      console.log(`  - ${dataset.id}`);
    });
    
    // Test 2: Check tables in each dataset
    for (const dataset of datasets) {
      console.log(`\n🔍 Checking tables in dataset: ${dataset.id}`);
      
      try {
        const datasetRef = vendorBigQueryClient.dataset(dataset.id);
        const [tables] = await datasetRef.getTables();
        
        console.log(`  📋 Found ${tables.length} tables:`);
        tables.forEach(table => {
          console.log(`    - ${table.id}`);
        });
        
        // Test 3: Try to query the first table if it exists
        if (tables.length > 0) {
          const firstTable = tables[0];
          console.log(`\n🔍 Testing query on table: ${dataset.id}.${firstTable.id}`);
          
          const query = `
            SELECT COUNT(*) as row_count
            FROM \`${dataset.id}.${firstTable.id}\`
            LIMIT 1
          `;
          
          const [rows] = await vendorBigQueryClient.query({ query });
          console.log(`  ✅ Query successful: ${rows[0].row_count} rows in table`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error accessing dataset ${dataset.id}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Vendor BigQuery connection failed:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error status:", error.status);
    console.error("Project ID:", vendorBigQueryClient.projectId);
  }
}

testVendorConnection(); 