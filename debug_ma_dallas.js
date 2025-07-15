import { BigQuery } from '@google-cloud/bigquery';
import fs from 'fs';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function debugMADallas() {
  console.log('🔍 Debugging MA Enrollment Data for Dallas Area...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./debug_ma_dallas.sql', 'utf8');
    
    // Split into individual queries (separated by semicolons)
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q && !q.startsWith('--') && q.length > 10);

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (!query) continue;

      console.log(`\n📊 Query ${i + 1}:`);
      console.log('─'.repeat(50));
      
      try {
        const [rows] = await myBigQuery.query({ 
          query: query, 
          location: "US" 
        });
        
        if (rows.length > 0) {
          console.log('Results:');
          rows.forEach((row, index) => {
            const rowData = Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ');
            console.log(`  ${index + 1}. ${rowData}`);
          });
        } else {
          console.log('  No results found');
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugMADallas(); 