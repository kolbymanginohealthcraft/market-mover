import { BigQuery } from '@google-cloud/bigquery';

const myBigQuery = new BigQuery({
  projectId: 'market-mover-464517',
  keyFilename: './server/credentials/my-service-account.json'
});

async function getLatestPublishDate() {
  console.log('🔍 Getting latest publish date from MA tables...\n');

  try {
    // Get the actual latest publish date
    const latestQuery = `
      SELECT 
        publish_date,
        COUNT(*) as row_count
      FROM \`market-mover-464517.payers.ma_enrollment\`
      GROUP BY publish_date
      ORDER BY publish_date DESC
      LIMIT 5
    `;
    
    const [rows] = await myBigQuery.query({ query: latestQuery, location: "US" });
    
    console.log('Latest publish dates:');
    rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.publish_date}: ${row.row_count} rows`);
    });

    // Also check what the date format looks like for Dallas
    const dallasQuery = `
      SELECT 
        publish_date,
        COUNT(*) as row_count
      FROM \`market-mover-464517.payers.ma_enrollment\`
      WHERE fips = '48113'
      GROUP BY publish_date
      ORDER BY publish_date DESC
      LIMIT 3
    `;
    
    const [dallasRows] = await myBigQuery.query({ query: dallasQuery, location: "US" });
    
    console.log('\nDallas County publish dates:');
    dallasRows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.publish_date}: ${row.row_count} rows`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getLatestPublishDate(); 