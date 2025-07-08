import { BigQuery } from '@google-cloud/bigquery';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function debugDatabase() {
  try {
    console.log('🔍 Checking database contents...\n');

    // Check what tables exist
    const checkTablesQuery = `
      SELECT table_name 
      FROM \`market-mover-464517.quality.INFORMATION_SCHEMA.TABLES\`
      WHERE table_name IN ('qm_dictionary', 'qm_provider', 'qm_post')
      ORDER BY table_name
    `;
    
    const [checkRows] = await myBigQuery.query({ query: checkTablesQuery, location: "US" });
    const existingTables = checkRows.map(row => row.table_name);
    
    console.log('📋 Existing tables:', existingTables);
    console.log('');

    // Check qm_provider publish dates
    if (existingTables.includes('qm_provider')) {
      console.log('🔍 Checking qm_provider publish dates...');
      const [providerDates] = await myBigQuery.query({
        query: `SELECT DISTINCT publish_date FROM \`market-mover-464517.quality.qm_provider\` ORDER BY publish_date DESC LIMIT 10`,
        location: "US"
      });
      
      console.log('📅 qm_provider publish dates:');
      providerDates.forEach(row => {
        const date = row.publish_date?.value || row.publish_date;
        console.log(`  - ${date} (type: ${typeof date})`);
      });
      console.log('');

      // Check if April 2025 exists
      const april2025Exists = providerDates.some(row => {
        const date = row.publish_date?.value || row.publish_date;
        return String(date).includes('2025-04') || String(date).includes('2025-04');
      });
      console.log(`🔍 April 2025 in qm_provider: ${april2025Exists ? 'YES' : 'NO'}`);
      console.log('');
    }

    // Check qm_post publish dates
    if (existingTables.includes('qm_post')) {
      console.log('🔍 Checking qm_post publish dates...');
      const [postDates] = await myBigQuery.query({
        query: `SELECT DISTINCT publish_date FROM \`market-mover-464517.quality.qm_post\` ORDER BY publish_date DESC LIMIT 10`,
        location: "US"
      });
      
      console.log('📅 qm_post publish dates:');
      postDates.forEach(row => {
        const date = row.publish_date?.value || row.publish_date;
        console.log(`  - ${date} (type: ${typeof date})`);
      });
      console.log('');

      // Check if April 2025 exists
      const april2025Exists = postDates.some(row => {
        const date = row.publish_date?.value || row.publish_date;
        return String(date).includes('2025-04') || String(date).includes('2025-04');
      });
      console.log(`🔍 April 2025 in qm_post: ${april2025Exists ? 'YES' : 'NO'}`);
      console.log('');
    }

    // Check sample data for the most recent date
    if (existingTables.includes('qm_provider')) {
      const [providerDates] = await myBigQuery.query({
        query: `SELECT DISTINCT publish_date FROM \`market-mover-464517.quality.qm_provider\` ORDER BY publish_date DESC LIMIT 1`,
        location: "US"
      });
      
      if (providerDates.length > 0) {
        const latestDate = providerDates[0].publish_date?.value || providerDates[0].publish_date;
        console.log(`🔍 Sample data for latest date (${latestDate}):`);
        
        const [sampleData] = await myBigQuery.query({
          query: `SELECT ccn, code, score, publish_date FROM \`market-mover-464517.quality.qm_provider\` WHERE publish_date = @latest_date LIMIT 5`,
          location: "US",
          params: { latest_date: latestDate }
        });
        
        sampleData.forEach(row => {
          console.log(`  - CCN: ${row.ccn}, Code: ${row.code}, Score: ${row.score}, Date: ${row.publish_date?.value || row.publish_date}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugDatabase(); 